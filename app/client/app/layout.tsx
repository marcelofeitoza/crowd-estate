import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import AppWalletProvider from "@/components/AppWalletProvider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthContext";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Crowd Estate",
	description:
		"Crowd Estate is a platform for investing in real estate using Solana blockchain.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AppWalletProvider>
					<AuthProvider>{children}</AuthProvider>
				</AppWalletProvider>
				<Toaster />
			</body>
		</html>
	);
}
