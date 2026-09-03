import * as path from 'path';
import * as ESLintPlugin from 'eslint-webpack-plugin';
import * as webpack from 'webpack';
import {fileURLToPath} from 'url';
import {ImportCssPlugin} from './node_tools/ImportCssPlugin.mjs';

const MINIMIZE = false;


class WebpackDonePlugin{
    apply(compiler){
        compiler.hooks.done.tap('compilation',  stats=> {
            setTimeout(async ()=>{
                if (stats.compilation.errors && stats.compilation.errors.length) {
                    console.error('compiled with errors');
                } else {
                    console.log(`compiled at ${new Date()}`);
                }
            },10);
        });
    }
}

export default async (env = {})=>{

    const entry = {};
    const output = {};

    entry['index'] = './src/index.ts';
    entry['editor'] = './src/editor/main.tsx';
    output.path = path.resolve('./out');

    output.filename = '[name].js';
    output.chunkFilename = "[name].chunk.js";

    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const config = {
        entry,
        output,
        target: ['web', 'es5'],
        mode: 'production', //debug ? 'development' : 'production',
        //devtool: 'inline-source-map',
        resolveLoader: {
            modules: ['node_modules', path.resolve(__dirname, 'node_tools/loaders')]
        },
        watchOptions: {
            aggregateTimeout: 2000,
            ignored: ['**/out/', '/node_modules/'],
        },
        performance: {
            maxEntrypointSize: 1024000,
            maxAssetSize: 1024000
        },
        module: {
            rules: [
                {
                    test: /\.txt/,
                    use: [
                        {loader: "txt/txt-loader",options: {}},
                    ]
                },
                {
                    test: /\.tsx$/,
                    enforce: 'pre',
                    use: [
                        {
                            loader: "ts-engine-precompiler/tsx-precompiler.mjs"
                        },
                    ]
                },
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: "ts-loader",options: {},
                        },
                    ]
                },
            ]
        },
        resolve: {
            extensions: ['.ts','.tsx','.js'],
            modules: [
                path.resolve(__dirname, 'node_modules'),
            ],
            alias: {
                '@engine': path.resolve(__dirname, 'engine'),
            },
        },
        optimization: {
            minimize: MINIMIZE,
            emitOnErrors: false,
        },
    };

    config.plugins = [
        new webpack.default.DefinePlugin({
            BUILD_ID: webpack.default.DefinePlugin.runtimeValue(() => new Date().getTime()),
        }),
        new ESLintPlugin.default({
            context: '../',
            emitError: true,
            emitWarning: true,
            failOnError: true,
            extensions: ["ts", "tsx"],
        }),
        new ImportCssPlugin({output: 'all.css'}),
        new WebpackDonePlugin(),
    ];

    return config;
}
