import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';
import {ImportCssPlugin} from './node_tools/ImportCssPlugin.mts';
import {TsxIdTransformerPlugin} from './node_tools/TsxIdTransformerPlugin.mts';
import {spawn} from 'node:child_process';
import {GlslTransformerPlugin} from "./node_tools/GlslTransformerPlugin.mts";

const dev = process.argv.includes('--dev');



class CustomTransformerPlugin {

    constructor() {


    }

    _checkTypeScript() {
        return new Promise((resolve) => {
            const tsc = spawn(
                process.execPath,
                [
                    './node_modules/typescript/bin/tsc',
                    '--project', './tsconfig.json',
                    '--noEmit',
                    '--incremental', 'false',
                ],
                { stdio: 'inherit' }
            );

            tsc.on('error', (error) => {
                resolve({
                    errors: [{
                        text: `Не вдалося запустити TypeScript: ${error.message}`
                    }]
                });
            });

            tsc.on('close', (code) => {
                resolve(code === 0
                    ? {}
                    : {
                        errors: [{
                            text: 'Перевірка TypeScript завершилася з помилками'
                        }]
                    }
                );
            });
        });
    }

    pipe(...transformers) {
        const self = this;
        return {
            name: 'custom-transformer',
            setup(build) {

                build.onStart(async () => {
                    console.log('Збірка розпочалася...');
                    for (const transformer of transformers) {
                        await transformer.onBuildStarted(build);
                    }
                    return await self._checkTypeScript();
                });

                build.onLoad({ filter: /\.(ts|tsx)$/ }, async (args) => {
                    let code = await fs.readFile(args.path, 'utf8');

                    for (const transformer of transformers) {
                        code = await transformer.transform(code,build,args);
                    }

                    return {
                        contents: code,
                        loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts',
                        watchFiles: [args.path]
                    };
                });

                build.onEnd(async (result) => {
                    if (result.errors.length > 0) {
                        console.error('Помилка збірки:', result.errors);
                    } else {
                        for (const transformer of transformers) {
                            await transformer.onBuildFinished(build);
                        }
                        console.log(`[${new Date().toLocaleTimeString()}] Бандл успішно оновлено!`);
                    }
                });
            }
        }
    }

}

const ctx = await esbuild.context({
    entryPoints: ['src/index.ts','src/editor/main.tsx'],
    bundle: true,
    outdir: 'out',
    format: 'iife',
    sourcemap: !dev,
    keepNames: !dev,
    minify: !dev,
    define: {
        BUILD_ID: JSON.stringify(`${new Date().getTime()}`),
    },
    plugins: [
        new CustomTransformerPlugin().pipe(
            new ImportCssPlugin({output: 'editor/all.css'}),
            new TsxIdTransformerPlugin(),
            new GlslTransformerPlugin({minify: !dev})
        )
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
