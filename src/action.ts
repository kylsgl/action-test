import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { type BuilderParams, type PackageManagerCommands } from './types';
import { getInput, getPlatform, run, setEnv } from './utils';

const packageManagerCommands: Record<
	string,
	PackageManagerCommands | undefined
> = {
	NPM: {
		electronBuilder: 'npx --no-install',
		script: 'npm run',
	},
	PNPM: {
		electronBuilder: 'pnpm',
		script: 'pnpm run',
	},
	YARN: {
		electronBuilder: 'yarn run',
		script: 'yarn run',
	},
};

function builder({
	args = '',
	buildScriptName,
	githubToken,
	mac = {},
	packageManager = 'NPM',
	packageRoot = '.',
	platform,
	release = false,
	windows = {},
}: BuilderParams): void {
	setEnv('GH_TOKEN', githubToken);

	const commands = packageManagerCommands[packageManager];

	if (commands === undefined) {
		throw new Error(`${packageManager} is not supported`);
	}

	const packageJSONPath: string = join(packageRoot, 'package.json');

	/**
	 * Check if "package.json" exists
	 */
	if (!existsSync(packageJSONPath)) {
		throw new Error('package.json not found');
	}

	/**
	 * Run build script if provided
	 */
	if (buildScriptName !== undefined) {
		run([commands.script, buildScriptName], packageRoot);
	}

	/**
	 * Set signing certificate and password
	 */
	switch (platform) {
		case 'mac': {
			setEnv('CSC_LINK', mac.cert);

			setEnv('CSC_KEY_PASSWORD', mac.password);

			break;
		}
		case 'windows': {
			setEnv('CSC_LINK', windows.cert);

			setEnv('CSC_KEY_PASSWORD', windows.password);

			break;
		}
		default: {
			break;
		}
	}

	run(
		[
			commands.electronBuilder,
			'electron-builder',
			`--${platform}`,
			release ? '--publish always' : '',
			args,
		],
		packageRoot,
	);
}

function main(): void {
	try {
		const githubToken: string | undefined = getInput('github_token');

		if (githubToken === undefined) {
			throw new Error('Github Token not found');
		}

		builder({
			args: getInput('args'),
			buildScriptName: getInput('build_script_name'),
			githubToken,
			mac: {
				cert: getInput('mac_certs'),
				password: getInput('mac_certs_password'),
			},
			packageManager: getInput('package_manager'),
			packageRoot: getInput('package_root'),
			platform: getPlatform(),
			release: getInput('release') === 'true',
			windows: {
				cert: getInput('windows_certs'),
				password: getInput('windows_certs_password'),
			},
		});
	} catch (error: unknown) {
		console.error(error);

		process.exit(1);
	}
}

main();
