import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { type BuilderParams, type PackageManagerCommands } from './types';
import { run } from './utils';

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
	configPath,
	linux,
	mac,
	packageManager = 'NPM',
	packageRoot = '.',
	platform,
	publish = false,
	scriptBeforeBuild,
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
	 * Run script before build if provided
	 */
	if (scriptBeforeBuild !== undefined) {
		run([commands.script, scriptBeforeBuild], packageRoot);
	}

	const archs: string[] = [];

	if (platform === 'linux' && linux.arch !== undefined) {
		archs.push(...linux.arch);
	}

	if (platform === 'mac' && mac.arch !== undefined) {
		archs.push(...mac.arch);
	}

	if (platform === 'windows' && windows.arch !== undefined) {
		archs.push(...windows.arch);
	}

	const configFlag: string | undefined =
		configPath === undefined ? undefined : `--config ${configPath}`;

	const platformFlag = `--${platform}`;

	const publishFlag = `--publish ${publish ? 'always' : 'never'}`;

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
					configFlag,
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
			configFlag,
			args,
		],
		packageRoot,
	);
}
