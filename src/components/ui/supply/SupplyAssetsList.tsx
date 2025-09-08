import { useState, useEffect } from "react";
import Image from "next/image";
import { formatUnits } from "ethers/lib/utils";
import { useRootStore } from "~/store/root";
import {
  ComputedReserveData,
  useAppDataContext,
} from "~/hooks/app-data-provider/useAppDataProvider";
import { useWalletBalances } from "~/hooks/app-data-provider/useWalletBalances";
import { USD_DECIMALS, valueToBigNumber } from "@aave/math-utils";
import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers";
import { fetchIconSymbolAndName } from "~/ui-config/reservePatches";
import { BigNumber } from "bignumber.js";
import { Tooltip, Switch, FormControlLabel } from "@mui/material";
import { styled } from "@mui/material/styles";
import { roundToTokenDecimals } from "~/utils/utils";
import { SupplyModal } from "./SupplyModal";

// Custom styled switch with refined theme
const CustomSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase": {
    color: "#6B7280",
    "&.Mui-checked": {
      color: "#9CA3AF",
      "& + .MuiSwitch-track": {
        backgroundColor: "#4B5563",
        opacity: 0.6,
      },
    },
  },
  "& .MuiSwitch-track": {
    backgroundColor: "#374151",
    opacity: 0.4,
  },
}));

export function SupplyAssetsList() {
  const [showZeroBalance, setShowZeroBalance] = useState(true);
  const currentMarketData = useRootStore((store) => store.currentMarketData);
  const {
    user,
    reserves,
    marketReferencePriceInUsd,
    loading: loadingReserves,
  } = useAppDataContext();
  const { walletBalances, loading } = useWalletBalances(currentMarketData);

  const [openSupplyModal, setOpenSupplyModal] = useState(false);
  const [asset, setAsset] = useState<ComputedReserveData | null>(null);

  useEffect(() => {
    if (!openSupplyModal) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [openSupplyModal]);

  const formatApyPercent = (apy: number | string) => {
    const n = typeof apy === "string" ? parseFloat(apy) : apy;
    if (!isFinite(n) || n === 0) return "0%";
    const pct = n * 100;
    if (pct > 0 && pct < 0.01) return "<0.01%";
    return `${pct.toFixed(2)}%`;
  };

  const tokensToSupply =
    reserves && reserves.length > 0
      ? reserves
          .filter(
            (reserve: ComputedReserveData) =>
              !(reserve.isFrozen || reserve.isPaused)
          )
          .map((reserve: ComputedReserveData) => {
            const walletBalance =
              walletBalances[reserve.underlyingAsset]?.amount;
            const walletBalanceUSD =
              walletBalances[reserve.underlyingAsset]?.amountUSD;
            let availableToDeposit = valueToBigNumber(walletBalance);

            if (reserve.supplyCap !== "0") {
              availableToDeposit = BigNumber.min(
                availableToDeposit,
                new BigNumber(reserve.supplyCap)
                  .minus(reserve.totalLiquidity)
                  .multipliedBy("0.995")
              );
            }

            const availableToDepositUSD = valueToBigNumber(availableToDeposit)
              .multipliedBy(reserve.priceInMarketReferenceCurrency)
              .multipliedBy(marketReferencePriceInUsd)
              .shiftedBy(-USD_DECIMALS)
              .toString();

            if (reserve.isWrappedBaseAsset) {
              let baseAvailableToDeposit = valueToBigNumber(
                walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amount
              );
              if (reserve.supplyCap !== "0") {
                baseAvailableToDeposit = BigNumber.min(
                  baseAvailableToDeposit,
                  new BigNumber(reserve.supplyCap)
                    .minus(reserve.totalLiquidity)
                    .multipliedBy("0.995")
                );
              }
              const baseAvailableToDepositUSD = valueToBigNumber(
                baseAvailableToDeposit
              )
                .multipliedBy(reserve.priceInMarketReferenceCurrency)
                .multipliedBy(marketReferencePriceInUsd)
                .shiftedBy(-USD_DECIMALS)
                .toString();

              return [
                {
                  ...reserve,
                  underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
                  ...fetchIconSymbolAndName({
                    symbol: "ETH",
                    underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
                  }),
                  walletBalance:
                    walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amount,
                  walletBalanceUSD:
                    walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]
                      ?.amountUSD,
                  availableToDeposit: baseAvailableToDeposit.toString(),
                  availableToDepositUSD: baseAvailableToDepositUSD,
                },
                {
                  ...reserve,
                  walletBalance,
                  walletBalanceUSD,
                  availableToDeposit:
                    availableToDeposit.toNumber() <= 0
                      ? "0"
                      : availableToDeposit.toString(),
                  availableToDepositUSD:
                    Number(availableToDepositUSD) <= 0
                      ? "0"
                      : availableToDepositUSD.toString(),
                },
              ];
            }

            return {
              ...reserve,
              walletBalance,
              walletBalanceUSD,
              availableToDeposit:
                availableToDeposit.toNumber() <= 0
                  ? "0"
                  : availableToDeposit.toString(),
              availableToDepositUSD:
                Number(availableToDepositUSD) <= 0
                  ? "0"
                  : availableToDepositUSD.toString(),
            };
          })
          .flat()
      : [];

  console.log("tokensToSupply", tokensToSupply);

  const sortedSupplyReserves =
    tokensToSupply.length > 0
      ? tokensToSupply.sort((a, b) =>
          +a.walletBalanceUSD > +b.walletBalanceUSD ? -1 : 1
        )
      : [];

  const filteredReserves =
    sortedSupplyReserves.length > 0
      ? showZeroBalance
        ? sortedSupplyReserves
        : sortedSupplyReserves.filter(
            (reserve: any) =>
              reserve.walletBalance && parseFloat(reserve.walletBalance) > 0
          )
      : [];

  if (loadingReserves || loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">Loading assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Assets to Supply
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>
            {filteredReserves.length} asset
            {filteredReserves.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <FormControlLabel
          control={
            <CustomSwitch
              checked={showZeroBalance}
              onChange={(e) => setShowZeroBalance(e.target.checked)}
              inputProps={{ "aria-label": "toggle zero balance" }}
            />
          }
          label={
            <span className="text-xs" style={{ color: "var(--accent-light)" }}>
              {showZeroBalance ? "Hide" : "Show"} empty
            </span>
          }
          className="m-0"
        />
      </div>

      {/* Assets List */}
      <div className="space-y-3">
        {filteredReserves.map((reserve) => (
          <div
            key={reserve.underlyingAsset}
            className="relative border border-gray-700/30 rounded-xl p-4 hover:border-gray-600/40 transition-all duration-200"
            style={{ backgroundColor: "var(--secondary-bg)" }}
          >
            {/* APY tag in the top-right corner */}
            <Tooltip title="Annual Percentage Yield" arrow placement="top">
              <div
                className="absolute top-0 right-0 rounded-bl-lg text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--accent-light)",
                  color: "var(--text-secondary)",
                }}
              >
                <div className="px-2 py-1">
                  {formatApyPercent(reserve.supplyAPY)}
                </div>
              </div>
            </Tooltip>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Asset Row */}
              <div className="flex items-center gap-3 flex-1">
                {/* Token Icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary-bg)" }}
                >
                  <Image
                    src={`/assets/${reserve.iconSymbol.toLowerCase()}.svg`}
                    alt={reserve.name}
                    width={24}
                    height={24}
                  />
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Tooltip
                      title={`${reserve.name} (${reserve.symbol})`}
                      arrow
                      placement="top"
                    >
                      <div
                        className="font-medium cursor-help text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {reserve.symbol}
                      </div>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <Tooltip
                      title={`${reserve.walletBalance} ${reserve.symbol}`}
                      arrow
                      placement="top"
                    >
                      <div
                        className="text-xs cursor-help"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Balance:{" "}
                        {roundToTokenDecimals(reserve.walletBalance, 4)}{" "}
                        {reserve.symbol}
                      </div>
                    </Tooltip>

                    <div
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      ${(+reserve.walletBalanceUSD).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full sm:w-auto">
                <button
                  onClick={() => {
                    setOpenSupplyModal(true);
                    setAsset(reserve);
                  }}
                  disabled={
                    !reserve.walletBalance ||
                    parseFloat(reserve.walletBalance) <= 0
                  }
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--accent-light)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Supply
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReserves.length === 0 && (
          <div
            className="text-center py-12"
            style={{ color: "var(--text-primary)" }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--primary-bg)" }}
            >
              <div
                className="w-8 h-8 rounded-lg"
                style={{ backgroundColor: "var(--accent-light)" }}
              ></div>
            </div>
            <p className="text-sm" style={{ color: "var(--accent-light)" }}>
              No assets available
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--accent-light)" }}
            >
              {showZeroBalance
                ? "Connect your wallet or switch network to get started"
                : "Enable 'Show empty' to view all assets"}
            </p>
          </div>
        )}
      </div>

      {openSupplyModal && asset?.underlyingAsset && (
        <SupplyModal
          onClose={() => setOpenSupplyModal(false)}
          underlyingAsset={asset?.underlyingAsset as `0x${string}`}
        />
      )}
    </div>
  );
}
