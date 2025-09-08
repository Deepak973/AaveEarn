import { useCallback, useState } from "react";
import { Address, WaitForTransactionReceiptReturnType, parseAbi } from "viem";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "~/components/providers/WagmiProvider";
import { submitAction } from "~/utils/submitAction";

type UseSupplyHook__Type = {
  supply: (amount: bigint) => Promise<void>;
  loading: boolean;
};

const abi = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
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

  return {
    supply,
    loading,
  };
};
