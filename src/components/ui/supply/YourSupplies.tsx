import { useState, useMemo } from "react";
import Image from "next/image";
import { formatUnits } from "ethers/lib/utils";
import { useRootStore } from "~/store/root";
import { useAppDataContext } from "~/hooks/app-data-provider/useAppDataProvider";
import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers";
import { fetchIconSymbolAndName } from "~/ui-config/reservePatches";
import { Tooltip, Switch, FormControlLabel } from "@mui/material";
import { styled } from "@mui/material/styles";
import { roundToTokenDecimals } from "~/utils/utils";
import { amountToUsd } from "~/utils/utils";
import { SupplyModal } from "./SupplyModal";
import { WithdrawModal } from "../withdraw/WithdrawModal";

// Helper function to check if asset should be hidden
const isAssetHidden = (market: string, asset: string) => {
  // Add your asset hiding logic here
  return false;
};

const SMALL_BALANCE_THRESHOLD = 0.01;

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

export function YourSupplies() {
  const [showSmallBalance, setShowSmallBalance] = useState(true);
  const currentMarketData = useRootStore((store) => store.currentMarketData);
  const currentNetworkConfig = useRootStore(
    (store) => store.currentNetworkConfig
  );
  const {
    user,
    marketReferencePriceInUsd,
    loading: loadingReserves,
  } = useAppDataContext();
  const [openSupplyModal, setOpenSupplyModal] = useState(false);
  const [openWithdrawModal, setOpenWithdrawModal] = useState(false);
  const [asset, setAsset] = useState<any>(null);

  const formatApyPercent = (apy: number | string) => {
    const n = typeof apy === "string" ? parseFloat(apy) : apy;
    if (!isFinite(n) || n === 0) return "0%";
    const pct = n * 100;
    if (pct > 0 && pct < 0.01) return "<0.01%";
    return `${pct.toFixed(2)}%`;
  };

  const suppliedPositions = useMemo(() => {
    return (
      user?.userReservesData
        .filter(
          (userReserve) =>
            userReserve.underlyingBalance !== "0" &&
            !isAssetHidden(
              currentMarketData.market,
              userReserve.reserve.underlyingAsset
            )
        )
        .filter((userReserve) => {
          if (userReserve.underlyingBalance === "0") return false;

          if (showSmallBalance) return true;

          // Filter out dust amounts < $0.01 USD
          const balanceUSD = amountToUsd(
            userReserve.underlyingBalance,
            userReserve.reserve.formattedPriceInMarketReferenceCurrency,
            marketReferencePriceInUsd
          );
          return Number(balanceUSD) >= SMALL_BALANCE_THRESHOLD;
        })
        .map((userReserve) => ({
          ...userReserve,
          supplyAPY: userReserve.reserve.supplyAPY,
          reserve: {
            ...userReserve.reserve,
            ...(userReserve.reserve.isWrappedBaseAsset
              ? fetchIconSymbolAndName({
                  symbol: currentNetworkConfig.baseAssetSymbol,
                  underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
                })
              : {}),
          },
        })) || []
    );
  }, [
    showSmallBalance,
    user?.userReservesData,
    marketReferencePriceInUsd,
    currentMarketData.market,
    currentNetworkConfig.baseAssetSymbol,
  ]);

  // Update the USD amount display in the JSX
  const formatUsdAmount = (balance: string, price: string) => {
    const usdAmount = amountToUsd(balance, price, marketReferencePriceInUsd);
    return Number(usdAmount).toFixed(2);
  };

  if (loadingReserves) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">Loading your supplies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Total Value */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700/30 pb-4">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Your Supplies
          </h2>
        </div>
        <FormControlLabel
          control={
            <CustomSwitch
              checked={showSmallBalance}
              onChange={(e) => setShowSmallBalance(e.target.checked)}
              inputProps={{ "aria-label": "toggle small balance" }}
            />
          }
          label={
            <span className="text-xs" style={{ color: "var(--accent-light)" }}>
              {showSmallBalance ? "Hide" : "Show"} dust
            </span>
          }
          className="m-0"
        />
      </div>

      {/* Supplied Assets List */}
      <div className="space-y-3">
        {suppliedPositions.map((position) => (
          <div
            key={position.reserve.underlyingAsset}
            className="relative border border-gray-700/30 rounded-xl p-4 hover:border-gray-600/40 transition-all duration-200"
            style={{ backgroundColor: "var(--secondary-bg)" }}
          >
            {/* APY tag in the top-right corner */}
            <Tooltip title="Annual Percentage Yield" arrow placement="top">
              <div
                className="absolute top-0 right-0 rounded-bl-lg text-[10px] "
                style={{
                  backgroundColor: "var(--accent-light)",
                  color: "var(--text-secondary)",
                }}
              >
                <div className="px-2 py-1">
                  {formatApyPercent(position.supplyAPY)}
                </div>
              </div>
            </Tooltip>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Asset Info */}
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary-bg)" }}
                >
                  <Image
                    src={`/assets/${position.reserve.iconSymbol.toLowerCase()}.svg`}
                    alt={position.reserve.name}
                    width={24}
                    height={24}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Tooltip
                      title={`${position.reserve.name} (${position.reserve.symbol})`}
                      arrow
                      placement="top"
                    >
                      <div
                        className="font-medium cursor-help text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {position.reserve.symbol}
                      </div>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <Tooltip
                      title={`${position.underlyingBalance} ${position.reserve.symbol}`}
                      arrow
                      placement="top"
                    >
                      <div
                        className="text-xs cursor-help"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {roundToTokenDecimals(position.underlyingBalance, 4)}{" "}
                        {position.reserve.symbol}
                      </div>
                    </Tooltip>

                    <div
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      $
                      {formatUsdAmount(
                        position.underlyingBalance,
                        position.reserve.formattedPriceInMarketReferenceCurrency
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setOpenSupplyModal(true);
                    setAsset(position);
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: "var(--accent-light)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Supply
                </button>
                <button
                  onClick={() => {
                    setOpenWithdrawModal(true);
                    setAsset(position);
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium rounded-lg transition-all border"
                  style={{
                    backgroundColor: "var(--primary-bg)",
                    color: "var(--text-primary)",
                    borderColor: "var(--accent-light)",
                  }}
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        ))}

        {suppliedPositions.length === 0 && (
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
              No supplies yet
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--accent-light)" }}
            >
              Start earning by supplying assets to the protocol
            </p>
          </div>
        )}

        {openSupplyModal && asset?.underlyingAsset && (
          <SupplyModal
            onClose={() => setOpenSupplyModal(false)}
            underlyingAsset={asset?.underlyingAsset as `0x${string}`}
          />
        )}
        {openWithdrawModal && asset?.underlyingAsset && (
          <WithdrawModal
            onClose={() => setOpenWithdrawModal(false)}
            underlyingAsset={asset?.underlyingAsset as `0x${string}`}
          />
        )}
      </div>
    </div>
  );
}
