"use client";
import { createContext, PropsWithChildren, useContext } from "react";
import { UiPoolService } from "~/services/UIPoolService";
import { getProvider } from "~/utils/marketsAndNetworksConfig";
import invariant from "tiny-invariant";
import { WalletBalanceService } from "~/services/WalletBalanceService";
import { UiIncentivesService } from "~/services/UIIncentivesService";

interface SharedDependenciesContext {
  uiPoolService: UiPoolService;
  poolTokensBalanceService: WalletBalanceService;
  uiIncentivesService: UiIncentivesService;
}

const SharedDependenciesContext =
  createContext<SharedDependenciesContext | null>(null);

export const SharedDependenciesProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const uiPoolService = new UiPoolService(getProvider);
  const poolTokensBalanceService = new WalletBalanceService(getProvider);
  const uiIncentivesService = new UiIncentivesService(getProvider);

  return (
    <SharedDependenciesContext.Provider
      value={{
        uiPoolService,
        poolTokensBalanceService,
        uiIncentivesService,
      }}
    >
      {children}
    </SharedDependenciesContext.Provider>
  );
};

export const useSharedDependencies = () => {
  const context = useContext(SharedDependenciesContext);
  invariant(
    context,
    "Component should be wrapper inside a <SharedDependenciesProvider />"
  );
  return context;
};
