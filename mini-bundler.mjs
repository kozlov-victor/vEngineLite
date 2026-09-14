import * as esbuild from 'esbuild';
import swc from '@swc/core';
import fs from 'node:fs/promises';

// 1. Кастомний плагін трансформації
const customTransformerPlugin = {
    name: 'custom-transformer',
    setup(build) {
        // Обробка файлів перед збіркою
        build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
            const code = await fs.readFile(args.path, 'utf8');

            // Кастомна трансформація через SWC
            const transformed = await swc.transform(code, {
                filename: args.path,
                jsc: {
                    parser: { syntax: 'typescript', tsx: true },
                    target: 'es2022'
                }
            });

            return {
                contents: transformed.code,
                loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts'
            };
        });

        // Логування стану збірки в консоль
        build.onStart(() => {
            console.log('⏳ Збірка розпочалася...');
        });

        build.onEnd((result) => {
            if (result.errors.length > 0) {
                console.error('Помилка збірки:', result.errors);
            } else {
                console.log(`[${new Date().toLocaleTimeString()}] Бандл успішно оновлено!`);
            }
        });
    }
};

// 2. Створюємо контекст збірки
const ctx = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'esm',
    sourcemap: true,
    plugins: [customTransformerPlugin]
});

// 3. Запускаємо режим Watch
await ctx.watch();
console.log('Watcher запущено. Очікування змін у файлах...');
