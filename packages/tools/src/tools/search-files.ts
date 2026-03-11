import fs from "fs/promises";
import path from "path";
import { resolveWithinRoot } from "../utils/fs-path";

type SearchFilesArgs = {
  root?: string;
  query: string;
  maxResults?: number;
  includeHidden?: boolean;
  caseSensitive?: boolean;
};

async function walk(dir: string, includeHidden: boolean, results: string[], max: number, query: string, caseSensitive: boolean) {
  if (results.length >= max) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (results.length >= max) return;
    if (!includeHidden && entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, includeHidden, results, max, query, caseSensitive);
    } else {
      const name = caseSensitive ? entry.name : entry.name.toLowerCase();
      const q = caseSensitive ? query : query.toLowerCase();
      if (name.includes(q)) {
        results.push(fullPath);
      }
    }
  }
}

export const searchFilesTool = {
  name: "search_files",
  description: "Search for files by name substring",

  async execute({
    root = process.cwd(),
    query,
    maxResults = 200,
    includeHidden = false,
    caseSensitive = false,
  }: SearchFilesArgs) {
    if (!query || !query.trim()) {
      throw new Error("query is required");
    }
    const { resolvedRoot } = resolveWithinRoot(root, ".");
    const results: string[] = [];
    await walk(resolvedRoot, includeHidden, results, maxResults, query, caseSensitive);
    return { root: resolvedRoot, results };
  },
};
