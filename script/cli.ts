#!/usr/bin/env node
import { Command } from "commander";

import {
  build,
  test,
  migrate,
  dev,
  server,
  lint,
  format,
  migrateStatus,
  seed,
} from "./cli-commands";









const AETHEX_LOGO = `\n\x1b[36m
 $$$$$$\  $$$$$$$$\ $$$$$$$$\ $$\   $$\ $$$$$$$$\ $$\   $$\ 
$$  __$$\ $$  _____|\__$$  __|$$ |  $$ |$$  _____|$$ |  $$ |
$$ /  $$ |$$ |         $$ |   $$ |  $$ |$$ |      \$$\ $$  |
$$$$$$$$ |$$$$$\       $$ |   $$$$$$$$ |$$$$$\     \$$$$  / 
$$  __$$ |$$  __|      $$ |   $$  __$$ |$$  __|    $$  $$<  
$$ |  $$ |$$ |         $$ |   $$ |  $$ |$$ |      $$  /\$$\ 
$$ |  $$ |$$$$$$$$\    $$ |   $$ |  $$ |$$$$$$$$\ $$ /  $$ |
\__|  \__|\________|   \__|   \__|  \__|\________|\__|  \__|
\x1b[0m\nAeThex-OS CLI\n`;

const program = new Command();
program
  .name("aethex")
  .description("AeThex-OS CLI: Modular Web Desktop Platform")
  .version("0.1.0")
  .addHelpText("beforeAll", AETHEX_LOGO);
import readline from "readline";
program
  .command("shell")
  .description("Launch interactive AeThex shell (REPL)")
  .action(() => {
    console.log(AETHEX_LOGO);
    console.log("Type any shell command. Type 'exit' to quit.\n");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "aethex> "
    });
    rl.prompt();
    rl.on("line", (line) => {
      if (line.trim() === "exit") {
        rl.close();
        return;
      }
      try {
        const result = require("child_process").execSync(line, { stdio: "inherit" });
      } catch (err) {
        console.error("Error executing command.");
      }
      rl.prompt();
    });
    rl.on("close", () => {
      console.log("Exiting AeThex shell.");
      process.exit(0);
    });
  });


program
  .command("build")
  .description("Build the client app using Vite")
  .action(build);


program
  .command("test")
  .description("Run implementation tests")
  .action(test);


program
  .command("migrate")
  .description("Run Drizzle migrations")
  .action(migrate);


program
  .command("dev")
  .description("Start Vite dev server for client")
  .action(dev);


program
  .command("server")
  .description("Start the server (index.ts)")
  .action(server);

program
  .command("lint")
  .description("Run linter on the codebase")
  .action(lint);

program
  .command("format")
  .description("Format codebase using Prettier or configured formatter")
  .action(format);

program
  .command("migrate-status")
  .description("Show Drizzle migration status")
  .action(migrateStatus);

program
  .command("seed")
  .description("Seed the database with initial data")
  .action(seed);

program.parse(process.argv);
