import { existsSync } from 'fs';
import { join } from 'path';

import { type BuilderParams, type PackageManagerCommands } from './types';
import { run, setEnv } from './utils';

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
		electronBuilder: 'yarn',
		script: 'yarn run',
	},
};

export default function builder({
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
		packageManagerCommands[packageManager.toUpperCase()];

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
			if (mac.arch !== undefined) {
				archs.push(...mac.arch);
			}

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

	const publishFlag: string | null = release ? '--publish always' : null;

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
