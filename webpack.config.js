const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const copyWebpackPlugin = require('copy-webpack-plugin');
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
	entry: path.resolve(appDirectory, 'src/game.ts'), //path to the main .ts file
	output: {
		filename: 'js/[name].bundle.js', //name for the js file that is created/compiled in memory
		path: path.resolve(__dirname, 'dist'),
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	devtool: 'source-map',
	devServer: {
		host: '0.0.0.0',
		port: 8080, //port that we're using for local host (localhost:8080)
		disableHostCheck: true,
		contentBase: path.resolve(appDirectory, 'public'), //tells webpack to serve from the public folder
		publicPath: '/',
		hot: true,
	},
	target: 'web',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.m?js/,
				resolve: {
					fullySpecified: false,
				},
			},
		],
	},
	optimization: {
		removeAvailableModules: false,
		removeEmptyChunks: false,
		splitChunks: {
			chunks: 'all',
			minSize: 20000,
			minRemainingSize: 0,
			minChunks: 1,
			maxAsyncRequests: 30,
			maxInitialRequests: 30,
			enforceSizeThreshold: 50000,
			cacheGroups: {
				defaultVendors: {
					test: /[\\/]node_modules[\\/]/,
					priority: -10,
					reuseExistingChunk: true,
				},
				default: {
					minChunks: 1,
					priority: -20,
					reuseExistingChunk: true,
				},
			},
		},
		minimize: false,
		moduleIds: 'named',
	},
	plugins: [
		new HtmlWebpackPlugin({
			inject: true,
			template: path.resolve(appDirectory, 'public/index.html'),
		}),
		new CleanWebpackPlugin(),
		new copyWebpackPlugin({
			patterns: ['electron/index.js', 'electron/preload.js', 'public/assets', {from:'public/gamedata', to:'gamedata'}],
		})
	],
	mode: 'development',
};
