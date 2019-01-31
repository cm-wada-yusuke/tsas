const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/tsas.ts',
    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },
    mode: "development",
    devtool: 'inline-source-map',
    externals: [nodeExternals()],
    output: {
        filename: 'index.js'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['ts-loader'],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: './src/assets'
            }
        ]),
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(require("./package.json").version),
            APP_NAME: JSON.stringify(require("./package.json").name)
        })
    ]
};
