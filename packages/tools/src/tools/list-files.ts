import fs from "fs/promises"

export const listFilesTool = {
  name: "list_files",

  description: "List files in a directory",

  async execute({ path }: { path: string }) {
    const files = await fs.readdir(path)

    return {
      path,
      files,
    }
  },
}