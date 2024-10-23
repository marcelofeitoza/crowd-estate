"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
	const [logged, setLogged] = useState(false);
	const wallet = useWallet();

	useEffect(() => {
		if (wallet.publicKey) {
			setLogged(true);
		}
	}, [wallet.publicKey]);

	return (
		<div className="min-h-screen bg-background text-foreground flex items-center justify-center">
			<main className="p-6 max-w-4xl mx-auto text-center">
				<h1 className="text-6xl font-bold mb-8">
					Welcome to Crowd Estate
				</h1>
				<p className="text-lg mb-6">
					Crowd Estate is a platform for investing in real estate
					using Solana blockchain.
				</p>
				<p className="text-lg mb-6">
					We provide a marketplace for buying and selling real estate
					tokens. Our platform allows you to invest in real estate
					properties by purchasing tokens that represent ownership of
					the property.
				</p>
				<p className="text-lg mb-6">
					You can also earn passive income by staking your tokens and
					receiving dividends from the property&apos;s revenue.
				</p>
				<p className="text-lg mb-8">
					Get started by connecting your Solana wallet and exploring
					the available properties.
				</p>
				<div className="flex justify-center space-x-4">
					{!logged ? (
						<WalletMultiButton />
					) : (
						<>
							<Button asChild>
								<Link href="/invest">Invest in Properties</Link>
							</Button>
							<Button asChild variant="secondary">
								<Link href="/admin">Create a Property</Link>
							</Button>
						</>
					)}
				</div>
			</main>
		</div>
	);
}
