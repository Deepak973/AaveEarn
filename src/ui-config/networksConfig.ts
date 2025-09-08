import { ChainId } from "@aave/contract-helpers";
import { base, Chain } from "wagmi/chains";

export type ExplorerLinkBuilderProps = {
  tx?: string;
  address?: string;
};

export type ExplorerLinkBuilderConfig = {
  baseUrl: string;
  addressPrefix?: string;
  txPrefix?: string;
};

export type NetworkConfig = {
  name: string;
  displayName?: string;
  publicJsonRPCUrl: readonly string[]; // public rpc used if not private found
  baseUniswapAdapter?: string;
  /**
   * When this is set withdrawals will automatically be unwrapped
   */
  wrappedBaseAssetSymbol: string;
  baseAssetSymbol: string;
  // needed for configuring the chain on metemask when it doesn't exist yet
  baseAssetDecimals: number;
  // usdMarket?: boolean;
  // function returning a link to etherscan et al
  explorerLink: string;
  explorerLinkBuilder: (props: ExplorerLinkBuilderProps) => string;
  // set this to show faucets and similar
  isTestnet?: boolean;
  // get's automatically populated on fork networks
  isFork?: boolean;
  networkLogoPath: string;
  // contains the forked off chainId
  underlyingChainId?: number;
  bridge?: {
    icon: string;
    name: string;
    url: string;
  };
  wagmiChain: Chain;
};

export type BaseNetworkConfig = Omit<NetworkConfig, "explorerLinkBuilder">;

export const prodNetworkConfig: Record<string, BaseNetworkConfig> = {
  [ChainId.base]: {
    name: "Base",
    publicJsonRPCUrl: [
      "https://base-mainnet.infura.io/v3/b0ed9ff304d7402ea29e5dcfa7092e8a",
      "https://1rpc.io/base",
      "https://base.publicnode.com",
      "https://base-mainnet.public.blastapi.io",
    ],
    baseUniswapAdapter: "0x0",
    baseAssetSymbol: "ETH",
    wrappedBaseAssetSymbol: "WETH",
    baseAssetDecimals: 18,
    explorerLink: "https://basescan.org",
    networkLogoPath: "/icons/networks/base.svg",
    bridge: {
      icon: "/icons/networks/base.svg",
      name: "Base Bridge",
      url: "https://bridge.base.org/",
    },
    wagmiChain: base,
  },
};

export const networkConfigs = {
  ...prodNetworkConfig,
};
