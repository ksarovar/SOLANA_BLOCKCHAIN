const { Connection, PublicKey } = require("@solana/web3.js");

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com/"; // Replace with your RPC provider
const PROGRAM_ADDRESS = "EfbbhahGNuhqEraRZXrwETfsaKxScngEttdQixWAW4WE"; // Replace with your program address
const TRANSACTION_LIMIT = 1; // Fetch the latest 5 transactions for example
const RATE_LIMIT_DELAY = 500; // Delay in ms between each request

// Conversion factor: 1 SOL = 1,000,000,000 lamports
const LAMPORTS_PER_SOL = 1_000_000_000;

const fetchLatestTransactions = async () => {
  try {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const programPublicKey = new PublicKey(PROGRAM_ADDRESS);

    console.log(`Fetching the latest ${TRANSACTION_LIMIT} transactions for contract: ${PROGRAM_ADDRESS}`);

    // Fetch signatures for the latest transactions
    const signatures = await connection.getSignaturesForAddress(programPublicKey, { limit: TRANSACTION_LIMIT });

    if (signatures.length === 0) {
      console.log("No transactions found for the given address.");
      return;
    }

    console.log(`Found ${signatures.length} transactions. Fetching details...`);

    // Loop through each signature (transaction)
    for (const signature of signatures) {
      try {
        const transaction = await connection.getTransaction(signature.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });

        if (!transaction) {
          console.log(`Transaction not found for signature: ${signature.signature}`);
          continue;
        }

        console.log("Transaction details:", transaction);

        // Extracting the unique identifier (signature) of the transaction
        const transactionSignature = signature.signature;
        console.log("Transaction Signature (Nonce equivalent):", transactionSignature);

        // Extracting transfer amounts from token balances
        const preBalances = transaction.meta.preBalances;
        const postBalances = transaction.meta.postBalances;
        
        // Calculate the transfer amounts in lamports and convert them to SOL
        const transferAmounts = preBalances.map((preBalance, index) => {
          const postBalance = postBalances[index];
          const amountTransferredLamports = preBalance - postBalance;
          if (amountTransferredLamports !== 0) {
            // Convert lamports to SOL
            const amountTransferredSOL = amountTransferredLamports / LAMPORTS_PER_SOL;
            return { accountIndex: index, amountTransferredSOL };
          }
          return null;
        }).filter(Boolean); // Filter out null values (i.e., no transfer)

        console.log("Transfer Amounts in SOL:");
        transferAmounts.forEach(({ accountIndex, amountTransferredSOL }) => {
          console.log(`Account ${accountIndex} transferred: ${amountTransferredSOL} SOL`);
        });

        await delay(RATE_LIMIT_DELAY); // Add delay to avoid hitting rate limits
      } catch (err) {
        console.error("Error fetching transaction:", err);
      }
    }

    console.log(`Fetched details for ${signatures.length} transactions.`);
  } catch (err) {
    console.error("Error initializing connection:", err);
  }
};

// Helper function to add a delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Run the script
fetchLatestTransactions();
