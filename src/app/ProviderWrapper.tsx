"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SharedDependenciesProvider } from "~/ui-config/SharedDependenciesProvider";
import { AlertsProvider } from "./AllertProvider";
import { Notifier } from "~/hooks/Notifier";
import { AppDataProvider } from "~/hooks/app-data-provider/useAppDataProvider";
import { Providers } from "~/app/providers";

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <Providers>
      <QueryClientProvider client={queryClient}>
        <SharedDependenciesProvider>
          <AlertsProvider>
            <Notifier />
            <AppDataProvider>{children}</AppDataProvider>
          </AlertsProvider>
        </SharedDependenciesProvider>
      </QueryClientProvider>
    </Providers>
  );
}
