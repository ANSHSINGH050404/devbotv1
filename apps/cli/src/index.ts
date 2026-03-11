import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { serveCommand } from "./cmd/server";
import { runCommand } from "./cmd/run";
import { tuiCommand } from "./cmd/tui";

yargs(hideBin(process.argv))
  .command(serveCommand)
  .command(runCommand)
  .command(tuiCommand)
  .demandCommand()
  .help()
  .parse();
