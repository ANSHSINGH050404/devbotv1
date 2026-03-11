import fs from "fs/promises";
import path from "path";

export const readFileTool = {
  name: "read_file",

  description: "Read the contents of a file",

  async execute({
    path: filePath,
    maxBytes = 1_000_000,
    root = process.cwd(),
  }: {
    path: string;
    maxBytes?: number;
    root?: string;
  }) {
    if (!filePath || !filePath.trim()) {
      throw new Error("path is required");
    }

    const resolvedRoot = path.resolve(root);
    const resolvedPath = path.resolve(resolvedRoot, filePath);
    const rel = path.relative(resolvedRoot, resolvedPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error("path is outside allowed root");
    }

    const stat = await fs.stat(resolvedPath);
    if (stat.size > maxBytes) {
      throw new Error(`file exceeds maxBytes (${maxBytes})`);
    }

    const content = await fs.readFile(resolvedPath, "utf-8");

    return {
      path: resolvedPath,
      content,
      size: stat.size,
    };
  },
};
