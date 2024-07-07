#!/usr/bin/env node
const shell = require('shelljs');
const fs = require('fs');
const { backupFiles } = require('./backup');

const setupPipeline = () => {

  const backupsDir = './backups';
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir);
    console.log(`Created 'backups' directory.`);
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
  fs.writeFileSync('.github/workflows/lighthouse.yml', workflowContent);
  console.log('GitHub Actions workflow created. Add your secrets to the repository.');
};

// CLI command
const command = process.argv[2];
if (command === 'setup-pipeline') {
  setupPipeline();
} 
else if(command == "backup")
  {
    backupFiles();
  }
else {
  console.log('Unknown command. Use "setup-pipeline" to set up the GitHub Actions workflow.');
}
