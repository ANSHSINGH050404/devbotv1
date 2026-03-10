import path from "path";

export interface ProjectInstance {
  root: string;
  cwd: string;
  name: string;
  isGitRepo: boolean;
}

export function createProjectInstance(cwd: string): ProjectInstance {
  const root = cwd;
  console.log(root);
  

  const name = path.basename(root);
  console.log(name);
  

  return {
    root,
    cwd,
    name,
    isGitRepo: false,
  };
}