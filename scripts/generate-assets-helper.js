// @ts-nocheck
const chokidar = require('chokidar');
const { Project } = require('ts-morph');
const walkdir = require('walkdir');

const project = new Project({ tsConfigFilePath: './tsconfig.json' });

const writeAssets = () => {
	const assetsFile = project.createSourceFile('src/Assets.ts', '', { overwrite: true });
	assetsFile.replaceWithText((writer) => {
		writer.writeLine('export class Assets {');
		const entries = [];
		walkdir.sync('public/assets', (path, stat) => {
			if (stat.isFile()) {
				let name = path.split('/').pop().split('.')[0].toUpperCase();
				if (name.charAt(1) === 'K') {
					const def = name.substr(0, 2);
					name = name.substr(3) + '_' + def;
				}
				const relativePath = path.substr(path.indexOf('assets/') + 7);
				writer.writeLine('\tstatic ' + name + " = '" + relativePath + "'");
				entries.push([name, relativePath]);
			}
		});
		writer.writeLine('static byName = new Map<string, string>(' + JSON.stringify(entries) + ');');
		writer.writeLine('}');
		console.log('updated Assets' + writer.toString());
	});
	assetsFile.save();
};
const watcher = chokidar.watch('public/assets', {
	persistent: true,
});

const watched = ['change', 'add', 'unlink'];

watcher.on('ready', () => {
	writeAssets();
	console.log('watching changes...');
	watcher.on('all', (event, path) => {
		console.log('**detected ' + event + ' on ' + path);
		if (watched.includes(event)) {
			console.log('detected ' + event + ' on ' + path);
			writeAssets();
		}
	});
});

const shutdown = () => {
	console.log('exiting...');
	watcher.close();
	process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
