/* eslint-disable @typescript-eslint/no-unused-vars */
import * as anchor from "@coral-xyz/anchor";
import { CrowdEstate } from "@/idl/types/crowd_estate";
import IDL from "@/idl/idl/crowd_estate.json";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { endpoint, setupUsdc } from "@/utils/solana";

export const useAnchor = () => {
	const wallet = useAnchorWallet();

	// for using Devnet
	const { connection } = useConnection();

	// for using Localnet
	// const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || endpoint;
	// const connection = useMemo(() => new Connection(network), [network]);

	// setupUsdc(connection);

	const provider = useMemo(() => {
		if (!wallet) return null;
		return new anchor.AnchorProvider(connection, wallet, {
			preflightCommitment: "processed",
		});
	}, [connection, wallet]);

	const program = useMemo(() => {
		if (!provider) return null;
		return new anchor.Program<CrowdEstate>(IDL as CrowdEstate, provider);
	}, [provider]);

	return { provider, program };
};
