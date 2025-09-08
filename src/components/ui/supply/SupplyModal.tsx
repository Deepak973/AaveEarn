import { useContext, useState, useEffect } from "react";
import Image from "next/image";
import { parseUnits } from "ethers/lib/utils";
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
import { USD_DECIMALS } from "@aave/math-utils";
import { AlertsContext } from "~/app/AllertProvider";
import { Alert_Kind__Enum_Type } from "~/app/AllertProvider";
import { BigNumber } from "bignumber.js";
import NumberFormat, { NumberFormatProps } from "react-number-format";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";

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

export function SupplyModal({ onClose, underlyingAsset }: SupplyModalProps) {
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  const { address: userAddress } = useAccount();
  const currentMarketData = useRootStore((store) => store.currentMarketData);
  const { showAlert } = useContext(AlertsContext);
  const poolAddress = useRootStore(
    (store) => store.currentMarketData.addresses.LENDING_POOL
  );
  const wethGatewayAddress = useRootStore(
    (store) => store.currentMarketData.addresses.WETH_GATEWAY
  );
  const { walletBalances } = useWalletBalances(currentMarketData);
  const { user, reserves, marketReferencePriceInUsd } = useAppDataContext();
  const queryClient = useQueryClient();

  const poolReserve = reserves.find((reserve) => {
    if (underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase())
      return reserve.isWrappedBaseAsset;
    return underlyingAsset === reserve.underlyingAsset;
  }) as ComputedReserveData;

  const symbol = poolReserve.isWrappedBaseAsset ? "ETH" : poolReserve.symbol;
  const isNativeETH =
    underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

  // Token approval hook (only for non-native tokens)
  const {
    approve,
    allowance,
    loading: approvalLoading,
    fetchAllowance,
  } = useTokenApprove({
    token: underlyingAsset as `0x${string}`,
    spender: poolAddress as `0x${string}`,
    owner: userAddress as `0x${string}` | undefined,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please Approve ${symbol} to be used for the supply.`,
      });
    },
    onSubmitted: (hash) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.INFO,
        message: "Please confirm the approval transaction in your wallet.",
      });
    },
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} approved successfully!`,
      });
      if (userAddress) {
        fetchAllowance();
      }
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to approve ${symbol}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    },
  });

  // Regular supply hook (for non-native tokens)
  const { supply, loading: supplyLoading } = useSupply({
    poolAddress: poolAddress as `0x${string}`,
    asset: isNativeETH
      ? undefined
      : (underlyingAsset as `0x${string}` | undefined),
    onBehalfOf: userAddress as `0x${string}` | undefined,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please confirm the ${symbol} supply transaction in your wallet.`,
      });
    },
    onSubmitted: (hash) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.INFO,
        message: `${symbol} supply transaction submitted successfully.`,
      });
    },
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} supplied successfully!`,
      });
      if (userAddress) {
        fetchAllowance();
      }
      queryClient.invalidateQueries({
        queryKey: queryKeysFactory.poolReservesDataHumanized(currentMarketData),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeysFactory.userPoolReservesDataHumanized(
          userAddress as `0x${string}`,
          currentMarketData
        ),
      });
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to supply ${symbol}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    },
  });

  // Wrapped token hook (for native ETH)
  const { depositETH, loading: wrappedTokenLoading } = useWrappedToken({
    wethGatewayAddress: wethGatewayAddress as `0x${string}` | undefined,
    poolAddress: poolAddress as `0x${string}`,
    onBehalfOf: userAddress as `0x${string}` | undefined,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please confirm the ${symbol} deposit transaction in your wallet.`,
      });
    },
    onSubmitted: (hash) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.INFO,
        message: `${symbol} deposit transaction submitted successfully.`,
      });
    },
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} deposited successfully!`,
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
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to deposit ${symbol}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    },
  });

  const isLoading = approvalLoading || supplyLoading || wrappedTokenLoading;

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const needsApproval = !!(
    !isNativeETH &&
    (allowance === BigInt(0) ||
      (amount &&
        BigInt(parseUnits(amount, poolReserve.decimals).toString()) >
          allowance))
  );

  const tokenBalance =
    walletBalances[poolReserve.underlyingAsset.toLowerCase()]?.amount || "0";
  const nativeBalance =
    walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amount || "0";

  const {
    supplyCap,
    totalLiquidity,
    isFrozen,
    decimals,
    debtCeiling,
    isolationModeTotalDebt,
  } = poolReserve;

  const walletBalance = poolReserve.isWrappedBaseAsset
    ? nativeBalance
    : tokenBalance;

  const maxAmountToSupply = getMaxAmountAvailableToSupply(
    walletBalance,
    {
      supplyCap,
      totalLiquidity,
      isFrozen,
      decimals,
      debtCeiling,
      isolationModeTotalDebt,
    },
    underlyingAsset,
    "0"
  );

  const handleChange = (value: string) => {
    if (value === "-1") {
      setAmount(maxAmountToSupply);
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

  const isMaxSelected = amount === maxAmountToSupply;

  const handleApprove = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const approvalAmount = parseUnits(amount, poolReserve.decimals);
    approve(BigInt(approvalAmount.toString()));
  };

  const handleSupply = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const supplyAmount = parseUnits(amount, poolReserve.decimals);

    if (isNativeETH) {
      // Use wrapped token deposit for native ETH
      depositETH(BigInt(supplyAmount.toString()));
    } else {
      // Use regular supply for ERC20 tokens
      supply(BigInt(supplyAmount.toString()));
    }
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto bg-gray-900 border-2 border-white rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Supply {symbol}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Asset Info */}
        <div className="bg-gray-800/50 border border-white rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <Image
                  src={`/assets/${poolReserve.iconSymbol.toLowerCase()}.svg`}
                  alt={poolReserve.name}
                  width={20}
                  height={20}
                />
              </div>
              <div className="font-medium text-white text-sm">{symbol}</div>
            </div>
            <Tooltip title="Annual Percentage Yield" arrow>
              <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-md cursor-help">
                {(+poolReserve.supplyAPY * 100).toFixed(2)}%
              </div>
            </Tooltip>
          </div>

          {/* Amount Input */}
          <div className="mb-3">
            <InputBase
              sx={{
                flex: 1,
                "& input": {
                  color: "white",
                  fontSize: "18px",
                  fontWeight: 500,
                  "&::placeholder": {
                    color: "#9CA3AF",
                    opacity: 1,
                  },
                },
              }}
              placeholder="0.00"
              disabled={isLoading}
              value={amount}
              autoFocus
              onChange={(e) => {
                if (Number(e.target.value) > Number(maxAmountToSupply)) {
                  handleChange("-1");
                } else {
                  handleChange(e.target.value);
                }
              }}
              inputProps={{
                "aria-label": "amount input",
                style: {
                  fontSize: "18px",
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
            <div className="text-xs text-gray-400 mt-1">
              ${" "}
              {amountInUsd.gt(0)
                ? roundToTokenDecimals(amountInUsd.toString(), 2)
                : "0.00"}
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            <span>
              Balance: {roundToTokenDecimals(walletBalance, 4)} {symbol}
            </span>
            <button
              onClick={() => handleChange("-1")}
              disabled={isLoading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Show approve button only for non-native tokens that need approval */}
          {!isNativeETH && needsApproval && (
            <button
              onClick={handleApprove}
              disabled={!amount || parseFloat(amount) <= 0 || isLoading}
              className="w-full px-4 py-3 bg-gray-700 text-white text-sm font-medium rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
            >
              {approvalLoading ? "Approving..." : `Approve ${symbol}`}
            </button>
          )}

          <button
            onClick={handleSupply}
            disabled={
              !amount ||
              !parseFloat(amount) ||
              parseFloat(amount) <= 0 ||
              isLoading ||
              needsApproval
            }
            className="w-full px-4 py-3 bg-gray-700 text-white text-sm font-medium rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
          >
            {supplyLoading || wrappedTokenLoading
              ? "Supplying..."
              : `Supply ${symbol}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
