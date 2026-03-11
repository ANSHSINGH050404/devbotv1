import path from "path";

export function resolveWithinRoot(root: string, targetPath: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, targetPath);
  const rel = path.relative(resolvedRoot, resolvedPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("path is outside allowed root");
  }
  return { resolvedRoot, resolvedPath };
}
