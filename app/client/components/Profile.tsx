import { Investment, Property } from "@/utils/solana";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
	DollarSign,
	PieChart,
	TrendingUp,
	Building,
	Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileProps {
	wallet: WalletContextState;
	totalInvested?: number;
	totalReturns?: number;
	investments?: Investment[];
	properties?: Property[];
	type: "investor" | "admin";
}

export const Profile = ({
	wallet,
	totalInvested = 0,
	totalReturns = 0,
	investments = [],
	properties = [],
	type,
}: ProfileProps) => {
	const totalInvestors = properties.reduce(
		(acc, property) =>
			acc + (property.total_tokens - property.available_tokens),
		0
	);
	const totalValueManaged = properties.reduce(
		(acc, property) =>
			acc + property.total_tokens * property.token_price_usdc,
		0
	);

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle>Your Profile</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center space-x-4 mb-4">
					<Avatar>
						<AvatarImage
							src={`https://robohash.org/${wallet.publicKey?.toBase58()}`}
						/>
						<AvatarFallback className="bg-primary-foreground">
							{wallet.publicKey?.toBase58().slice(0, 2)}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="font-medium">
							{wallet.publicKey
								? wallet.publicKey.toBase58().slice(0, 8) +
									"..."
								: "Not connected"}
						</p>
						<p className="text-sm text-muted-foreground capitalize">
							{type}
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{type === "investor" ? (
						<>
							<Card>
								<CardContent className="flex items-center p-4">
									<DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											Total Invested
										</p>
										<p className="text-lg">
											${totalInvested.toFixed(2)}
										</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="flex items-center p-4">
									<TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											Total Returns
										</p>
										<p className="text-lg">
											${totalReturns.toFixed(2)}
										</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="flex items-center p-4">
									<PieChart className="w-4 h-4 mr-2 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											Active Investments
										</p>
										<p className="text-lg">
											{investments.length}
										</p>
									</div>
								</CardContent>
							</Card>
						</>
					) : (
						<>
							<Card>
								<CardContent className="flex items-center p-4">
									<Building className="w-4 h-4 mr-2 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											Properties Managed
										</p>
										<p className="text-lg">
											{properties.length}
										</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="flex items-center p-4">
									<Users className="w-4 h-4 mr-2 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											Total Investors
										</p>
										<p className="text-lg">
											{totalInvestors}
										</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="flex items-center p-4">
									<DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											Total Value Managed
										</p>
										<p className="text-lg">
											${totalValueManaged.toFixed(2)}
										</p>
									</div>
								</CardContent>
							</Card>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
