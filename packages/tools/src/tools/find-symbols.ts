import fs from "fs/promises";
import path from "path";
import ts from "typescript";
import { resolveWithinRoot } from "../utils/fs-path";

type FindSymbolsArgs = {
  root?: string;
  maxResults?: number;
  maxFileBytes?: number;
  includeHidden?: boolean;
  fileExtensions?: string[];
  useAst?: boolean;
};

type SymbolMatch = {
  path: string;
  line: number;
  kind: string;
  name: string;
};

const defaultSymbolRegexes: { kind: string; re: RegExp }[] = [
  { kind: "function", re: /^\s*export\s+function\s+([A-Za-z0-9_]+)/ },
  { kind: "function", re: /^\s*function\s+([A-Za-z0-9_]+)/ },
  { kind: "class", re: /^\s*export\s+class\s+([A-Za-z0-9_]+)/ },
  { kind: "class", re: /^\s*class\s+([A-Za-z0-9_]+)/ },
  { kind: "const", re: /^\s*export\s+const\s+([A-Za-z0-9_]+)/ },
  { kind: "const", re: /^\s*const\s+([A-Za-z0-9_]+)/ },
  { kind: "type", re: /^\s*export\s+type\s+([A-Za-z0-9_]+)/ },
  { kind: "interface", re: /^\s*export\s+interface\s+([A-Za-z0-9_]+)/ },
];

function collectAstSymbols(source: ts.SourceFile): SymbolMatch[] {
  const matches: SymbolMatch[] = [];

  const add = (kind: string, name: string, line: number) => {
    matches.push({ path: source.fileName, line, kind, name });
  };

  const isTopLevel = (node: ts.Node) => node.parent && ts.isSourceFile(node.parent);

  source.forEachChild((node) => {
    if (!isTopLevel(node)) return;

    if (ts.isFunctionDeclaration(node) && node.name) {
      const line = source.getLineAndCharacterOfPosition(node.name.getStart()).line + 1;
      add("function", node.name.text, line);
      return;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      const line = source.getLineAndCharacterOfPosition(node.name.getStart()).line + 1;
      add("class", node.name.text, line);
      return;
    }

    if (ts.isInterfaceDeclaration(node)) {
      const line = source.getLineAndCharacterOfPosition(node.name.getStart()).line + 1;
      add("interface", node.name.text, line);
      return;
    }

    if (ts.isTypeAliasDeclaration(node)) {
      const line = source.getLineAndCharacterOfPosition(node.name.getStart()).line + 1;
      add("type", node.name.text, line);
      return;
    }

    if (ts.isEnumDeclaration(node)) {
      const line = source.getLineAndCharacterOfPosition(node.name.getStart()).line + 1;
      add("enum", node.name.text, line);
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const line = source.getLineAndCharacterOfPosition(decl.name.getStart()).line + 1;
          add("const", decl.name.text, line);
        }
      }
    }
  });

  return matches;
}

async function walkFiles(dir: string, includeHidden: boolean, files: string[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(fullPath, includeHidden, files);
    } else {
      files.push(fullPath);
    }
  }
}

export const findSymbolsTool = {
  name: "find_symbols",
  description: "Find top-level symbols in code files",

  async execute({
    root = process.cwd(),
    maxResults = 500,
    maxFileBytes = 1_000_000,
    includeHidden = false,
    fileExtensions = [".ts", ".tsx", ".js", ".jsx"],
    useAst = true,
  }: FindSymbolsArgs) {
    const { resolvedRoot } = resolveWithinRoot(root, ".");
    const files: string[] = [];
    await walkFiles(resolvedRoot, includeHidden, files);

    const extSet = new Set(fileExtensions.map((e) => e.toLowerCase()));
    const matches: SymbolMatch[] = [];

    for (const file of files) {
      if (matches.length >= maxResults) break;
      const ext = path.extname(file).toLowerCase();
      if (!extSet.has(ext)) continue;
      const stat = await fs.stat(file);
      if (stat.size > maxFileBytes) continue;
      const content = await fs.readFile(file, "utf-8");
      if (useAst) {
        try {
          const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
          const astMatches = collectAstSymbols(source);
          for (const m of astMatches) {
            matches.push(m);
            if (matches.length >= maxResults) break;
          }
          continue;
        } catch {
          // fallback to regex
        }
      }

      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i += 1) {
        if (matches.length >= maxResults) break;
        const line = lines[i];
        if (line === undefined) continue;
        for (const { kind, re } of defaultSymbolRegexes) {
          const m = re.exec(line);
          if (m && m[1]) {
            matches.push({
              path: file,
              line: i + 1,
              kind,
              name: m[1],
            });
            break;
          }
        }
      }
    }

    return { root: resolvedRoot, matches };
  },
};
