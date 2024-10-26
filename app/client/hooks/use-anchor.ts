import * as anchor from "@coral-xyz/anchor";
import { CrowdEstate } from "@/idl/types/crowd_estate";
import IDL from "@/idl/idl/crowd_estate.json";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export const useAnchor = () => {
	const wallet = useAnchorWallet();
	const { connection } = useConnection();

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
