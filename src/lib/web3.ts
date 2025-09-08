import { ethers } from "ethers";
import { Pool } from "@aave/contract-helpers";

// Base network configuration
const BASE_NETWORK = {
  chainId: 8453,
  name: "Base",
  rpcUrls: [
    "https://mainnet.base.org",
    "https://base.blockpi.network/v1/rpc/public",
    "https://base.meowrpc.com",
    "https://base.llamarpc.com",
  ],
  contracts: {
    POOL: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5", // Base Aave V3 Pool
    WETH_GATEWAY: "0x9c402E3b0D123323F0FCed781b8184Ec7E02Dd31", // Base Aave V3 WETH Gateway
  },
};

// Initialize provider with fallback URLs
export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    // If we're in the browser and have MetaMask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return provider;
  }

  // Create a fallback provider with multiple URLs
  const fallbackProvider = new ethers.providers.FallbackProvider(
    BASE_NETWORK.rpcUrls.map(
      (url) => new ethers.providers.JsonRpcProvider(url)
    ),
    1 // minimum number of providers that need to agree
  );

  return fallbackProvider;
};

// Initialize Pool contract
export const getPoolContract = (provider: ethers.providers.Provider) => {
  return new Pool(provider, {
    POOL: BASE_NETWORK.contracts.POOL,
    WETH_GATEWAY: BASE_NETWORK.contracts.WETH_GATEWAY,
  });
};

// Supply asset to Aave
export const supplyAsset = async (
  pool: Pool,
  asset: string,
  amount: string
) => {
  try {
    const provider = getProvider();
    let signer;

    if (provider instanceof ethers.providers.Web3Provider) {
      // Check if we're on the correct network
      const network = await provider.getNetwork();
      if (network.chainId !== BASE_NETWORK.chainId) {
        throw new Error("Please switch to Base network");
      }
      signer = provider.getSigner();
    } else {
      throw new Error("Please connect your wallet");
    }

    const tx = await pool.supply({
      user: await signer.getAddress(),
      reserve: asset,
      amount,
      onBehalfOf: await signer.getAddress(),
    });

    return tx;
  } catch (error) {
    console.error("Error supplying asset:", error);
    throw error;
  }
};

// Withdraw asset from Aave
export const withdrawAsset = async (
  pool: Pool,
  asset: string,
  amount: string
) => {
  try {
    const provider = getProvider();
    let signer;

    if (provider instanceof ethers.providers.Web3Provider) {
      // Check if we're on the correct network
      const network = await provider.getNetwork();
      if (network.chainId !== BASE_NETWORK.chainId) {
        throw new Error("Please switch to Base network");
      }
      signer = provider.getSigner();
    } else {
      throw new Error("Please connect your wallet");
    }

    const tx = await pool.withdraw({
      user: await signer.getAddress(),
      reserve: asset,
      amount,
      onBehalfOf: await signer.getAddress(),
    });

    return tx;
  } catch (error) {
    console.error("Error withdrawing asset:", error);
    throw error;
  }
};

// Helper function to switch network to Base
export const switchToBaseNetwork = async () => {
  if (!window.ethereum) throw new Error("No crypto wallet found");

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${BASE_NETWORK.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${BASE_NETWORK.chainId.toString(16)}`,
              chainName: BASE_NETWORK.name,
              rpcUrls: BASE_NETWORK.rpcUrls,
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });
      } catch (addError) {
        console.error("Error adding Base network:", addError);
        throw addError;
      }
    } else {
      console.error("Error switching to Base network:", switchError);
      throw switchError;
    }
  }
};
