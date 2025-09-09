import { useContext, useState, useEffect } from "react";
import Image from "next/image";
import { parseUnits } from "ethers/lib/utils";
import { constants } from "ethers";
import { useTokenApprove } from "~/hooks/transaction/useToken";
import { useSupply } from "~/hooks/transaction/useSupply";
import { useWrappedToken } from "~/hooks/transaction/useWrappedToken";
import { useAccount } from "wagmi";
import { useRootStore } from "~/store/root";
import { useWalletBalances } from "~/hooks/app-data-provider/useWalletBalances";
import { queryKeysFactory } from "~/ui-config/queries";
import {
  ComputedReserveData,
  ComputedUserReserveData,
  useAppDataContext,
} from "~/hooks/app-data-provider/useAppDataProvider";
import { InputBase, Tooltip } from "@mui/material";
import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers";
import { roundToTokenDecimals } from "~/utils/utils";
import { getMaxAmountAvailableToSupply } from "~/utils/getMaxAmountAvailableToSupply";
import { USD_DECIMALS, valueToBigNumber } from "@aave/math-utils";
import { AlertsContext } from "~/app/AllertProvider";
import { Alert_Kind__Enum_Type } from "~/app/AllertProvider";
import { BigNumber } from "bignumber.js";
import NumberFormat, { NumberFormatProps } from "react-number-format";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWithdraw } from "~/hooks/transaction/useWithdraw";
import { calculateMaxWithdrawAmount } from "~/utils/withdrawUtils";
import { ExtendedFormattedUser } from "~/hooks/pool/useExtendedUserSummaryAndIncentives";
import { createPortal } from "react-dom";
import { FormControlLabel, Switch } from "@mui/material";

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
  value: string;
}

const NumberFormatCustom = React.forwardRef<NumberFormatProps, CustomProps>(
  function NumberFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumberFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          if (values.value !== props.value) {
            onChange({
              target: {
                name: props.name,
                value: values.value || "",
              },
            });
          }
        }}
        thousandSeparator
        isNumericString
        allowNegative={false}
      />
    );
  }
);

interface SupplyModalProps {
  onClose: () => void;
  underlyingAsset: `0x${string}`;
}

export function WithdrawModal({ onClose, underlyingAsset }: SupplyModalProps) {
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const { address: userAddress } = useAccount();
  const currentMarketData = useRootStore((store) => store.currentMarketData);
  const { showAlert } = useContext(AlertsContext);
  const [withdrawSucceeded, setWithdrawSucceeded] = useState(false);
  const poolAddress = useRootStore(
    (store) => store.currentMarketData.addresses.LENDING_POOL
  );
  const wethGatewayAddress = useRootStore(
    (store) => store.currentMarketData.addresses.WETH_GATEWAY
  );

  const { user, reserves, marketReferencePriceInUsd } = useAppDataContext();
  const queryClient = useQueryClient();
  const [isMaxSelected, setIsMaxSelected] = useState(false);
  const [receiveAsEth, setReceiveAsEth] = useState(false);

  const poolReserve = reserves.find((reserve) => {
    if (underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase())
      return reserve.isWrappedBaseAsset;
    return underlyingAsset === reserve.underlyingAsset;
  }) as ComputedReserveData;

  const symbol = poolReserve.isWrappedBaseAsset ? "ETH" : poolReserve.symbol;
  const actionSymbol = poolReserve.isWrappedBaseAsset
    ? receiveAsEth
      ? "ETH"
      : "WETH"
    : symbol;

  const userReserve = user?.userReservesData.find((userReserve) => {
    if (underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase())
      return userReserve.reserve.isWrappedBaseAsset;
    return underlyingAsset === userReserve.underlyingAsset;
  }) as ComputedUserReserveData;

  const maxAmountToWithdraw = calculateMaxWithdrawAmount(
    user as ExtendedFormattedUser,
    userReserve,
    poolReserve
  );
  const underlyingBalance = valueToBigNumber(
    userReserve?.underlyingBalance || "0"
  );

  const withdrawAmount = isMaxSelected
    ? maxAmountToWithdraw.toString(10)
    : amount;

  // Native withdrawal (unwrap) path: aToken approval + WETH Gateway withdrawETH
  const { withdrawETH, loading: wrappedLoading } = useWrappedToken({
    wethGatewayAddress: wethGatewayAddress as `0x${string}` | undefined,
    poolAddress: poolAddress as `0x${string}` | undefined,
    to: userAddress as `0x${string}` | undefined,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please confirm the ${symbol} withdraw (unwrap) transaction in your wallet.`,
      });
    },
    onSubmitted: () => {},
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} withdrawn as native ETH successfully!`,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeysFactory.poolReservesDataHumanized(currentMarketData),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeysFactory.userPoolReservesDataHumanized(
          userAddress as `0x${string}`,
          currentMarketData
        ),
      });
      queryClient.invalidateQueries({ queryKey: queryKeysFactory.pool });
      setWithdrawSucceeded(true);
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to withdraw as ETH: ${
          error instanceof Error ? error.message.slice(50) : "Unknown error"
        }`,
      });
    },
  });

  const {
    allowance,
    approve,
    fetchAllowance,
    loading: approveLoading,
  } = useTokenApprove({
    token: poolReserve?.aTokenAddress as `0x${string}` | undefined,
    owner: userAddress as `0x${string}` | undefined,
    spender: wethGatewayAddress as `0x${string}` | undefined,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please approve a${symbol} for the WETH Gateway to proceed.`,
      });
    },
    onSubmitted: () => {},
    onSuccess: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `a${symbol} approved for WETH Gateway.`,
      });
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to approve a${symbol}: ${
          error instanceof Error ? error.message.slice(50) : "Unknown error"
        }`,
      });
    },
  });

  const { withdraw, loading: withdrawLoading } = useWithdraw({
    poolAddress: poolAddress as `0x${string}`,
    asset: underlyingAsset as `0x${string}` | undefined,
    to: userAddress as `0x${string}` | undefined,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please confirm the ${symbol} withdraw transaction in your wallet.`,
      });
    },
    onSubmitted: (hash) => {},
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} withdraw successfully!`,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeysFactory.poolReservesDataHumanized(currentMarketData),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeysFactory.userPoolReservesDataHumanized(
          userAddress as `0x${string}`,
          currentMarketData
        ),
      });
      queryClient.invalidateQueries({ queryKey: queryKeysFactory.pool });
      setWithdrawSucceeded(true);
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to withdraw ${symbol}: ${
          error instanceof Error ? error.message.slice(50) : "Unknown error"
        }`,
      });
    },
  });

  const isLoading = withdrawLoading || wrappedLoading || approveLoading;

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setAnimateIn(true), 10);
    return () => clearTimeout(t);
  }, []);

  const { decimals } = poolReserve;

  const handleChange = (value: string) => {
    if (value === "-1") {
      setAmount(maxAmountToWithdraw.toString(10));
    } else {
      const decimalTruncatedValue = roundToTokenDecimals(value, decimals);
      setAmount(decimalTruncatedValue);
    }
  };

  const amountInEth = new BigNumber(amount).multipliedBy(
    poolReserve.formattedPriceInMarketReferenceCurrency
  );

  const amountInUsd = amountInEth
    .multipliedBy(marketReferencePriceInUsd)
    .shiftedBy(-USD_DECIMALS);

  const handleWithdraw = async () => {
    // If base asset (WETH market) and user wants native ETH, use Gateway path
    if (poolReserve.isWrappedBaseAsset && receiveAsEth) {
      const needed = isMaxSelected
        ? BigInt(constants.MaxUint256.toString())
        : BigInt(parseUnits(withdrawAmount, poolReserve.decimals).toString());

      // Ensure aToken approval for Gateway
      if (allowance < needed) {
        try {
          await approve(needed);
          await fetchAllowance();
        } catch {
          return;
        }
      }

      await withdrawETH(needed);
      return;
    }

    // Default (token) withdraw path
    if (isMaxSelected) {
      withdraw(BigInt(constants.MaxUint256.toString()));
    } else {
      const withdrawalAmount = parseUnits(withdrawAmount, poolReserve.decimals);
      withdraw(BigInt(withdrawalAmount.toString()));
    }
    // handleCloseAnimated();
  };

  const handleCloseAnimated = () => {
    setAnimateIn(false);
    setTimeout(() => onClose(), 220);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={handleCloseAnimated}
    >
      <div
        className={`w-full max-w-md rounded-t-xl border border-subtle p-6 bg-secondary-bg transform transition-transform duration-300 ease-out ${
          animateIn ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold text-text-secondary">
            Withdraw {actionSymbol}
          </h2>
          <button
            onClick={handleCloseAnimated}
            disabled={isLoading}
            className="text-text-primary hover:text-text-secondary transition-colors text-lg leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {!withdrawSucceeded && (
          <>
            <div className="border border-subtle rounded-lg p-4 mb-6 bg-[#111318]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#0e1015] flex items-center justify-center">
                    <Image
                      src={`/assets/${symbol}.svg`}
                      alt={poolReserve.name}
                      width={20}
                      height={20}
                    />
                  </div>
                  <div className="font-medium text-text-secondary text-sm">
                    {symbol}
                  </div>
                </div>
                <Tooltip title="Annual Percentage Yield" arrow>
                  <div className="px-2 py-1 bg-[rgba(59,130,246,0.12)] text-text-secondary text-xs font-medium rounded border border-[rgba(59,130,246,0.3)]">
                    {(+poolReserve.supplyAPY * 100).toFixed(2)}%
                  </div>
                </Tooltip>
              </div>

              <div className="mb-3">
                <InputBase
                  sx={{
                    flex: 1,
                    "& input": {
                      color: "#e5e7eb",
                      fontSize: "16px",
                      fontWeight: 500,
                      "&::placeholder": { color: "#9CA3AF", opacity: 1 },
                    },
                  }}
                  placeholder="0.00"
                  disabled={isLoading}
                  value={amount}
                  autoFocus
                  onChange={(e) => {
                    if (Number(e.target.value) > Number(maxAmountToWithdraw)) {
                      handleChange("-1");
                    } else {
                      handleChange(e.target.value);
                    }
                  }}
                  inputProps={{
                    "aria-label": "amount input",
                    style: {
                      fontSize: "16px",
                      fontWeight: 500,
                      padding: 0,
                      height: "24px",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    },
                  }}
                  // eslint-disable-next-line
                  inputComponent={NumberFormatCustom as any}
                />
                <div className="text-xs text-text-primary mt-1">
                  ${" "}
                  {amountInUsd.gt(0)
                    ? roundToTokenDecimals(amountInUsd.toString(), 2)
                    : "0.00"}
                </div>
              </div>

              <div className="flex justify-between text-xs text-text-primary">
                <span>
                  Available:{" "}
                  {roundToTokenDecimals(underlyingBalance.toString(), 4)}{" "}
                  {symbol}
                </span>
                <button
                  onClick={() => {
                    handleChange("-1");
                    setIsMaxSelected(true);
                  }}
                  disabled={isLoading}
                  className="text-text-primary hover:text-text-secondary transition-colors disabled:opacity-50 font-medium"
                >
                  MAX
                </button>
              </div>

              {poolReserve.isWrappedBaseAsset && (
                <div className="mt-4 flex items-center justify-between">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={receiveAsEth}
                        onChange={(e) => setReceiveAsEth(e.target.checked)}
                        disabled={isLoading}
                        inputProps={{ "aria-label": "toggle unwrap to ETH" }}
                      />
                    }
                    label={
                      <span className="text-xs text-text-primary">
                        Unwrap and receive native ETH
                      </span>
                    }
                    className="m-0"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleWithdraw}
              disabled={
                !amount ||
                !parseFloat(amount) ||
                parseFloat(amount) <= 0 ||
                isLoading
              }
              className="w-full px-4 py-3 bg-[#1f2937] text-text-secondary text-sm font-medium rounded-lg hover:bg-[#2b3444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Withdrawing..."
                : poolReserve.isWrappedBaseAsset && receiveAsEth
                ? `Withdraw ETH`
                : poolReserve.isWrappedBaseAsset
                ? `Withdraw WETH`
                : `Withdraw ${symbol}`}
            </button>
          </>
        )}

        {withdrawSucceeded && (
          <div className="space-y-4">
            <div className="text-sm text-text-secondary">
              Withdrawn ${roundToTokenDecimals(amount || "0", decimals)}{" "}
              {actionSymbol} sucessfully
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-[#1f2937] text-text-secondary text-sm font-medium rounded-lg hover:bg-[#2b3444] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
