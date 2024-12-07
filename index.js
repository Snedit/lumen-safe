#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
require('dotenv').config()
const { backupFiles } = require('./backup');
const figlet = require('figlet');
const path = require('path');
const os = require('os');

const displayAsciiArt = () => {
  figlet('LUMEN-SAFE', (err, data) => {
    if (err) {
      console.log(chalk.greenBright('THANK YOU for installing Lumen Safe:', err));
      return;
    }
    console.log(chalk.blueBright(data));
  });
};


const displayCredits = () => {
  figlet('The Goodman Code', function(err, data) {
    if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
    }
    console.log(chalk.hex('#DC143C')(data));
    console.log(chalk.green(`
Project by:
- Soham De
- Arghya Chowdhury
- Devjyoti Bannerjee
- Sayan Genri
`));
  });
};






const setupLighthousePipeline = () => {
  const workflowsDir = '.github/workflows';
  const lighthouseWorkflowPath = `${workflowsDir}/walrus.yml`;

  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
    console.log(`Created '.github/workflows' directory.`);
    console.log("help us walrus!");
  }

  const workflowContent = `
name: Backup to Lighthouse
on: [push]
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g lumen-safe
      - run: lumen-safe backup
    env:
      LIGHTHOUSE_API_KEY: \${{ secrets.LIGHTHOUSE_API_KEY }}
      CONTRACT_ADDRESS: \${{ secrets.CONTRACT_ADDRESS }}
      PRIVATE_KEY: \${{ secrets.PRIVATE_KEY }}
`;

  fs.writeFileSync(lighthouseWorkflowPath, workflowContent);
  console.log(chalk.greenBright(`Created '${lighthouseWorkflowPath}' file.`));
  console.log(`\n Now set the following secrets in your github repository: `);
  console.log(chalk.cyan(`\n LIGHTHOUSE_API_KEY \n CONTRACT_ADDRESS \n PRIVATE_KEY `));



};

const removeLighthousePipeline = () => {
  const workflowPath = '.github/workflows/lighthouse.yml';
  if (fs.existsSync(workflowPath)) {
    fs.unlinkSync(workflowPath);
    console.log(chalk.redBright('Lighthouse workflow removed.'));
  } else {
    console.log(chalk.yellow('No Lighthouse workflow found to remove.'));
  }
};

const setupSlitherArmor = () => {
  const workflowsDir = '.github/workflows';
  const slitherWorkflowPath = `${workflowsDir}/slither.yml`;

  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
    console.log(`Created '.github/workflows' directory.`);
  }

  const workflowContent = `
name: Slither Analysis
on: 
  push:
    branches: [ dev, main ]
  pull_request:
    branches: [ dev, main ]
  schedule:
    - cron: "0 7 * * 2"
jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Run Slither
        uses: crytic/slither-action@v0.4.0
        id: slither
        with:
          target: 'contracts'
          sarif: results.sarif
          fail-on: none
      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: \${{ steps.slither.outputs.sarif }}
`;

  fs.writeFileSync(slitherWorkflowPath, workflowContent);
  console.log(chalk.cyan(`Web3 armor is activated.`));
  console.log(chalk.greenBright(` \n Created '${slitherWorkflowPath}' file.`));
};

const removeSlitherArmor = () => {
  const workflowPath = '.github/workflows/slither.yml';
  if (fs.existsSync(workflowPath)) {
    fs.unlinkSync(workflowPath);
    console.log(chalk.redBright('Slither workflow removed.'));
  } else {
    console.log(chalk.yellow('No Slither workflow found to remove.'));
  }
};

const displayHelp = () => {
  displayAsciiArt();

  console.log(chalk.bold.cyan('\nWelcome to Lumen Safe CLI Tool\n'));
  console.log(chalk.yellow('Usage:'));
  console.log(chalk.bold.white('\nGeneral Commands:'));
  console.log(chalk.blueBright(`
  lumen-safe help
    - Displays this help information.

  lumen-safe credits
    - Shows the contributors of the project.
`));

  console.log(chalk.bold.white('\nPipeline Setup Commands:'));
  console.log(chalk.blueBright(`
  lumen-safe setup-pipeline
    - Sets up the Lighthouse GitHub Actions workflow for automatic backups.
  
  lumen-safe remove-pipeline
    - Removes the Lighthouse GitHub Actions workflow.

  lumen-safe armor-on
    - Activates the Slither security analysis workflow for smart contracts.

  lumen-safe armor-off
    - Deactivates the Slither security analysis workflow.
`));

  console.log(chalk.bold.white('\nConfiguration Commands:'));
  console.log(chalk.blueBright(`
  lumen-safe setupcreds
    - Saves your email address for workflow notifications.

  lumen-safe savechain
    - Saves a new blockchain network configuration.

  lumen-safe deletechain
    - Deletes an existing blockchain network configuration.
`));

  console.log(chalk.bold.white('\nTruffle Integration Commands:'));
  console.log(chalk.blueBright(`
  lumen-safe setuptruffle <contract_name> <chain_name>
    - Creates a GitHub Actions workflow to deploy a smart contract using Truffle.
    - Example: lumen-safe setuptruffle MyContract polygon
`));

  console.log(chalk.yellowBright('\nFor further details, refer to the documentation or contact support.'));
};


const configPath = path.join(os.homedir(), 'lumen_safe_config.json');

// Helper to load the config
const loadConfig = () => {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath));
  }
  return { email: null, networks: {} };
};

// Helper to save the config
const saveConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

const setupCredentials = () => {
  const config = loadConfig();

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter your email ID: ', (email) => {
    console.log(`You entered: ${email}`);
    rl.question('Confirm saving this email ID (yes/no)? ', (confirmation) => {
      if (confirmation.toLowerCase() === 'yes') {
        config.email = email;
        saveConfig(config);
        console.log(chalk.greenBright('Email ID saved successfully!'));
      } else {
        console.log(chalk.yellow('Email ID not saved.'));
      }
      rl.close();
    });
  });
};


const saveChain = () => {
  const config = loadConfig();

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter network name: ', (networkName) => {
    rl.question('Enter network ID: ', (networkID) => {
      rl.question('Enter RPC URL: ', (rpcURL) => {
        config.networks[networkName] = { networkID, rpcURL };
        saveConfig(config);
        console.log(chalk.greenBright(`Network "${networkName}" saved successfully!`));
        rl.close();
      });
    });
  });
};


const deleteChain = () => {
  const config = loadConfig();

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.cyan('Saved Networks:'));
  Object.keys(config.networks).forEach((network, idx) => {
    console.log(`${idx + 1}. ${network}`);
  });

  rl.question('Enter the name of the network to delete: ', (networkName) => {
    if (config.networks[networkName]) {
      delete config.networks[networkName];
      saveConfig(config);
      console.log(chalk.greenBright(`Network "${networkName}" deleted successfully!`));
    } else {
      console.log(chalk.red(`Network "${networkName}" not found.`));
    }
    rl.close();
  });
};


const setupTruffle = (contractName, chainName) => {
  const config = loadConfig();

  if (!config.email) {
    console.log(chalk.red('Email ID not found. Please run "lumen-safe setupcreds" first.'));
    return;
  }

  if (!config.networks[chainName]) {
    console.log(chalk.red(`Network "${chainName}" not found. Please run "lumen-safe savechain" first.`));
    return;
  }

  const workflowsDir = '.github/workflows';
  const truffleWorkflowPath = `${workflowsDir}/deploy_truffle.yml`;

  const networkConfig = config.networks[chainName];
  const workflowContent = `
name: Deploy Smart Contract
on: 
  push:
    branches: [ dev, main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Deploy contract
        run: |
          echo 'Deploying contract...'
          npx hardhat run scripts/deploy.js --network ${chainName}
    env:
      PRIVATE_KEY: \${{ secrets.PRIVATE_KEY }}
      RPC_URL: '${networkConfig.rpcURL}'

  notify:
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - name: Send Email
        run: |
          echo "Deployment Details" | mail -s "Deployment Status" ${config.email}
`;

  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
  }

  fs.writeFileSync(truffleWorkflowPath, workflowContent);
  console.log(chalk.greenBright(`GitHub Actions workflow for "${contractName}" on "${chainName}" created successfully!`));
};



const command = process.argv[2];

if (command === 'setup-pipeline') {
  setupLighthousePipeline();
} else if (command === 'remove-pipeline') {
  removeLighthousePipeline();
} else if (command === 'armor-on') {
  setupSlitherArmor();
} else if (command === 'armor-off') {
  removeSlitherArmor();
} else if (command === 'setupcreds') {
  setupCredentials();
} else if (command === 'savechain') {
  saveChain();
} else if (command === 'deletechain') {
  deleteChain();
} else if (command === 'setuptruffle') {
  const contractName = process.argv[3];
  const chainName = process.argv[4];
  
  if (!contractName || !chainName) {
    console.log(chalk.red('Error: Please provide the contract name and chain name.'));
    console.log('Usage: lumen-safe setuptruffle <contract_name> <chain_name>');
  } else {
    setupTruffleWorkflow(contractName, chainName);
  }
} else if (command === 'help') {
  displayHelp();
} else if (command === 'credits') {
  displayCredits();
} else {
  console.log('Unknown command. Use "lumen-safe help" to display available commands.');
}

// changes
