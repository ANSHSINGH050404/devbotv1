import fs from "fs/promises";
import { resolveWithinRoot } from "../utils/fs-path";

export const searchReplaceTool = {
  name: "search_replace",
  description: "Search and replace text in a file",

  async execute({
    path,
    search,
    replace,
    root = process.cwd(),
    isRegex = false,
    flags = "g",
    matchIndex,
  }: {
    path: string;
    search: string;
    replace: string;
    root?: string;
    isRegex?: boolean;
    flags?: string;
    matchIndex?: number;
  }) {
    if (!path || !path.trim()) {
      throw new Error("path is required");
    }
    if (search == null) {
      throw new Error("search is required");
    }
    if (replace == null) {
      throw new Error("replace is required");
    }

    const { resolvedPath } = resolveWithinRoot(root, path);
    const content = await fs.readFile(resolvedPath, "utf-8");

    let updated = content;
    let replacements = 0;

    if (isRegex) {
      const re = new RegExp(search, flags);
      if (typeof matchIndex === "number") {
        let i = 0;
        updated = content.replace(re, (m) => {
          const shouldReplace = i === matchIndex;
          i += 1;
          if (shouldReplace) {
            replacements += 1;
            return replace;
          }
          return m;
        });
      } else {
        updated = content.replace(re, () => {
          replacements += 1;
          return replace;
        });
      }
    } else {
      if (search === "") {
        throw new Error("search cannot be empty");
      }
      if (typeof matchIndex === "number") {
        let i = 0;
        updated = content.replaceAll(search, (m) => {
          const shouldReplace = i === matchIndex;
          i += 1;
          if (shouldReplace) {
            replacements += 1;
            return replace;
          }
          return m;
        });
      } else {
        const parts = content.split(search);
        replacements = parts.length - 1;
        updated = parts.join(replace);
      }
    }

    if (replacements === 0) {
      return { path: resolvedPath, replacements: 0 };
    }

    await fs.writeFile(resolvedPath, updated, "utf-8");

    return { path: resolvedPath, replacements };
  },
};
