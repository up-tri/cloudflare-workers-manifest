import fs, { readFileSync } from "fs";
import path from "path";
import arg from "arg";
import { execSync } from "child_process";
import TOML from "@iarna/toml";
import dotenv from "dotenv";
import chalk from "chalk";

import { overwrite } from "./overwrite";

dotenv.config();

const PROJECT_DIR = process.cwd();
const MANIFESTS_DIR = path.join(PROJECT_DIR, "manifests");

const FILES = {
  wrangler_setting: "wrangler.toml",
};

function showHelp() {
  const help = `
  usage:
    yarn deploy --name <worker name>

  options:
    --help,-h : show command help
    --name,-n : pass the worker name
  `;
  console.log(help);
}

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      "--name": String,
      "--help": Boolean,
      "-n": "--name",
      "-h": "--help",
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  return {
    name: args["--name"] || null,
    help: args["--help"] || false,
  };
}

export function cli(args) {
  const options = parseArgumentsIntoOptions(args);
  if (options.help) {
    showHelp();
    return;
  }

  const workerName = options.name;
  const token = process.env.CLOUDFLAER_API_TOKEN;

  // check worker name
  if (!workerName) {
    console.log(chalk.bold.red(`receive invalid worker name`));
    return process.exit(1);
  }

  // check token
  if (token === null) {
    console.log(chalk.bold.red(`receive invalid token`));
    return process.exit(1);
  }

  const workerDir = path.join(MANIFESTS_DIR, workerName);

  // existance check
  if (!fs.existsSync(workerDir)) {
    console.log(chalk.bold.red(`worker does not exist: ${workerName}`));
    return process.exit(1);
  }

  const settingPath = path.join(workerDir, FILES.wrangler_setting);
  const setting = TOML.parse(readFileSync(settingPath));

  // deploy worker
  // const deployCommand = `npm install && CLOUDFLARE_API_TOKEN=${token} npx -y wrangler@2 publish ./dist/worker.js`;
  const deployCommand = `CLOUDFLARE_API_TOKEN=${token} npm run deploy`;
  execSync(deployCommand, { cwd: workerDir });

  // revert wrangler.toml
  overwrite(settingPath, () => {
    return TOML.stringify(setting);
  });

  return process.exit(0);
}
