/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { network } from "@/utils/solana";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const networkUrl = (network: WalletAdapterNetwork | string) => {
    if (network === WalletAdapterNetwork.Devnet) {
      return clusterApiUrl(network);
    } else if (network === "http://localhost:8899") {
      return "http://localhost:8899";
    } else {
      throw new Error("Unsupported network");
    }
  };

  const endpoint = useMemo(
    () => networkUrl(network as WalletAdapterNetwork),
    [network],
  );

  // Inicializar os wallets com os adaptadores desejados
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({
        network: network as WalletAdapterNetwork,
      }),
      // Adicione outros adaptadores aqui
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{}}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
