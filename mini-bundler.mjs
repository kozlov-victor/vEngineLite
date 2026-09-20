import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';
import {ImportCssPlugin} from './node_tools/ImportCssPlugin.mjs';
import {TsxIdTransformerPlugin} from './node_tools/TsxIdTransformerPlugin.mjs';
import { execFileSync } from 'node:child_process';

const dev = process.argv.includes('--dev');

class CustomTransformerPlugin {

    constructor() {

    }

    pipe(...transformers) {
        return {
            name: 'custom-transformer',
            setup(build) {

                build.onStart(async () => {
                    console.log('Збірка розпочалася...');
                    for (const transformer of transformers) {
                        await transformer.onBuildStarted(build);
                    }
                });

                build.onLoad({ filter: /\.(ts|tsx)$/ }, async (args) => {
                    let code = await fs.readFile(args.path, 'utf8');

                    for (const transformer of transformers) {
                        code = await transformer.transform(code,build,args);
                    }

                    return {
                        contents: code,
                        loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts'
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
        )
    ]
});

if (dev) {
    await ctx.watch();
    console.log('Watcher запущено. Очікування змін у файлах...');
}
else {

    console.log('Перевірка TypeScript...');

    execFileSync(
        process.execPath,
        ['./node_modules/typescript/bin/tsc', '--noEmit'],
        { stdio: 'inherit' }
    );

    await ctx.rebuild();
    await ctx.dispose();
    console.log('Білд завершено. Вихід');
    process.exit(0);
}
