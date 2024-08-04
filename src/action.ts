import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { type BuilderParams, type PackageManagerCommands } from './types';
import { getInput, getMultiLineInput, getPlatform, run, setEnv } from './utils';

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
	linux,
	mac,
	packageManager = 'NPM',
	packageRoot = '.',
	platform,
	release = false,
	windows,
}: BuilderParams): void {
	const commands: PackageManagerCommands | undefined =
		packageManagerCommands[packageManager];

	if (commands === undefined) {
		throw new Error(`${packageManager} is not supported`);
	}

	/**
	 * Check if "package.json" exists
	 */
	if (!existsSync(join(packageRoot, 'package.json'))) {
		throw new Error('package.json not found');
	}

	/**
	 * Run build script if provided
	 */
	if (buildScriptName !== undefined) {
		run([commands.script, buildScriptName], packageRoot);
	}

	const archs: string[] = [];

	/**
	 * Set signing certificate and password
	 */
	switch (platform) {
		case 'linux': {
			if (linux.arch !== undefined) {
				archs.push(...linux.arch);
			}

			break;
		}
		case 'mac': {
			setEnv('CSC_LINK', mac.cert);

			setEnv('CSC_KEY_PASSWORD', mac.password);

			break;
		}
		case 'windows': {
			if (windows.arch !== undefined) {
				archs.push(...windows.arch);
			}

			setEnv('WIN_CSC_LINK', windows.cert);

			setEnv('WIN_CSC_KEY_PASSWORD', windows.password);

			break;
		}
		default: {
			break;
		}
	}

	setEnv('GH_TOKEN', githubToken);

	const platformFlag = `--${platform}`;

	const publishFlag: string = release ? '--publish always' : '';

	if (archs.length > 0) {
		/**
		 * Separate build for each arch
		 */
		archs.forEach((arch: string): void => {
			run(
				[
					commands.electronBuilder,
					'electron-builder',
					platformFlag,
					`--${arch}`,
					publishFlag,
					args,
				],
				packageRoot,
			);
		});

		return;
	}

	run(
		[
			commands.electronBuilder,
			'electron-builder',
			platformFlag,
			publishFlag,
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
			linux: {
				arch: getMultiLineInput('linux_arch'),
			},
			mac: {
				cert: getInput('mac_certs'),
				password: getInput('mac_certs_password'),
			},
			packageManager: getInput('package_manager'),
			packageRoot: getInput('package_root'),
			platform: getPlatform(),
			release: getInput('release') === 'true',
			windows: {
				arch: getMultiLineInput('windows_arch'),
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
