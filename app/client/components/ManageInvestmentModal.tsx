"use client";

import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Coins, DollarSign, PieChart } from "lucide-react";
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
	const [usdcAmount, setUsdcAmount] = useState<number>(0);
	const [tokenAmount, setTokenAmount] = useState<number>(0);
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

				if (balance === 0) {
					// Opcional: Mintar USDC para o usuário, se necessário
					// await mintUsdc(1000, userUsdcAddress);
				}

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

	// Função para lidar com a retirada
	const handleWithdraw = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!wallet.publicKey || !program) {
			toast({
				title: "Erro",
				description: "Conecte sua carteira Solana.",
				variant: "destructive",
			});
			return;
		}

		if (usdcAmount <= 0) {
			toast({
				title: "Erro",
				description: "Insira um valor válido para retirar.",
				variant: "destructive",
			});
			return;
		}

		// Verifica se o usuário não está tentando retirar mais do que investiu
		const maxWithdrawUSDC = investment.amount / 1e6; // Supondo que investment.amount está em micro USDC
		if (usdcAmount > maxWithdrawUSDC) {
			toast({
				title: "Erro",
				description: `O valor máximo que você pode retirar é $${maxWithdrawUSDC.toFixed(
					2
				)} USDC.`,
				variant: "destructive",
			});
			return;
		}

		if (usdcAmount > walletUsdcBalance) {
			toast({
				title: "Erro",
				description: "Saldo insuficiente de USDC para esta retirada.",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsSubmitting(true);

			// Encontrar o PDA da conta de investimento
			const [investmentPda] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("investment"),
					wallet.publicKey.toBuffer(),
					new PublicKey(investment.property).toBuffer(),
				],
				program.programId
			);
			console.log("investmentPda", investmentPda.toBase58());

			const tx = new Transaction();

			// Garantir que as contas associadas existam
			const investorUsdcAta = await ensureAssociatedTokenAccount(
				tx,
				USDC_MINT,
				wallet.publicKey,
				wallet.publicKey
			);
			console.log("investorUsdcAta", investorUsdcAta.toBase58());

			const propertyUsdcAta = await ensureAssociatedTokenAccount(
				tx,
				USDC_MINT,
				new PublicKey(investment.property),
				wallet.publicKey,
				true
			);
			console.log("propertyUsdcAta", propertyUsdcAta.toBase58());

			const accounts = {
				property: new PublicKey(investment.property),
				propertyMint: new PublicKey(propertyData.mint),
				investor: wallet.publicKey,
				investmentAccount: investmentPda,
				propertyUsdcAccount: propertyUsdcAta,
				investorUsdcAccount: investorUsdcAta,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			};
			console.log("accounts", accounts);

			const withdrawIx = await program.methods
				.withdrawInvestment()
				.accountsPartial({
					...accounts,
				})
				.instruction();
			tx.add(withdrawIx);
			console.log("tx", tx);

			const { blockhash } =
				await provider.connection.getLatestBlockhash();
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

			// Confirmar a transação
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

			// Atualizar o saldo de USDC no frontend
			setWalletUsdcBalance(walletUsdcBalance + usdcAmount);
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

	// Funções para sincronizar os campos de entrada
	const handleUsdcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseFloat(e.target.value);
		if (!isNaN(value)) {
			setUsdcAmount(value);
			setTokenAmount(value / (investment.amount / 1e6)); // Ajuste conforme necessário
		} else {
			setUsdcAmount(0);
			setTokenAmount(0);
		}
	};

	// Opcional: Se desejar sincronizar a quantidade de tokens com a retirada
	const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseFloat(e.target.value);
		if (!isNaN(value)) {
			setTokenAmount(value);
			setUsdcAmount(value * (investment.amount / 1e6)); // Ajuste conforme necessário
		} else {
			setTokenAmount(0);
			setUsdcAmount(0);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="default" disabled={investment.amount == 0}>
					Manage Investment
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Retirar Investimento em {investment.property}{" "}
						{/* Ajustar conforme necessário */}
					</DialogTitle>
				</DialogHeader>

				{/* Informações sobre o investimento */}
				<div className="space-y-4">
					<div>
						<div className="flex justify-between text-sm mb-1">
							<span>Investido</span>
							<span>
								${(investment.amount / 1e6).toFixed(2)} USDC
							</span>
						</div>
						<Progress
							value={
								(investment.amount /
									1e6 /
									(investment.amount / 1e6)) *
								100
							} // Ajuste conforme necessário
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
					<div className="flex space-x-4">
						<div className="flex-1">
							<Label htmlFor="usdcAmount">
								Quantidade para Retirar (USDC)
							</Label>
							<Input
								id="usdcAmount"
								type="number"
								step="0.01"
								min="0.01"
								max={Math.min(
									investment.amount / 1e6,
									walletUsdcBalance
								)}
								value={usdcAmount}
								onChange={handleUsdcChange}
								placeholder={`$0.00 - Máximo: $${Math.min(
									investment.amount / 1e6,
									walletUsdcBalance
								).toFixed(2)}`}
								required
							/>
						</div>

						<div className="flex-1">
							<Label htmlFor="tokenAmount">
								Quantidade de Tokens a Retirar
							</Label>
							<Input
								id="tokenAmount"
								type="number"
								step="1"
								min="0"
								max={
									propertyData?.dividends_total -
									investment.dividendsClaimed
								}
								value={tokenAmount}
								onChange={handleTokenChange}
								placeholder={`0 - Máximo: ${
									propertyData?.dividends_total -
									investment.dividendsClaimed
								}`}
								required
							/>
						</div>
					</div>

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
			</DialogContent>
		</Dialog>
	);
};
