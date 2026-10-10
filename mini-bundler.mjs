import * as esbuild from 'esbuild';
import {ImportCssPlugin} from './node_tools/plugins/transform/ImportCssPlugin.mts';
import {TsxIdTransformerPlugin} from './node_tools/plugins/transform/TsxIdTransformerPlugin.mts';
import {IndexHtmlPlugin} from './node_tools/plugins/post_transform/IndexHtmlPlugin.mts';
import {CustomTransformerPlugin} from "./node_tools/CustomTransformerPlugin.mts";
import {GlslTransformerPlugin} from "./node_tools/plugins/transform/GlslTransformerPlugin.mts";
import {DefinePlugin} from "./node_tools/plugins/post_transform/DefinePlugin.mts";
import {AssetsPlugin} from "./node_tools/plugins/post_transform/AssetsPlugin.mts";

const dev = process.argv.includes('--dev');



const ctx = await esbuild.context({
    entryPoints: ['src/index.ts','src/editor/main.tsx'],
    bundle: true,
    outdir: 'out',
    format: 'iife',
    sourcemap: !dev,
    keepNames: !dev,
    minify: !dev,
    plugins: [
        new CustomTransformerPlugin().
        transformers(
            new ImportCssPlugin({output: 'editor/all.css'}),
            new TsxIdTransformerPlugin(),
            new GlslTransformerPlugin({minify: !dev}),
        ).
        postTransformers(
            new IndexHtmlPlugin({
                files: ['src/editor/editor.html', 'src/test1/index.html'],
                variables: {
                    BUILD_ID: ()=>`${new Date().getTime()}`,
                }
            }),
            new DefinePlugin({
                BUILD_ID: ()=>`${new Date().getTime()}`,
            }),
            new AssetsPlugin([
                {from: 'src/test1/assets', to: 'test1/assets'},
                {from: 'src/test2/assets', to: 'test2/assets'},
            ])
        ).
        createPluginContext()
    ]
});

if (dev) {
    await ctx.watch();
    console.log('Watcher запущено. Очікування змін у файлах...');
}
else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Білд завершено. Вихід');
    process.exit(0);
}
