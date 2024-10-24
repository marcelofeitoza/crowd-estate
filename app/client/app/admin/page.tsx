"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { useCallback, useEffect, useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { USDC_MINT } from "@/utils/solana";
import {
	Keypair,
	PublicKey,
	SendTransactionError,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createInitializeMintInstruction,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAnchor } from "@/hooks/use-anchor";
import CreatePropertyModal from "@/components/CreatePropertyModal";
import { DollarSign, Coins, ChartColumnIcon, PieChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/components/Profile";

interface Property {
	publicKey: string;
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
		propertyName: "San Francisco Property",
		totalTokens: 1_000,
		pricePerToken: 1_000,
		tokenSymbol: "SFP",
	});
	const [isLoading, setIsLoading] = useState(false);

	const wallet = useWallet();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm({
			...form,
			[name]: name === "tokenSymbol" ? value.toUpperCase() : value,
		});
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
			console.error("Error fetching properties:", error);
		}
	}, [program]);

	useEffect(() => {
		if (program && provider) {
			fetchProperties();
		}
	}, [fetchProperties, program, provider]);

	const createProperty = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		if (!wallet.publicKey || !wallet.signTransaction) {
			toast({
				title: "Error",
				description: "Wallet not connected.",
				variant: "destructive",
			});
			setIsLoading(false);
			return;
		}

		try {
			const adminPublicKey = wallet.publicKey;

			const transaction = new Transaction();
			const instructions = [];

			const [propertyPda, bump] = await PublicKey.findProgramAddress(
				[
					Buffer.from("property"),
					adminPublicKey.toBuffer(),
					Buffer.from(form.propertyName),
				],
				program.programId
			);

			const propertyMint = Keypair.generate();
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

			const accounts = {
				admin: adminPublicKey,
				property: propertyPda,
				propertyMint: propertyMint.publicKey,
				usdcMint: USDC_MINT,
				tokenProgram: TOKEN_PROGRAM_ID,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
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
			console.log("Transaction signed");

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

			toast({
				title: "Success",
				description:
					"Property created successfully: " + propertyPda.toBase58(),
				variant: "default",
			});

			setForm({
				propertyName: "",
				totalTokens: 0,
				pricePerToken: 0,
				tokenSymbol: "",
			});

			fetchProperties();
		} catch (error) {
			if (error instanceof SendTransactionError) {
				console.error(
					"Transaction error:",
					await error.getLogs(provider.connection)
				);
				toast({
					title: "Error",
					description:
						"Failed to create property. Please try again later.",
					variant: "destructive",
				});
				return;
			}
			toast({
				title: "Error",
				description:
					"Failed to create property. Please try again later.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Navbar />

			<main className="container mx-auto p-6">
				<Profile wallet={wallet} properties={properties} type="admin" />

				<div className="flex justify-between items-center mb-6">
					<h2 className="text-3xl font-bold">Your Properties</h2>
					<CreatePropertyModal
						createProperty={createProperty}
						form={form}
						handleChange={handleChange}
						isLoading={isLoading}
					/>
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
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="flex items-center">
											<Coins className="w-4 h-4 mr-2 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Token Symbol
												</p>
												<p className="text-lg">
													{property.token_symbol}
												</p>
											</div>
										</div>
										<div className="flex items-center">
											<DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Total Tokens
												</p>
												<p className="text-lg">
													{property.total_tokens}{" "}
													{property.token_symbol}
												</p>
											</div>
										</div>
										<div className="flex items-center">
											<ChartColumnIcon className="w-4 h-4 mr-2 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Available Tokens
												</p>
												<p className="text-lg">
													{property.available_tokens}{" "}
													{property.token_symbol}
												</p>
											</div>
										</div>
										<div className="flex items-center">
											<DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Price per Token
												</p>
												<p className="text-lg">
													${property.token_price_usdc}{" "}
													per {property.token_symbol}
												</p>
											</div>
										</div>
										<div className="flex items-center">
											<PieChart className="w-4 h-4 mr-2 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Total Dividends
												</p>
												<p className="text-lg">
													{property.dividends_total}{" "}
													total dividends
												</p>
											</div>
										</div>
									</div>

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
