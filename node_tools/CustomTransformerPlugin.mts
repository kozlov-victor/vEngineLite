import {spawn} from "node:child_process";
import * as fs from "node:fs/promises";
// @ts-ignore
import type {MiniBundlerPostTransformPlugin, MiniBundlerTransformPlugin} from "./plugins/base/MiniBundlerTransformPlugin.mts";
// @ts-ignore
import type {BuildResult, OnLoadArgs, PluginBuild} from "esbuild";


export class CustomTransformerPlugin {

    private postTransformPlugins: MiniBundlerPostTransformPlugin[] = [];
    private transformPlugins: MiniBundlerTransformPlugin[] = [];

    private checkTypeScript() {
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

    transformers(...transformPlugins:MiniBundlerTransformPlugin[]) {
        this.transformPlugins = transformPlugins;
        return this;
    }

    postTransformers(...postTransformPlugins:MiniBundlerPostTransformPlugin[]) {
        this.postTransformPlugins = postTransformPlugins;
        return this;
    }

    createPluginContext() {
        const self = this;
        return {
            name: 'custom-transformer',
            setup(build: PluginBuild) {

                for (const transformer of self.transformPlugins) {
                    transformer.configure?.(build);
                }

                for (const transformer of self.postTransformPlugins) {
                    transformer.configure?.(build);
                }

                build.onStart(async () => {
                    console.log('Збірка розпочалася...');
                    for (const transformer of self.transformPlugins) {
                        await transformer.onBuildStarted(build);
                    }
                    return await self.checkTypeScript();
                });

                build.onLoad({ filter: /\.(ts|tsx)$/ }, async (args:OnLoadArgs) => {
                    let code = await fs.readFile(args.path, 'utf8');
                    const files:string[]  = [];

                    for (const transformer of self.transformPlugins) {
                        const transformResult = await transformer.transform(code,build,args);
                        code = transformResult.code;
                        if (transformResult.watchFiles) {
                            files.push(...transformResult.watchFiles);
                        }
                    }
                    for (const postTransformPlugin of self.postTransformPlugins) {
                        files.push(...postTransformPlugin.getWatchFiles(build));
                    }

                    return {
                        contents: code,
                        loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts',
                        watchFiles: [args.path,...files]
                    };
                });

                build.onEnd(async (result:BuildResult) => {
                    if (result.errors.length > 0) {
                        console.error('Помилка збірки:', result.errors);
                    } else {
                        for (const transformer of self.transformPlugins) {
                            await transformer.onBuildFinished(build);
                        }
                        for (const transformer of self.postTransformPlugins) {
                            await transformer.onBuildFinished(build);
                        }
                        console.log(`[${new Date().toLocaleTimeString()}] Бандл успішно оновлено!`);
                    }
                });
            }
        }
    }

}
