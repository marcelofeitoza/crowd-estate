"use client";

import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { mintUsdc, Property, USDC_MINT } from "@/utils/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { SendTransactionError, Transaction } from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { AlertCircle, Coins, DollarSign, PieChart } from "lucide-react";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useAnchor } from "@/hooks/use-anchor";
import { investInPropertyTransaction } from "@/services/program";
import { checkUsdcAccount } from "@/services/usdc";
import { fetchInvestmentPDA } from "@/services/data";

interface InvestModalProps {
	property: Property;
	onInvestmentSuccess: (refetch?: boolean) => void;
}

export const InvestModal = ({
	property,
	onInvestmentSuccess,
}: InvestModalProps) => {
	const { program, provider } = useAnchor();
	const wallet = useWallet();
	const [usdcAmount, setUsdcAmount] = useState<number>(0);
	const [tokenAmount, setTokenAmount] = useState<number>(0);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [usdcAccountExists, setUsdcAccountExists] = useState<boolean>(true);
	const [walletUsdcBalance, setWalletUsdcBalance] = useState<number>(0);
	const [existingInvestment, setExistingInvestment] =
		useState<boolean>(false);
	const maxInvestmentUSDC =
		property.available_tokens * property.token_price_usdc;
	const tokenPriceUSDC = property.token_price_usdc;

	useEffect(() => {
		const fetchBalance = async () => {
			if (wallet.publicKey) {
				await checkUsdcAccount(provider, wallet.publicKey)
					.then((balance) => {
						setUsdcAccountExists(true);
						setWalletUsdcBalance(balance);
					})
					.catch(() => {
						setUsdcAccountExists(false);
						setWalletUsdcBalance(0);
					});
			}
		};
		fetchBalance();
	}, [provider, wallet]);

	useEffect(() => {
		const checkExistingInvestment = async () => {
			try {
				if (wallet.publicKey && program) {
					const { exists } = await fetchInvestmentPDA(
						program,
						property,
						wallet
					);

					setExistingInvestment(exists);
				}
			} catch (error) {
				console.error("Error checking existing investment:", error);
			}
		};
		checkExistingInvestment();
	}, [program, wallet, property]);

	const handleUsdcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newUsdcAmount = Number(e.target.value);
		if (newUsdcAmount % tokenPriceUSDC !== 0) {
			const adjustedUsdc =
				Math.floor(newUsdcAmount / tokenPriceUSDC) * tokenPriceUSDC;
			setUsdcAmount(adjustedUsdc);
			setTokenAmount(adjustedUsdc / tokenPriceUSDC);
		} else {
			setUsdcAmount(newUsdcAmount);
			setTokenAmount(newUsdcAmount / tokenPriceUSDC);
		}
	};

	const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTokenAmount = Number(e.target.value);
		const newUsdcAmount = newTokenAmount * tokenPriceUSDC;
		setTokenAmount(newTokenAmount);
		setUsdcAmount(newUsdcAmount);
	};

	const handleInvest = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!wallet.publicKey || !program) {
			toast({
				title: "Error",
				description: "Connect your Solana wallet.",
				variant: "destructive",
			});
			return;
		}

		if (usdcAmount <= 0) {
			toast({
				title: "Error",
				description: "Enter a valid amount to invest.",
				variant: "destructive",
			});
			return;
		}

		if (usdcAmount > maxInvestmentUSDC) {
			toast({
				title: "Error",
				description: `The maximum amount you can invest is $ ${maxInvestmentUSDC.toFixed(2)} USDC.`,
				variant: "destructive",
			});
			return;
		}

		if (usdcAmount > walletUsdcBalance) {
			toast({
				title: "Error",
				description: "Insufficient USDC balance for this investment.",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsSubmitting(true);

			const { txSignature, investment } =
				await investInPropertyTransaction(
					provider,
					program,
					property,
					usdcAmount,
					wallet
				);

			console.log(
				`https://solscan.io/tx/${txSignature}?cluster=${provider.connection.rpcEndpoint}`
			);

			toast({
				title: "Success",
				description: "Investment successful: " + investment,
				variant: "default",
			});

			setWalletUsdcBalance(walletUsdcBalance - usdcAmount);
			setIsSubmitting(false);
			setIsOpen(false);
			onInvestmentSuccess(true);
		} catch (error) {
			if (error instanceof SendTransactionError) {
				console.error(
					"Error sending transaction:",
					await error.getLogs(provider.connection)
				);
			} else {
				console.error("Error investing:", error);
			}
			toast({
				title: "Error",
				description: "Investment failed. Check the console.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCreateUsdcAccount = async () => {
		try {
			if (!wallet.publicKey || !provider) {
				toast({
					title: "Error",
					description:
						"Wallet not connected or provider unavailable.",
					variant: "destructive",
				});
				return;
			}

			const userUsdcAddress = await getAssociatedTokenAddress(
				USDC_MINT,
				wallet.publicKey
			);
			const accountInfo =
				await provider.connection.getAccountInfo(userUsdcAddress);
			if (accountInfo) {
				toast({
					title: "Info",
					description: "USDC account already exists.",
					variant: "default",
				});
				setUsdcAccountExists(true);
				return;
			}

			const tx = new Transaction().add(
				createAssociatedTokenAccountInstruction(
					wallet.publicKey,
					userUsdcAddress,
					wallet.publicKey,
					USDC_MINT
				)
			);
			tx.recentBlockhash = (
				await provider.connection.getLatestBlockhash()
			).blockhash;
			tx.feePayer = wallet.publicKey;

			const signTx = await wallet.signTransaction(tx);
			const signature = await provider.connection.sendRawTransaction(
				signTx.serialize()
			);

			toast({
				title: "Success",
				description: "USDC account created successfully: " + signature,
				variant: "default",
			});

			setUsdcAccountExists(true);
		} catch (error) {
			console.error("Error creating USDC account:", error);
			toast({
				title: "Error",
				description: "Failed to create USDC account. Please try again.",
				variant: "destructive",
			});
		}
	};

	const [isMinting, setIsMinting] = useState<boolean>(false);

	const handleMintUsdc = async () => {
		try {
			setIsMinting(true);
			const usdcAccount = await getAssociatedTokenAddress(
				USDC_MINT,
				wallet.publicKey
			);
			await mintUsdc(provider.connection, 10_000, usdcAccount);
			const balance = await provider.connection
				.getTokenAccountBalance(usdcAccount)
				.then((balance) => balance.value.uiAmount)
				.catch((error) => {
					console.error("Error fetching USDC balance:", error);
					return 0;
				});
			setWalletUsdcBalance(balance);
		} catch (error) {
			console.error("Error minting USDC:", error);
		} finally {
			setIsMinting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="default" disabled={property.is_closed}>
					Invest Now
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						Invest in {property.property_name}
					</DialogTitle>
					<div className="text-sm text-muted-foreground space-y-1">
						<p>
							<strong>Investment Creator:</strong> {property.admin}
						</p>
						<p>
							<strong>Investment PDA:</strong> {property.publicKey}
						</p>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					<div>
						<Label className="text-sm font-medium">
							Available Tokens
						</Label>
						<Progress
							value={
								(property.available_tokens /
									property.total_tokens) *
								100
							}
							className="mt-2"
						/>
						<div className="flex justify-between text-sm mt-1">
							<span>
								{property.available_tokens.toLocaleString(
									undefined,
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									}
								)}
							</span>
							<span>
								out of{" "}
								{property.total_tokens.toLocaleString(
									undefined,
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									}
								)}
							</span>
						</div>
					</div>

					<Separator />

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="flex items-center space-x-2">
							<DollarSign className="w-5 h-5 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">
									Token Price
								</p>
								<p className="text-lg font-semibold">
									${property.token_price_usdc.toFixed(2)}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Coins className="w-5 h-5 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">
									Token Symbol
								</p>
								<p className="text-lg font-semibold">
									{property.token_symbol}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<PieChart className="w-5 h-5 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">
									Total Dividends
								</p>
								<p className="text-lg font-semibold">
									${property.dividends_total.toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				</div>

				{!usdcAccountExists ? (
					<div className="text-center">
						<p className="text-sm text-muted-foreground mb-4">
							You need a USDC account to invest in this property.
						</p>
						<Button
							variant="default"
							onClick={handleCreateUsdcAccount}
							className="w-full"
						>
							Create USDC Account
						</Button>
					</div>
				) : existingInvestment ? (
					<>
						<div className="bg-warning/20 text-warning p-3 rounded-md flex items-center w-full">
							<AlertCircle className="w-4 h-4 mr-2 text-zinc-600" />
							<p className="text-sm text-muted-foreground mb-4 text-zinc-600">
								You already have an investment in this property.
								Please withdraw your existing investment to
								invest again.
							</p>
						</div>
						<Button
							variant="default"
							onClick={() => setIsOpen(false)}
							className="w-full"
						>
							Close
						</Button>
					</>
				) : property.available_tokens > 0 ? (
					<form onSubmit={handleInvest} className="space-y-6 mt-6">
						<div className="space-y-4">
							<div>
								<Label htmlFor="usdcAmount">
									Amount to Invest (USDC)
								</Label>
								<Input
									id="usdcAmount"
									type="number"
									step={tokenPriceUSDC}
									min="0"
									max={Math.min(
										maxInvestmentUSDC,
										walletUsdcBalance
									)}
									value={usdcAmount}
									onChange={handleUsdcChange}
									placeholder={`$0.00 - Max: $${Math.min(maxInvestmentUSDC, walletUsdcBalance).toFixed(2)}`}
									required
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="tokenAmount">
									Token Amount
								</Label>
								<Input
									id="tokenAmount"
									type="number"
									step="1"
									min="0"
									max={property.available_tokens}
									value={tokenAmount}
									onChange={handleTokenChange}
									placeholder={`0 - Max: ${property.available_tokens} tokens`}
									required
									className="mt-1"
								/>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
							<p className="text-sm text-muted-foreground">
								USDC Balance: $
								{walletUsdcBalance.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
							<Button
								variant="outline"
								onClick={handleMintUsdc}
								disabled={isMinting}
							>
								{isMinting ? (
									<LoadingSpinner margin={2} />
								) : null}
								{isMinting ? "Minting..." : "Mint 10,000 USDC"}
							</Button>
						</div>

						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full"
						>
							{isSubmitting ? (
								<LoadingSpinner margin={2} />
							) : null}
							{isSubmitting
								? "Investing..."
								: "Confirm Investment"}
						</Button>
					</form>
				) : (
					<p className="text-center text-muted-foreground mt-6">
						No tokens available for investment.
					</p>
				)}
			</DialogContent>
		</Dialog>
	);
};
