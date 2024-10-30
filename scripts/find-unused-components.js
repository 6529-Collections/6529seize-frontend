import fs from 'fs';
import path from 'path';
import * as babel from '@babel/parser';
import traverse from '@babel/traverse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDirs = [
  path.join(__dirname, '..', 'components'),
  path.join(__dirname, '..', 'pages')
];

const pagesDir = path.join(__dirname, '..', 'pages');

function getAllFiles(dirs) {
  return dirs.flatMap(dir => {
    const files = fs.readdirSync(dir);
    return files.flatMap(file => {
      const filePath = path.join(dir, file);
      return fs.statSync(filePath).isDirectory() ? getAllFiles([filePath]) : filePath;
    });
  });
}

function getExportedComponents(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = babel.parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });

  const exportedComponents = [];
  const fileBaseName = path.basename(filePath, path.extname(filePath));

  traverse.default(ast, {
    ExportNamedDeclaration(path) {
      const declaration = path.node.declaration;
      if (declaration && declaration.type === 'VariableDeclaration') {
        declaration.declarations.forEach(d => {
          if (d.id.type === 'Identifier') {
            exportedComponents.push(d.id.name);
          }
        });
      } else if (declaration && declaration.type === 'FunctionDeclaration' && declaration.id) {
        exportedComponents.push(declaration.id.name);
      }
    },
    ExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      if (declaration.type === 'Identifier') {
        exportedComponents.push(declaration.name);
      } else if (declaration.type === 'FunctionDeclaration' && declaration.id) {
        exportedComponents.push(declaration.id.name);
      }
    }
  });

  return { fileBaseName, exportedComponents };
}

function findUnusedComponents() {
  const allFiles = getAllFiles(srcDirs);
  const componentFiles = allFiles.filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

  const exportedComponents = new Map();
  const importedComponents = new Set();

  componentFiles.forEach(file => {
    const { fileBaseName, exportedComponents: components } = getExportedComponents(file);
    exportedComponents.set(file, { fileBaseName, components });

    const content = fs.readFileSync(file, 'utf-8');
    const ast = babel.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse.default(ast, {
      ImportDeclaration(path) {
        path.node.specifiers.forEach(specifier => {
          if (specifier.type === 'ImportSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
            importedComponents.add(specifier.local.name);
          }
        });
      },
      CallExpression(nodePath) {
        if (nodePath.node.callee.type === 'Import' || 
            (nodePath.node.callee.type === 'Identifier' && nodePath.node.callee.name === 'dynamic')) {
          const importArg = nodePath.node.arguments[0];
          if (importArg.type === 'ArrowFunctionExpression' && 
              importArg.body.type === 'CallExpression' &&
              importArg.body.callee.type === 'Import') {
            const importPath = importArg.body.arguments[0];
            if (importPath.type === 'StringLiteral') {
              const componentName = path.basename(importPath.value, path.extname(importPath.value));
              importedComponents.add(componentName);
            } else if (importPath.type === 'TemplateLiteral') {
              console.log(`Warning: Dynamic import with template literal found in ${file}. Manual check required.`);
            }
          }
        }
      }
    });
  });

  const unusedComponents = [];

  exportedComponents.forEach(({ fileBaseName, components }, file) => {
    if (!file.startsWith(pagesDir)) {
      if (!importedComponents.has(fileBaseName) && components.every(component => !importedComponents.has(component))) {
        unusedComponents.push({ file, components });
      }
    }
  });

  return unusedComponents;
}

const unusedComponents = findUnusedComponents();
console.log('Potentially unused components:');
unusedComponents.forEach(({ file, components }) => {
  console.log(`File: ${file}`);
  console.log(`Exported components: ${components.join(', ')}`);
  console.log('---');
});
