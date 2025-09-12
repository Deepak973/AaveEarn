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
import { ShareButton } from "../Share";
import { APP_URL } from "~/lib/constants";
import { useMiniApp } from "@neynar/react";

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
  const [animateIn, setAnimateIn] = useState(false);
  const [supplySucceeded, setSupplySucceeded] = useState(false);
  const { address: userAddress } = useAccount();
  const currentMarketData = useRootStore((store) => store.currentMarketData);
  const { showAlert } = useContext(AlertsContext);
  const poolAddress = useRootStore(
    (store) => store.currentMarketData.addresses.LENDING_POOL
  );
  const { context } = useMiniApp();
  const wethGatewayAddress = useRootStore(
    (store) => store.currentMarketData.addresses.WETH_GATEWAY
  );
  const { walletBalances } = useWalletBalances(currentMarketData);
  const { user, reserves, marketReferencePriceInUsd } = useAppDataContext();
  const queryClient = useQueryClient();

  // onBehalfOf search state
  const [supplyForOther, setSupplyForOther] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<
    {
      fid?: number;
      username: string;
      display_name: string;
      pfp_url: string;
      address?: `0x${string}`;
    }[]
  >([]);
  const [selectedUser, setSelectedUser] = useState<{
    fid?: number;
    username: string;
    display_name: string;
    pfp_url: string;
    address?: `0x${string}`;
  } | null>(null);

  useEffect(() => {
    let active = true;
    let abort = new AbortController();

    async function run() {
      if (!supplyForOther || !searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setSearchLoading(true);
        const resp = await fetch(
          `/api/user-search?q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            method: "GET",
            signal: abort.signal,
          }
        );
        if (!resp.ok) throw new Error("failed");
        const data = (await resp.json()) as { users: any[] };
        if (!active) return;
        setSearchResults(data.users || []);
      } catch (e) {
        if (!active) return;
        setSearchResults([]);
      } finally {
        if (active) setSearchLoading(false);
      }
    }

    const t = setTimeout(run, 300);
    return () => {
      active = false;
      abort.abort();
      clearTimeout(t);
    };
  }, [searchQuery, supplyForOther]);

  // Compute final onBehalfOf address
  const onBehalfOfAddress =
    supplyForOther && selectedUser?.address
      ? selectedUser.address
      : (userAddress as `0x${string}` | undefined);

  const poolReserve = reserves.find((reserve) => {
    if (underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase())
      return reserve.isWrappedBaseAsset;
    return underlyingAsset === reserve.underlyingAsset;
  }) as ComputedReserveData;

  console.log(poolReserve);

  const isNativeETH =
    underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();
  const apyPercent = Number(poolReserve.supplyAPY) * 100;
  const symbol =
    poolReserve.isWrappedBaseAsset && isNativeETH ? "ETH" : poolReserve.symbol;

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
    onSubmitted: (hash) => {},
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} approved successfully!`,
      });
      if (userAddress) {
        // wait 2 seconds before re-fetching allowance
        setTimeout(() => {
          fetchAllowance();
        }, 1000);
      }
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to approve ${symbol}: ${
          error instanceof Error ? error.message.slice(0, 50) : "Unknown error"
        }`,
      });
    },
  });

  const { supply, loading: supplyLoading } = useSupply({
    poolAddress: poolAddress as `0x${string}`,
    asset: isNativeETH
      ? undefined
      : (underlyingAsset as `0x${string}` | undefined),
    onBehalfOf: onBehalfOfAddress,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please confirm the ${symbol} supply transaction in your wallet.`,
      });
    },
    onSubmitted: (hash) => {},
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} supplied successfully!`,
      });
      if (userAddress) {
        fetchAllowance();
      }
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeysFactory.pool,
        });
      }, 1000); // 1 second delay

      setSupplySucceeded(true);
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to supply ${symbol}: ${
          error instanceof Error ? error.message.slice(0, 50) : "Unknown error"
        }`,
      });
    },
  });

  const { depositETH, loading: wrappedTokenLoading } = useWrappedToken({
    wethGatewayAddress: wethGatewayAddress as `0x${string}` | undefined,
    poolAddress: poolAddress as `0x${string}`,
    onBehalfOf: onBehalfOfAddress,
    onPrompt: () => {
      showAlert({
        kind: Alert_Kind__Enum_Type.PROGRESS,
        message: `Please confirm the ${symbol} supply transaction in your wallet.`,
      });
    },
    onSubmitted: (hash) => {},
    onSuccess: (receipt) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.SUCCESS,
        message: `${symbol} deposited successfully!`,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeysFactory.pool,
        });
      }, 1000); // 1 second delay

      setSupplySucceeded(true);
    },
    onError: (error) => {
      showAlert({
        kind: Alert_Kind__Enum_Type.ERROR,
        message: `Failed to supply ${symbol}: ${
          error instanceof Error ? error.message.slice(0, 50) : "Unknown error"
        }`,
      });
    },
  });

  const isLoading = approvalLoading || supplyLoading || wrappedTokenLoading;

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setAnimateIn(true), 10);
    return () => clearTimeout(t);
  }, []);

  const needsApproval = !!(
    !isNativeETH &&
    (allowance === BigInt(0) ||
      (amount &&
        amount !== "." &&
        BigInt(
          parseUnits(
            roundToTokenDecimals(amount, poolReserve.decimals),
            poolReserve.decimals
          ).toString()
        ) > allowance))
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

  const walletBalance = isNativeETH ? nativeBalance : tokenBalance;

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
      depositETH(BigInt(supplyAmount.toString()));
    } else {
      supply(BigInt(supplyAmount.toString()));
    }
    // Do not auto-close; allow user to share
  };

  const shareText =
    supplyForOther &&
    selectedUser &&
    selectedUser.username &&
    selectedUser.address &&
    selectedUser.address !== (userAddress as `0x${string}` | undefined)
      ? `Hey @${selectedUser.username}, I just supplied ${roundToTokenDecimals(
          amount || "0",
          decimals
        )} ${symbol} on your behalf on Aave via EOA (Earn on Aave) at ${apyPercent.toFixed(
          2
        )}% APY. You can withdraw anytime, but it's better to keep it invested so it grows. A small nudge from me to avoid leaving your tokens idle. Use EOA to supply more.`
      : `Hey, I just supplied ${roundToTokenDecimals(
          amount || "0",
          decimals
        )} ${symbol} on Aave using EOA (Earn on Aave) at ${apyPercent.toFixed(
          2
        )}% APY. Make your tokens grow—don't keep them idle.`;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className={`w-full max-w-md rounded-t-xl border border-subtle p-6 bg-secondary-bg transform transition-transform duration-300 ease-out ${
          animateIn ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold text-text-secondary">
            Supply {symbol}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-text-primary hover:text-text-secondary transition-colors text-lg leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {!supplySucceeded && (
          <>
            <div className="border border-subtle rounded-lg p-4 mb-6 bg-[#111318]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#0e1015] flex items-center justify-center">
                    <Image
                      src={`/assets/${symbol.toLowerCase()}.svg`}
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
                    {apyPercent.toFixed(2)}%
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
                    if (Number(e.target.value) > Number(maxAmountToSupply)) {
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
                  Balance: {roundToTokenDecimals(walletBalance, 4)} {symbol}
                </span>
                <button
                  onClick={() => handleChange("-1")}
                  disabled={isLoading}
                  className="text-text-primary hover:text-text-secondary transition-colors disabled:opacity-50 font-medium"
                >
                  MAX
                </button>
              </div>

              {isNativeETH && (
                <div className="mt-4 text-[11px] leading-4 text-text-primary bg-[#0f1220] border border-[rgba(59,130,246,0.25)] rounded-md p-2">
                  You are supplying native ETH. It will be wrapped and supplied
                  as WETH under the hood, and you will receive aWETH.
                </div>
              )}

              {/* Supply on behalf toggle and search */}
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-xs text-text-primary">
                  <input
                    type="checkbox"
                    checked={supplyForOther}
                    onChange={(e) => {
                      setSupplyForOther(e.target.checked);
                      setSearchQuery("");
                      setSearchResults([]);
                      setSelectedUser(null);
                    }}
                  />
                  Supply on behalf of someone
                </label>

                {supplyForOther && (
                  <div className="space-y-2">
                    {selectedUser ? (
                      <div className="flex items-center justify-between bg-[#0e1015] border border-subtle rounded px-3 py-2 text-xs text-text-secondary">
                        <div className="flex items-center gap-2">
                          {selectedUser.pfp_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedUser.pfp_url}
                              alt="pfp"
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#1f2937]" />
                          )}
                          <span>@{selectedUser.username}</span>
                          {selectedUser.address && (
                            <span className="text-[10px] opacity-70">
                              {selectedUser.address.slice(0, 6)}…
                              {selectedUser.address.slice(-4)}
                            </span>
                          )}
                        </div>
                        <button
                          className="text-[11px] text-text-primary hover:text-text-secondary"
                          onClick={() => setSelectedUser(null)}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <InputBase
                          sx={{
                            flex: 1,
                            "& input": {
                              color: "#e5e7eb",
                              fontSize: "14px",
                              fontWeight: 500,
                              "&::placeholder": {
                                color: "#9CA3AF",
                                opacity: 1,
                              },
                            },
                          }}
                          placeholder="Search Farcaster user by username"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {(searchLoading ||
                          (searchResults && searchResults.length > 0)) && (
                          <div className="absolute z-10 mt-1 w-full bg-[#0e1015] border border-subtle rounded-md shadow-lg max-h-56 overflow-auto">
                            {searchLoading && (
                              <div className="px-3 py-2 text-xs text-text-primary">
                                Searching…
                              </div>
                            )}
                            {!searchLoading &&
                              searchResults.map((u, idx) => (
                                <button
                                  key={`${u.fid || u.username}-${idx}`}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#1a1f2c]"
                                  onClick={() => setSelectedUser(u)}
                                >
                                  {u.pfp_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={u.pfp_url}
                                      alt="pfp"
                                      className="w-5 h-5 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-[#1f2937]" />
                                  )}
                                  <span className="text-text-secondary">
                                    @{u.username}
                                  </span>
                                  {u.display_name && (
                                    <span className="text-text-primary opacity-70">
                                      {u.display_name}
                                    </span>
                                  )}
                                  {u.address && (
                                    <span className="ml-auto text-[10px] opacity-70">
                                      {u.address.slice(0, 6)}…
                                      {u.address.slice(-4)}
                                    </span>
                                  )}
                                </button>
                              ))}
                            {!searchLoading &&
                              searchResults.length === 0 &&
                              searchQuery && (
                                <div className="px-3 py-2 text-xs text-text-primary">
                                  No users found
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {!isNativeETH && needsApproval && (
                <button
                  onClick={handleApprove}
                  disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                  className="w-full px-4 py-3 bg-[#1f2937] text-text-secondary text-sm font-medium rounded-lg hover:bg-[#2b3444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  needsApproval ||
                  (supplyForOther && !selectedUser?.address)
                }
                className="w-full px-4 py-3 bg-[#1f2937] text-text-secondary text-sm font-medium rounded-lg hover:bg-[#2b3444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {supplyLoading || wrappedTokenLoading
                  ? "Supplying..."
                  : `Supply ${symbol}`}
              </button>
            </div>
          </>
        )}

        {supplySucceeded && (
          <div className="space-y-4">
            <div className="text-sm text-text-secondary">
              Supplied ${roundToTokenDecimals(amount || "0", decimals)} {symbol}{" "}
              sucessfully
            </div>
            <ShareButton
              buttonText="Share"
              className="w-full"
              cast={{
                text: shareText,
                bestFriends: false,
                embeds: [`${APP_URL}/share/${context?.user?.fid || ""}`],
              }}
            />
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
