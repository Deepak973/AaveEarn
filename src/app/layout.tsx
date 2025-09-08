import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { AppDataProvider } from "~/hooks/app-data-provider/useAppDataProvider";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import { SharedDependenciesProvider } from "~/ui-config/SharedDependenciesProvider";
import { AlertsProvider } from "./AllertProvider";
import { Notifier } from "~/hooks/Notifier";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SharedDependenciesProvider>
            <AlertsProvider>
              <Notifier />
              <AppDataProvider>{children}</AppDataProvider>
            </AlertsProvider>
          </SharedDependenciesProvider>
        </Providers>
      </body>
    </html>
  );
}
