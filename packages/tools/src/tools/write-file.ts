import fs from "fs/promises";
import { resolveWithinRoot } from "../utils/fs-path";

export const writeFileTool = {
  name: "write_file",
  description: "Write content to a file",

  async execute({
    path,
    content,
    root = process.cwd(),
    overwrite = true,
    encoding = "utf-8",
  }: {
    path: string;
    content: string;
    root?: string;
    overwrite?: boolean;
    encoding?: BufferEncoding;
  }) {
    if (!path || !path.trim()) {
      throw new Error("path is required");
    }
    if (content == null) {
      throw new Error("content is required");
    }

    const { resolvedPath } = resolveWithinRoot(root, path);

    if (!overwrite) {
      try {
        await fs.access(resolvedPath);
        throw new Error("file already exists");
      } catch {
        // file does not exist
      }
    }

    await fs.writeFile(resolvedPath, content, { encoding });

    return { path: resolvedPath, bytes: Buffer.byteLength(content, encoding) };
  },
};
