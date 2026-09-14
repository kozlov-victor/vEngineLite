import fs from 'node:fs/promises';
import path from 'node:path';

export class ImportCssPlugin {

    constructor(params) {
        this.output = params.output;
    }

    async onBuildStarted(build) {
        this.fileContents = [];
    }

    async onBuildFinished(build) {
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

    async transform(code,build,args) {
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

// export function ImportCssPlugin(
//     options = {}
// ) {
//     const decoratorName = options.decoratorName ?? 'CSS';
//     const output = options.output ?? 'bundle.css';
//
//     const cssFiles = new Set();
//
//     {
//
//         // ------------------------------------------------------------
//         // Знаходимо DI.CSS(...) у кожному TS/TSX файлі
//         // ------------------------------------------------------------
//
//         build.onLoad(
//             { filter: /\.(ts|tsx)$/ },
//             async (args) => {
//                 const source = await fs.readFile(args.path, 'utf8');
//
//                 const cssPaths = extractCssPaths(
//                     source,
//                     decoratorName
//                 );
//
//                 const watchFiles = [];
//
//                 for (const relativePath of cssPaths) {
//                     const cssPath = path.resolve(
//                         path.dirname(args.path),
//                         relativePath
//                     );
//
//                     try {
//                         await fs.access(cssPath);
//
//                         cssFiles.add(cssPath);
//                         watchFiles.push(cssPath);
//                     } catch {
//                         throw new Error(
//                             `ImportCssPlugin: CSS not found: ${cssPath}`
//                         );
//                     }
//                 }
//
//                 const finalCss = contents.join('\n');
//
//                 const outdir = build.initialOptions.outdir;
//
//                 if (!outdir) {
//                     throw new Error(
//                         'ImportCssPlugin: "outdir" is required'
//                     );
//                 }
//
//                 const outputPath = path.resolve(
//                     outdir,
//                     output
//                 );
//
//                 await fs.mkdir(
//                     path.dirname(outputPath),
//                     { recursive: true }
//                 );
//
//                 await fs.writeFile(
//                     outputPath,
//                     finalCss,
//                     'utf8'
//                 );
//
//                 console.log(
//                     `[CSS] ${outputPath}`
//                 );
//
//                 return source;
//             }
//         );
//
//         // ------------------------------------------------------------
//         // Після успішної збірки генеруємо bundle.css
//         // ------------------------------------------------------------
//
//         build.onEnd(async (result) => {
//
//             if (result.errors.length > 0) {
//                 return;
//             }
//
//             const contents = [];
//
//             for (const cssPath of cssFiles) {
//                 const css = await fs.readFile(cssPath, 'utf8');
//                 contents.push(css);
//             }
//
//             const finalCss = contents.join('\n');
//
//             const outdir = build.initialOptions.outdir;
//
//             if (!outdir) {
//                 throw new Error(
//                     'ImportCssPlugin: "outdir" is required'
//                 );
//             }
//
//             const outputPath = path.resolve(
//                 outdir,
//                 output
//             );
//
//             await fs.mkdir(
//                 path.dirname(outputPath),
//                 { recursive: true }
//             );
//
//             await fs.writeFile(
//                 outputPath,
//                 finalCss,
//                 'utf8'
//             );
//
//             console.log(
//                 `[CSS] ${outputPath}`
//             );
//         });
//     }
// }


// ============================================================================
// CSS extractor
// ============================================================================

function extractCssPaths(source, decoratorName) {

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

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
