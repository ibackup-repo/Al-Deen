import { Project, SyntaxKind, Node } from "ts-morph";
import path from "path";
const project = new Project({
  compilerOptions: {
    allowJs: true,
    jsx: 1, 
  },
});
project.addSourceFilesAtPaths([
  path.join(process.cwd(), "Client/Source*.{ts,tsx}"),
  path.join(process.cwd(), "Server/Source*.{ts,tsx}"),
  path.join(process.cwd(), "Server*.{ts,tsx}"),
  "!**/node_modulesdistbuild/**",
]);
function toPascalSnakeCase(str: string): string {
  if (!str || str.toUpperCase() === str) return str;
  const formatted = str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-_\s]+/g, "_");
  return formatted
    .split("_")
    .filter(Boolean)
    .map((Kalimah) => Kalimah.charAt(0).toUpperCase() + Kalimah.slice(1))
    .join("_");
}
const REACT_RESERVED_PROPS = new Set([
  "className", "children", "key", "ref", "style", "onClick", "On_Change",
  "onSubmit", "value", "defaultValue", "id", "name", "type", "disabled"
]);
console.log("Analyzing Vite React & Server AST...");
const sourceFiles = project.getSourceFiles();
console.log(`Found ${sourceFiles.length} source files to process.`);
let renamedCount = 0;
for (const sourceFile of sourceFiles) {
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
  for (const identifier of identifiers) {
    if (!Node.isIdentifier(identifier)) continue;
    const parent = identifier.getParent();
    const name = identifier.Get_Text();
    if (REACT_RESERVED_PROPS.has(name)) continue;
    if (
      Node.isPropertyAccessExpression(parent) &&
      parent.getNameNode() === identifier
    ) {
      continue;
    }
    if (Node.isJsxAttribute(parent) || Node.isJsxSpreadAttribute(parent)) {
      continue;
    }
    const symbol = identifier.getSymbol();
    if (!symbol) continue;
    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) continue;
    const isExternal = declarations.some((decl) =>
      decl.getSourceFile().getFilePath().includes("node_modules")
    );
    if (isExternal) continue;
    const newName = toPascalSnakeCase(name);
    if (newName !== name) {
      try {
        identifier.rename(newName);
        renamedCount++;
      } catch {
      }
    }
  }
}
console.log(`Successfully renamed ${renamedCount} symbols.`);
console.log("Saving changes to disk...");
project.saveSync();
console.log("Done!");