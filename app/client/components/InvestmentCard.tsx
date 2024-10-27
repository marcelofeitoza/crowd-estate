"use client";

import { useEffect, useState } from "react";
import { useAnchor } from "@/hooks/use-anchor";
import { ellipsify, Investment, Property } from "@/utils/solana";
import { getProperty } from "@/services/data";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Wallet, Building, TrendingUp } from "lucide-react";
import { ManageInvestmentModal } from "./ManageInvestmentModal";

interface InvestmentCardProps {
	investment: Investment;
	onManagementSuccess: (refetch?: boolean) => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
	investment,
	onManagementSuccess,
}) => {
	const { program } = useAnchor();
	const [propertyData, setPropertyData] = useState<Property>();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchPropertyData = async () => {
			try {
				const property = await getProperty(investment.property);
				setPropertyData(property);
			} catch (error) {
				console.error("Error fetching property data:", error);
			} finally {
				setLoading(false);
			}
		};

		if (investment.property) {
			fetchPropertyData();
		}
	}, [investment, program]);

	useEffect(() => {
		console.log("investment", investment);
		console.log("propertyData", propertyData);
	}, [investment, propertyData]);

	const investmentValue = propertyData
		? investment.amount * propertyData.token_price_usdc
		: 0;

	const InvestmentDetail = ({ icon, label, value }) => (
		<div className="flex items-center space-x-2">
			{icon}
			<div>
				<p className="text-sm font-medium text-muted-foreground">
					{label}
				</p>
				<p className="text-lg font-semibold">{value}</p>
			</div>
		</div>
	);

	return (
		<Card className="overflow-hidden">
			<CardHeader className="pb-2">
				<div className="flex justify-between items-start">
					<div>
						<CardTitle className="text-xl mb-1">
							{loading ? (
								<Skeleton className="h-6 w-48" />
							) : (
								<span className="font-bold hover:text-primary transition-colors">
									{propertyData?.property_name}
								</span>
							)}
						</CardTitle>
						<CardDescription>
							{loading ? (
								<Skeleton className="h-4 w-36" />
							) : (
								<>
									Investment ID:{" "}
									{ellipsify(investment.publicKey)}
								</>
							)}
						</CardDescription>
					</div>
					{!loading && propertyData && (
						<Badge
							variant={
								propertyData.is_closed
									? "destructive"
									: "secondary"
							}
						>
							{propertyData.is_closed ? "Closed" : "Active"}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="pb-2">
				{loading ? (
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
					</div>
				) : (
					<>
						<div className="mb-4">
							<div className="flex justify-between text-sm mb-1">
								<span>Investment Progress</span>
								<span>
									{(
										(investment.amount /
											propertyData.total_tokens) *
										100
									).toFixed(2)}
									%
								</span>
							</div>
							<Progress
								value={
									(investment.amount /
										propertyData.total_tokens) *
									100
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<InvestmentDetail
								icon={
									<Wallet className="w-4 h-4 text-primary" />
								}
								label="Invested Amount"
								value={`${investment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${propertyData?.token_symbol}`}
							/>
							<InvestmentDetail
								icon={
									<Building className="w-4 h-4 text-primary" />
								}
								label="Investment Value"
								value={`$${investmentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
							/>
							{investment.dividendsClaimed > 0 && (
								<InvestmentDetail
									icon={
										<Coins className="w-4 h-4 text-primary" />
									}
									label="Dividends Claimed"
									value={`$${(investment.dividendsClaimed / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
								/>
							)}
							<InvestmentDetail
								icon={
									<TrendingUp className="w-4 h-4 text-primary" />
								}
								label="Token Price"
								value={`$${propertyData?.token_price_usdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
							/>
						</div>
					</>
				)}
			</CardContent>
			<Separator />
			<CardFooter className="pt-4">
				{loading ? (
					<Skeleton className="h-10 w-full" />
				) : (
					investment.amount > 0 && (
						<ManageInvestmentModal
							investment={investment}
							propertyData={propertyData}
							onManagementSuccess={onManagementSuccess}
						/>
					)
				)}
			</CardFooter>
		</Card>
	);
};
