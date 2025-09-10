import { useCallback, useState } from "react";
import { Address, WaitForTransactionReceiptReturnType, parseAbi } from "viem";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "~/components/providers/WagmiProvider";
import { submitAction } from "~/utils/submitAction";

type UseWrappedTokenHook__Type = {
  depositETH: (amount: bigint) => Promise<void>;
  withdrawETH: (amount: bigint) => Promise<void>;
  loading: boolean;
};

const abi = parseAbi([
  "function depositETH(address pool, address onBehalfOf, uint16 referralCode) external payable",
  "function withdrawETH(address pool, uint256 amount, address to) external",
]);

export const useWrappedToken = ({
  wethGatewayAddress,
  poolAddress,
  onBehalfOf,
  to,
  onPrompt,
  onSubmitted,
  onSuccess,
  onError,
}: {
  wethGatewayAddress?: Address;
  poolAddress?: Address;
  onBehalfOf?: Address;
  to?: Address;
  onPrompt?: () => void;
  onSubmitted?: (hash: `0x${string}`) => void;
  onSuccess?: (receipt: WaitForTransactionReceiptReturnType) => void;
  onError?: (err: unknown) => void;
}): UseWrappedTokenHook__Type => {
  const [loading, setLoading] = useState<boolean>(false);

  const depositETH = useCallback(
    async (amount: bigint) => {
      if (!wethGatewayAddress || !poolAddress || !onBehalfOf) return;

      await submitAction(
        async () => {
          return await writeContract(wagmiConfig, {
            address: wethGatewayAddress,
            abi,
            functionName: "depositETH",
            args: [poolAddress, onBehalfOf, 0], // referralCode is 0
            value: amount, // ETH amount to deposit
            gas: BigInt(300000),
          });
        },
        {
          onPrompt: () => {
            setLoading(true);
            if (onPrompt) onPrompt();
          },
          onSubmitted,
          onSuccess: async (receipt: WaitForTransactionReceiptReturnType) => {
            setLoading(false);
            if (onSuccess) onSuccess(receipt);
          },
          onError: (err: unknown) => {
            setLoading(false);
            if (onError) onError(err);
          },
        }
      );
    },
    [
      wethGatewayAddress,
      poolAddress,
      onBehalfOf,
      onPrompt,
      onSubmitted,
      onSuccess,
      onError,
    ]
  );

  const withdrawETH = useCallback(
    async (amount: bigint) => {
      if (!wethGatewayAddress || !poolAddress || !to) return;

      await submitAction(
        async () => {
          return await writeContract(wagmiConfig, {
            address: wethGatewayAddress,
            abi,
            functionName: "withdrawETH",
            args: [poolAddress, amount, to],
            gas: BigInt(300000),
          });
        },
        {
          onPrompt: () => {
            setLoading(true);
            if (onPrompt) onPrompt();
          },
          onSubmitted,
          onSuccess: async (receipt: WaitForTransactionReceiptReturnType) => {
            setLoading(false);
            if (onSuccess) onSuccess(receipt);
          },
          onError: (err: unknown) => {
            setLoading(false);
            if (onError) onError(err);
          },
        }
      );
    },
    [
      wethGatewayAddress,
      poolAddress,
      to,
      onPrompt,
      onSubmitted,
      onSuccess,
      onError,
    ]
  );

  return {
    depositETH,
    withdrawETH,
    loading,
  };
};
