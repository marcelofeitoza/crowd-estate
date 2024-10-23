"use client";

import { useCallback, useEffect, useState } from "react";
import { Investment, mintUsdc, Property, USDC_MINT } from "@/utils/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Building, Wallet } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PropertyCard } from "@/components/PropertyCard";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddress,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";
import { ManageInvestmentModal } from "@/components/ManageInvestmentModal";
import { useAnchor } from "@/hooks/use-anchor";

export default function Invest() {
	const { program, provider } = useAnchor();
	const wallet = useWallet();

	const [properties, setProperties] = useState<Property[]>([]);
	const [investments, setInvestments] = useState<Investment[]>([]);
	const [isLoadingProperties, setIsLoadingProperties] = useState(false);
	const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);
	const [, setWalletUsdcBalance] = useState<number>(0);

	const fetchProperties = useCallback(async () => {
		try {
			setIsLoadingProperties(true);

			const fetchedProperties = await program.account.property.all();

			const propertiesData = fetchedProperties.map((property) => ({
				publicKey: property.publicKey.toBase58(),
				property_name: Buffer.from(
					property.account.propertyName
				).toString(),
				total_tokens: property.account.totalTokens.toNumber(),
				available_tokens: property.account.availableTokens.toNumber(),
				token_price_usdc:
					property.account.tokenPriceUsdc.toNumber() / 1e6,
				token_symbol: Buffer.from(
					property.account.tokenSymbol
				).toString(),
				admin: property.account.admin.toBase58(),
				mint: property.account.mint.toBase58(),
				bump: property.account.bump,
				dividends_total:
					property.account.dividendsTotal.toNumber() / 1e6,
				is_closed: property.account.isClosed,
			}));

			propertiesData.sort((a, b) =>
				a.is_closed === b.is_closed ? 0 : a.is_closed ? 1 : -1
			);

			setProperties(propertiesData);
		} catch (error) {
			console.error("Error fetching properties:", error);
			toast({
				title: "Error",
				description:
					"Failed to fetch properties. Please try again later.",
				variant: "destructive",
			});
		} finally {
			setIsLoadingProperties(false);
		}
	}, [program]);

	const fetchInvestments = useCallback(async () => {
		try {
			setIsLoadingInvestments(true);
			const investorPublicKey = wallet.publicKey?.toBuffer();
			if (!investorPublicKey) {
				setIsLoadingInvestments(false);
				return;
			}

			const fetchedInvestments = await program.account.investor.all();
			const investmentsData = fetchedInvestments
				.filter((investment) =>
					investment.account.investor.equals(wallet.publicKey)
				)
				.map((investment) => ({
					publicKey: investment.publicKey.toBase58(),
					investor: investment.account.investor.toBase58(),
					property: investment.account.property.toBase58(),
					amount: investment.account.tokensOwned.toNumber(),
					dividendsClaimed:
						investment.account.dividendsClaimed.toNumber(),
				}));

			setInvestments(investmentsData);
		} catch (error) {
			console.error("Error fetching investments:", error);
			toast({
				title: "Error",
				description:
					"Failed to fetch your investments. Please try again later.",
				variant: "destructive",
			});
		} finally {
			setIsLoadingInvestments(false);
		}
	}, [program, wallet.publicKey]);

	useEffect(() => {
		const getUsdcBalance = async () => {
			try {
				const userUsdcAddress = await getAssociatedTokenAddress(
					USDC_MINT,
					wallet.publicKey
				);

				const balance = await provider.connection
					.getTokenAccountBalance(userUsdcAddress)
					.then((balance) => balance.value.uiAmount)
					.catch(async (error) => {
						console.error("Erro ao obter saldo de USDC:", error);

						const tx = new Transaction().add(
							createAssociatedTokenAccountInstruction(
								wallet.publicKey,
								userUsdcAddress,
								wallet.publicKey,
								USDC_MINT
							)
						);
						const signature = await wallet.sendTransaction(
							tx,
							provider.connection
						);
						await provider.connection.confirmTransaction(
							signature,
							"confirmed"
						);
						return 0;
					});

				if (balance === 0) {
					await mintUsdc(1000, userUsdcAddress);
				}

				console.log("Saldo USDC:", balance);
				setWalletUsdcBalance(balance);
			} catch (error) {
				console.error("Erro ao obter saldo de USDC:", error);
				setWalletUsdcBalance(0);
			}
		};

		if (wallet.publicKey) {
			getUsdcBalance();
		}
	}, [provider, wallet, wallet.publicKey]);

	useEffect(() => {
		if (program && provider && wallet.publicKey) {
			console.log("Fetching properties and investments...");
			fetchProperties();
			fetchInvestments();
		}
	}, [
		fetchInvestments,
		fetchProperties,
		program,
		provider,
		wallet.publicKey,
	]);

	const handleSuccess = () => {
		fetchInvestments();
		fetchProperties();
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Navbar />

			<main className="container mx-auto p-6">
				<Tabs defaultValue="properties" className="mb-6">
					<TabsList className="mb-8">
						<TabsTrigger value="properties">
							<Building className="w-4 h-4 mr-2" />
							Properties
						</TabsTrigger>
						<TabsTrigger value="investments">
							<Wallet className="w-4 h-4 mr-2" />
							Your Investments
						</TabsTrigger>
					</TabsList>
					<TabsContent value="properties">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-3xl font-bold">
								Explore Properties
							</h2>
							<div className="flex space-x-2">
								<Button variant="outline">Filters</Button>
								<Button variant="outline">Sort</Button>
							</div>
						</div>

						{isLoadingProperties ? (
							<LoadingSpinner />
						) : properties.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{properties.map((property) => (
									<PropertyCard
										onInvestmentSuccess={handleSuccess}
										key={property.publicKey}
										property={property}
									/>
								))}
							</div>
						) : (
							<p className="text-muted-foreground">
								No properties found.
							</p>
						)}
					</TabsContent>
					<TabsContent value="investments">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-3xl font-bold">
								Your Investments
							</h2>
							<div className="flex space-x-2">
								<Button variant="outline">Filters</Button>
								<Button variant="outline">Sort</Button>
							</div>
						</div>

						{isLoadingInvestments ? (
							<LoadingSpinner />
						) : investments.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{investments.map((investment) => (
									<ManageInvestmentModal
										key={investment.publicKey}
										onManagementSuccess={handleSuccess}
										investment={investment}
									/>
								))}
							</div>
						) : (
							<p className="text-muted-foreground">
								You have no investments.
							</p>
						)}
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
