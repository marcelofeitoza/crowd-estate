import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchor } from "@/hooks/use-anchor";

export const Navbar = () => {
  const { provider } = useAnchor();
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      let balance = 0;
      if (publicKey) {
        balance = await provider.connection.getBalance(publicKey);
      }

      setBalance(balance / LAMPORTS_PER_SOL);
    };

    fetchBalance();
  }, [publicKey, provider]);

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            CrowdEstate
          </Link>
          <div className="space-x-4 flex items-center">
            <Button
              asChild
              variant={pathname === "/invest" ? "default" : "outline"}
            >
              <Link href="/invest">Invest</Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/admin" ? "default" : "outline"}
            >
              <Link href="/admin">Admin</Link>
            </Button>

            {publicKey && (
              <p className="">
                Balance:{" "}
                {balance !== null ? balance.toFixed(2) + " SOL" : "Loading..."}
              </p>
            )}

            <WalletMultiButton
              style={{
                color: "white",
                border: "1px solid white",
                borderRadius: "0.375rem",
                padding: "0rem 0.5rem",
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
