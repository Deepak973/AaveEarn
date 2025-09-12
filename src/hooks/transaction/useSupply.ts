import { useCallback, useState } from "react";
import { Address, WaitForTransactionReceiptReturnType, parseAbi } from "viem";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "~/components/providers/WagmiProvider";
import { submitAction } from "~/utils/submitAction";
import { encodeFunctionData } from "viem";
import { sendCalls, waitForCallsStatus } from "@wagmi/core";

type UseSupplyHook__Type = {
  supply: (amount: bigint) => Promise<void>;
  supplyWithApprove: (params: {
    token: Address;
    amount: bigint;
    spender?: Address; // defaults to poolAddress
  }) => Promise<void>;
  loading: boolean;
};

const abi = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
]);

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export const useSupply = ({
  poolAddress,
  asset,
  onBehalfOf,
  onPrompt,
  onSubmitted,
  onSuccess,
  onError,
}: {
  poolAddress?: Address;
  asset?: Address;
  onBehalfOf?: Address;
  onPrompt?: () => void;
  onSubmitted?: (hash: `0x${string}`) => void;
  onSuccess?: (receipt: WaitForTransactionReceiptReturnType) => void;
  onError?: (err: unknown) => void;
}): UseSupplyHook__Type => {
  const [loading, setLoading] = useState<boolean>(false);

  const supply = useCallback(
    async (amount: bigint) => {
      if (!poolAddress || !asset || !onBehalfOf) return;

      await submitAction(
        async () => {
          return await writeContract(wagmiConfig, {
            address: poolAddress,
            abi,
            functionName: "supply",
            args: [asset, amount, onBehalfOf, 0], // referralCode is 0
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
    [poolAddress, asset, onBehalfOf, onPrompt, onSubmitted, onSuccess, onError]
  );

  const supplyWithApprove = useCallback(
    async ({
      token,
      amount,
      spender,
    }: {
      token: Address;
      amount: bigint;
      spender?: Address;
    }) => {
      if (!poolAddress || !asset || !onBehalfOf) return;

      try {
        setLoading(true);
        if (onPrompt) onPrompt();

        const approveCalldata = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [spender ?? poolAddress, amount],
        });

        const supplyCalldata = encodeFunctionData({
          abi,
          functionName: "supply",
          args: [asset, amount, onBehalfOf, 0],
        });

        const { id } = await sendCalls(wagmiConfig, {
          calls: [
            { to: token, data: approveCalldata },
            { to: poolAddress, data: supplyCalldata, value: BigInt(0) },
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
    [poolAddress, asset, onBehalfOf, onPrompt, onSubmitted, onSuccess, onError]
  );

  return {
    supply,
    loading,
    supplyWithApprove,
  };
};
