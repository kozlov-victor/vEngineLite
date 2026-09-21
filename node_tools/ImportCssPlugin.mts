import fs from 'node:fs/promises';
import path from 'node:path';

export interface ImportCssOptions {
    output: string;
}

export class ImportCssPlugin {

    private readonly output: string;
    private fileContents: string[];

    constructor(params: ImportCssOptions) {
        this.output = params.output;
    }

    async onBuildStarted(build: any) {
        this.fileContents = [];
    }

    async onBuildFinished(build:any) {
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

    async transform(code:string,build:any,args:any) {
        const cssPaths = extractCssPaths(code,'CSS');
        for (const relativePath of cssPaths) {
            const cssPath = path.resolve(
                path.dirname(args.path),
                relativePath
            );

            let source = await fs.readFile(cssPath,'utf8');

            this.fileContents.push(source);
        }

        return code;
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
