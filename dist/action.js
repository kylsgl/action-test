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
function isValidString(str) {
  return str != null && str.length > 0;
}
function getInput(name) {
  return process.env[`INPUT_${name.toUpperCase()}`];
}
function getMultiLineInput(name) {
  const input = getInput(name);
  const inputArr = [];
  if (input !== void 0) {
    input.split(/[\r\n]/).forEach((str) => {
      const cleanStr = str.trim();
      if (isValidString(cleanStr)) {
        inputArr.push(cleanStr);
      }
    });
  }
  return inputArr;
}
function setEnv(name, value) {
  if (value == null) {
    return;
  }
  process.env[name.toUpperCase()] = value.toString();
}
function run(command, cwd) {
  const commandStr = Array.isArray(command) ? command.filter(isValidString).join(" ") : command;
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
  linux,
  mac,
  packageManager = "NPM",
  packageRoot = ".",
  platform,
  release = false,
  windows
}) {
  const commands = packageManagerCommands[packageManager];
  if (commands === void 0) {
    throw new Error(`${packageManager} is not supported`);
  }
  if (!existsSync(join(packageRoot, "package.json"))) {
    throw new Error("package.json not found");
  }
  if (buildScriptName !== void 0) {
    run([commands.script, buildScriptName], packageRoot);
  }
  const archs = [];
  switch (platform) {
    case "linux": {
      if (linux.arch !== void 0) {
        archs.push(...linux.arch);
      }
      break;
    }
    case "mac": {
      setEnv("CSC_LINK", mac.cert);
      setEnv("CSC_KEY_PASSWORD", mac.password);
      break;
    }
    case "windows": {
      if (windows.arch !== void 0) {
        archs.push(...windows.arch);
      }
      setEnv("WIN_CSC_LINK", windows.cert);
      setEnv("WIN_CSC_KEY_PASSWORD", windows.password);
      break;
    }
    default: {
      break;
    }
  }
  setEnv("GH_TOKEN", githubToken);
  const platformFlag = `--${platform}`;
  const publishFlag = release ? "--publish always" : "";
  if (archs.length > 0) {
    archs.forEach((arch) => {
      run(
        [
          commands.electronBuilder,
          "electron-builder",
          platformFlag,
          `--${arch}`,
          publishFlag,
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
      linux: {
        arch: getMultiLineInput("linux_arch")
      },
      mac: {
        cert: getInput("mac_certs"),
        password: getInput("mac_certs_password")
      },
      packageManager: getInput("package_manager"),
      packageRoot: getInput("package_root"),
      platform: getPlatform(),
      release: getInput("release") === "true",
      windows: {
        arch: getMultiLineInput("windows_arch"),
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
