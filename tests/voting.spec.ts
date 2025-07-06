import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey} from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { BankrunProvider } from 'anchor-bankrun';
import { startAnchor } from 'solana-bankrun';

// const IDL = require('../target/idl/voting.json');
const fs = require('fs');
const path = require('path');

const idlPath = path.resolve(__dirname, '../target/idl/voting.json');
// console.log("IDL Path:", idlPath);

// if (!fs.existsSync(idlPath)) {
//   console.error("IDL file does not exist!");
// } else {
//   console.log("IDL file exists!");
// }

const IDL = require(idlPath);
const votingAddress = new PublicKey("44GzwVL6BDUn2EC1ncbKBLVuMetQiXAg9How6X85iKuu");

// console.log("Current working directory:", process.cwd());

describe('Voting', () => {

  let context;
  let provider;
  let votingProgram;

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "voting", programId: votingAddress }], []);
    // console.log("Context initialized:", context);
  
    provider = new BankrunProvider(context);
    // console.log("Provider initialized:", provider);
  
    votingProgram = new Program<Voting>(IDL, provider);
    // console.log("Voting program initialized:", votingProgram);
  });

  it('initialize Poll', async () => {
    // console.log("Starting test: initialize Poll");
  
    context = await startAnchor("", [{ name: "voting", programId: votingAddress }], []);
    // console.log("Context initialized:", context);
  
    provider = new BankrunProvider(context);
    // console.log("Provider initialized:", provider);
  
    votingProgram = new Program<Voting>(IDL, provider);
    // console.log("Voting program initialized:", votingProgram);
  
    await votingProgram.methods
      .initializePoll(new anchor.BN(1), "what is your favorite type of peanut butter?", new anchor.BN(0), new anchor.BN(1940332534))
      .rpc();

    const [polladdress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)], votingAddress
    )

    const poll = await votingProgram.account.poll.fetch(polladdress);
    // console.log("Poll initialized successfully", poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.pollDescription).toEqual("what is your favorite type of peanut butter?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("initialize candidate", async () => {
    await votingProgram.methods
      .initializeCandidate("Smooth", new anchor.BN(1),).rpc();

      await votingProgram.methods
      .initializeCandidate("Crunchy", new anchor.BN(1),).rpc();
    
      const [crunchyAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")], votingAddress
      )
      const [smoothAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")], votingAddress
      )
      const crunchy = await votingProgram.account.candidate.fetch(crunchyAddress);
      const smooth = await votingProgram.account.candidate.fetch(smoothAddress);
      console.log("Candidate initialized successfully", crunchy, smooth);
      expect(crunchy.candidateName).toEqual("Crunchy");
      expect(smooth.candidateName).toEqual("Smooth");
      expect(crunchy.candidateVotes.toNumber()).toEqual(0);
      expect(smooth.candidateVotes.toNumber()).toEqual(0);
    });

  it("vote", async () => {
    await votingProgram.methods.vote("Smooth", new anchor.BN(1)).rpc();

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")], votingAddress
    )
    const smooth = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log("Candidate initialized successfully", smooth);
    expect(smooth.candidateName).toEqual("Smooth");
    expect(smooth.candidateVotes.toNumber()).toEqual(1);
  });
  
});

// describe('votingdapp', () => {
//   // Configure the client to use the local cluster.
//   const provider = anchor.AnchorProvider.env()
//   anchor.setProvider(provider)
//   const payer = provider.wallet as anchor.Wallet

//   const program = anchor.workspace.Votingdapp as Program<Votingdapp>

//   const votingdappKeypair = Keypair.generate()

//   it('Initialize Votingdapp', async () => {
//     await program.methods
//       .initialize()
//       .accounts({
//         votingdapp: votingdappKeypair.publicKey,
//         payer: payer.publicKey,
//       })
//       .signers([votingdappKeypair])
//       .rpc()

//     const currentCount = await program.account.votingdapp.fetch(votingdappKeypair.publicKey)

//     expect(currentCount.count).toEqual(0)
//   })

//   it('Increment Votingdapp', async () => {
//     await program.methods.increment().accounts({ votingdapp: votingdappKeypair.publicKey }).rpc()

//     const currentCount = await program.account.votingdapp.fetch(votingdappKeypair.publicKey)

//     expect(currentCount.count).toEqual(1)
//   })

//   it('Increment Votingdapp Again', async () => {
//     await program.methods.increment().accounts({ votingdapp: votingdappKeypair.publicKey }).rpc()

//     const currentCount = await program.account.votingdapp.fetch(votingdappKeypair.publicKey)

//     expect(currentCount.count).toEqual(2)
//   })

//   it('Decrement Votingdapp', async () => {
//     await program.methods.decrement().accounts({ votingdapp: votingdappKeypair.publicKey }).rpc()

//     const currentCount = await program.account.votingdapp.fetch(votingdappKeypair.publicKey)

//     expect(currentCount.count).toEqual(1)
//   })

//   it('Set votingdapp value', async () => {
//     await program.methods.set(42).accounts({ votingdapp: votingdappKeypair.publicKey }).rpc()

//     const currentCount = await program.account.votingdapp.fetch(votingdappKeypair.publicKey)

//     expect(currentCount.count).toEqual(42)
//   })

//   it('Set close the votingdapp account', async () => {
//     await program.methods
//       .close()
//       .accounts({
//         payer: payer.publicKey,
//         votingdapp: votingdappKeypair.publicKey,
//       })
//       .rpc()

//     // The account should no longer exist, returning null.
//     const userAccount = await program.account.votingdapp.fetchNullable(votingdappKeypair.publicKey)
//     expect(userAccount).toBeNull()
//   })
// })
