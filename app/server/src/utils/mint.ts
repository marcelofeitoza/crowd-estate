import {
	createMint,
	getAssociatedTokenAddress,
	getOrCreateAssociatedTokenAccount,
	mintTo,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import dotenv from "dotenv";
import { connection } from "../services/solana";
import { USDC_MINT } from "./constants";
dotenv.config();

const adminKeypair = JSON.parse(process.env.ADM!);
const platform = Keypair.fromSecretKey(Uint8Array.from(adminKeypair));

export const mintUsdc = async (
	amount: number,
	recipient: PublicKey,
	allowOwnerOffCurve = false
) => {
	let recipientUsdcAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		platform,
		USDC_MINT,
		recipient,
		allowOwnerOffCurve
	);

	const balanceBefore = await connection.getTokenAccountBalance(
		recipientUsdcAccount.address
	);
	console.log(
		"Recipient USDC Account Balance Before: ",
		balanceBefore.value.uiAmount
	);

	mintTo(
		connection,
		platform,
		USDC_MINT,
		recipientUsdcAccount.address,
		platform.publicKey,
		amount * 10 ** 6
	);

	const balanceAfter = await connection.getTokenAccountBalance(
		recipientUsdcAccount.address
	);
	console.log(
		"Recipient USDC Account Balance After: ",
		balanceAfter.value.uiAmount
	);
};
