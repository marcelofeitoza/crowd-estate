"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { useCallback, useEffect, useState } from "react";
import { SendTransactionError } from "@solana/web3.js";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAnchor } from "@/hooks/use-anchor";
import CreatePropertyModal from "@/components/CreatePropertyModal";
import {
	DollarSign,
	Coins,
	ChartColumnIcon,
	Building,
	Search,
	Users,
	RefreshCwIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/components/Profile";
import { createPropertyTransaction } from "@/services/program";
import { getProperties, getUsers, GetUsersResponse } from "@/services/data";
import { useAuth } from "@/components/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { ManagePropertyModal } from "@/components/ManagePropertyModal";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

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

export default function Landlord() {
	const { isAuthenticated, user } = useAuth();
	const router = useRouter();
	const { program, provider } = useAnchor();
	const wallet = useWallet();

	const [properties, setProperties] = useState<Property[]>([]);
	const [users, setUsers] = useState<GetUsersResponse[]>([]);
	const [activeTab, setActiveTab] = useState("properties");
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const [form, setForm] = useState({
		propertyName: "San Francisco Property",
		totalTokens: 1_000,
		pricePerToken: 1_000,
		tokenSymbol: "SFP",
	});

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, router]);

	const fetchProperties = useCallback(async (forceRefresh?: boolean) => {
		try {
			const propertiesData = await getProperties({ forceRefresh });
			setProperties(propertiesData);
		} catch (error) {
			console.error("Error fetching properties:", error);
		}
	}, []);

	const fetchUsers = useCallback(async () => {
		try {
			const usersData = await getUsers(wallet.publicKey.toBase58());
			setUsers(usersData);
		} catch (error) {
			console.error("Error fetching users:", error);
		}
	}, [wallet]);

	useEffect(() => {
		if (program && provider) {
			fetchProperties();
			fetchUsers();
		}
	}, [fetchProperties, fetchUsers, program, provider]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm({
			...form,
			[name]: name === "tokenSymbol" ? value.toUpperCase() : value,
		});
	};

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
			const { txSignature, propertyPda } =
				await createPropertyTransaction(
					provider,
					program,
					form,
					wallet
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

			fetchProperties(true);
		} catch (error) {
			if (error instanceof SendTransactionError) {
				console.error(
					"Transaction error:",
					await error.getLogs(provider.connection)
				);
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

	const handleActionSuccess = () => {
		fetchProperties(true);
	};

	const [filteredProperties, setFilteredProperties] = useState(properties);

	useEffect(() => {
		setFilteredProperties(
			properties.filter((property) => {
				return property.property_name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase());
			})
		);
	}, [properties, searchTerm]);

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
				<Profile user={user} properties={properties} type="landlord" />
				<div className="flex justify-between items-center mb-6">
					<div className="flex space-x-2">
						<h2 className="text-3xl font-bold">
							{activeTab === "properties"
								? "Properties"
								: "Users"}
						</h2>
						<Button
							variant="ghost"
							onClick={() =>
								activeTab === "properties"
									? fetchProperties(true)
									: fetchUsers()
							}
						>
							<RefreshCwIcon />
						</Button>
					</div>
					<CreatePropertyModal
						createProperty={createProperty}
						form={form}
						handleChange={handleChange}
						isLoading={isLoading}
					/>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="mb-8">
						<TabsTrigger
							value="properties"
							onClick={() => fetchProperties(true)}
						>
							<Building className="w-4 h-4 mr-2" />
							Properties
						</TabsTrigger>
						<TabsTrigger value="users" onClick={fetchUsers}>
							<Users className="w-4 h-4 mr-2" />
							Users
						</TabsTrigger>
					</TabsList>

					<TabsContent value="properties">
						<div className="flex items-center space-x-2 mb-4">
							<Search className="w-4 h-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder={`Search ${activeTab}...`}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="max-w-sm"
							/>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredProperties.length > 0 ? (
								filteredProperties.map((property, index) => (
									<Card key={index} className="flex flex-col">
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
										<CardContent className="flex flex-col flex-grow justify-between">
											<>
												<div>
													<Label className="text-sm font-medium">
														Available Tokens
													</Label>
													<Progress
														value={
															property.total_tokens
																? (property.available_tokens /
																		property.total_tokens) *
																	100
																: 0
														}
														className="mt-2"
													/>
													<div className="flex justify-between text-sm mt-1">
														<span>
															{property.available_tokens.toLocaleString()}
														</span>
														<span>
															out of{" "}
															{property.total_tokens.toLocaleString()}
														</span>
													</div>
												</div>

												<Separator className="my-4" />

												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div className="flex items-center">
														<Coins className="w-4 h-4 mr-2 text-muted-foreground" />
														<div>
															<p className="text-sm font-medium">
																Token Symbol
															</p>
															<p className="text-lg">
																{
																	property.token_symbol
																}
															</p>
														</div>
													</div>
													<div className="flex items-center">
														<DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
														<div>
															<p className="text-sm font-medium">
																Price per{" "}
																{
																	property.token_symbol
																}
															</p>
															<p className="text-lg">
																${" "}
																{property.token_price_usdc.toLocaleString()}
															</p>
														</div>
													</div>
													<div className="flex items-center">
														<ChartColumnIcon className="w-4 h-4 mr-2 text-muted-foreground" />
														<div>
															<p className="text-sm font-medium">
																Total Tokens
															</p>
															<p className="text-lg">
																{property.total_tokens.toLocaleString()}{" "}
																{
																	property.token_symbol
																}
															</p>
														</div>
													</div>
													<div className="flex items-center">
														<Coins className="w-4 h-4 mr-2 text-muted-foreground" />
														<div>
															<p className="text-sm font-medium">
																Dividends Total
															</p>
															<p className="text-lg">
																${" "}
																{property.dividends_total.toLocaleString()}
															</p>
														</div>
													</div>
												</div>
											</>

											<ManagePropertyModal
												property={property}
												onActionSuccess={
													handleActionSuccess
												}
											/>
										</CardContent>
									</Card>
								))
							) : (
								<p className="text-muted-foreground col-span-3">
									No properties found.
								</p>
							)}
						</div>
					</TabsContent>

					<TabsContent value="users">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Public Key</TableHead>
									<TableHead>Investments</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user, index) => (
									<TableRow key={index}>
										<TableCell className="font-medium">
											{user.name}
										</TableCell>
										<TableCell>{user.wallet}</TableCell>
										<TableCell>
											{user.investments.length}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
