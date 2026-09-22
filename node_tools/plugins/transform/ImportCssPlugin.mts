import * as fs from 'node:fs/promises';
import * as path from 'node:path';
// @ts-ignore
import type {OnLoadArgs, PluginBuild} from 'esbuild';
// @ts-ignore
import type {MiniBundlerTransformPlugin} from "../base/MiniBundlerTransformPlugin.mts";

export interface ImportCssOptions{
    output: string;
}

export class ImportCssPlugin implements MiniBundlerTransformPlugin {

    private readonly output: string;
    private fileContents: string[];

    constructor(params: ImportCssOptions) {
        this.output = params.output;
    }

    async onBuildStarted(build: PluginBuild) {
        this.fileContents = [];
    }

    async transform(code: string, build: PluginBuild, args: OnLoadArgs) {
        const cssPaths = extractCssPaths(code, 'CSS');

        const watchFiles: string[] = [];
        for (const relativePath of cssPaths) {
            const cssPath = path.resolve(
                path.dirname(args.path),
                relativePath
            );

            const source = await fs.readFile(cssPath, 'utf8');

            this.fileContents.push(source);
            watchFiles.push(cssPath);
        }

        return {code, watchFiles};
    }

    async onBuildFinished(build:PluginBuild) {
        const finalCss = this.fileContents.join('\n');

        const outdir = build.initialOptions.outdir;

        if (!outdir) {
            throw new Error(
                'ImportCssPlugin: "outdir" is required'
            );
        }

        const outputPath = path.resolve(outdir,this.output);
        await fs.mkdir(path.dirname(outputPath),{ recursive: true });
        await fs.writeFile(outputPath,finalCss,'utf8');
    }


}

function extractCssPaths(source: string, decoratorName: string) {

    const result = [];

    /*
     * Шукаємо:
     *
     * @DI.CSS('./main.css')
     *
     * і взагалі:
     *
     * DI.CSS('./main.css')
     */

    const escapedName = escapeRegExp(decoratorName);

    const regex = new RegExp(
        `\\bDI\\.${escapedName}\\s*\\(\\s*(['"])(.*?)\\1\\s*\\)`,
        'g'
    );

    let match;

    while ((match = regex.exec(source)) !== null) {
        result.push(match[2]);
    }

    return result;
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
