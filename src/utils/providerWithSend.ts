import { providers } from "ethers";

export interface ProviderWithSend extends providers.Provider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send<P = any, R = any>(method: string, params: Array<P>): Promise<R>;
}
