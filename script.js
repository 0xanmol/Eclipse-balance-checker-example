// Create a connection to the Eclipse RPC endpoint
const connection = new solanaWeb3.Connection("https://mainnetbeta-rpc.eclipse.xyz");

// When the 'Check Balances' button is clicked
document.getElementById('checkBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value;
    const solDisplay = document.getElementById('solBalance');
    const balanceDisplay = document.getElementById('balance');

    // Clear previous results
    solDisplay.innerHTML = '';
    balanceDisplay.innerHTML = '';

    try {
        const pubkey = new solanaWeb3.PublicKey(address);

        // Fetch native ETH balance (Eclipse gas token)
        const solBalance = await connection.getBalance(pubkey);
        solDisplay.textContent = `ETH Balance: ${(solBalance / 1e9).toFixed(4)} ETH`;

        // Fetch all Token-2022 token accounts for this wallet
        const tokenAccounts = await connection.getTokenAccountsByOwner(pubkey, {
            programId: new solanaWeb3.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
        });

        if (tokenAccounts.value.length === 0) {
            balanceDisplay.textContent = 'No tokens found for this wallet.';
            return;
        }

        // Known token mappings - mint address to token name and decimals
        const knownTokens = {
            "AKEWE7Bgh87GPp171b4cJPSSZfmZwQ3KaqYqXoKLNAEE": { name: "USDC", decimals: 6 },
            "BeRUj3h7BqkbdfFU7FBNYbodgf8GCHodzKvF9aVjNNfL": { name: "ETH", decimals: 10 },
            "GU7NS9xCwgNPiAdJ69iusFrRfawjDDPjeMBovhV1d4kn": { name: "TurboETH", decimals: 10 },
            "So11111111111111111111111111111111111111112": { name: "WrappedETH", decimals: 10 },
            "LaihKXA47apnS599tyEyasY2REfEzBNe4heunANhsMx": { name: "Laika/MoonCoin", decimals: 6 },
            "27Kkn8PWJbKJsRZrxbsYDdedpUQKnJ5vNfserCxNEJ3R": { name: "TurboUSD", decimals: 6 }
        };

        // Loop through each token account
        for (const tokenAccountInfo of tokenAccounts.value) {
            const accountData = tokenAccountInfo.account.data;
            const data = accountData.slice(0, 165); // Token account data layout

            const mint = new solanaWeb3.PublicKey(data.slice(0, 32));
            const amountBuffer = data.slice(64, 72);
            const rawAmount = amountBuffer.readBigUInt64LE(0);

            const mintAddress = mint.toBase58();
            // Check if token is known, otherwise abbreviate mint address
            const tokenInfo = knownTokens[mintAddress] || { name: abbreviateAddress(mintAddress), decimals: 0 };

            // Adjust amount based on decimals if available
            const amount = tokenInfo.decimals > 0 
                ? (Number(rawAmount) / (10 ** tokenInfo.decimals)).toFixed(4) 
                : Number(rawAmount);

            // Create token card element
            const card = document.createElement('div');
            card.className = 'token-card';

            card.innerHTML = `
                <div class="token-name">${tokenInfo.name}</div>
                <div class="token-balance">${amount}</div>
                <button class="copy-btn" data-address="${mintAddress}">📋</button>
            `;

            balanceDisplay.appendChild(card);
        }

        // Copy-to-clipboard logic for each token card
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(btn.dataset.address);
                btn.textContent = '✅';
                setTimeout(() => btn.textContent = '📋', 1000);
            });
        });

    } catch (err) {
        console.error(err);
        balanceDisplay.textContent = 'Invalid address or error fetching token balances.';
    }
});

// Utility to shorten long mint addresses for unknown tokens
function abbreviateAddress(address) {
    return address.slice(0, 4) + "..." + address.slice(-4);
}
