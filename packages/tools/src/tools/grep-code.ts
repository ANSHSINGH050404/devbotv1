import fs from "fs/promises";
import path from "path";
import { resolveWithinRoot } from "../utils/fs-path";

type GrepArgs = {
  root?: string;
  pattern: string;
  isRegex?: boolean;
  flags?: string;
  maxResults?: number;
  maxFileBytes?: number;
  includeHidden?: boolean;
  fileExtensions?: string[];
};

type GrepMatch = {
  path: string;
  line: number;
  column: number;
  match: string;
};

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

export const grepCodeTool = {
  name: "grep_code",
  description: "Search for a text or regex pattern in code files",

  async execute({
    root = process.cwd(),
    pattern,
    isRegex = false,
    flags = "g",
    maxResults = 500,
    maxFileBytes = 1_000_000,
    includeHidden = false,
    fileExtensions,
  }: GrepArgs) {
    if (!pattern || !pattern.trim()) {
      throw new Error("pattern is required");
    }
    const { resolvedRoot } = resolveWithinRoot(root, ".");
    const files: string[] = [];
    await walkFiles(resolvedRoot, includeHidden, files);

    const matches: GrepMatch[] = [];
    const re = isRegex ? new RegExp(pattern, flags) : null;
    const extSet = fileExtensions && fileExtensions.length > 0 ? new Set(fileExtensions.map((e) => e.toLowerCase())) : null;

    for (const file of files) {
      if (matches.length >= maxResults) break;
      if (extSet) {
        const ext = path.extname(file).toLowerCase();
        if (!extSet.has(ext)) continue;
      }
      const stat = await fs.stat(file);
      if (stat.size > maxFileBytes) continue;
      const content = await fs.readFile(file, "utf-8");
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i += 1) {
        if (matches.length >= maxResults) break;
        const line = lines[i];
        if (line === undefined) continue;
        if (isRegex && re) {
          re.lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = re.exec(line)) !== null) {
            matches.push({
              path: file,
              line: i + 1,
              column: (m.index ?? 0) + 1,
              match: m[0],
            });
            if (matches.length >= maxResults) break;
            if (!re.global) break;
          }
        } else {
          const idx = line.indexOf(pattern);
          if (idx !== -1) {
            matches.push({
              path: file,
              line: i + 1,
              column: idx + 1,
              match: pattern,
            });
          }
        }
      }
    }

    return { root: resolvedRoot, matches };
  },
};
