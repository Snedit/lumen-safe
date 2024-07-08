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
  const lighthouseWorkflowPath = `${workflowsDir}/lighthouse.yml`;

  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
    console.log(`Created '.github/workflows' directory.`);
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

  console.log(chalk.blueBright('Welcome to Your CLI Tool\n'));
  console.log(chalk.yellow('Usage:'));
  console.log('  lumen-safe setup-pipeline    - Set up the Lighthouse GitHub Actions workflow');
  console.log('  lumen-safe remove-pipeline   - Remove the Lighthouse GitHub Actions workflow');
  console.log('  lumen-safe armor-on          - Enable Slither security analysis');
  console.log('  lumen-safe armor-off         - Disable Slither security analysis');
  console.log('  lumen-safe help              - Display this help information');
  console.log('  lumen-safe credits           - The developers of this project');


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
}
  else if(command === 'help')
  {
    displayHelp();
    
  }
  else if(command === 'credits')
    {
      displayCredits();
      
    }
else {
  console.log('Unknown command. Use "lumen-safe help" to display available commands.');
}
