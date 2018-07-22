const { join } = require('path');
const webpack = require('webpack');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const root = join(__dirname, '..');
const DashboardPlugin = require('webpack-dashboard/plugin');
module.exports = production => {
	 // base plugins array
	const plugins = [
		!production && new FriendlyErrorsWebpackPlugin(),
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development')
		})
	];

	if (production) {
		plugins.push(
			new MinifyPlugin(),
			new webpack.LoaderOptionsPlugin({ minimize: true }),
			new webpack.optimize.ModuleConcatenationPlugin()

		);
	} else {
		// dev only
		plugins.push(
			//		new webpack.HotModuleReplacementPlugin(),
			new webpack.NamedModulesPlugin(),
			new DashboardPlugin()
		);
	}

	return plugins.filter(x => !!x);
};
