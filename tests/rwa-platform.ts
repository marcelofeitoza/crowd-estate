import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CrowdEstate } from "../target/types/crowd_estate";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import {
	Account,
	createMint,
	getAccount,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("RWA Platform", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const connection = provider.connection;

	const program = anchor.workspace.CrowdEstate as Program<CrowdEstate>;

	let propertyPda: PublicKey;
	let propertyPdaBump: number;
	let propertyMint: PublicKey;
	let propertyVault: Account;
	let propertyUsdcVault: Account;
	let usdcMint: PublicKey;
	let admin = Keypair.generate();
	let adminUsdcAccount: Account;
	let investor = Keypair.generate();
	let investorUsdcAccount: Account;
	let investorPropertyTokenAccount: Account;

	let propertyName = "Test Property";
	let tokenSymbol = "TST";
	const totalTokens = new anchor.BN(100);
	const pricePerToken = new anchor.BN(100 * 10 ** 6);

	before(async () => {
		const latestBlockhash = await connection.getLatestBlockhash();

		await connection.confirmTransaction({
			signature: await connection.requestAirdrop(
				admin.publicKey,
				5 * anchor.web3.LAMPORTS_PER_SOL
			),
			...latestBlockhash,
		});

		await connection.confirmTransaction({
			signature: await connection.requestAirdrop(
				investor.publicKey,
				5 * anchor.web3.LAMPORTS_PER_SOL
			),
			...latestBlockhash,
		});

		[propertyPda, propertyPdaBump] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("property"),
				admin.publicKey.toBuffer(),
				Buffer.from(propertyName),
			],
			program.programId
		);

		propertyMint = await createMint(
			connection,
			admin,
			propertyPda,
			null,
			0
		);
		usdcMint = await createMint(
			connection,
			admin,
			admin.publicKey,
			null,
			6
		);

		investorUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			usdcMint,
			investor.publicKey
		);

		adminUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			usdcMint,
			admin.publicKey
		);

		investorPropertyTokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			propertyMint,
			investor.publicKey
		);

		propertyVault = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			propertyMint,
			propertyPda,
			true
		);

		propertyUsdcVault = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			usdcMint,
			propertyPda,
			true
		);

		await mintTo(
			connection,
			admin,
			usdcMint,
			adminUsdcAccount.address,
			admin,
			1_000 * 10 ** 6
		);

		await mintTo(
			connection,
			admin,
			usdcMint,
			investorUsdcAccount.address,
			admin,
			1_000 * 10 ** 6
		);

		await mintTo(
			connection,
			admin,
			usdcMint,
			propertyUsdcVault.address,
			admin,
			1_000 * 10 ** 6
		);
	});

	it("Creates a property!", async () => {
		const accounts = {
			admin: admin.publicKey,
			property: propertyPda,
			propertyMint,
			propertyVault: propertyVault.address,
			systemProgram: SystemProgram.programId,
			usdcMint,
			propertyUsdcAccount: propertyUsdcVault.address,
			tokenProgram: TOKEN_PROGRAM_ID,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
		};
		console.log(accounts);

		await program.methods
			.createProperty(
				propertyName,
				totalTokens,
				pricePerToken,
				tokenSymbol,
				propertyPdaBump
			)
			.accountsPartial(accounts)
			.signers([admin])
			.rpc();

		const propertyAccount = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			Buffer.from(propertyAccount.propertyName).toString(),
			propertyName.toString()
		);
		assert.equal(
			propertyAccount.availableTokens.toNumber(),
			totalTokens.toNumber()
		);
		assert.equal(
			propertyAccount.tokenPriceUsdc.toNumber(),
			pricePerToken.toNumber()
		);
		assert.equal(propertyAccount.isClosed, false);

		const propertyVaultAccount = await getAccount(
			connection,
			propertyVault.address
		);
		assert.equal(
			Number(propertyVaultAccount.amount),
			totalTokens.toNumber(),
			"Property vault should hold all minted tokens"
		);
	});

	it("Updates the property", async () => {
		const propertyAccountBefore = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			Buffer.from(propertyAccountBefore.tokenSymbol).toString(),
			tokenSymbol.toString()
		);

		tokenSymbol = "UPD";

		await program.methods
			.updateProperty(tokenSymbol)
			.accountsPartial({
				admin: admin.publicKey,
				property: propertyPda,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				// systemProgram: SystemProgram.programId,
			})
			.signers([admin])
			.rpc();

		const propertyAccountAfter = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			Buffer.from(propertyAccountAfter.tokenSymbol).toString(),
			"UPD"
		);
	});

	it("Invests in a property!", async () => {
		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investor.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);

		await program.methods
			.investInProperty(new anchor.BN(300 * 10 ** 6))
			.accountsPartial({
				propertyUsdcAccount: propertyUsdcVault.address,
				propertyVault: propertyVault.address,
				investor: investor.publicKey,
				property: propertyPda,
				investorUsdcAccount: investorUsdcAccount.address,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
				// admin: admin.publicKey,
				propertyMint,
				investorPropertyTokenAccount:
					investorPropertyTokenAccount.address,
				investmentAccount,
			})
			.signers([investor /*, admin*/])
			.rpc()
			.catch(async (error) => {
				console.log(await error.getLogs(connection));
				throw error;
			});

		const propertyAccount = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			propertyAccount.availableTokens.toNumber(),
			totalTokens.toNumber() - 3
		);

		const investmentAccountData = await program.account.investor.fetch(
			investmentAccount
		);
		assert.equal(investmentAccountData.tokensOwned.toNumber(), 3);
		assert.equal(investmentAccountData.dividendsClaimed.toNumber(), 0);
	});

	it("Rejects investment without enough USDC", async () => {
		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investor.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);

		await program.methods
			.withdrawInvestment()
			.accountsPartial({
				propertyUsdcAccount: propertyUsdcVault.address,
				propertyVault: propertyVault.address,
				investor: investor.publicKey,
				// admin: admin.publicKey,
				investorUsdcAccount: investorUsdcAccount.address,
				investmentAccount: investmentAccount,
				property: propertyPda,
				propertyMint: propertyMint,
				adminUsdcAccount: adminUsdcAccount.address,
				investorPropertyTokenAccount:
					investorPropertyTokenAccount.address,
				systemProgram: SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([investor])
			.rpc();

		try {
			await program.methods
				.investInProperty(new anchor.BN(300 * 10 ** 6))
				.accountsPartial({
					propertyUsdcAccount: propertyUsdcVault.address,
					propertyVault: propertyVault.address,
					investor: investor.publicKey,
					property: propertyPda,
					investorUsdcAccount: investorUsdcAccount.address,
					tokenProgram: TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
					// admin: admin.publicKey,
					propertyMint,
					investorPropertyTokenAccount:
						investorPropertyTokenAccount.address,
					investmentAccount: investmentAccount,
				})
				.signers([investor /*, admin*/])
				.rpc();
			assert.fail("Expected an error but did not get one");
		} catch (error) {
			assert.isDefined(error);
		}
	});

	it("Rejects investment below minimum price", async () => {
		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investor.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);

		try {
			const tx = program.methods
				.investInProperty(new anchor.BN(50 * 10 ** 6))
				.accountsPartial({
					investor: investor.publicKey,
					property: propertyPda,
					investorUsdcAccount: investorUsdcAccount.address,
					tokenProgram: TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
					// admin: admin.publicKey,
					propertyMint,
					investorPropertyTokenAccount:
						investorPropertyTokenAccount.address,
					investmentAccount: investmentAccount,
				})
				.signers([investor /*, admin*/])
				.rpc();
		} catch (error) {
			assert.equal(
				error.toString(),
				"Transaction simulation failed: Error: Program failed to complete: Error: [1]: Invest amount is below the minimum price",
				"Should throw an error"
			);
		}
	});

	it("Distributes dividends!", async () => {
		await mintTo(
			connection,
			admin,
			usdcMint,
			adminUsdcAccount.address,
			admin,
			1_000 * 10 ** 6
		);

		await program.methods
			.distributeDividends(new anchor.BN(1_000 * 10 ** 6))
			.accountsPartial({
				admin: admin.publicKey,
				adminUsdcAccount: adminUsdcAccount.address,
				property: propertyPda,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			})
			.signers([admin])
			.rpc();

		const propertyAccount = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			propertyAccount.dividendsTotal.toNumber(),
			1_000 * 10 ** 6
		);
	});

	it("Redeems dividends!", async () => {
		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investor.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);

		await program.methods
			.redeemDividends()
			.accountsPartial({
				propertyUsdcAccount: propertyUsdcVault.address,
				investor: investor.publicKey,
				investorUsdcAccount: investorUsdcAccount.address,
				property: propertyPda,
				investmentAccount,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			})
			.signers([investor])
			.rpc();

		const investorUsdcBalance = await connection.getTokenAccountBalance(
			investorUsdcAccount.address
		);
		const investorPropertyTokenBalance =
			await connection.getTokenAccountBalance(
				investorPropertyTokenAccount.address
			);

		assert.equal(investorUsdcBalance.value.amount, "730000000");
		assert.equal(investorPropertyTokenBalance.value.amount, "3");

		const investmentAccountData = await program.account.investor.fetch(
			investmentAccount
		);
		assert.equal(
			investmentAccountData.dividendsClaimed.toNumber(),
			30 * 10 ** 6
		);
	});

	it("Withdraws investment from a property!", async () => {
		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investor.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);

		const initialUsdcBalance = await connection.getTokenAccountBalance(
			investorUsdcAccount.address
		);
		assert.equal(initialUsdcBalance.value.amount, "730000000");

		await program.methods
			.withdrawInvestment()
			.accountsPartial({
				propertyUsdcAccount: propertyUsdcVault.address,
				propertyVault: propertyVault.address,
				investor: investor.publicKey,
				// admin: admin.publicKey,
				investorUsdcAccount: investorUsdcAccount.address,
				investmentAccount: investmentAccount,
				property: propertyPda,
				propertyMint: propertyMint,
				adminUsdcAccount: adminUsdcAccount.address,
				investorPropertyTokenAccount:
					investorPropertyTokenAccount.address,
				systemProgram: SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([investor /*, admin*/])
			.rpc();

		const finalUsdcBalance = await connection.getTokenAccountBalance(
			investorUsdcAccount.address
		);
		assert.equal(finalUsdcBalance.value.amount, "1030000000");

		const investorPropertyTokenBalance =
			await connection.getTokenAccountBalance(
				investorPropertyTokenAccount.address
			);
		assert.equal(investorPropertyTokenBalance.value.amount, "0");

		const propertyAccount = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(propertyAccount.availableTokens.toNumber(), 100);

		const investmentAccountInfo = await connection.getAccountInfo(
			investmentAccount
		);
		assert.isNull(
			investmentAccountInfo,
			"Investment account should be closed"
		);
	});

	it("Mint additional tokens for a property", async () => {
		const additionalAmount = 50;

		await program.methods
			.mintAdditionalTokens(new anchor.BN(additionalAmount))
			.accountsPartial({
				admin: admin.publicKey,
				property: propertyPda,
				propertyMint: propertyMint,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([admin])
			.rpc();

		const propertyAccount = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			propertyAccount.totalTokens.toNumber(),
			150,
			"Total tokens should be updated correctly"
		);
		assert.equal(
			propertyAccount.availableTokens.toNumber(),
			150,
			"Available tokens should be updated correctly"
		);
	});

	it("Rejects investment exceeding available tokens", async () => {
		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investor.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);

		try {
			const tx = program.methods
				.investInProperty(new anchor.BN(300 * 10 ** 6))
				.accountsPartial({
					investor: investor.publicKey,
					property: propertyPda,
					investorUsdcAccount: investorUsdcAccount.address,
					tokenProgram: TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
					// admin: admin.publicKey,
					propertyMint,
					investorPropertyTokenAccount:
						investorPropertyTokenAccount.address,
					investmentAccount: investmentAccount,
				})
				.signers([investor /*, admin*/])
				.rpc();
		} catch (error) {
			assert.equal(
				error.toString(),
				"Transaction simulation failed: Error: Program failed to complete: Error: [1]: Not enough tokens available",
				"Should throw an error"
			);
		}
	});

	it("Closes a property!", async () => {
		const propertyAccountInfoBefore = await connection.getAccountInfo(
			propertyPda
		);
		assert.isNotNull(
			propertyAccountInfoBefore,
			"Property account should exist before closing"
		);

		const propertyAccountBefore = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			propertyAccountBefore.isClosed,
			false,
			"Property should not be closed initially"
		);

		await program.methods
			.closeProperty()
			.accountsPartial({
				propertyMint,
				propertyVault: propertyVault.address,
				property: propertyPda,
				admin: admin.publicKey,
				adminUsdcAccount: adminUsdcAccount.address,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			})
			.signers([admin])
			.rpc();

		const propertyAccountInfoAfter = await connection.getAccountInfo(
			propertyPda
		);
		assert.isNull(
			propertyAccountInfoAfter,
			"Property account should be closed"
		);
	});
});

describe("Transfering", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const connection = provider.connection;

	const program = anchor.workspace.CrowdEstate as Program<CrowdEstate>;

	let propertyPda: PublicKey;
	let propertyPdaBump: number;
	let propertyMint: PublicKey;
	let propertyVault: Account;
	let propertyUsdcVault: Account;
	let usdcMint: PublicKey;
	let admin = Keypair.generate();
	let adminUsdcAccount: Account;
	let investor = Keypair.generate();
	let investorUsdcAccount: Account;
	let investorPropertyTokenAccount: Account;

	const propertyName = "Test Property";
	const totalTokens = new anchor.BN(100);
	const pricePerToken = new anchor.BN(100 * 10 ** 6);
	const tokenSymbol = "TST";

	before(async () => {
		const latestBlockhash = await connection.getLatestBlockhash();

		await connection.confirmTransaction({
			signature: await connection.requestAirdrop(
				admin.publicKey,
				5 * anchor.web3.LAMPORTS_PER_SOL
			),
			...latestBlockhash,
		});

		await connection.confirmTransaction({
			signature: await connection.requestAirdrop(
				investor.publicKey,
				5 * anchor.web3.LAMPORTS_PER_SOL
			),
			...latestBlockhash,
		});

		[propertyPda, propertyPdaBump] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("property"),
				admin.publicKey.toBuffer(),
				Buffer.from(propertyName),
			],
			program.programId
		);

		propertyMint = await createMint(
			connection,
			admin,
			propertyPda,
			null,
			0
		);
		usdcMint = await createMint(
			connection,
			admin,
			admin.publicKey,
			null,
			6
		);

		investorUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			usdcMint,
			investor.publicKey
		);

		adminUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			usdcMint,
			admin.publicKey
		);

		investorPropertyTokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			propertyMint,
			investor.publicKey
		);

		propertyVault = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			propertyMint,
			propertyPda,
			true
		);

		propertyUsdcVault = await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			usdcMint,
			propertyPda,
			true
		);

		await mintTo(
			connection,
			admin,
			usdcMint,
			adminUsdcAccount.address,
			admin,
			1_000 * 10 ** 6
		);

		await mintTo(
			connection,
			admin,
			usdcMint,
			investorUsdcAccount.address,
			admin,
			1_000 * 10 ** 6
		);

		await mintTo(
			connection,
			admin,
			usdcMint,
			propertyUsdcVault.address,
			admin,
			1_000 * 10 ** 6
		);
	});

	it("Creates and invests in a property!", async () => {
		await program.methods
			.createProperty(
				propertyName,
				totalTokens,
				pricePerToken,
				tokenSymbol,
				propertyPdaBump
			)
			.accountsPartial({
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				propertyVault: propertyVault.address,
				admin: admin.publicKey,
				property: propertyPda,
				propertyMint,
				systemProgram: SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([admin])
			.rpc();

		const propertyAccount = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			Buffer.from(propertyAccount.propertyName).toString(),
			propertyName.toString()
		);
		assert.equal(
			propertyAccount.availableTokens.toNumber(),
			totalTokens.toNumber()
		);
		assert.equal(
			propertyAccount.tokenPriceUsdc.toNumber(),
			pricePerToken.toNumber()
		);
		assert.equal(propertyAccount.isClosed, false);

		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investor.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);

		await program.methods
			.investInProperty(new anchor.BN(300 * 10 ** 6))
			.accountsPartial({
				investor: investor.publicKey,
				property: propertyPda,
				investorUsdcAccount: investorUsdcAccount.address,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
				// admin: admin.publicKey,
				propertyMint,
				investorPropertyTokenAccount:
					investorPropertyTokenAccount.address,
				investmentAccount,
				propertyUsdcAccount: propertyUsdcVault.address,
				propertyVault: propertyVault.address,
			})
			.signers([investor /*, admin*/])
			.rpc();

		const propertyAccountAfter = await program.account.property.fetch(
			propertyPda
		);
		assert.equal(
			propertyAccountAfter.availableTokens.toNumber(),
			totalTokens.toNumber() - 3
		);

		const investmentAccountData = await program.account.investor.fetch(
			investmentAccount
		);
		assert.equal(investmentAccountData.tokensOwned.toNumber(), 3);
		assert.equal(investmentAccountData.dividendsClaimed.toNumber(), 0);
	});

	it("Transfers tokens between investors", async () => {
		const anotherInvestor = Keypair.generate();
		const anotherInvestorPropertyTokenAccount =
			await getOrCreateAssociatedTokenAccount(
				connection,
				admin,
				propertyMint,
				anotherInvestor.publicKey
			);

		const investorPropertyTokenBalance =
			await connection.getTokenAccountBalance(
				investorPropertyTokenAccount.address
			);
		assert.equal(
			investorPropertyTokenBalance.value.amount,
			"3",
			"Investor should initially have 3 tokens"
		);

		await program.methods
			.transferTokens(new anchor.BN(1))
			.accountsPartial({
				authority: investor.publicKey,
				fromTokenAccount: investorPropertyTokenAccount.address,
				toTokenAccount: anotherInvestorPropertyTokenAccount.address,
				to: anotherInvestor.publicKey,
				propertyMint: propertyMint,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			})
			.signers([investor])
			.rpc();

		const finalFromBalance = await connection.getTokenAccountBalance(
			investorPropertyTokenAccount.address
		);
		const finalToBalance = await connection.getTokenAccountBalance(
			anotherInvestorPropertyTokenAccount.address
		);

		assert.equal(
			finalFromBalance.value.amount,
			"2",
			"Investor should have 2 tokens after transfer"
		);
		assert.equal(
			finalToBalance.value.amount,
			"1",
			"Another investor should have 1 token after transfer"
		);
	});
});

describe("Governance", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const connection = provider.connection;

	const program = anchor.workspace.CrowdEstate as Program<CrowdEstate>;

	let property: PublicKey;
	let propertyMint: PublicKey;
	let proposal: PublicKey;
	let bump: number;
	let proposer = Keypair.generate();
	let voter = Keypair.generate();

	before(async () => {
		const latestBlockhash = await connection.getLatestBlockhash();

		await connection.confirmTransaction({
			signature: await connection.requestAirdrop(
				proposer.publicKey,
				5 * anchor.web3.LAMPORTS_PER_SOL
			),
			...latestBlockhash,
		});

		await connection.confirmTransaction({
			signature: await connection.requestAirdrop(
				voter.publicKey,
				5 * anchor.web3.LAMPORTS_PER_SOL
			),
			...latestBlockhash,
		});

		[property, bump] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("property"),
				proposer.publicKey.toBuffer(),
				Buffer.from("Test Property"),
			],
			program.programId
		);

		propertyMint = await createMint(
			connection,
			proposer,
			property,
			null,
			0
		);

		[proposal] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("proposal"),
				proposer.publicKey.toBuffer(),
				property.toBuffer(),
			],
			program.programId
		);

		await program.methods
			.createProperty(
				"Test Property",
				new anchor.BN(100),
				new anchor.BN(100 * 10 ** 6),
				"TST",
				bump
			)
			.accountsPartial({
				property: property,
				admin: proposer.publicKey,
				systemProgram: SystemProgram.programId,
				propertyMint: propertyMint,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([proposer])
			.rpc();

		const propertyAccount = await program.account.property.fetch(property);
		assert.include(
			Buffer.from(propertyAccount.propertyName).toString(),
			"Test Property"
		);
		assert.equal(Number(propertyAccount.totalTokens), 100);
		assert.equal(Number(propertyAccount.availableTokens), 100);
		assert.equal(propertyAccount.isClosed, false);
	});

	it("Creates a proposal", async () => {
		await program.methods
			.createProposal(
				"Test Proposal",
				{ mintAdditionalTokens: {} },
				"",
				new anchor.BN(100)
			)
			.accountsPartial({
				proposal: proposal,
				proposer: proposer.publicKey,
				property: property,
				systemProgram: SystemProgram.programId,
			})
			.signers([proposer])
			.rpc();

		const proposalAccount = await program.account.proposal.fetch(proposal);
		assert.include(
			Buffer.from(proposalAccount.description).toString(),
			"Test Proposal"
		);
		assert.equal(Number(proposalAccount.votesFor), 0);
		assert.equal(Number(proposalAccount.votesAgainst), 0);
		assert.equal(proposalAccount.isExecuted, false);
	});

	it("Votes on a proposal", async () => {
		const voteRecord = PublicKey.findProgramAddressSync(
			[
				Buffer.from("vote"),
				proposal.toBuffer(),
				voter.publicKey.toBuffer(),
			],
			program.programId
		)[0];

		await program.methods
			.voteOnProposal(true)
			.accountsPartial({
				proposal: proposal,
				voteRecord: voteRecord,
				voter: voter.publicKey,
				systemProgram: SystemProgram.programId,
			})
			.signers([voter])
			.rpc();

		const proposalAccount = await program.account.proposal.fetch(proposal);
		assert.equal(Number(proposalAccount.votesFor), 1);
		assert.equal(Number(proposalAccount.votesAgainst), 0);
	});

	it("Executes a proposal", async () => {
		const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			proposer,
			propertyMint,
			proposer.publicKey
		);

		await program.methods
			.executeProposal()
			.accountsPartial({
				admin: proposer.publicKey,
				destinationTokenAccount: destinationTokenAccount.address,
				newAdmin: proposer.publicKey,
				property: property,
				propertyMint: propertyMint,
				proposal: proposal,
				systemProgram: SystemProgram.programId,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([proposer])
			.rpc();

		const propertyAccount = await program.account.property.fetch(property);
		assert.equal(propertyAccount.availableTokens.toNumber(), 200);
		assert.equal(propertyAccount.totalTokens.toNumber(), 200);
	});
});
