// src/builder.ts
import { existsSync } from "node:fs";
import { join } from "node:path";

// src/utils.ts
import { execSync } from "node:child_process";
function getPlatform() {
  switch (process.platform) {
    case "darwin": {
      return "mac";
    }
    case "linux": {
      return "linux";
    }
    case "win32": {
      return "windows";
    }
    default: {
      return null;
    }
  }
}
function isValidString(str) {
  return typeof str === "string" && str.length > 0;
}
function getInput(name) {
  const input = process.env[`INPUT_${name.toUpperCase()}`];
  return isValidString(input) ? input : void 0;
}
function getInputMultiLine(name) {
  const input = getInput(name);
  const inputArr = [];
  if (input !== void 0) {
    input.split("\n").forEach((str) => {
      const cleanStr = str.trim();
      if (isValidString(cleanStr)) {
        inputArr.push(cleanStr);
      }
    });
  }
  return inputArr;
}
function setEnv(name, value) {
  const cleanValue = value?.toString().trim();
  if (!isValidString(cleanValue)) {
    return;
  }
  process.env[name.toUpperCase()] = cleanValue;
}
function run(command, cwd) {
  const commandStr = Array.isArray(command) ? command.filter(isValidString).join(" ") : command;
  execSync(commandStr, {
    encoding: "utf8",
    stdio: "inherit",
    cwd
  });
}

// src/builder.ts
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
    electronBuilder: "yarn",
    script: "yarn run"
  }
};
function builder({
  args = "",
  configPath,
  githubToken,
  linux,
  mac,
  packageManager = "NPM",
  packageRoot = ".",
  platform,
  publish = false,
  scriptBeforeBuild,
  windows
}) {
  const commands = packageManagerCommands[packageManager.toUpperCase()];
  if (commands === void 0) {
    throw new Error(`${packageManager} is not supported`);
  }
  if (!existsSync(join(packageRoot, "package.json"))) {
    throw new Error("package.json not found");
  }
  if (scriptBeforeBuild !== void 0) {
    run([commands.script, scriptBeforeBuild], packageRoot);
  }
  const archs = [];
  if (platform === "linux" && linux.arch !== void 0) {
    archs.push(...linux.arch);
  }
  if (platform === "mac" && mac.arch !== void 0) {
    archs.push(...mac.arch);
  }
  if (platform === "windows" && windows.arch !== void 0) {
    archs.push(...windows.arch);
  }
  setEnv("GH_TOKEN", githubToken);
  const configFlag = configPath === void 0 ? void 0 : `--config ${configPath}`;
  const platformFlag = `--${platform}`;
  const publishFlag = `--publish ${publish ? "always" : "never"}`;
  if (archs.length > 0) {
    archs.forEach((arch) => {
      run(
        [
          commands.electronBuilder,
          "electron-builder",
          platformFlag,
          `--${arch}`,
          publishFlag,
          configFlag,
          args
        ],
        packageRoot
      );
    });
    return;
  }
  run(
    [
      commands.electronBuilder,
      "electron-builder",
      platformFlag,
      publishFlag,
      configFlag,
      args
    ],
    packageRoot
  );
}

// src/index.ts
function main() {
  const githubToken = getInput("github_token");
  if (githubToken === void 0) {
    throw new Error("Github Token not found");
  }
  const platform = getPlatform();
  if (platform === null) {
    throw new Error(`Platform ${process.platform} is not supported`);
  }
  builder({
    args: getInput("args"),
    configPath: getInput("config_path"),
    githubToken,
    linux: {
      arch: getInputMultiLine("linux_arch")
    },
    mac: {
      arch: getInputMultiLine("mac_arch")
    },
    packageManager: getInput("package_manager"),
    packageRoot: getInput("package_root"),
    platform,
    publish: getInput("publish") === "true",
    scriptBeforeBuild: getInput("script_before_build"),
    windows: {
      arch: getInputMultiLine("windows_arch")
    }
  });
}
main();
