import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { serveCommand } from "./cmd/server";
import { runCommand } from "./cmd/run";

yargs(hideBin(process.argv))
  .command(serveCommand)
  .command(runCommand)
  .demandCommand()
  .help()
  .parse();