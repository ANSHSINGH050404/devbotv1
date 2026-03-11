import { execFile } from "child_process";
import { promisify } from "util";
import { resolveWithinRoot } from "../utils/fs-path";

const execFileAsync = promisify(execFile);

export const gitCommitTool = {
  name: "git_commit",
  description: "Commit changes to git",

  async execute({
    root = process.cwd(),
    message,
    addAll = false,
  }: {
    root?: string;
    message: string;
    addAll?: boolean;
  }) {
    if (!message || !message.trim()) {
      throw new Error("message is required");
    }

    const { resolvedRoot } = resolveWithinRoot(root, ".");

    if (addAll) {
      await execFileAsync("git", ["add", "-A"], { cwd: resolvedRoot });
    }

    const { stdout } = await execFileAsync("git", ["commit", "-m", message], {
      cwd: resolvedRoot,
    });

    return { root: resolvedRoot, output: stdout.trim() };
  },
};
