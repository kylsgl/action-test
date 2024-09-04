import { execSync } from 'node:child_process';

import { type Platform } from './types';

export function getPlatform(): Platform | null {
	switch (process.platform) {
		case 'darwin': {
			return 'mac';
		}
		case 'linux': {
			return 'linux';
		}
		case 'win32': {
			return 'windows';
		}
		default: {
			return null;
		}
	}
}

export function isValidString(str: string | null | undefined): str is string {
	return typeof str === 'string' && str.length > 0;
}

export function getInput(name: string): string | undefined {
	const input: string | undefined = process.env[`INPUT_${name.toUpperCase()}`];

	return isValidString(input) ? input : undefined;
}

export function getInputMultiLine(name: string): string[] {
	const input: string | undefined = getInput(name);

	const inputArr: string[] = [];

	if (input !== undefined) {
		input.split('\n').forEach((str: string): void => {
			const cleanStr: string = str.trim();

			if (isValidString(cleanStr)) {
				inputArr.push(cleanStr);
			}
		});
	}

	return inputArr;
}

export function setEnv(
	name: string,
	value: bigint | boolean | number | string | null | undefined,
): void {
	const cleanValue: string | undefined = value?.toString().trim();

	if (!isValidString(cleanValue)) {
		return;
	}

	process.env[name.toUpperCase()] = cleanValue;
}

export function run(
	command: Array<string | null | undefined> | string,
	cwd?: URL | string,
): void {
	const commandStr: string = Array.isArray(command)
		? command.filter(isValidString).join(' ')
		: command;

	// eslint-disable-next-line sonarjs/os-command
	execSync(commandStr, {
		encoding: 'utf8',
		stdio: 'inherit',
		cwd,
	});
}
