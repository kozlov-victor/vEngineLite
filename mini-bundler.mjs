import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';
import {ImportCssPlugin} from './node_tools/ImportCssPlugin.mjs';
import {TsxIdTransformerPlugin} from './node_tools/TsxIdTransformerPlugin.mjs';

// 1. Кастомний плагін трансформації
const customTransformerPlugin = (transformers)=>{
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
};

// 2. Створюємо контекст збірки
const ctx = await esbuild.context({
    entryPoints: ['src/index.ts','src/editor/main.tsx'],
    bundle: true,
    outdir: 'out',
    format: 'iife',
    sourcemap: true,
    define: {
        BUILD_ID: JSON.stringify(`${new Date().getTime()}`),
    },
    plugins: [
        customTransformerPlugin([
            new ImportCssPlugin({output: 'editor/all.css'}),
            new TsxIdTransformerPlugin(),
        ])
    ]
});

// 3. Запускаємо режим Watch
await ctx.watch();
console.log('Watcher запущено. Очікування змін у файлах...');
