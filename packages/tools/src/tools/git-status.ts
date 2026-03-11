import { execFile } from "child_process";
import { promisify } from "util";
import { resolveWithinRoot } from "../utils/fs-path";

const execFileAsync = promisify(execFile);

export const gitStatusTool = {
  name: "git_status",
  description: "Get git status for a repository",

  async execute({
    root = process.cwd(),
    porcelain = true,
  }: {
    root?: string;
    porcelain?: boolean;
  }) {
    const { resolvedRoot } = resolveWithinRoot(root, ".");
    const args = ["status"];
    if (porcelain) {
      args.push("--porcelain");
    }

    const { stdout } = await execFileAsync("git", args, {
      cwd: resolvedRoot,
    });

    return { root: resolvedRoot, output: stdout.trim() };
  },
};
