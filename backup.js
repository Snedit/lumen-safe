const lighthouse = require('@lighthouse-web3/sdk');
const { JsonRpcProvider, Wallet, Contract, utils } = require('ethers');
const { zip } = require('zip-a-folder');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = process.env.LIGHTHOUSE_API_KEY;
const WEB3_FILES_PATH = process.env.WEB3_FILES_PATH || '.';
const today = new Date();
const options = {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
};
const localDateString = today.toLocaleString('en-GB', options);
const [date, time] = localDateString.split(', ');
const [day, month, year] = date.split('/');
const [hour, minute, second] = time.split(':');

const backupDir = path.join(os.homedir(), 'backups');
const archiveFileName = `backup-${year}-${month}-${day}-${hour}-${minute}-${second}.zip`;
const ARCHIVE_PATH = path.join(backupDir, archiveFileName);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;  // Deployed contract address
const PRIVATE_KEY = process.env.PRIVATE_KEY;  // Private key for signing transactions

const provider = new JsonRpcProvider('https://rpc-amoy.polygon.technology/');
const wallet = new Wallet(PRIVATE_KEY, provider);
const abi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      }
    ],
    "name": "addBackup",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BackupAdded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getBackups",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "cid",
            "type": "string"
          }
        ],
        "internalType": "struct BackupStorage.Backup[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
const contract = new Contract(CONTRACT_ADDRESS, abi, wallet);

async function backupFiles() {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    await zip(WEB3_FILES_PATH, ARCHIVE_PATH);

    console.log(`Uploading ${ARCHIVE_PATH} to Lighthouse...`);
    const response = await lighthouse.upload(ARCHIVE_PATH, API_KEY);
    console.log('Lighthouse response:', response);

    const cid = response.data.Hash;
    if (!cid) {
      throw new Error(`CID is undefined. Response from Lighthouse: ${JSON.stringify(response)}`);
    }
    console.log('Backup completed. File CID:', cid);

    // Get gas price and calculate maxFeePerGas and maxPriorityFeePerGas
    const gasPrice = await provider.getGasPrice();
    const maxPriorityFeePerGas = utils.parseUnits('30', 'gwei');
    const maxFeePerGas = gasPrice.add(maxPriorityFeePerGas);

    const txOptions = {
      gasLimit: utils.hexlify(1000000),  // Convert to hex
      maxPriorityFeePerGas,
      maxFeePerGas
    };

    const tx = await contract.addBackup(cid, txOptions);
    await tx.wait();
    console.log('Backup metadata stored on Polygon.');

    fs.unlinkSync(ARCHIVE_PATH); // Clean up the archive after successful backup
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

module.exports = { backupFiles };
