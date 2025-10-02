import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const files = project.getSourceFiles([
  "**/*.ts",
  "**/*.tsx",
  "!generated/**/*.ts",
  "!node_modules/**",
  "!**/*.d.ts",
  "!**/dist/**",
  "!**/.next/**",
  "!**/out/**",
  "!**/build/**",
]);

for (const file of files) {
  let changed = false;

  for (const imp of file.getImportDeclarations()) {
    const spec = imp.getModuleSpecifierValue();

    // Skip same-directory imports like "./Something" – keep them relative
    if (spec.startsWith("./")) {
      continue;
    }

    if (spec.startsWith(".")) {
      const fromDir = path.dirname(file.getFilePath());
      const absPath = path.resolve(fromDir, spec);

      const projectRoot = project.getDirectoryOrThrow(".").getPath();
      let relToRoot = path.relative(projectRoot, absPath).replaceAll("\\", "/");
      // normalize by removing any leading "../"
      relToRoot = relToRoot.replaceAll(/^(\.\.\/)+/, "");

      // candidate 1: alias path from project root
      const aliasPath = `@/${relToRoot}`;

      // candidate 2: relative path from current file
      let relFromFile = path.relative(fromDir, absPath).replaceAll("\\", "/");
      if (!relFromFile.startsWith(".")) {
        relFromFile = `./${relFromFile}`;
      }

      // Determine relative depth (number of leading ../ segments)
      let depth = 0;
      const m = spec.match(/^(\.\.\/)+/);
      if (m) depth = m[0].split("../").length - 1;

      // For deep relatives (>=2), force alias; otherwise choose shortest
      const candidate =
        depth >= 2
          ? aliasPath
          : aliasPath.length < relFromFile.length
          ? aliasPath
          : relFromFile;

      if (candidate !== spec) {
        imp.setModuleSpecifier(candidate);
        changed = true;
      }
    }
  }

  // Also handle jest.mock()/vi.mock() specifiers which are string literals, not import declarations
  for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression();
    let isMock = false;
    if (Node.isPropertyAccessExpression(expr)) {
      const calleeName = expr.getName();
      const objText = expr.getExpression().getText();
      isMock =
        calleeName === "mock" && (objText === "jest" || objText === "vi");
    } else if (Node.isIdentifier(expr)) {
      // In case of direct call like mock()
      isMock = expr.getText() === "mock"; // conservative
    }
    if (!isMock) continue;

    const args = call.getArguments();
    if (args.length === 0) continue;
    const first = args[0];
    if (!Node.isStringLiteral(first)) continue;

    const spec = first.getLiteralText();

    // Skip same-directory paths like "./Something"
    if (spec.startsWith("./")) continue;

    if (spec.startsWith(".")) {
      const fromDir = path.dirname(file.getFilePath());
      const absPath = path.resolve(fromDir, spec);

      const projectRoot = project.getDirectoryOrThrow(".").getPath();
      let relToRoot = path.relative(projectRoot, absPath).replaceAll("\\", "/");
      // normalize by removing any leading "../"
      relToRoot = relToRoot.replaceAll(/^(\.\.\/)+/, "");

      // candidate 1: alias
      const aliasPath = `@/${relToRoot}`;

      // candidate 2: relative from file
      let relFromFile = path.relative(fromDir, absPath).replaceAll("\\", "/");
      if (!relFromFile.startsWith(".")) {
        relFromFile = `./${relFromFile}`;
      }

      // Determine relative depth (number of leading ../ segments)
      let depth = 0;
      const m = spec.match(/^(\.\.\/)+/);
      if (m) depth = m[0].split("../").length - 1;

      // For deep relatives (>=2), force alias; otherwise choose shortest
      const candidate =
        depth >= 2
          ? aliasPath
          : aliasPath.length < relFromFile.length
          ? aliasPath
          : relFromFile;

      if (candidate !== spec) {
        first.setLiteralValue(candidate);
        changed = true;
      }
    }
  }

  // Also handle require("...") calls
  for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression();
    if (!Node.isIdentifier(expr) || expr.getText() !== "require") continue;

    const args = call.getArguments();
    if (args.length === 0) continue;
    const first = args[0];
    if (!Node.isStringLiteral(first)) continue;

    const spec = first.getLiteralText();

    if (spec.startsWith("./")) continue;

    if (spec.startsWith(".")) {
      const fromDir = path.dirname(file.getFilePath());
      const absPath = path.resolve(fromDir, spec);

      const projectRoot = project.getDirectoryOrThrow(".").getPath();
      let relToRoot = path.relative(projectRoot, absPath).replaceAll("\\", "/");
      // normalize by removing any leading "../"
      relToRoot = relToRoot.replaceAll(/^(\.\.\/)+/, "");

      const aliasPath = `@/${relToRoot}`;

      let relFromFile = path.relative(fromDir, absPath).replaceAll("\\", "/");
      if (!relFromFile.startsWith(".")) {
        relFromFile = `./${relFromFile}`;
      }

      // Determine relative depth (number of leading ../ segments)
      let depth = 0;
      const m = spec.match(/^(\.\.\/)+/);
      if (m) depth = m[0].split("../").length - 1;

      // For deep relatives (>=2), force alias; otherwise choose shortest
      const candidate =
        depth >= 2
          ? aliasPath
          : aliasPath.length < relFromFile.length
          ? aliasPath
          : relFromFile;

      if (candidate !== spec) {
        first.setLiteralValue(candidate);
        changed = true;
      }
    }
  }

  if (changed) {
    file.saveSync();
    console.log(`Updated: ${file.getFilePath()}`);
  }
}
