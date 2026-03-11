import fs from "fs/promises";
import { resolveWithinRoot } from "../utils/fs-path";

type Hunk = {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
};

function parseHunks(patch: string): Hunk[] {
  const lines = patch.split(/\r?\n/);
  const hunks: Hunk[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line === undefined || !line.startsWith("@@")) {
      i += 1;
      continue;
    }

    const match = /@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/.exec(line);
    if (!match) {
      throw new Error("Invalid patch hunk header");
    }

    const oldStart = Number(match[1]);
    const oldCount = match[2] ? Number(match[2]) : 1;
    const newStart = Number(match[3]);
    const newCount = match[4] ? Number(match[4]) : 1;

    i += 1;
    const hunkLines: string[] = [];
    while (i < lines.length) {
      const nextLine = lines[i];
      if (nextLine === undefined || nextLine.startsWith("@@")) {
        break;
      }
      hunkLines.push(nextLine);
      i += 1;
    }

    hunks.push({ oldStart, oldCount, newStart, newCount, lines: hunkLines });
  }

  return hunks;
}

function applyHunks(content: string, hunks: Hunk[]) {
  const lines = content.split(/\r?\n/);
  let offset = 0;

  for (const hunk of hunks) {
    let idx = hunk.oldStart - 1 + offset;
    const originalIdx = idx;

    for (const line of hunk.lines) {
      if (line === undefined) {
        throw new Error("Invalid patch line");
      }
      const tag = line[0];
      const text = line.slice(1);

      if (tag === " ") {
        if (lines[idx] !== text) {
          throw new Error(`Hunk context mismatch at line ${idx + 1}`);
        }
        idx += 1;
      } else if (tag === "-") {
        if (lines[idx] !== text) {
          throw new Error(`Hunk delete mismatch at line ${idx + 1}`);
        }
        lines.splice(idx, 1);
        offset -= 1;
      } else if (tag === "+") {
        lines.splice(idx, 0, text);
        idx += 1;
        offset += 1;
      } else if (tag === "\\") {
        // "\ No newline at end of file" — ignore
      } else {
        throw new Error("Invalid patch line");
      }
    }

    const appliedLines = idx - originalIdx;
    if (appliedLines < 0) {
      throw new Error("Patch application failed");
    }
  }

  return lines.join("\n");
}

export const applyPatchTool = {
  name: "apply_patch",
  description: "Apply a unified diff patch to a file",

  async execute({
    path,
    patch,
    root = process.cwd(),
  }: {
    path: string;
    patch: string;
    root?: string;
  }) {
    if (!path || !path.trim()) {
      throw new Error("path is required");
    }
    if (!patch || !patch.trim()) {
      throw new Error("patch is required");
    }

    const { resolvedPath } = resolveWithinRoot(root, path);
    const content = await fs.readFile(resolvedPath, "utf-8");

    const hunks = parseHunks(patch);
    if (hunks.length === 0) {
      throw new Error("No hunks found in patch");
    }

    const updated = applyHunks(content, hunks);
    await fs.writeFile(resolvedPath, updated, "utf-8");

    return { path: resolvedPath, hunks: hunks.length };
  },
};
