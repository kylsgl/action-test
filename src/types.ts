export type Platform = 'linux' | 'mac' | 'windows';

export interface BuilderParams {
	args?: string;
	buildScriptName?: string;
	githubToken: string;
	linux: {
		arch?: string[];
	};
	mac: {
		arch?: string[];
		cert?: string;
		password?: string;
	};
	packageManager?: string;
	packageRoot?: string;
	platform: Platform;
	release?: boolean;
	windows: {
		arch?: string[];
		cert?: string;
		password?: string;
	};
}

export interface PackageManagerCommands {
	electronBuilder: string;
	script: string;
}
