import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const packageManagerInstallCommand: Record<string, string | undefined> = {
	NPM: 'npx --no-install',
	PNPM: 'pnpm',
	YARN: 'yarn run',
};

/**
 * Logs to the console
 */
const log = (msg: unknown): void => {
	// eslint-disable-next-line no-console
	console.log('\n', msg);
};

/**
 * Exits the current process with an error code and message
 */
const exit = (msg: string): void => {
	console.error(msg);
	process.exit(1);
};

/**
 * Executes the provided shell command and redirects stdout/stderr to the console
 */
const run = (cmd: string, cwd: URL | string | undefined): string =>
	execSync(cmd, { encoding: 'utf8', stdio: 'inherit', cwd });

/**
 * Determines the current operating system (one of ["mac", "windows", "linux"])
 */
const getPlatform = (): 'linux' | 'mac' | 'windows' => {
	switch (process.platform) {
		case 'darwin':
			return 'mac';
		case 'win32':
			return 'windows';
		default:
			return 'linux';
	}
};

/**
 * Returns the value for an environment variable (or `null` if it's not defined)
 */
const getEnv = (name: string): string | null =>
	process.env[name.toUpperCase()] ?? null;

/**
 * Sets the specified env variable if the value isn't empty
 */
const setEnv = (
	name: string,
	value: bigint | boolean | number | string | null | undefined,
): void => {
	if (value != null) {
		process.env[name.toUpperCase()] = value.toString();
	}
};

/**
 * Returns the value for an input variable (or `null` if it's not defined). If the variable is
 * required and doesn't have a value, abort the action
 */
const getInput = (name: string, required?: boolean): string | null => {
	const value = getEnv(`INPUT_${name}`);
	if (required === true && value === null) {
		exit(`"${name}" input variable is not defined`);
	}
	return value;
};

/**
 * Installs NPM dependencies and builds/releases the Electron app
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const runAction = (): void => {
	const platform = getPlatform();
	const release = getInput('release', true) === 'true';
	const pkgRoot = getInput('package_root', true);
	const pkgManager = getInput('package_manager')?.toUpperCase() ?? 'NPM';
	const buildScriptName = getInput('build_script_name', true);
	const skipBuild = getInput('skip_build') === 'true';
	const useVueCli = getInput('use_vue_cli') === 'true';
	const args = getInput('args') ?? '';
	const maxAttempts = Number(getInput('max_attempts') ?? '1');

	if (pkgRoot === null) {
		exit('pkgRoot not found');

		return;
	}

	const pkgJsonPath = join(pkgRoot, 'package.json');
	const pkgLockPath = join(pkgRoot, 'package-lock.json');

	// Determine whether NPM should be used to run commands (instead of Yarn, which is the default)
	const useNpm = existsSync(pkgLockPath);
	log(`Will run ${useNpm ? 'NPM' : 'Yarn'} commands in directory "${pkgRoot}"`);

	// Make sure `package.json` file exists
	if (!existsSync(pkgJsonPath)) {
		exit(`\`package.json\` file not found at path "${pkgJsonPath}"`);
	}

	// Copy "github_token" input variable to "GH_TOKEN" env variable (required by `electron-builder`)
	setEnv('GH_TOKEN', getInput('github_token', true));

	// Require code signing certificate and password if building for macOS. Export them to environment
	// variables (required by `electron-builder`)
	if (platform === 'mac') {
		setEnv('CSC_LINK', getInput('mac_certs'));
		setEnv('CSC_KEY_PASSWORD', getInput('mac_certs_password'));
	} else if (platform === 'windows') {
		setEnv('CSC_LINK', getInput('windows_certs'));
		setEnv('CSC_KEY_PASSWORD', getInput('windows_certs_password'));
	}

	// Disable console advertisements during install phase
	// setEnv('ADBLOCK', true);

	// log(`Installing dependencies using ${useNpm ? 'NPM' : 'Yarn'}…`);
	// run(useNpm ? 'npm install' : 'yarn', pkgRoot);

	// Run NPM build script if it exists
	if (skipBuild) {
		log('Skipping build script because `skip_build` option is set');
	} else if (buildScriptName !== null) {
		log('Running the build script…');

		run(`npm run ${buildScriptName} --if-present`, pkgRoot);

		// if (useNpm) {
		// 	run(`npm run ${buildScriptName} --if-present`, pkgRoot);
		// } else {
		// 	// TODO: Use `yarn run ${buildScriptName} --if-present` once supported
		// 	// https://github.com/yarnpkg/yarn/issues/6894
		// 	const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
		// 	if (pkgJson.scripts?.[buildScriptName]) {
		// 		run(`yarn run ${buildScriptName}`, pkgRoot);
		// 	}
		// }
	}

	const pckCommand = packageManagerInstallCommand[pkgManager];

	if (pckCommand === undefined) {
		exit('PKACKAGE MANAGERN OT FOUND');

		return;
	}

	log(`Building${release ? ' and releasing' : ''} the Electron app…`);
	const cmd = useVueCli ? 'vue-cli-service electron:build' : 'electron-builder';
	for (let i = 0; i < maxAttempts; i += 1) {
		try {
			// run(
			// 	`${useNpm ? 'npx --no-install' : 'yarn run'} ${cmd} --${platform} ${
			// 		release ? '--publish always' : ''
			// 	} ${args}`,
			// 	pkgRoot,
			// );
			run(
				`${pckCommand} ${cmd} --${platform} ${
					release ? '--publish always' : ''
				} ${args}`,
				pkgRoot,
			);

			break;
		} catch (err: unknown) {
			if (i < maxAttempts - 1) {
				log(`Attempt ${i + 1} failed:`);
				log(err);
			} else {
				throw err;
			}
		}
	}
};

runAction();
