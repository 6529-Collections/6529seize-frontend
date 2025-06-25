const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run tests and capture output to find files with TitleContext errors
console.log('Finding test files with TitleContext errors...');
let testOutput = '';
try {
  testOutput = execSync('npm test -- --no-coverage 2>&1 | grep -B 20 "useTitle must be used within a TitleProvider" | grep "FAIL.*\\.test\\." || true', { encoding: 'utf8' });
} catch (e) {
  testOutput = e.stdout || '';
}

// Extract failing test files
const failingFiles = new Set();
const lines = testOutput.split('\n');
lines.forEach(line => {
  const match = line.match(/FAIL\s+(__tests__\/.*\.test\.[jt]sx?)/);
  if (match) {
    failingFiles.add(match[1]);
  }
});

// Also check the specific files mentioned in the error
const knownFailingFiles = [
  '__tests__/pages/access.test.tsx',
  '__tests__/components/user/layout/UserPageLayout.test.tsx',
  '__tests__/pages/tools/app-wallets/address.test.tsx',
  '__tests__/pages/additionalPages.test.tsx',
  '__tests__/pages/home.test.tsx',
  '__tests__/pages/theMemesMint.test.tsx',
  '__tests__/components/DistributionPlanToolWrapper.test.tsx',
  '__tests__/pages/miscPages2.test.tsx',
  '__tests__/pages/nextgenPages.test.tsx',
  '__tests__/pages/tools/index.test.tsx',
  '__tests__/pages/miscPages3.test.tsx',
];

knownFailingFiles.forEach(file => failingFiles.add(file));

console.log(`Found ${failingFiles.size} files that need TitleContext mock\n`);

// Function to calculate correct relative path
function getRelativePath(filePath) {
  const cleanPath = filePath.replace('__tests__/', '');
  const depth = cleanPath.split('/').length - 1;
  return '../'.repeat(depth + 1);
}

// Function to add TitleContext mock
function addTitleContextMock(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has TitleContext mock
    if (content.includes('contexts/TitleContext') && content.includes('jest.mock')) {
      console.log(`⚠️  Skipping ${filePath} - already has TitleContext mock`);
      return;
    }
    
    const relativePath = getRelativePath(filePath);
    
    // The mock to add
    const titleMock = `
// Mock TitleContext
jest.mock('${relativePath}contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));
`;

    // Find the right place to insert
    const lines = content.split('\n');
    let insertIndex = -1;
    let lastImportOrMockIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('import ') || 
          line.includes('jest.mock(') || 
          line.includes('require(')) {
        lastImportOrMockIndex = i;
      }
      // Look for describe or test blocks
      if ((line.includes('describe(') || line.includes('it(') || line.includes('test(')) && insertIndex === -1) {
        insertIndex = i - 1;
        break;
      }
    }
    
    // If we found imports/mocks, insert after them
    if (lastImportOrMockIndex !== -1 && insertIndex === -1) {
      insertIndex = lastImportOrMockIndex;
    }
    
    if (insertIndex !== -1) {
      lines.splice(insertIndex + 1, 0, titleMock);
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚠️  Could not find insertion point for ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
  }
}

// Process all failing files
failingFiles.forEach(file => {
  addTitleContextMock(file);
});

console.log('\nDone!');