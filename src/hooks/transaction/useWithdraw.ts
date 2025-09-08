import { useCallback, useState } from "react";
import { Address, WaitForTransactionReceiptReturnType, parseAbi } from "viem";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "~/components/providers/WagmiProvider";
import { submitAction } from "~/utils/submitAction";

type UseWithdrawHook__Type = {
  withdraw: (amount: bigint) => Promise<void>;
  loading: boolean;
};

const abi = parseAbi([
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
]);

export const useWithdraw = ({
  poolAddress,
  asset,
  to,
  onPrompt,
  onSubmitted,
  onSuccess,
  onError,
}: {
  poolAddress?: Address;
  asset?: Address;
  to?: Address;
  onPrompt?: () => void;
  onSubmitted?: (hash: `0x${string}`) => void;
  onSuccess?: (receipt: WaitForTransactionReceiptReturnType) => void;
  onError?: (err: unknown) => void;
}): UseWithdrawHook__Type => {
  const [loading, setLoading] = useState<boolean>(false);

  const withdraw = useCallback(
    async (amount: bigint) => {
      if (!poolAddress || !asset || !to) return;

      await submitAction(
        async () => {
          return await writeContract(wagmiConfig, {
            address: poolAddress,
            abi,
            functionName: "withdraw",
            args: [asset, amount, to],
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
    [poolAddress, asset, to, onPrompt, onSubmitted, onSuccess, onError]
  );

  return {
    withdraw,
    loading,
  };
};
