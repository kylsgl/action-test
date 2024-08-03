export type Platform = 'linux' | 'mac' | 'windows';

export interface BuilderParams {
	args?: string;
	buildScriptName?: string;
	githubToken: string;
	mac: {
		cert?: string;
		password?: string;
	};
	packageManager?: string;
	packageRoot?: string;
	platform: Platform;
	release?: boolean;
	windows: {
		cert?: string;
		password?: string;
	};
}

export interface PackageManagerCommands {
	electronBuilder: string;
	script: string;
}
