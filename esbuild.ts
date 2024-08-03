import { build, type BuildOptions } from 'esbuild';

const opts: BuildOptions = {
	bundle: true,
	drop: ['debugger'],
	entryPoints: ['./src/action.ts'],
	format: 'esm',
	legalComments: 'none',
	minify: false,
	outdir: 'dist',
	packages: 'external',
	platform: 'node',
	supported: {
		'node-colon-prefix-import': true,
	},
	target: ['es2023', 'node20'],
	treeShaking: true,
};

await build(opts);
