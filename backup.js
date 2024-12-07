const axios = require('axios');
const { zip } = require('zip-a-folder');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { JsonRpcProvider, Wallet, Contract, utils } = require('ethers');

const ADDRESS = "https://publisher.walrus-testnet.walrus.space"; // Replace with Walrus service address
const EPOCHS = "5";
const WEB3_FILES_PATH = process.env.WEB3_FILES_PATH || '.';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const today = new Date();
const options = {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};
const localDateString = today.toLocaleString('en-GB', options);
const [date, time] = localDateString.split(', ');
const [day, month, year] = date.split('/');
const [hour, minute, second] = time.split(':');

const backupDir = path.join(os.homedir(), 'backups');
const archiveFileName = `backup-${year}-${month}-${day}-${hour}-${minute}-${second}.zip`;
const ARCHIVE_PATH = path.join(backupDir, archiveFileName);

const provider = new JsonRpcProvider('https://rpc-amoy.polygon.technology/');
const wallet = new Wallet(PRIVATE_KEY, provider);
const abi = [
  {
    "inputs": [{ "internalType": "string", "name": "cid", "type": "string" }],
    "name": "addBackup",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function",
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getBackups",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "string", "name": "cid", "type": "string" },
        ],
        "internalType": "struct BackupStorage.Backup[]",
        "name": "",
        "type": "tuple[]",
      },
    ],
    "stateMutability": "view",
    "type": "function",
  },
];
const contract = new Contract(CONTRACT_ADDRESS, abi, wallet);

async function uploadBlob(data) {
  const storeUrl = `${ADDRESS}/v1/store?epochs=${EPOCHS}`;
  const response = await axios.put(storeUrl, data, {
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  if (response.status !== 200) {
    throw new Error(`Failed to upload blob: ${response.statusText}`);
  }
  return response.data.newlyCreated.blobObject.blobId;
}



async function backupFiles() {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    await zip(WEB3_FILES_PATH, ARCHIVE_PATH);

    console.log(`Uploading ${ARCHIVE_PATH} to Walrus...`);
    const fileData = fs.readFileSync(ARCHIVE_PATH);
    const blobId = await uploadBlob(fileData);
    console.log('Walrus response: Blob ID:', blobId);

    // Store blobId in the smart contract
    const gasPrice = await provider.getGasPrice();
    const maxPriorityFeePerGas = utils.parseUnits('30', 'gwei');
    const maxFeePerGas = gasPrice.add(maxPriorityFeePerGas);

    const txOptions = {
      gasLimit: utils.hexlify(1000000),
      maxPriorityFeePerGas,
      maxFeePerGas,
    };

    const tx = await contract.addBackup(blobId, txOptions);
    await tx.wait();
    console.log('Backup metadata stored on Polygon.');

    fs.unlinkSync(ARCHIVE_PATH); // Clean up the archive
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

module.exports = { backupFiles };
