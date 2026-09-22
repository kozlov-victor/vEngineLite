import * as fs from 'node:fs/promises';
import * as path from "node:path";

// @ts-ignore
import type {PluginBuild} from 'esbuild';
// @ts-ignore
import type {MiniBundlerPostTransformPlugin} from "../base/MiniBundlerTransformPlugin.mts";


export interface IndexHtmlPluginOptions {
    files: string[];
    outputDir: string;
    variables: Record<string, string>;
}

export class IndexHtmlPlugin implements MiniBundlerPostTransformPlugin {

    private readonly options: IndexHtmlPluginOptions;

    constructor(options: IndexHtmlPluginOptions) {
        if (!options.outputDir) options.outputDir = '';
        this.options = options;
    }

    async onBuildFinished(build: PluginBuild) {
        const outdir = build.initialOptions.outdir;

        if (!outdir) {
            throw new Error('IndexHtmlPlugin: "outdir" is required');
        }

        for (const file of this.options.files) {
            let html = await fs.readFile(file, 'utf8');

            html = html.replace(
                /\{\{\s*([A-Z0-9_]+)\s*}}/g,
                (_, name) => {
                    return (this.options.variables as any)[name] ?? '';
                }
            );

            try {
                const outputPath = path.resolve(outdir,this.options.outputDir);
                const filePath = path.resolve(outputPath,path.basename(file))
                await fs.mkdir(path.dirname(outputPath),{recursive: true});
                await fs.writeFile(filePath,html,'utf8');
            }
            catch (ex) {
                console.error(ex);
            }
        }
    }

    getWatchFiles() {
        return this.options.files;
    }



}
