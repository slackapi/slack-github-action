#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_SITE_REPO = 'slackapi/slackapi.github.io';
const TEMP_DIR = path.join(REPO_ROOT, '.docusaurus-preview');

function executeCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error('Failed to execute command:', command);
    console.error(error.message);
    process.exit(1);
  }
}

function cleanupTempDir() {
  if (fs.existsSync(TEMP_DIR)) {
    console.log('Cleaning up existing preview directory...');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

function setupPreviewEnvironment() {
  cleanupTempDir();
  
  console.log('Creating temporary directory...');
  fs.mkdirSync(TEMP_DIR);

  console.log('Fetching latest documentation site from main branch...');
  executeCommand(`git clone --depth 1 https://github.com/${DOCS_SITE_REPO}.git .`, { cwd: TEMP_DIR });

  const docsDir = path.join(TEMP_DIR, 'content', 'slack-github-action');
  console.log('\nSetting up documentation:');
  console.log('Source directory:', path.join(REPO_ROOT, 'docs'));
  console.log('Target directory:', docsDir);

  if (!fs.existsSync(docsDir)) {
    console.log('Creating target directory...');
    fs.mkdirSync(docsDir, { recursive: true });
  }

  console.log('\nSetting up documentation hardlinks...');
  for (const file of fs.readdirSync(path.join(REPO_ROOT, 'docs'))) {
    const sourcePath = path.join(REPO_ROOT, 'docs', file);
    const targetPath = path.join(docsDir, file);
    console.log(`\nProcessing ${file}:`);
    console.log('  From:', sourcePath);
    console.log('  To:', targetPath);
    
    // Remove existing file/link if it exists
    if (fs.existsSync(targetPath)) {
      console.log('  Removing existing file/link');
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    
    // For directories, we need to copy them
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log('  Copying directory...');
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    } else {
      // For files, create hardlinks
      console.log('  Creating hardlink...');
      fs.linkSync(sourcePath, targetPath);
    }
  }

  // Verify links
  console.log('\nVerifying files:');
  for (const file of fs.readdirSync(docsDir)) {
    try {
      const filePath = path.join(docsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`${file} -> ${stats.isDirectory() ? 'Directory' : 'File'} (${stats.nlink} links)`);
    } catch (error) {
      console.error(`Error with file ${file}:`, error.message);
    }
  }
}

function startDocusaurusServer() {
  console.log('Starting Docusaurus development server...');
  executeCommand('npm install', { cwd: TEMP_DIR });
  executeCommand('npm start', { cwd: TEMP_DIR });
}

async function main() {
  console.log('Setting up documentation preview environment...');
  setupPreviewEnvironment();
  startDocusaurusServer();
}

main().catch(error => {
  console.error('Failed to set up documentation preview:', error);
  process.exit(1);
}); 