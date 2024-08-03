// src/action.ts
import { existsSync } from "node:fs";
import { join } from "node:path";

// src/utils.ts
import { execSync } from "child_process";
function getPlatform() {
  switch (process.platform) {
    case "darwin": {
      return "mac";
    }
    case "win32": {
      return "windows";
    }
    default: {
      return "linux";
    }
  }
}
function getInput(name) {
  return process.env[`INPUT_${name.toUpperCase()}`];
}
function setEnv(name, value) {
  if (value == null) {
    return;
  }
  process.env[name.toUpperCase()] = value.toString();
}
function run(command, cwd) {
  const commandStr = Array.isArray(command) ? command.filter((str) => str.length > 0).join(" ") : command;
  execSync(commandStr, {
    encoding: "utf8",
    stdio: "inherit",
    cwd
  });
}

// src/action.ts
var packageManagerCommands = {
  NPM: {
    electronBuilder: "npx --no-install",
    script: "npm run"
  },
  PNPM: {
    electronBuilder: "pnpm",
    script: "pnpm run"
  },
  YARN: {
    electronBuilder: "yarn run",
    script: "yarn run"
  }
};
function builder({
  args = "",
  buildScriptName,
  githubToken,
  mac = {},
  packageManager = "NPM",
  packageRoot = ".",
  platform,
  release = false,
  windows = {}
}) {
  setEnv("GH_TOKEN", githubToken);
  const commands = packageManagerCommands[packageManager];
  if (commands === void 0) {
    throw new Error(`${packageManager} is not supported`);
  }
  const packageJSONPath = join(packageRoot, "package.json");
  if (!existsSync(packageJSONPath)) {
    throw new Error("package.json not found");
  }
  if (buildScriptName !== void 0) {
    run([commands.script, buildScriptName], packageRoot);
  }
  switch (platform) {
    case "mac": {
      setEnv("CSC_LINK", mac.cert);
      setEnv("CSC_KEY_PASSWORD", mac.password);
      break;
    }
    case "windows": {
      setEnv("CSC_LINK", windows.cert);
      setEnv("CSC_KEY_PASSWORD", windows.password);
      break;
    }
    default: {
      break;
    }
  }
  run(
    [
      commands.electronBuilder,
      "electron-builder",
      `--${platform}`,
      release ? "--publish always" : "",
      args
    ],
    packageRoot
  );
}
function main() {
  try {
    const githubToken = getInput("github_token");
    if (githubToken === void 0) {
      throw new Error("Github Token not found");
    }
    builder({
      args: getInput("args"),
      buildScriptName: getInput("build_script_name"),
      githubToken,
      mac: {
        cert: getInput("mac_certs"),
        password: getInput("mac_certs_password")
      },
      packageManager: getInput("package_manager"),
      packageRoot: getInput("package_root"),
      platform: getPlatform(),
      release: getInput("release") === "true",
      windows: {
        cert: getInput("windows_certs"),
        password: getInput("windows_certs_password")
      }
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
main();
