import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchor } from "@/hooks/use-anchor";
import { useAuth } from "./AuthContext";
import { toast } from "@/hooks/use-toast";

export const Navbar = () => {
	const { isAuthenticated, logout, user } = useAuth();
	const router = useRouter();
	const { provider } = useAnchor();
	const pathname = usePathname();
	const wallet = useWallet();
	const [balance, setBalance] = useState<number | null>(null);

	useEffect(() => {
		const fetchBalance = async () => {
			let balance = 0;
			if (wallet.publicKey) {
				balance = await provider.connection.getBalance(
					wallet.publicKey
				);
			}

			setBalance(balance / LAMPORTS_PER_SOL);
		};

		fetchBalance();
	}, [wallet.publicKey, provider]);

	const handleLogout = () => {
		logout();
		toast({
			title: "Logout",
			description: "Logout bem-sucedido!",
			variant: "default",
		});
		router.push("/");
	};

	useEffect(() => {
		if (!wallet.publicKey) {
			setBalance(null);
		}
	}, [wallet.publicKey]);

	return (
		<nav className="bg-background border-b">
			<div className="container mx-auto px-6 py-3">
				<div className="flex justify-between items-center">
					<Link href="/" className="text-2xl font-bold">
						CrowdEstate
					</Link>

					<div className="space-x-4 flex items-center">
						{user.role === "landlord" ? (
							<Button
								asChild
								variant={
									pathname === "/landlord"
										? "default"
										: "outline"
								}
							>
								<Link href="/landlord">Landlord</Link>
							</Button>
						) : (
							<Button
								asChild
								variant={
									pathname === "/invest"
										? "default"
										: "outline"
								}
							>
								<Link href="/invest">Investor</Link>
							</Button>
						)}

						{wallet.publicKey && balance ? (
							<span>Balance: {balance.toFixed(2)} SOL</span>
						) : null}

						{isAuthenticated ? (
							<>
								<Button
									onClick={handleLogout}
									variant="outline"
								>
									Logout
								</Button>
							</>
						) : (
							<Button variant="outline">
								<Link href="/login">Login</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};
