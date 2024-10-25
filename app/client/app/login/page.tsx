"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthContext";
import { PhantomWalletName } from "@solana/wallet-adapter-wallets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function LoginPage() {
	const { connect, select, publicKey } = useWallet();
	const { isAuthenticated, login, user } = useAuth();
	const router = useRouter();

	const [isLoading, setIsLoading] = useState(false);
	const [showRegisterModal, setShowRegisterModal] = useState(false);
	const [name, setName] = useState("");

	useEffect(() => {
		if (isAuthenticated && user) {
			if (user.role === "investor") {
				router.push("/invest");
			} else if (user.role === "landlord") {
				router.push("/landlord");
			} else {
				router.push("/");
			}
		}
	}, [isAuthenticated, router, user]);

	const handleLogin = async () => {
		setIsLoading(true);

		try {
			select(PhantomWalletName);
			await connect();

			if (!publicKey) {
				toast({
					title: "Error",
					description: "Wallet not connected.",
					variant: "destructive",
				});
				setIsLoading(false);
				return;
			}

			try {
				await login(publicKey.toBase58());

				toast({
					title: "Success",
					description: "Login successful!",
					variant: "default",
				});
			} catch (error) {
				if (error.message === "User not found") {
					console.log("User not found, showing register modal");
					setShowRegisterModal(true);
				} else {
					console.error("Error during login:", error);
					toast({
						title: "Error",
						description: "Failed to login. Please try again later.",
						variant: "destructive",
					});
				}
			}
		} catch (error) {
			console.error("Error during login:", error);
			toast({
				title: "Error",
				description: "Failed to login. Please try again later.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleRegister = async () => {
		if (!name) {
			toast({
				title: "Error",
				description: "Please enter your name.",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);

		try {
			await login(publicKey!.toBase58(), name);

			toast({
				title: "Success",
				description: "Registration successful! You are now logged in.",
				variant: "default",
			});

			setShowRegisterModal(false);
		} catch (error) {
			console.error("Error during registration:", error);
			toast({
				title: "Error",
				description: "Failed to register. Please try again later.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-3xl font-bold text-center">
						Welcome to CrowdEstate
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col justify-center space-y-4">
					<p className="text-center text-muted-foreground">
						Login to access your investments and more.
					</p>

					<WalletMultiButton
						style={{
							display: "flex",
							justifyContent: "center",
							width: "100%",
						}}
					/>

					<Button
						onClick={handleLogin}
						disabled={isLoading}
						className="w-full space-x-2"
					>
						{isLoading ? (
							<LoadingSpinner />
						) : (
							<LogIn className="mr-2 h-4 w-4" />
						)}
						{isLoading ? "Connecting..." : "Connect Wallet"}
					</Button>
				</CardContent>
				<CardFooter className="flex justify-center">
					<p className="text-sm text-muted-foreground">
						New to CrowdEstate? Connect your wallet to get started.
					</p>
				</CardFooter>
			</Card>

			<Dialog
				open={showRegisterModal}
				onOpenChange={setShowRegisterModal}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Complete Your Registration</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<p className="text-sm text-muted-foreground">
							Please enter your name to complete the registration
							process.
						</p>
						<Input
							placeholder="Enter your name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<Button
							onClick={handleRegister}
							disabled={!name || isLoading}
							className="w-full space-x-2"
						>
							{isLoading ? (
								<LoadingSpinner />
							) : (
								<UserPlus className="mr-2 h-4 w-4" />
							)}
							{isLoading
								? "Registering..."
								: "Complete Registration"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
