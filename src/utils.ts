import { execSync } from 'child_process';

import { type Platform } from './types';

export function getPlatform(): Platform {
	switch (process.platform) {
		case 'darwin': {
			return 'mac';
		}
		case 'win32': {
			return 'windows';
		}
		default: {
			return 'linux';
		}
	}
}

export function getInput(name: string): string | undefined {
	return process.env[`INPUT_${name.toUpperCase()}`];
}

export function setEnv(
	name: string,
	value: bigint | boolean | number | string | null | undefined,
): void {
	if (value == null) {
		return;
	}

	process.env[name.toUpperCase()] = value.toString();
}

export function run(
	command: string[] | string,
	cwd: URL | string | undefined,
): void {
	const commandStr: string = Array.isArray(command)
		? command.filter((str: string): boolean => str.length > 0).join(' ')
		: command;

	execSync(commandStr, {
		encoding: 'utf8',
		stdio: 'inherit',
		cwd,
	});
}
