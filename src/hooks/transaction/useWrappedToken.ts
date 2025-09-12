import { useCallback, useState } from "react";
import { Address, WaitForTransactionReceiptReturnType, parseAbi } from "viem";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "~/components/providers/WagmiProvider";
import { submitAction } from "~/utils/submitAction";
import { encodeFunctionData } from "viem";
import { sendCalls, waitForCallsStatus } from "@wagmi/core";

type UseWrappedTokenHook__Type = {
  depositETH: (amount: bigint) => Promise<void>;
  withdrawETH: (amount: bigint) => Promise<void>;
  loading: boolean;
};

const abi = parseAbi([
  "function depositETH(address pool, address onBehalfOf, uint16 referralCode) external payable",
  "function withdrawETH(address pool, uint256 amount, address to) external",
]);

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export const useWrappedToken = ({
  wethGatewayAddress,
  poolAddress,
  onBehalfOf,
  to,
  aTokenAddress,
  onPrompt,
  onSubmitted,
  onSuccess,
  onError,
}: {
  wethGatewayAddress?: Address;
  poolAddress?: Address;
  onBehalfOf?: Address;
  to?: Address;
  aTokenAddress?: Address; // aToken to approve for withdrawETH path
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
      if (!wethGatewayAddress || !poolAddress || !to || !aTokenAddress) return;
      try {
        setLoading(true);
        if (onPrompt) onPrompt();

        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [wethGatewayAddress, amount],
        });

        const withdrawData = encodeFunctionData({
          abi,
          functionName: "withdrawETH",
          args: [poolAddress, amount, to],
        });

        const { id } = await sendCalls(wagmiConfig, {
          calls: [
            { to: aTokenAddress, data: approveData },
            { to: wethGatewayAddress, data: withdrawData },
          ],
        });

        const { receipts } = await waitForCallsStatus(wagmiConfig, { id });
        const first = receipts?.[0];
        if (onSubmitted && first?.transactionHash)
          onSubmitted(first.transactionHash);
        if (onSuccess && first)
          onSuccess(first as unknown as WaitForTransactionReceiptReturnType);
      } catch (err) {
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    },
    [
      wethGatewayAddress,
      poolAddress,
      to,
      aTokenAddress,
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
