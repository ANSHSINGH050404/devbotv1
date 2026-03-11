import { execFile } from "child_process";
import { promisify } from "util";
import { resolveWithinRoot } from "../utils/fs-path";

const execFileAsync = promisify(execFile);

export const gitDiffTool = {
  name: "git_diff",
  description: "Get git diff for a repository",

  async execute({
    root = process.cwd(),
    staged = false,
    pathspec,
  }: {
    root?: string;
    staged?: boolean;
    pathspec?: string;
  }) {
    const { resolvedRoot } = resolveWithinRoot(root, ".");
    const args = ["diff"];
    if (staged) {
      args.push("--staged");
    }
    if (pathspec) {
      args.push("--", pathspec);
    }

    const { stdout } = await execFileAsync("git", args, {
      cwd: resolvedRoot,
    });

    return { root: resolvedRoot, diff: stdout };
  },
};
