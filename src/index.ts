import builder from './builder';
import { getInput, getMultiLineInput, getPlatform } from './utils';

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
				cert: getInput('mac_cert'),
				password: getInput('mac_cert_password'),
			},
			packageManager: getInput('package_manager'),
			packageRoot: getInput('package_root'),
			platform: getPlatform(),
			release: getInput('release') === 'true',
			windows: {
				arch: getMultiLineInput('windows_arch'),
				cert: getInput('windows_cert'),
				password: getInput('windows_cert_password'),
			},
		});
	} catch (error: unknown) {
		console.error(error);

		process.exit(1);
	}
}

main();
