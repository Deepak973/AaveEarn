"use client";
import { createContext, PropsWithChildren, useCallback, useState } from "react";

export enum Alert_Kind__Enum_Type {
  PROGRESS = "progress",
  INFO = "info",
  SUCCESS = "success",
  ERROR = "error",
}

export type Alert__Type = {
  kind: Alert_Kind__Enum_Type;
  message: string;
};

type StateType = {
  alert: Alert__Type | undefined;
  isLoading: boolean;
};

const initialState: StateType = {
  alert: undefined,
  isLoading: true,
};

const useAlertsContext = (_initialState: StateType) => {
  const [state, setState] = useState(_initialState);

  const showAlert = useCallback((value: Alert__Type) => {
    setState((prev) => ({ ...prev, alert: value }));
  }, []);

  const clearAlert = useCallback(() => {
    setState((prev) => ({ ...prev, alert: undefined }));
  }, []);

  return { state, showAlert, clearAlert };
};

type UseAlertsContextType = ReturnType<typeof useAlertsContext>;

const initialContextState: UseAlertsContextType = {
  state: initialState,

  showAlert: (_value: Alert__Type) => {},
  clearAlert: () => {},
};

export const AlertsContext =
  createContext<UseAlertsContextType>(initialContextState);

export const AlertsProvider = ({ children }: PropsWithChildren) => {
  const value = useAlertsContext(initialState);

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
};
