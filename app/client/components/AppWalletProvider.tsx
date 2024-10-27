/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useMemo } from "react";
import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { network } from "@/utils/solana";

import "@solana/wallet-adapter-react-ui/styles.css";
import { clusterApiUrl } from "@solana/web3.js";

export default function AppWalletProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const n = clusterApiUrl(network);
	const wallets = useMemo(() => [new PhantomWalletAdapter()], [n]);

	return (
		<ConnectionProvider endpoint={n}>
			<WalletProvider wallets={wallets} autoConnect={true}>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
