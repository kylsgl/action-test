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

export function isValidString(str: string | null | undefined): boolean {
	return str != null && str.length > 0;
}

export function getInput(name: string): string | undefined {
	return process.env[`INPUT_${name.toUpperCase()}`];
}

export function getMultiLineInput(name: string): string[] {
	const input: string | undefined = getInput(name);

	const inputArr: string[] = [];

	if (input !== undefined) {
		input.split(/[\r\n]/).forEach((str: string): void => {
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
		? command.filter(isValidString).join(' ')
		: command;

	execSync(commandStr, {
		encoding: 'utf8',
		stdio: 'inherit',
		cwd,
	});
}
