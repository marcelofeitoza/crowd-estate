import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as crypto from "crypto";
import { RPC_URL } from "./constants";
import { connection } from "../services/solana";

export const createUserWallet = async () => {
	const keypair = Keypair.generate();

	const airdropSignature = await connection.requestAirdrop(
		keypair.publicKey,
		10 * LAMPORTS_PER_SOL
	);
	await connection.confirmTransaction(airdropSignature);

	const pubkey = keypair.publicKey.toString();
	const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey);

	return { pubkey, encryptedPrivateKey };
};

const encryptPrivateKey = (privateKey: Uint8Array): string => {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(
		"aes-256-ctr",
		Buffer.from(process.env.CRYPTO_SECRET!, "hex"),
		iv
	);

	const encrypted = Buffer.concat([
		cipher.update(privateKey),
		cipher.final(),
	]);

	return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptPrivateKey = (encryptedPrivateKey: string): Uint8Array => {
	const [iv, encrypted] = encryptedPrivateKey
		.split(":")
		.map((str) => Buffer.from(str, "hex"));

	const decipher = crypto.createDecipheriv(
		"aes-256-ctr",
		Buffer.from(process.env.CRYPTO_SECRET!, "hex"),
		iv
	);

	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);

	return new Uint8Array(decrypted);
};
