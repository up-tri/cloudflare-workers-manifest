import fs from "fs";
import path from "path";
import arg from "arg";
import { execSync } from "child_process";
import TOML from "@iarna/toml";

import { now } from "./timestamp";
import { overwrite } from "./overwrite";
import chalk from "chalk";

const DEFAULT_WORKER_NAME = `worker_${now.format("YYYYMMDD-HHmmss")}`;
const PROJECT_DIR = process.cwd();
const MANIFESTS_DIR = path.join(PROJECT_DIR, "manifests");

const WORKER_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/;

const FILES = {
  wrangler_setting: "wrangler.toml",
  package_json: "package.json",
  readme: "README.md",
  deletions: ["LICENSE_APACHE", "LICENSE_MIT"],
};

function showHelp() {
  const help = `
  usage:
    yarn generate --name <worker name>

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
    name: args["--name"] || DEFAULT_WORKER_NAME,
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

  // worker name validation
  if (!WORKER_NAME_REGEX.test(workerName)) {
    console.log(chalk.bold.red(`invalid worker name: ${workerName}`));
    return process.exit(1);
  }

  const workerDir = path.join(MANIFESTS_DIR, workerName);

  // existance check
  if (fs.existsSync(workerDir)) {
    console.log(chalk.bold.red(`worker already exists: ${workerName}`));
    return process.exit(1);
  }

  // generate by template
  const generateCommand = `yarn create cloudflare ${workerName} worker-typescript && rm -rf  ${workerName}/.git`;
  execSync(generateCommand, { cwd: MANIFESTS_DIR });

  // update wrangler.toml
  overwrite(path.join(workerDir, FILES.wrangler_setting), (content) => {
    const setting = TOML.parse(content);
    setting.name = workerName;
    return TOML.stringify(setting);
  });

  // update package.json
  overwrite(path.join(workerDir, FILES.package_json), (content) => {
    const info = JSON.parse(content);
    const newInfo = {
      ...info,
      name: workerName,
      license: "UNLICENSED",
      private: true,
    };
    return JSON.stringify(newInfo, {}, 2);
  });

  // remove unused files
  for (const filename of FILES.deletions) {
    const filepath = path.join(workerDir, filename);
    fs.existsSync(filepath) && fs.unlinkSync(filepath);
  }

  // update README.md
  overwrite(path.join(workerDir, FILES.readme), () => `# ${workerName}\n`);

  // install modules on project-root
  const installCommand = `yarn`;
  execSync(installCommand, { cwd: workerDir });

  return process.exit(0);
}
