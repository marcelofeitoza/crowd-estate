"use client";

import { useCallback, useEffect, useState } from "react";
import { Investment, Property } from "@/utils/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Building, Wallet } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PropertyCard } from "@/components/PropertyCard";
import { useAnchor } from "@/hooks/use-anchor";
import { InvestmentCard } from "@/components/InvestmentCard";
import { Profile } from "@/components/Profile";
import { getProperties, getInvestments } from "@/services/data";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";

export default function Invest() {
	const { isAuthenticated, user } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, router]);

	const { program } = useAnchor();
	const wallet = useWallet();

	const [properties, setProperties] = useState<Property[]>([]);
	const [investments, setInvestments] = useState<Investment[]>([]);
	const [isLoadingProperties, setIsLoadingProperties] = useState(false);
	const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);
	const [totalInvested, setTotalInvested] = useState(0);
	const [totalReturns, setTotalReturns] = useState(0);

	const fetchProperties = useCallback(
		async (refetch?: boolean) => {
			try {
				setIsLoadingProperties(true);
				const properties = await getProperties(
					program,
					[],
					null,
					refetch
				);
				console.log("properties", properties);

				setProperties(properties);
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
		},
		[program]
	);

	const fetchInvestments = useCallback(
		async (refetch?: boolean) => {
			try {
				setIsLoadingInvestments(true);
				const investorPublicKey = wallet.publicKey;
				if (!investorPublicKey) {
					setIsLoadingInvestments(false);
					return;
				}

				const { investmentsData, invested, returns } =
					await getInvestments(
						program,
						properties,
						investorPublicKey,
						refetch
					);

				setInvestments(investmentsData);
				setTotalInvested(invested);
				setTotalReturns(returns);
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
		},
		[program, wallet.publicKey, properties]
	);

	useEffect(() => {
		if (program && wallet.publicKey) {
			fetchProperties();
			fetchInvestments();
		}
	}, [fetchInvestments, fetchProperties, program, wallet.publicKey]);

	const handleSuccess = (refetch?: boolean) => {
		fetchInvestments(refetch);
		fetchProperties(refetch);
	};

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-background text-foreground flex items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Navbar />

			<main className="container mx-auto p-6">
				<Profile
					user={user}
					totalInvested={totalInvested}
					totalReturns={totalReturns}
					investments={investments}
					type="investor"
				/>

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
							<div className="flex flex-wrap gap-6">
								{investments.map((investment) => (
									<div
										key={investment.publicKey}
										className="w-full md:w-1/2 lg:w-1/3"
									>
										<InvestmentCard
											onManagementSuccess={handleSuccess}
											investment={investment}
										/>
									</div>
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
