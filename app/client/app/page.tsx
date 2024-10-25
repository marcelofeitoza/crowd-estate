"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout",
      description: "Logout bem-sucedido!",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <main className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-8">Welcome to Crowd Estate</h1>
        <p className="text-lg mb-6">
          Crowd Estate is a platform for investing in real estate using Solana
          blockchain.
        </p>
        <p className="text-lg mb-6">
          We provide a marketplace for buying and selling real estate tokens.
          Our platform allows you to invest in real estate properties by
          purchasing tokens that represent ownership of the property.
        </p>
        <p className="text-lg mb-8">
          You can also earn passive income by staking your tokens and receiving
          dividends from the property&apos;s revenue.
        </p>
        {!isAuthenticated ? (
          <Button asChild className="mb-8">
            <Link href="/login">Login</Link>
          </Button>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h2>
              <p className="text-lg mb-6">
                Your wallet address is: {user.publicKey}
              </p>

              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
            </div>
            <div className="flex justify-center space-x-4">
              {user.role === "landlord" ? (
                <Button asChild variant="secondary" className="text-lg">
                  <Link href="/landlord">Manage Properties</Link>
                </Button>
              ) : (
                <Button asChild className="text-lg">
                  <Link href="/invest">Invest in Properties</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
