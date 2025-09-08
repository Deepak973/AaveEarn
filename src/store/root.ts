import { enableMapSet } from "immer";
import { CustomMarket } from "~/ui-config/marketsConfig";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import {
  createProtocolDataSlice,
  ProtocolDataSlice,
} from "./protocolDataSlice";

enableMapSet();

export type RootStore = ProtocolDataSlice;

export const useRootStore = create<RootStore>()(
  subscribeWithSelector(
    devtools((...args) => {
      return {
        ...createProtocolDataSlice(...args),
      };
    })
  )
);

// hydrate state from localeStorage to not break on ssr issues
if (typeof document !== "undefined") {
  document.onreadystatechange = function () {
    if (document.readyState == "complete") {
      const selectedMarket = localStorage.getItem("selectedMarket");

      if (selectedMarket) {
        const currentMarket = useRootStore.getState().currentMarket;
        const setCurrentMarket = useRootStore.getState().setCurrentMarket;
        if (selectedMarket !== currentMarket) {
          setCurrentMarket(selectedMarket as CustomMarket, true);
        }
      }
    }
  };
}

// useRootStore.subscribe(
//   (state) => state.currentMarket,
//   (account) => {
//     if (account) {
//       // useRootStore.getState().fetchConnectedWalletDomains();
//     } else {
//       // useRootStore.getState().clearWalletDomains();
//     }
//   },
//   { fireImmediately: true }
// );
