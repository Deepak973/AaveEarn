import { useQueries } from "@tanstack/react-query";
import { UserReservesDataHumanized } from "~/services/UIPoolService";
import { useRootStore } from "~/store/root";
import { MarketDataType } from "~/ui-config/marketsConfig";
import { POLLING_INTERVAL, queryKeysFactory } from "~/ui-config/queries";
import { useSharedDependencies } from "~/ui-config/SharedDependenciesProvider";
export type HookOpts<T, V> = {
  select?: (originalValue: T) => V;
  refetchInterval?: number | false | (() => number | false);
  staleTime?: number;
};

export const useUserPoolsReservesHumanized = <T = UserReservesDataHumanized>(
  marketsData: MarketDataType[],
  user: `0x${string}`,
  opts?: HookOpts<UserReservesDataHumanized, T>
) => {
  const { uiPoolService } = useSharedDependencies();
  return useQueries({
    queries: marketsData.map((marketData) => ({
      queryKey: queryKeysFactory.userPoolReservesDataHumanized(
        user,
        marketData
      ),
      queryFn: () => uiPoolService.getUserReservesHumanized(marketData, user),
      enabled: !!user,
      refetchInterval: POLLING_INTERVAL,
      ...opts,
    })),
  });
};

export const useUserPoolReservesHumanized = (
  marketData: MarketDataType,
  user: `0x${string}`
) => {
  return useUserPoolsReservesHumanized([marketData], user)[0];
};
