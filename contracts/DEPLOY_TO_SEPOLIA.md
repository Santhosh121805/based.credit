# 🚀 Deploy Trust AI Weave to Sepolia Testnet

## 📋 Prerequisites Checklist

### 1️⃣ Get Sepolia ETH for Gas Fees
- [ ] Visit [Sepolia Faucet](https://sepoliafaucet.com/) or [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [ ] Request 0.5-1 ETH for gas fees (should be enough for deployment)
- [ ] Verify you received ETH in your MetaMask wallet

### 2️⃣ Export Your Private Key from MetaMask
⚠️ **NEVER share your private key publicly!**

1. Open MetaMask extension
2. Click on your account name → **Account Details**
3. Click **Export Private Key**
4. Enter your MetaMask password
5. Copy the private key (starts with `0x...`)

### 3️⃣ Get a Sepolia RPC URL
Choose one of these options:

**Option A: Infura (Recommended)**
1. Visit [Infura.io](https://infura.io/) and create a free account
2. Create a new project
3. Copy your Project ID
4. Your RPC URL will be: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Option B: Alchemy**
1. Visit [Alchemy.com](https://www.alchemy.com/) and create a free account
2. Create a new app on Ethereum Sepolia
3. Your RPC URL will be: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Option C: Public RPC (may be slower)**
- Use: `https://sepolia.gateway.tenderly.co`

## 🔧 Configuration Steps

### 4️⃣ Update Environment Variables

Edit your `.env` file:

```bash
# Replace YOUR_ACTUAL_PRIVATE_KEY_HERE with your MetaMask private key
PRIVATE_KEY=0x1234567890abcdef...

# Replace with your chosen RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Optional: For contract verification on Etherscan
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 5️⃣ Verify Configuration

Run this command to check your setup:

```bash
npx hardhat console --network sepolia
```

In the console, check your balance:
```javascript
const [deployer] = await ethers.getSigners();
console.log("Deployer:", deployer.address);
console.log("Balance:", await ethers.provider.getBalance(deployer.address));
```

Type `.exit` to exit the console.

## 🚀 Deployment Commands

### 6️⃣ Deploy to Sepolia

```bash
# Navigate to contracts directory
cd contracts

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.ts --network sepolia
```

### 7️⃣ Expected Output

You should see something like:
```
🚀 Starting Trust AI Weave smart contract deployment...

📋 Deployment Details:
   Network: sepolia (Chain ID: 11155111)
   Deployer: 0xYourWalletAddress
   Balance: 0.5 ETH

📍 Deploying TrustAIToken...
✅ TrustAIToken deployed to: 0x1234abcd5678ef90123456789abcdef123456789

📍 Deploying CreditScoreNFT...
✅ CreditScoreNFT deployed to: 0xabcdef1234567890fedcba098765432112345678

🎉 All contracts deployed and verified successfully!
```

## 📝 Save Your Contract Addresses

**Copy these addresses for your hackathon submission:**
- **TrustAIToken Address**: `0x...`
- **CreditScoreNFT Address**: `0x...`

## 🔍 Verify Contracts on Etherscan (Optional)

If you have an Etherscan API key:

```bash
# Verify TrustAIToken (replace with your actual addresses)
npx hardhat verify --network sepolia 0x1234abcd5678ef90123456789abcdef123456789 "0xYourWalletAddress"

# Verify CreditScoreNFT
npx hardhat verify --network sepolia 0xabcdef1234567890fedcba098765432112345678 "Trust AI Credit Score" "TAICS"
```

## 🎯 View on Sepolia Etherscan

After deployment, view your contracts on:
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- Search for your contract addresses

## 🚨 Troubleshooting

### Common Issues:

**"Insufficient funds for gas"**
- Get more Sepolia ETH from faucets
- Reduce gas price in hardhat.config.ts

**"Network timeout"**
- Try a different RPC URL
- Check your internet connection
- Increase timeout in hardhat.config.ts

**"Invalid private key"**
- Make sure private key starts with `0x`
- Re-export from MetaMask if needed

**"Account not found"**
- Verify private key is correct
- Check you're on Sepolia network in MetaMask

## 📂 Files Generated

After successful deployment:
```
deployments/
  sepolia/
    TrustAIToken.json        # Token deployment info
    CreditScoreNFT.json      # NFT deployment info
    deployments.json         # Summary of all deployments
    .env.contracts           # Contract addresses for frontend
```

---

🎉 **Congratulations!** Your smart contracts are now deployed on Sepolia testnet and ready for your hackathon submission!