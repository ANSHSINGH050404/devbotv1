import fs from "fs";
import path from "path";
import { createProjectInstance } from "./instance";

export function bootstrapProject() {
  const cwd = process.cwd();
console.log(cwd);

  const instance = createProjectInstance(cwd);
 console.log(instance);
 
  const gitPath = path.join(cwd, ".git");
  console.log(gitPath);
  

  if (fs.existsSync(gitPath)) {
    instance.isGitRepo = true;
  }

  return instance;
}