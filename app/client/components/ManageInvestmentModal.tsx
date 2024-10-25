"use client";

import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Investment, Property } from "@/utils/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { SendTransactionError } from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
	ChartBarIcon,
	ChartColumnIcon,
	Coins,
	DollarSign,
	PieChart,
} from "lucide-react";
import { useAnchor } from "@/hooks/use-anchor";
import { withdrawInvestment } from "@/services/program";
import { getUsdcBalance } from "@/services/usdc";

interface ManageInvestmentProps {
	investment: Investment;
	propertyData: Property;
	onManagementSuccess: (refetch?: boolean) => void;
}

export const ManageInvestmentModal = ({
	investment,
	propertyData,
	onManagementSuccess,
}: ManageInvestmentProps) => {
	const { program, provider } = useAnchor();
	const wallet = useWallet();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const [walletUsdcBalance, setWalletUsdcBalance] = useState<number>(0);
	const [, setErrorUsdcBalance] = useState<boolean>(false);

	useEffect(() => {
		const fetchUsdcBalance = async () => {
			if (wallet.publicKey) {
				try {
					const balance = await getUsdcBalance(
						provider,
						wallet.publicKey
					);
					setWalletUsdcBalance(balance);
				} catch {
					setErrorUsdcBalance(false);
				}
			}
		};

		fetchUsdcBalance();
	}, [provider, wallet.publicKey]);

	const handleWithdraw = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!wallet.publicKey || !program || !provider) {
			toast({
				title: "Error",
				description: "Connect your Solana wallet.",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsSubmitting(true);

			const { txSignature, investmentPda } = await withdrawInvestment(
				provider,
				program,
				investment,
				propertyData,
				wallet
			);

			console.log(
				`https://solscan.io/tx/${txSignature}?cluster=${provider.connection.rpcEndpoint}`
			);

			toast({
				title: "Success",
				description: "Withdrawal successful! " + investmentPda,
				variant: "default",
			});

			setIsSubmitting(false);
			setIsOpen(false);
			onManagementSuccess(true);
		} catch (error) {
			if (error instanceof SendTransactionError) {
				console.error(
					"Transaction error:",
					await error.getLogs(provider.connection)
				);
			} else {
				console.error("Withdrawal error:", error);
			}
			toast({
				title: "Error",
				description: "Failed to withdraw. Check the console.",
				variant: "destructive",
			});
			setIsSubmitting(false);
		}
	};

	const collectDividends = async () => {
		// Implement collectDividends logic here
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<div className="flex flex-col lg:flex-row justify-center lg:justify-between space-y-2 lg:space-y-0 lg:space-x-2 w-full">
				<DialogTrigger asChild>
					<Button
						variant="default"
						disabled={investment.amount === 0}
						className="w-full sm:w-auto"
					>
						Manage Investment
					</Button>
				</DialogTrigger>
				<Button
					variant="outline"
					disabled={investment.amount === 0}
					onClick={collectDividends}
					className="w-full sm:w-auto"
				>
					Collect Dividends
				</Button>
			</div>

			<DialogContent className="sm:max-w-[425px]">
				{investment && propertyData ? (
					<>
						<DialogHeader>
							<DialogTitle className="text-center">
								Withdraw Investment in{" "}
								{propertyData.property_name}
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-4">
							<div>
								<div className="flex justify-between text-sm mb-1">
									<span>Invested</span>
								</div>
								<Progress
									value={
										(investment.amount /
											propertyData.total_tokens) *
										100
									}
								/>
								<div className="flex justify-between text-sm mt-1">
									<span>
										{investment.amount.toLocaleString(
											undefined,
											{
												minimumFractionDigits: 0,
												maximumFractionDigits: 0,
											}
										)}{" "}
										{propertyData.token_symbol}
									</span>
									<span>
										out of{" "}
										{propertyData.total_tokens.toLocaleString(
											undefined,
											{
												minimumFractionDigits: 0,
												maximumFractionDigits: 0,
											}
										)}{" "}
										{propertyData.token_symbol}
									</span>
								</div>
							</div>

							<Separator />

							<div className="grid grid-cols-1 gap-4">
								<InvestmentDetail
									icon={
										<DollarSign className="w-5 h-5 text-muted-foreground" />
									}
									label="Invested Value"
									value={`$ ${(
										investment.amount *
										propertyData.token_price_usdc
									).toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}`}
								/>
								<InvestmentDetail
									icon={
										<Coins className="w-5 h-5 text-muted-foreground" />
									}
									label="Token Symbol"
									value={propertyData.token_symbol}
								/>
								<InvestmentDetail
									icon={
										<DollarSign className="w-5 h-5 text-muted-foreground" />
									}
									label="Price per Token"
									value={`$ ${propertyData.token_price_usdc.toLocaleString(
										undefined,
										{
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										}
									)}`}
								/>
								<InvestmentDetail
									icon={
										<ChartBarIcon className="w-5 h-5 text-muted-foreground" />
									}
									label="Total Tokens"
									value={`${propertyData.total_tokens.toLocaleString(
										undefined,
										{
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										}
									)} ${propertyData.token_symbol}`}
								/>
								<InvestmentDetail
									icon={
										<ChartColumnIcon className="w-5 h-5 text-muted-foreground" />
									}
									label="Tokens Owned"
									value={`${investment.amount.toLocaleString(
										undefined,
										{
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										}
									)} ${propertyData.token_symbol}`}
								/>
								<InvestmentDetail
									icon={
										<PieChart className="w-5 h-5 text-muted-foreground" />
									}
									label="Dividends Claimed"
									value={`$ ${(
										investment.dividendsClaimed / 1e6
									).toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}`}
								/>
							</div>
						</div>

						<Separator />

						<form onSubmit={handleWithdraw} className="space-y-4">
							<p className="text-sm text-muted-foreground text-center">
								USDC Balance: ${" "}
								{walletUsdcBalance.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>

							<Button
								type="submit"
								disabled={isSubmitting}
								className="w-full"
							>
								{isSubmitting ? (
									<LoadingSpinner />
								) : (
									"Confirm Withdrawal"
								)}
							</Button>
						</form>
					</>
				) : (
					<LoadingSpinner />
				)}
			</DialogContent>
		</Dialog>
	);
};

const InvestmentDetail = ({ icon, label, value }) => (
	<div className="flex items-center space-x-2">
		{icon}
		<div>
			<p className="text-sm font-medium text-muted-foreground">{label}</p>
			<p className="text-lg font-semibold">{value}</p>
		</div>
	</div>
);
