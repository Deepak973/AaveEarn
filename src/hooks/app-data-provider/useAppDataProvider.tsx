"use client";
import { UserReserveData } from "@aave/math-utils";
import React, { PropsWithChildren, useContext } from "react";
import { useRootStore } from "~/store/root";

import {
  ExtendedFormattedUser as _ExtendedFormattedUser,
  useExtendedUserSummaryAndIncentives,
} from "../pool/useExtendedUserSummaryAndIncentives";
import {
  FormattedReservesAndIncentives,
  usePoolFormattedReserves,
} from "../pool/usePoolFormattedReserves";
import { usePoolReservesHumanized } from "../pool/usePoolReserves";
import { useUserPoolReservesHumanized } from "../pool/useUserPoolReserves";
import { FormattedUserReserves } from "../pool/useUserSummaryAndIncentives";
import { useAccount } from "wagmi";

/**
 * removes the marketPrefix from a symbol
 * @param symbol
 * @param prefix
 */
export const unPrefixSymbol = (symbol: string, prefix: string) => {
  return symbol
    .toUpperCase()
    .replace(RegExp(`^(${prefix[0]}?${prefix.slice(1)})`), "");
};

/**
 * @deprecated Use FormattedReservesAndIncentives type from usePoolFormattedReserves hook
 */
export type ComputedReserveData = FormattedReservesAndIncentives;

/**
 * @deprecated Use FormattedUserReserves type from useUserSummaryAndIncentives hook
 */
export type ComputedUserReserveData = FormattedUserReserves;

/**
 * @deprecated Use ExtendedFormattedUser type from useExtendedUserSummaryAndIncentives hook
 */
export type ExtendedFormattedUser = _ExtendedFormattedUser;

export interface AppDataContextType {
  loading: boolean;
  reserves: ComputedReserveData[];
  user?: ExtendedFormattedUser;
  marketReferencePriceInUsd: string;
  marketReferenceCurrencyDecimals: number;
  userReserves: UserReserveData[];
}

const AppDataContext = React.createContext<AppDataContextType>(
  {} as AppDataContextType
);

/**
 * This is the only provider you'll ever need.
 * It fetches reserves /incentives & walletbalances & keeps them updated.
 */
export const AppDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { address } = useAccount();

  const currentMarketData = useRootStore((state) => state.currentMarketData);

  const { data: reservesData, isPending: reservesDataLoading } =
    usePoolReservesHumanized(currentMarketData);
  const {
    data: formattedPoolReserves,
    isPending: formattedPoolReservesLoading,
  } = usePoolFormattedReserves(currentMarketData);
  const baseCurrencyData = reservesData?.baseCurrencyData;
  // user hooks

  const { data: userReservesData, isPending: userReservesDataLoading } =
    useUserPoolReservesHumanized(currentMarketData, address as `0x${string}`);
  const { data: userSummary, isPending: userSummaryLoading } =
    useExtendedUserSummaryAndIncentives(
      currentMarketData,
      address as `0x${string}`
    );
  const userReserves = userReservesData?.userReserves || [];

  // loading
  const isReservesLoading = reservesDataLoading || formattedPoolReservesLoading;
  const isUserDataLoading = userReservesDataLoading || userSummaryLoading;

  return (
    <AppDataContext.Provider
      value={{
        loading: isReservesLoading || (!!address && isUserDataLoading),
        reserves: formattedPoolReserves || [],
        user: userSummary,
        userReserves: userReserves || [],
        marketReferencePriceInUsd:
          baseCurrencyData?.marketReferenceCurrencyPriceInUsd || "0",
        marketReferenceCurrencyDecimals:
          baseCurrencyData?.marketReferenceCurrencyDecimals || 0,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppDataContext = () => useContext(AppDataContext);
