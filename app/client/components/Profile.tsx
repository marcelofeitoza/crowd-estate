import { Investment, Property } from "@/utils/solana";
import { DollarSign, PieChart, TrendingUp, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "./AuthContext";

interface ProfileProps {
	user: User;
	totalInvested?: number;
	totalReturns?: number;
	investments?: Investment[];
	properties?: Property[];
	type: "investor" | "landlord";
}

export const Profile = ({
	user,
	totalInvested = 0,
	totalReturns = 0,
	investments = [],
	properties = [],
	type,
}: ProfileProps) => {
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
							src={`https://robohash.org/${user.publicKey}`}
						/>
						<AvatarFallback className="bg-primary-foreground">
							{user.publicKey?.slice(0, 5)}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="text-lg font-semibold">{user.name} </p>
						<p className="text-sm text-muted-foreground capitalize text-zinc-600">
							{user.publicKey}
						</p>
						<p className="text-sm text-muted-foreground capitalize text-zinc-600">
							{type}
						</p>
					</div>
				</div>
				<div
					className={`grid grid-cols-1 ${type == "investor" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}
				>
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
											$
											{totalInvested.toLocaleString(
												undefined,
												{
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												}
											)}
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
											$
											{totalReturns.toLocaleString(
												undefined,
												{
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												}
											)}
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
									<DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											Total Value Managed
										</p>
										<p className="text-lg">
											${" "}
											{totalValueManaged.toLocaleString(
												undefined,
												{
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												}
											)}
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
