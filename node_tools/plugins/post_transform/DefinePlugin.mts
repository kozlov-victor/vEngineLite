// @ts-ignore
import type {MiniBundlerPostTransformPlugin} from "../base/MiniBundlerTransformPlugin.mts";
// @ts-ignore
import type {PluginBuild} from "esbuild";

type DefineValue =
    string |
    number |
    boolean |
    (() => string | number | boolean);

export class DefinePlugin implements MiniBundlerPostTransformPlugin {

    private readonly options: Record<string, DefineValue>;

    constructor(options: Record<string, DefineValue>) {
        this.options = options;
    }

    configure(build: PluginBuild) {

        const virtualPath = 'virtual:defines';
        const namespace = 'define-plugin';

        build.onResolve(
            {
                filter: /^virtual:defines$/
            },
            () => ({
                path: virtualPath,
                namespace
            })
        );

        build.onLoad(
            {
                filter: /.*/,
                namespace
            },
            () => {

                const names = Object.keys(this.options);

                const definitions = names
                    .map(name => {
                        const value = this.options[name];

                        const resolvedValue =
                            typeof value === 'function'
                                ? value()
                                : value;

                        return `const ${name} = ${JSON.stringify(resolvedValue)};`;
                    })
                    .join('\n');

                const exports = names.join(',\n');

                return {
                    contents: `
${definitions}

export {
    ${exports}
};
`,
                    loader: 'js'
                };
            }
        );

        build.initialOptions.inject ??= [];

        build.initialOptions.inject.push(
            virtualPath
        );
    }

    async onBuildFinished(build: PluginBuild): Promise<void> {
    }

    getWatchFiles(build: PluginBuild): string[] {
        return [];
    }



}
