import type { Metadata } from "next";

import "~/app/globals.css";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";

import { ProvidersWrapper } from "./ProviderWrapper";

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
        <ProvidersWrapper>{children}</ProvidersWrapper>
      </body>
    </html>
  );
}
