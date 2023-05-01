import type { AppProps } from "next/app";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";

import { Web3Modal } from "@web3modal/react";
import { configureChains, createClient, sepolia, WagmiConfig } from "wagmi";
import { arbitrum, mainnet, polygon } from "wagmi/chains";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const chains = [arbitrum, mainnet, polygon, sepolia];
  const projectId = "87e61d9355e116858a99f7371a3e838f";

  const { provider } = configureChains(chains, [w3mProvider({ projectId })]);
  const wagmiClient = createClient({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, version: 1, chains }),
    provider,
  });

  const ethereumClient = new EthereumClient(wagmiClient, chains);
  return (
    <>
      <WagmiConfig client={wagmiClient}>
        <Component {...pageProps} />
      </WagmiConfig>

      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  );
}
