import builder from './builder';
import { type Platform } from './types';
import { getInput, getInputMultiLine, getPlatform } from './utils';

function main(): void {
	const githubToken: string | undefined = getInput('github_token');

	if (githubToken === undefined) {
		throw new Error('Github Token not found');
	}

	const platform: Platform | null = getPlatform();

	if (platform === null) {
		throw new Error(`Platform ${process.platform} is not supported`);
	}

	builder({
		args: getInput('args'),
		configPath: getInput('config_path'),
		githubToken,
		linux: {
			arch: getInputMultiLine('linux_arch'),
		},
		mac: {
			arch: getInputMultiLine('mac_arch'),
		},
		packageManager: getInput('package_manager'),
		packageRoot: getInput('package_root'),
		platform,
		publish: getInput('publish') === 'true',
		scriptBeforeBuild: getInput('script_before_build'),
		windows: {
			arch: getInputMultiLine('windows_arch'),
		},
	});
}

main();
