/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useAnchor } from "@/hooks/use-anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "@/hooks/use-toast";
import { Property } from "@/utils/solana";
import {
  distributeDividendsTransaction,
  closePropertyTransaction,
} from "@/services/program";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BuildingIcon, CoinsIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface ManagePropertyModalProps {
  property: Property;
  onActionSuccess: () => void;
}

export const ManagePropertyModal: React.FC<ManagePropertyModalProps> = ({
  property,
  onActionSuccess,
}) => {
  const [dividendsAmount, setDividendsAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { provider, program } = useAnchor();
  const wallet = useWallet();

  const handleDistributeDividends = async () => {
    const amount = parseFloat(dividendsAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!provider || !program || !wallet.publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await distributeDividendsTransaction(
        provider,
        program,
        property,
        amount,
        wallet,
      );
      toast({
        title: "Dividends Distributed",
        description: `Successfully distributed ${amount} USDC in dividends.`,
      });
      onActionSuccess();
    } catch (error) {
      // console.error("Error distributing dividends:", error);
      toast({
        title: "Distribution Failed",
        description:
          "An error occurred while distributing dividends. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseProperty = async () => {
    if (!provider || !program || !wallet.publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await closePropertyTransaction(provider, program, property, wallet);
      toast({
        title: "Property Closed",
        description:
          "The property has been successfully closed. Wait for the funds to be returned to your wallet and the property to be removed from the list.",
      });
      onActionSuccess();
    } catch (error) {
      // console.error("Error closing property:", error);
      toast({
        title: "Closure Failed",
        description:
          "An error occurred while closing the property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full mt-4">Manage Property</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Property</DialogTitle>
          <DialogDescription>{property.property_name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CoinsIcon className="mr-2 h-4 w-4" />
                Distribute Dividends
              </CardTitle>
              <CardDescription>
                Distribute USDC dividends to token holders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="dividendsAmount">Amount (USDC)</Label>
                <Input
                  id="dividendsAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={dividendsAmount}
                  onChange={(e) => setDividendsAmount(e.target.value)}
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleDistributeDividends}
                  disabled={isProcessing || parseFloat(dividendsAmount) <= 0}
                  className="space-x-2"
                >
                  {isProcessing ? <LoadingSpinner /> : null}
                  <span>{isProcessing ? "Processing..." : "Distribute"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BuildingIcon className="mr-2 h-4 w-4" />
                Close Property
              </CardTitle>
              <CardDescription>Permanently close this property</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isProcessing}>
                    Close Property
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently close
                      the property and prevent any further investments or
                      distributions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCloseProperty}>
                      <span className="flex items-center space-x-2">
                        {isProcessing ? <LoadingSpinner /> : null}
                        <span>
                          {isProcessing ? "Processing..." : "Close Property"}
                        </span>
                      </span>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={isProcessing}>
              Cancel
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
