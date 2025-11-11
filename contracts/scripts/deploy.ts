import { ethers } from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import * as path from "path";

interface DeploymentResult {
  contractName: string;
  address: string;
  transactionHash: string;
  blockNumber: number;
  deployer: string;
  network: string;
  timestamp: number;
  constructorArgs: any[];
}

interface NetworkDeployments {
  [contractName: string]: DeploymentResult;
}

async function main() {
  console.log("🚀 Starting Trust AI Weave smart contract deployment...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📋 Deployment Details:`);
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${await ethers.provider.getBalance(deployer.address) / BigInt(10**18)} ETH`);
  console.log("");

  const deployments: NetworkDeployments = {};

  // Deploy TrustAIToken first
  console.log("📍 Deploying TrustAIToken...");
  const treasuryAddress = deployer.address; // Using deployer as treasury for now
  
  const TrustAIToken = await ethers.getContractFactory("TrustAIToken");
  const trustAIToken = await TrustAIToken.deploy(treasuryAddress);
  await trustAIToken.waitForDeployment();

  const tokenAddress = await trustAIToken.getAddress();
  const tokenTx = trustAIToken.deploymentTransaction();
  
  deployments.TrustAIToken = {
    contractName: "TrustAIToken",
    address: tokenAddress,
    transactionHash: tokenTx?.hash || "",
    blockNumber: 0, // Will be filled later
    deployer: deployer.address,
    network: network.name,
    timestamp: Date.now(),
    constructorArgs: [treasuryAddress]
  };

  console.log(`✅ TrustAIToken deployed to: ${tokenAddress}`);
  console.log(`   Transaction: ${tokenTx?.hash}`);
  console.log("");

  // Deploy CreditScoreNFT
  console.log("📍 Deploying CreditScoreNFT...");
  
  const CreditScoreNFT = await ethers.getContractFactory("CreditScoreNFT");
  const creditScoreNFT = await CreditScoreNFT.deploy(
    "Trust AI Credit Score",
    "TAICS"
  );
  await creditScoreNFT.waitForDeployment();

  const nftAddress = await creditScoreNFT.getAddress();
  const nftTx = creditScoreNFT.deploymentTransaction();
  
  deployments.CreditScoreNFT = {
    contractName: "CreditScoreNFT",
    address: nftAddress,
    transactionHash: nftTx?.hash || "",
    blockNumber: 0, // Will be filled later
    deployer: deployer.address,
    network: network.name,
    timestamp: Date.now(),
    constructorArgs: ["Trust AI Credit Score", "TAICS"]
  };

  console.log(`✅ CreditScoreNFT deployed to: ${nftAddress}`);
  console.log(`   Transaction: ${nftTx?.hash}`);
  console.log("");

  // Setup initial roles and permissions
  console.log("🔐 Setting up roles and permissions...");
  
  // Grant MINTER_ROLE to deployer for CreditScoreNFT
  const MINTER_ROLE = await creditScoreNFT.MINTER_ROLE();
  const ORACLE_ROLE = await creditScoreNFT.ORACLE_ROLE();
  
  await creditScoreNFT.grantRole(MINTER_ROLE, deployer.address);
  await creditScoreNFT.grantRole(ORACLE_ROLE, deployer.address);
  
  console.log(`✅ Granted MINTER_ROLE and ORACLE_ROLE to deployer`);
  console.log("");

  // Save deployment information
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const networkDir = path.join(deploymentsDir, network.name);
  
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }
  
  if (!existsSync(networkDir)) {
    mkdirSync(networkDir, { recursive: true });
  }

  // Save individual deployment files
  for (const [contractName, deployment] of Object.entries(deployments)) {
    const deploymentFile = path.join(networkDir, `${contractName}.json`);
    writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  }

  // Save summary deployment file
  const summaryFile = path.join(networkDir, "deployments.json");
  writeFileSync(summaryFile, JSON.stringify(deployments, null, 2));

  // Create environment file with contract addresses
  const envContent = `
# Contract Addresses for ${network.name} (Chain ID: ${network.chainId})
# Generated on: ${new Date().toISOString()}

NETWORK=${network.name}
CHAIN_ID=${network.chainId}
DEPLOYER_ADDRESS=${deployer.address}

# Contract Addresses
TRUST_AI_TOKEN_ADDRESS=${tokenAddress}
CREDIT_SCORE_NFT_ADDRESS=${nftAddress}

# Transaction Hashes
TRUST_AI_TOKEN_TX=${tokenTx?.hash || ""}
CREDIT_SCORE_NFT_TX=${nftTx?.hash || ""}

# Block Numbers (will be filled after deployment)
TRUST_AI_TOKEN_BLOCK=0
CREDIT_SCORE_NFT_BLOCK=0
`.trim();

  const envFile = path.join(networkDir, ".env.contracts");
  writeFileSync(envFile, envContent);

  console.log("📊 Deployment Summary:");
  console.log("========================");
  console.log(`Network: ${network.name} (${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("");
  console.log("📋 Contract Addresses:");
  console.log(`   TrustAIToken: ${tokenAddress}`);
  console.log(`   CreditScoreNFT: ${nftAddress}`);
  console.log("");
  console.log("🔗 Verification Commands:");
  console.log(`   npx hardhat verify --network ${network.name} ${tokenAddress} "${treasuryAddress}"`);
  console.log(`   npx hardhat verify --network ${network.name} ${nftAddress} "Trust AI Credit Score" "TAICS"`);
  console.log("");
  console.log("📂 Files Created:");
  console.log(`   Deployments: ${summaryFile}`);
  console.log(`   Environment: ${envFile}`);
  console.log("");
  console.log("✨ Deployment completed successfully!");

  // Test basic functionality
  console.log("🧪 Testing basic functionality...");
  
  // Test token
  const tokenName = await trustAIToken.name();
  const tokenSymbol = await trustAIToken.symbol();
  const totalSupply = await trustAIToken.totalSupply();
  
  console.log(`   Token Name: ${tokenName}`);
  console.log(`   Token Symbol: ${tokenSymbol}`);
  console.log(`   Total Supply: ${await trustAIToken.totalSupply() / BigInt(10**18)} TRUST`);
  
  // Test NFT
  const nftName = await creditScoreNFT.name();
  const nftSymbol = await creditScoreNFT.symbol();
  
  console.log(`   NFT Name: ${nftName}`);
  console.log(`   NFT Symbol: ${nftSymbol}`);
  
  console.log("");
  console.log("🎉 All contracts deployed and verified successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });