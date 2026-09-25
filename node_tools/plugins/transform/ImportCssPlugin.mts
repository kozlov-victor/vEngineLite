import * as fs from 'node:fs/promises';
import * as path from 'node:path';
// @ts-ignore
import type {OnLoadArgs, PluginBuild} from 'esbuild';
// @ts-ignore
import type {MiniBundlerTransformPlugin} from "../base/MiniBundlerTransformPlugin.mts";
// @ts-ignore
import {CssSelectorPreprocessor} from "./CssSelectorPreprocessor.mts";

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
        const decoratorData = extractCssDecoratorData(code, 'CSS');

        const watchFiles: string[] = [];
        for (const item of decoratorData) {
            const cssPath = path.resolve(
                path.dirname(args.path),
                item.path
            );

            let source = await fs.readFile(cssPath, 'utf8');
            //source = CssSelectorPreprocessor.scope(source, item.className);

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

function extractCssDecoratorData(source: string, decoratorName: string) {
    const result: {path: string; className: string}[] = [];

    const escapedName = escapeRegExp(decoratorName);

    const regex = new RegExp(
        `\\bDI\\.${escapedName}\\s*\\(\\s*(['"])(.*?)\\1\\s*\\)` +
        `\\s*(?:export\\s+)?(?:default\\s+)?(?:abstract\\s+)?class\\s+(\\w+)`,
        'g'
    );

    let match: RegExpExecArray | null;

    while ((match = regex.exec(source)) !== null) {
        result.push({
            path: match[2],
            className: match[3]
        });
    }

    return result;
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
