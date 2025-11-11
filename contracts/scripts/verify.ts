import { ethers } from "hardhat";
import { readFileSync } from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Starting contract verification...");
  
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log(`Network: ${networkName} (Chain ID: ${network.chainId})`);
  
  // Read deployment information
  const deploymentsDir = path.join(__dirname, "..", "deployments", networkName);
  const deploymentsFile = path.join(deploymentsDir, "deployments.json");
  
  try {
    const deployments = JSON.parse(readFileSync(deploymentsFile, "utf8"));
    
    console.log("📋 Verifying contracts on Etherscan...");
    console.log("");
    
    // Verify TrustAIToken
    if (deployments.TrustAIToken) {
      console.log("🔍 Verifying TrustAIToken...");
      try {
        await run("verify:verify", {
          address: deployments.TrustAIToken.address,
          constructorArguments: deployments.TrustAIToken.constructorArgs,
        });
        console.log(`✅ TrustAIToken verified: ${deployments.TrustAIToken.address}`);
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log(`✅ TrustAIToken already verified: ${deployments.TrustAIToken.address}`);
        } else {
          console.error(`❌ TrustAIToken verification failed:`, error.message);
        }
      }
      console.log("");
    }
    
    // Verify CreditScoreNFT
    if (deployments.CreditScoreNFT) {
      console.log("🔍 Verifying CreditScoreNFT...");
      try {
        await run("verify:verify", {
          address: deployments.CreditScoreNFT.address,
          constructorArguments: deployments.CreditScoreNFT.constructorArgs,
        });
        console.log(`✅ CreditScoreNFT verified: ${deployments.CreditScoreNFT.address}`);
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log(`✅ CreditScoreNFT already verified: ${deployments.CreditScoreNFT.address}`);
        } else {
          console.error(`❌ CreditScoreNFT verification failed:`, error.message);
        }
      }
      console.log("");
    }
    
    console.log("🎉 Contract verification completed!");
    
    // Print explorer links
    console.log("🔗 Explorer Links:");
    const explorerUrls: { [key: string]: string } = {
      "mainnet": "https://etherscan.io",
      "sepolia": "https://sepolia.etherscan.io",
      "polygon": "https://polygonscan.com",
      "arbitrum": "https://arbiscan.io",
      "base": "https://basescan.org"
    };
    
    const explorerUrl = explorerUrls[networkName] || "https://etherscan.io";
    
    if (deployments.TrustAIToken) {
      console.log(`   TrustAIToken: ${explorerUrl}/address/${deployments.TrustAIToken.address}`);
    }
    
    if (deployments.CreditScoreNFT) {
      console.log(`   CreditScoreNFT: ${explorerUrl}/address/${deployments.CreditScoreNFT.address}`);
    }
    
  } catch (error) {
    console.error("❌ Error reading deployment file:", error);
    console.log("Please run deployment first: npm run deploy:<network>");
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });