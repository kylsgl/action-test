export type Platform = 'linux' | 'mac' | 'windows';

export interface BuilderParams {
	args?: string;
	configPath?: string;
	githubToken: string;
	linux: {
		arch?: string[];
	};
	mac: {
		arch?: string[];
	};
	packageManager?: string;
	packageRoot?: string;
	platform: Platform;
	publish?: boolean;
	scriptBeforeBuild?: string;
	windows: {
		arch?: string[];
	};
}

export interface PackageManagerCommands {
	electronBuilder: string;
	script: string;
}
