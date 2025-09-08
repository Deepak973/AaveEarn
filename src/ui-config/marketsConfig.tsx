import { ChainId } from "@aave/contract-helpers";
import { AaveV3Base } from "@bgd-labs/aave-address-book";
import { ReactNode } from "react";

// Enable for premissioned market
// import { PermissionView } from 'src/components/transactions/FlowCommons/PermissionView';
export type MarketDataType = {
  v3?: boolean;
  marketTitle: string;
  market: CustomMarket;
  // the network the market operates on
  chainId: ChainId;
  enabledFeatures?: {
    liquiditySwap?: boolean;
    staking?: boolean;
    governance?: boolean;
    faucet?: boolean;
    collateralRepay?: boolean;
    incentives?: boolean;
    permissions?: boolean;
    debtSwitch?: boolean;
    withdrawAndSwitch?: boolean;
    switch?: boolean;
  };
  permitDisabled?: boolean; // intended to be used for testnets
  isFork?: boolean;
  permissionComponent?: ReactNode;
  subgraphUrl?: string;
  logo?: string;
  externalUrl?: string; // URL for external markets like Aptos
  addresses: {
    LENDING_POOL_ADDRESS_PROVIDER: string;
    LENDING_POOL: string;
    WETH_GATEWAY?: string;
    SWAP_COLLATERAL_ADAPTER?: string;
    REPAY_WITH_COLLATERAL_ADAPTER?: string;
    DEBT_SWITCH_ADAPTER?: string;
    WITHDRAW_SWITCH_ADAPTER?: string;
    FAUCET?: string;
    PERMISSION_MANAGER?: string;
    WALLET_BALANCE_PROVIDER: string;
    L2_ENCODER?: string;
    UI_POOL_DATA_PROVIDER: string;
    UI_INCENTIVE_DATA_PROVIDER?: string;
    COLLECTOR?: string;
    V3_MIGRATOR?: string;
    GHO_TOKEN_ADDRESS?: string;
  };
};
export enum CustomMarket {
  // v3 mainnets
  proto_base_v3 = "proto_base_v3",
}

const apiKey = process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY;

export const marketsData: {
  [key in keyof typeof CustomMarket]: MarketDataType;
} = {
  [CustomMarket.proto_base_v3]: {
    marketTitle: "Base",
    market: CustomMarket.proto_base_v3,
    v3: true,
    chainId: ChainId.base,
    enabledFeatures: {
      incentives: true,
      liquiditySwap: true,
      withdrawAndSwitch: true,
      collateralRepay: true,
      debtSwitch: true,
      switch: true,
    },
    subgraphUrl: `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF`,
    addresses: {
      LENDING_POOL_ADDRESS_PROVIDER: AaveV3Base.POOL_ADDRESSES_PROVIDER,
      LENDING_POOL: AaveV3Base.POOL,
      WETH_GATEWAY: AaveV3Base.WETH_GATEWAY,
      WALLET_BALANCE_PROVIDER: AaveV3Base.WALLET_BALANCE_PROVIDER,
      UI_POOL_DATA_PROVIDER: AaveV3Base.UI_POOL_DATA_PROVIDER,
      UI_INCENTIVE_DATA_PROVIDER: AaveV3Base.UI_INCENTIVE_DATA_PROVIDER,
      L2_ENCODER: AaveV3Base.L2_ENCODER,
      COLLECTOR: AaveV3Base.COLLECTOR,
      REPAY_WITH_COLLATERAL_ADAPTER: AaveV3Base.REPAY_WITH_COLLATERAL_ADAPTER,
      SWAP_COLLATERAL_ADAPTER: AaveV3Base.SWAP_COLLATERAL_ADAPTER,
      WITHDRAW_SWITCH_ADAPTER: AaveV3Base.WITHDRAW_SWAP_ADAPTER,
      DEBT_SWITCH_ADAPTER: AaveV3Base.DEBT_SWAP_ADAPTER,
      GHO_TOKEN_ADDRESS: "0x6bb7a212910682dcfdbd5bcbb3e28fb4e8da10ee",
    },
  },
} as const;

export const findByChainId = (chainId: ChainId) => {
  return Object.values(marketsData).find(
    (market) => market.chainId === chainId
  );
};
