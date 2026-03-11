import { execFile } from "child_process";
import { promisify } from "util";
import { resolveWithinRoot } from "../utils/fs-path";

const execFileAsync = promisify(execFile);

export const gitBranchTool = {
  name: "git_branch",
  description: "Get git branches and current branch",

  async execute({
    root = process.cwd(),
  }: {
    root?: string;
  }) {
    const { resolvedRoot } = resolveWithinRoot(root, ".");
    const { stdout } = await execFileAsync("git", ["branch", "--list"], {
      cwd: resolvedRoot,
    });

    const lines = stdout.split(/\r?\n/).filter(Boolean);
    const branches = lines.map((line) => line.replace(/^\* /, "").trim());
    const current = lines.find((line) => line.startsWith("* "))?.replace(/^\* /, "").trim();

    return { root: resolvedRoot, current, branches };
  },
};
