#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const SOURCE_FILE_EXTENSIONS = ['.ts', '.tsx'];
const TEST_FILE_PATTERNS = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];
const RELEVANT_DIRS = ['components', 'contexts', 'entities', 'helpers', 'hooks', 'lib', 'pages', 'services', 'store', 'utils', 'wagmiConfig']; // Add your source directories

// Placeholder for coverage threshold
const COVERAGE_THRESHOLD = 80; 

function getChangedSourceFiles(baseBranch = 'main') {
  try {
    // Compare with the baseBranch directly to include uncommitted changes in the current working directory
    const command = 'git diff --name-only ' + baseBranch;
    const diffOutput = childProcess.execSync(command).toString().trim();
    if (!diffOutput) {
      console.log('No changes detected against branch ' + baseBranch + ' (including uncommitted changes).');
      return [];
    }
    const changedFiles = diffOutput.split('\\n');
    console.log('Files found by git diff ' + baseBranch + ':', changedFiles); // DEBUG raw output
    
    return changedFiles.filter(file => {
      console.log('\nProcessing file for filter: ' + file); // DEBUG
      const ext = path.extname(file);
      // const dir = path.dirname(file).split(path.sep)[0]; // Get the top-level directory, not currently used

      const isSourceExt = SOURCE_FILE_EXTENSIONS.includes(ext);
      console.log('  Is source extension (' + ext + ')? ' + isSourceExt); // DEBUG

      const isInRelevantDir = RELEVANT_DIRS.some(d => file.startsWith(d + path.sep));
      console.log('  Is in relevant directory? ' + isInRelevantDir); // DEBUG

      const isNotDeclaration = !file.endsWith('.d.ts');
      console.log('  Is not a .d.ts file? ' + isNotDeclaration); // DEBUG

      const isNotTestFile = !TEST_FILE_PATTERNS.some(pattern => file.endsWith(pattern));
      console.log('  Is not a test file? ' + isNotTestFile); // DEBUG

      const shouldKeep = isSourceExt && isInRelevantDir && isNotDeclaration && isNotTestFile;
      console.log('  => Should keep? ' + shouldKeep); // DEBUG

      return shouldKeep;
    });
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    if (error.stderr) {
      console.error('Git stderr:', error.stderr.toString());
    }
    if (error.stdout) {
      console.error('Git stdout:', error.stdout.toString());
    }
    // If git diff fails (e.g. not in a git repo, or main branch doesn't exist), exit
    process.exit(1); 
  }
}

async function main() {
  const changedFiles = getChangedSourceFiles();

  if (changedFiles.length === 0) {
    console.log("No relevant source file changes detected. Exiting.");
    process.exit(0);
  }

  console.log("\\nDetected changed source files:");
  changedFiles.forEach(file => console.log('- ' + file));
  console.log("\\n");

  // --- Placeholder for next steps ---
  // 1. Check for corresponding test files
  // 2. Run Jest for changed files and get JSON output
  // 3. Parse Jest output
  // 4. Verify coverage for tested changed files
  // 5. Report and exit

}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
}); 
