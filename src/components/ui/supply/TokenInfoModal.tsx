import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Modal, Backdrop, Typography, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { USD_DECIMALS, valueToBigNumber } from "@aave/math-utils";
import { ComputedReserveData } from "~/hooks/app-data-provider/useAppDataProvider";
import { roundToTokenDecimals } from "~/utils/utils";

export type SupplyReserveForModal = ComputedReserveData & {
  walletBalance?: string;
  walletBalanceUSD?: string;
};

interface TokenInfoModalProps {
  open: boolean;
  onClose: () => void;
  selectedReserve: SupplyReserveForModal | null;
  marketReferencePriceInUsd: string;
}

const formatApyPercent = (apy: number | string) => {
  const n = typeof apy === "string" ? parseFloat(apy) : apy;
  if (!isFinite(n) || n === 0) return "0%";
  const pct = n * 100;
  if (pct > 0 && pct < 0.01) return "<0.01%";
  return `${pct.toFixed(2)}%`;
};

const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
};

const getSupplyPercentage = (reserve: SupplyReserveForModal) => {
  if (!reserve || !reserve.totalLiquidity || !reserve.supplyCap) return 0;
  if (+reserve.supplyCap === 0) return 0;
  return (+reserve.totalLiquidity / +reserve.supplyCap) * 100;
};

export function TokenInfoModal({
  open,
  onClose,
  selectedReserve,
  marketReferencePriceInUsd,
}: TokenInfoModalProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(t);
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  const handleCloseAnimated = () => {
    setAnimateIn(false);
    setTimeout(() => onClose(), 220);
  };

  return (
    <Modal
      open={open}
      onClose={handleCloseAnimated}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 200,
        sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" },
      }}
      sx={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        p: 0,
      }}
    >
      <div
        className={`w-full max-w-2xl rounded-t-xl border border-subtle p-4 md:p-6 bg-[var(--secondary-bg)] text-[var(--text-secondary)] transform transition-transform duration-300 ease-out ${
          animateIn ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {selectedReserve && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#111318] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                  <Image
                    src={`/assets/${selectedReserve.iconSymbol.toLowerCase()}.svg`}
                    alt={selectedReserve.name}
                    width={20}
                    height={20}
                  />
                </div>
                <div>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    {selectedReserve.symbol}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}
                  >
                    {selectedReserve.name}
                  </Typography>
                </div>
              </div>

              <IconButton
                onClick={handleCloseAnimated}
                size="small"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": {
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </div>

            <div className="space-y-4 overflow-y-auto h-[calc(40vh-64px)] pr-1">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  {(() => {
                    const supplyPercentage =
                      getSupplyPercentage(selectedReserve);
                    return (
                      <>
                        <svg
                          className="w-16 h-16 transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${supplyPercentage * 2.51} 251`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {supplyPercentage.toFixed(2)}%
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex-1">
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}
                  >
                    Total supplied
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    {formatCompactNumber(+selectedReserve.totalLiquidity)} of{" "}
                    {selectedReserve.supplyCap !== "0"
                      ? formatCompactNumber(+selectedReserve.supplyCap)
                      : "Unlimited"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}
                  >
                    {(() => {
                      const totalUSD = +valueToBigNumber(
                        selectedReserve.totalLiquidity
                      )
                        .multipliedBy(
                          selectedReserve.formattedPriceInMarketReferenceCurrency
                        )
                        .multipliedBy(marketReferencePriceInUsd)
                        .shiftedBy(-USD_DECIMALS)
                        .toString();
                      const capUSD =
                        selectedReserve.supplyCap !== "0"
                          ? +valueToBigNumber(selectedReserve.supplyCap)
                              .multipliedBy(
                                selectedReserve.formattedPriceInMarketReferenceCurrency
                              )
                              .multipliedBy(marketReferencePriceInUsd)
                              .shiftedBy(-USD_DECIMALS)
                              .toString()
                          : undefined;
                      return (
                        <>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 2,
                          }).format(totalUSD)}{" "}
                          of{" "}
                          {capUSD !== undefined
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 2,
                              }).format(capUSD)
                            : "Unlimited"}
                        </>
                      );
                    })()}
                  </Typography>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111318] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      mb: 0.5,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Your Balance
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}
                  >
                    {roundToTokenDecimals(
                      selectedReserve.walletBalance ?? "0",
                      4
                    )}{" "}
                    {selectedReserve.symbol}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}
                  >
                    ${(+(selectedReserve.walletBalanceUSD ?? "0")).toFixed(2)}
                  </Typography>
                </div>

                <div className="bg-[#111318] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      mb: 0.5,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    APY
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}
                  >
                    {formatApyPercent(selectedReserve.supplyAPY)}
                  </Typography>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default TokenInfoModal;
