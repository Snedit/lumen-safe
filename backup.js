// backup.js
const lighthouse = require('@lighthouse-web3/sdk');
const { ethers } = require('ethers');
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.LIGHTHOUSE_API_KEY;

const WEB3_FILES_PATH = process.env.WEB3_FILES_PATH || '.';
const today = new Date();
const backupDir = './backups';
const archiveFileName = `backup-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.tar.gz`;
const ARCHIVE_PATH = `${backupDir}/${archiveFileName}`;
// const ARCHIVE_PATH = './archive.tar.gz';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;  // Deployed contract address
const PRIVATE_KEY = process.env.PRIVATE_KEY;  // Private key for signing transactions

const provider = new ethers.providers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
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
];  // Add the updated ABI here
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

async function backupFiles() {
  try {
    // Compress the Web3 files
     shell.exec(`tar -czvf ${ARCHIVE_PATH} ${WEB3_FILES_PATH}`);

    // Upload to Lighthouse and get the CID
    const response = await lighthouse.upload(WEB3_FILES_PATH, API_KEY);
    const cid = response.Hash;
    // const cid = 1234;
    console.log('Backup completed. File CID:', cid);

    // Store the backup metadata on Polygon
    const tx = await contract.addBackup(cid);
    await tx.wait();
    console.log('Backup metadata stored on Polygon.');

    // Clean up the archive file
    fs.unlinkSync(ARCHIVE_PATH);
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

module.exports = { backupFiles };
