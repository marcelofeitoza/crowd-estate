"use client";

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
    Investment,
    Property,
    USDC_MINT,
    ensureAssociatedTokenAccount,
} from "@/utils/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    SendTransactionError,
    PublicKey,
    Transaction,
    SystemProgram,
} from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { ChartBarIcon, ChartColumnIcon, Coins, DollarSign, PieChart } from "lucide-react";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAnchor } from "@/hooks/use-anchor";

interface ManageInvestmentProps {
    investment: Investment;
    onManagementSuccess: () => void;
}

export const ManageInvestmentModal = ({
    investment,
    onManagementSuccess,
}: ManageInvestmentProps) => {
    const { program, provider } = useAnchor();
    const wallet = useWallet();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [propertyData, setPropertyData] = useState<Property>();

    useEffect(() => {
        const fetchPropertyData = async () => {
            const p = await program.account.property.fetch(
                new PublicKey(investment.property)
            );
            setPropertyData({
                mint: p.mint.toBase58(),
                admin: p.admin.toBase58(),
                available_tokens: p.availableTokens.toNumber(),
                bump: p.bump,
                dividends_total: p.dividendsTotal.toNumber(),
                is_closed: p.isClosed,
                property_name: Buffer.from(p.propertyName).toString(),
                publicKey: investment.property,
                token_price_usdc: p.tokenPriceUsdc.toNumber() / 1e6,
                token_symbol: Buffer.from(p.tokenSymbol).toString(),
                total_tokens: p.totalTokens.toNumber(),
            });
        };

        if (investment.property) {
            fetchPropertyData();
        }
    }, [investment, program.account.property]);

    const [walletUsdcBalance, setWalletUsdcBalance] = useState<number>(0);
    const [, setErrorUsdcBalance] = useState<boolean>(false);

    useEffect(() => {
        const getUsdcBalance = async () => {
            try {
                const userUsdcAddress = await getAssociatedTokenAddress(
                    USDC_MINT,
                    wallet.publicKey
                );

                const balance = await provider.connection
                    .getTokenAccountBalance(userUsdcAddress)
                    .then((balance) => balance.value.uiAmount)
                    .catch((error) => {
                        console.error("Erro ao obter saldo de USDC:", error);
                        setWalletUsdcBalance(0);
                        setErrorUsdcBalance(true);
                        throw error;
                    });

                console.log("Saldo USDC:", balance);
                setWalletUsdcBalance(balance);
            } catch (error) {
                console.error("Erro ao obter saldo de USDC:", error);
                setWalletUsdcBalance(0);
            }
        };

        if (wallet.publicKey) {
            getUsdcBalance();
        }
    }, [provider.connection, wallet.publicKey]);

    const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey || !program || !provider) {
        toast({
            title: "Erro",
            description: "Conecte sua carteira Solana.",
            variant: "destructive",
        });
        return;
    }

    try {
        setIsSubmitting(true);

        // Derivar o investmentPda
        // const [investmentPda] = PublicKey.findProgramAddressSync(
        //     [
        //         Buffer.from("investment"),
        //         wallet.publicKey.toBuffer(),
        //         new PublicKey(investment.property).toBuffer(),
        //     ],
        //     program.programId
        // );
        // console.log("investmentPda", investmentPda.toBase58());
        const investmentPda = investment.publicKey;

        const tx = new Transaction();

        // Garantir que o investorUsdcAccount existe
        const investorUsdcAta = await ensureAssociatedTokenAccount(
            provider.connection,
            tx,
            USDC_MINT,
            wallet.publicKey,
            wallet.publicKey
        );
        console.log("investorUsdcAta", investorUsdcAta.toBase58());

        // Garantir que o propertyUsdcAccount existe
        const propertyUsdcAta = await ensureAssociatedTokenAccount(
            provider.connection,
            tx,
            USDC_MINT,
            new PublicKey(investment.property),
            wallet.publicKey,
            true
        );
        console.log("propertyUsdcAta", propertyUsdcAta.toBase58());

        // Derivar ou obter a adminUsdcAccount
        // Aqui, assumindo que admin é o próprio usuário conectado
        const adminPublicKey = wallet.publicKey;
        const adminUsdcAddress = await getAssociatedTokenAddress(
            USDC_MINT,
            adminPublicKey
        );
        console.log("adminUsdcAddress", adminUsdcAddress.toBase58());

        // Garantir que a adminUsdcAccount existe
        await ensureAssociatedTokenAccount(
            provider.connection,
            tx,
            USDC_MINT,
            adminPublicKey,
            adminPublicKey
        );

        const accounts = {
            property: new PublicKey(investment.property),
            propertyMint: new PublicKey(propertyData.mint),
            investor: wallet.publicKey,
            investmentAccount: investmentPda,
            propertyUsdcAccount: propertyUsdcAta,
            investorUsdcAccount: investorUsdcAta,
            adminUsdcAccount: adminUsdcAddress, // Adicionando aqui
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        };
        console.log("accounts", accounts);

        const withdrawIx = await program.methods
            .withdrawInvestment()
            .accounts(accounts)
            .instruction();
        tx.add(withdrawIx);
        console.log("tx", tx);

        const { blockhash } = await provider.connection.getLatestBlockhash();

        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet.publicKey;

        // Assinar e enviar a transação
        const signedTx = await wallet.signTransaction(tx);
        const txSignature = await provider.connection.sendRawTransaction(
            signedTx.serialize(),
            {
                skipPreflight: false,
                preflightCommitment: "confirmed",
            }
        );

        await provider.connection.confirmTransaction(
            txSignature,
            "confirmed"
        );
        console.log("Retirada realizada com sucesso:", txSignature);

        alert("Retirada realizada com sucesso!");

        toast({
            title: "Sucesso",
            description: "Retirada realizada com sucesso!",
            variant: "default",
        });

        setIsSubmitting(false);
        setIsOpen(false);
        onManagementSuccess();
    } catch (error) {
        if (error instanceof SendTransactionError) {
            console.error(
                "Erro ao enviar transação:",
                await error.getLogs(provider.connection)
            );
        } else {
            console.error("Erro ao retirar:", error);
        }
        toast({
            title: "Erro",
            description:
                "Falha ao realizar a retirada. Verifique o console.",
            variant: "destructive",
        });
        setIsSubmitting(false);
    }
};


    const collectDividends = async () => {
        // Implement collectDividends logic here
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex flex-col md:flex-row justify-between space-y-2 md:space-y-0 md:space-x-2">
                <DialogTrigger asChild>
                    <Button variant="default" disabled={investment.amount == 0}>
                        Manage Investment
                    </Button>
                </DialogTrigger>

                <Button variant="outline" disabled={investment.amount == 0} onClick={collectDividends}>
                    Collect Dividends
                </Button>
            </div>

            <DialogContent>
                {investment && propertyData ? (
					<>
                    <DialogHeader>
                    <DialogTitle>
                        Retirar Investimento em {investment.property}{" "}
                        {/* Ajustar conforme necessário */}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Investido</span>
                            <span>
                                ${(investment.amount * propertyData.token_price_usdc)} USDC / {investment.amount * propertyData.total_tokens} USDC
                            </span>
                        </div>
                        <Progress
                            value={investment.amount / propertyData.total_tokens}
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Valor Investido
                                </p>
                                <p className="text-lg">
                                    ${(investment.amount / 1e6).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Coins className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Token Symbol
                                </p>
                                <p className="text-lg">
                                    {propertyData?.token_symbol}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Price per Token
                                </p>
                                <p className="text-lg">
                                    ${(propertyData.token_price_usdc).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Total Tokens
                                </p>
                                <p className="text-lg">
                                    {propertyData.total_tokens} {propertyData.token_symbol}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <ChartColumnIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Tokens Owned
                                </p>
                                <p className="text-lg">
                                    {investment.amount} {propertyData.token_symbol}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <PieChart className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Dividends Claimed
                                </p>
                                <p className="text-lg">
                                    $
                                    {(
                                        investment.dividendsClaimed / 1e6
                                    ).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulário de retirada */}
                <form onSubmit={handleWithdraw} className="space-y-4 mt-6">
                    <p className="text-sm text-muted-foreground">
                        Saldo USDC: {walletUsdcBalance.toFixed(2)}
                    </p>

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <LoadingSpinner />
                        ) : (
                            "Confirmar Retirada"
                        )}
                    </Button>
                </form>
                </>
				) : (
					<LoadingSpinner />
                )}
            </DialogContent>
        </Dialog>
    );
};