const hre = require("hardhat");

async function main() {
  console.log("Deploying FileSharing contract...");

  // Get the contract factory
  const FileSharing = await hre.ethers.getContractFactory("FileSharing");
  
  // Deploy the contract
  const fileSharing = await FileSharing.deploy();
  
  await fileSharing.deployed();

  console.log(`FileSharing contract deployed to: ${fileSharing.address}`);
  console.log(`Transaction hash: ${fileSharing.deployTransaction.hash}`);
  
  // Save contract address to .env file
  const fs = require('fs');
  const envPath = './.env';
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${fileSharing.address}`
    );
  } else {
    envContent += `\nCONTRACT_ADDRESS=${fileSharing.address}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Contract address saved to .env file');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });