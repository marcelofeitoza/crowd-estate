"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "../../components/Navbar";
import { useCallback, useEffect, useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { USDC_MINT } from "@/utils/solana";
import {
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountInstruction,
	createInitializeMintInstruction,
	getAssociatedTokenAddress,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "../../components/ui/card";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { useAnchor } from "@/hooks/use-anchor";

interface Property {
	property_name: string;
	total_tokens: number;
	available_tokens: number;
	token_price_usdc: number;
	token_symbol: string;
	admin: string;
	mint: string;
	bump: number;
	dividends_total: number;
	is_closed: boolean;
}

export default function Admin() {
	const { program, provider } = useAnchor();

	const [properties, setProperties] = useState<Property[]>([]);
	const [form, setForm] = useState({
		propertyName: "TESTE",
		totalTokens: 100,
		pricePerToken: 100,
		tokenSymbol: "TST",
	});
	const [, setIsModalOpen] = useState(false);

	const wallet = useWallet();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const fetchProperties = useCallback(async () => {
		try {
			const fetchedProperties = await program.account.property.all();
			const propertiesData = fetchedProperties.map((property) => ({
				publicKey: property.publicKey.toBase58(),
				property_name: Buffer.from(
					property.account.propertyName
				).toString(),
				total_tokens: property.account.totalTokens.toNumber(),
				available_tokens: property.account.availableTokens.toNumber(),
				token_price_usdc:
					property.account.tokenPriceUsdc.toNumber() / 10 ** 6,
				token_symbol: Buffer.from(
					property.account.tokenSymbol
				).toString(),
				admin: property.account.admin.toBase58(),
				mint: property.account.mint.toBase58(),
				bump: property.account.bump,
				dividends_total: property.account.dividendsTotal.toNumber(),
				is_closed: property.account.isClosed,
			}));
			setProperties(propertiesData);
		} catch (error) {
			console.error("Erro ao buscar propriedades:", error);
			alert(
				"Erro ao buscar propriedades. Verifique o console para mais detalhes."
			);
		}
	}, [program]);

	useEffect(() => {
		if (program && provider) {
			fetchProperties();
		}
	}, [fetchProperties, program, provider]);

	const createProperty = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!wallet.publicKey || !wallet.signTransaction) {
			alert("Conecte sua carteira Solana primeiro.");
			return;
		}

		try {
			const adminPublicKey = wallet.publicKey;

			const [propertyPda, bump] = await PublicKey.findProgramAddress(
				[
					Buffer.from("property"),
					adminPublicKey.toBuffer(),
					Buffer.from(form.propertyName),
				],
				program.programId
			);

			const propertyMint = Keypair.generate();

			const adminUsdcAddress = await getAssociatedTokenAddress(
				USDC_MINT,
				adminPublicKey
			);

			const propertyVaultAddress = await getAssociatedTokenAddress(
				propertyMint.publicKey,
				propertyPda,
				true
			);

			const propertyUsdcVaultAddress = await getAssociatedTokenAddress(
				USDC_MINT,
				propertyPda,
				true
			);

			const transaction = new Transaction();
			const instructions = [];

			instructions.push(
				SystemProgram.createAccount({
					fromPubkey: adminPublicKey,
					newAccountPubkey: propertyMint.publicKey,
					space: 82,
					lamports:
						await provider.connection.getMinimumBalanceForRentExemption(
							82
						),
					programId: TOKEN_PROGRAM_ID,
				}),
				createInitializeMintInstruction(
					propertyMint.publicKey,
					0,
					propertyPda,
					null
				)
			);

			instructions.push(
				createAssociatedTokenAccountInstruction(
					adminPublicKey,
					adminUsdcAddress,
					adminPublicKey,
					USDC_MINT
				)
			);

			instructions.push(
				createAssociatedTokenAccountInstruction(
					adminPublicKey,
					propertyVaultAddress,
					propertyPda,
					propertyMint.publicKey
				)
			);

			instructions.push(
				createAssociatedTokenAccountInstruction(
					adminPublicKey,
					propertyUsdcVaultAddress,
					propertyPda,
					USDC_MINT
				)
			);

			const accounts = {
				admin: adminPublicKey,
				property: propertyPda,
				propertyMint: propertyMint.publicKey,
				propertyVault: propertyVaultAddress,
				systemProgram: SystemProgram.programId,
				usdcMint: USDC_MINT,
				propertyUsdcAccount: propertyUsdcVaultAddress,
				tokenProgram: TOKEN_PROGRAM_ID,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			};

			const createPropertyInstruction = await program.methods
				.createProperty(
					form.propertyName,
					new anchor.BN(form.totalTokens),
					new anchor.BN(form.pricePerToken * 10 ** 6),
					form.tokenSymbol,
					bump
				)
				.accounts(accounts)
				.instruction();

			instructions.push(createPropertyInstruction);

			transaction.add(...instructions);
			transaction.recentBlockhash = (
				await provider.connection.getLatestBlockhash()
			).blockhash;
			transaction.feePayer = adminPublicKey;
			transaction.partialSign(propertyMint);

			const signedTransaction = await wallet.signTransaction(transaction);
			const txSignature = await provider.connection.sendRawTransaction(
				signedTransaction.serialize(),
				{
					skipPreflight: false,
					preflightCommitment: "confirmed",
				}
			);

			await provider.connection.confirmTransaction(
				txSignature,
				"confirmed"
			);
			console.log("Transaction successful with signature:", txSignature);

			alert("Propriedade criada com sucesso!");

			setForm({
				propertyName: "",
				totalTokens: 0,
				pricePerToken: 0,
				tokenSymbol: "",
			});

			setIsModalOpen(false);

			fetchProperties();
		} catch (error) {
			console.error("Erro ao criar propriedade:", error);
			alert(
				"Erro ao criar propriedade. Verifique o console para mais detalhes."
			);
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Navbar />

			<main className="container mx-auto p-6">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-3xl font-bold">Your Properties</h2>
					<Dialog>
						<DialogTrigger asChild>
							<Button>Create New Property</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Property</DialogTitle>
							</DialogHeader>
							<form
								onSubmit={createProperty}
								className="space-y-4"
							>
								<div>
									<Label htmlFor="propertyName">
										Property Name
									</Label>
									<Input
										id="propertyName"
										name="propertyName"
										value={form.propertyName}
										onChange={handleChange}
										required
									/>
								</div>
								<div>
									<Label htmlFor="totalTokens">
										Total Tokens
									</Label>
									<Input
										id="totalTokens"
										name="totalTokens"
										type="number"
										value={form.totalTokens}
										onChange={handleChange}
										required
									/>
								</div>
								<div>
									<Label htmlFor="pricePerToken">
										Price per Token (USDC)
									</Label>
									<Input
										id="pricePerToken"
										name="pricePerToken"
										type="number"
										value={form.pricePerToken}
										onChange={handleChange}
										required
									/>
								</div>
								<div>
									<Label htmlFor="tokenSymbol">
										Token Symbol
									</Label>
									<Input
										id="tokenSymbol"
										name="tokenSymbol"
										value={form.tokenSymbol}
										onChange={handleChange}
										required
									/>
								</div>
								<Button type="submit">Create Property</Button>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{properties.length > 0 ? (
						properties.map((property, index) => (
							<Card key={index}>
								<CardHeader>
									<CardTitle className="flex justify-between items-center">
										{property.property_name}
										<Badge
											variant={
												property.is_closed
													? "destructive"
													: "secondary"
											}
										>
											{property.is_closed
												? "Closed"
												: "Open"}
										</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">
										{property.token_symbol}
									</p>
									<p>{property.total_tokens} tokens</p>
									<p>{property.available_tokens} available</p>
									<p>
										${property.token_price_usdc} per token
									</p>
									<p>
										{property.dividends_total} total
										dividends
									</p>
									<Button className="w-full mt-4">
										Manage
									</Button>
								</CardContent>
							</Card>
						))
					) : (
						<p className="text-muted-foreground col-span-3">
							No properties found.
						</p>
					)}
				</div>
			</main>
		</div>
	);
}
