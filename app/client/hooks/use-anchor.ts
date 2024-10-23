import {
	Connection,
} from "@solana/web3.js";

import * as anchor from "@coral-xyz/anchor";
import { CrowdEstate } from "../../../target/types/crowd_estate";
import IDL from "../../../target/idl/crowd_estate.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { endpoint } from "@/utils/solana";

export const useAnchor = () => {
	const wallet = useAnchorWallet();
	const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || endpoint;

	const connection = useMemo(() => new Connection(network), [network]);

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
