import * as fs from 'node:fs/promises';
import * as path from 'node:path';
// @ts-ignore
import swc from '@swc/core';
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

    async onBuildStarted(_build: PluginBuild) {
        this.fileContents = [];
    }

    async transform(code: string, _build: PluginBuild, args: OnLoadArgs) {
        const watchFiles: string[] = [];
        const decoratorData = extractCssDecoratorData(code, args.path);

        const globalCss = decoratorData.filter(item => item.global);
        for (const item of globalCss) {
            const cssPath = path.resolve(
                path.dirname(args.path),
                item.path
            );
            this.fileContents.push(await fs.readFile(cssPath, 'utf8'));
            watchFiles.push(cssPath);
        }

        for (const item of decoratorData.filter(item => !item.global)) {
            const cssPath = path.resolve(
                path.dirname(args.path),
                item.path
            );

            let source = await fs.readFile(cssPath, 'utf8');
            source = CssSelectorPreprocessor.scope(source, item.className);

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

function extractCssDecoratorData(source: string, filePath: string) {
    const result: {path: string; className: string; global: boolean}[] = [];
    const ast = swc.parseSync(source, {
        syntax: 'typescript',
        tsx: filePath.endsWith('.tsx'),
        decorators: true
    });

    visit(ast, node => {
        if (!isClassNode(node)) {
            return;
        }

        const className = node.identifier?.value;
        if (!className || !Array.isArray(node.decorators)) {
            return;
        }

        for (const decorator of node.decorators) {
            const data = readCssDecorator(decorator);
            if (!data) {
                continue;
            }

            result.push({
                path: data.path,
                className,
                global: data.global
            });
        }
    });

    return result;
}

function readCssDecorator(decorator: any): {path: string; global: boolean} | null {
    const callExpression = decorator?.expression;
    if (!callExpression || callExpression.type !== 'CallExpression') {
        return null;
    }

    if (!isCssDecoratorCall(callExpression.callee)) {
        return null;
    }

    const arg = callExpression.arguments?.[0]?.expression;
    const pathValue = readStringLiteral(arg);
    if (!pathValue) {
        return null;
    }

    const configArg = callExpression.arguments?.[1]?.expression;
    const global = readGlobalFlag(configArg);

    return {
        path: pathValue,
        global
    };
}

function isCssDecoratorCall(callee: any): boolean {
    if (!callee || callee.type !== 'MemberExpression') {
        return false;
    }

    const objectName = callee.object?.type === 'Identifier' ? callee.object.value : null;
    const propertyName = callee.property?.type === 'Identifier' ? callee.property.value : null;

    return objectName === 'DI' && propertyName === 'CSS';
}

function readGlobalFlag(node: any): boolean {
    if (!node || node.type !== 'ObjectExpression') {
        return false;
    }

    const properties = node.properties ?? [];
    for (const prop of properties) {
        if (prop.type === 'KeyValueProperty') {
            const keyName = prop.key?.value ?? prop.key?.computed?.value;
            if (keyName === 'global' && prop.value?.type === 'BooleanLiteral') {
                return prop.value.value === true;
            }
        }
    }

    return false;
}

function readStringLiteral(node: any): string | null {
    if (!node) {
        return null;
    }

    if (node.type === 'StringLiteral') {
        return node.value;
    }

    if (node.type === 'TemplateLiteral' && node.expressions?.length === 0) {
        return node.quasis?.[0]?.cooked ?? node.quasis?.[0]?.raw ?? null;
    }

    return null;
}

function isClassNode(node: any): boolean {
    return node?.type === 'ClassDeclaration' || node?.type === 'ClassExpression';
}

function visit(node: any, callback: (node: any) => void) {
    if (!node || typeof node !== 'object') {
        return;
    }

    callback(node);

    for (const key of Object.keys(node)) {
        if (key === 'span' || key === 'loc') {
            continue;
        }

        const value = node[key];

        if (Array.isArray(value)) {
            for (const child of value) {
                visit(child, callback);
            }
        } else if (value && typeof value === 'object') {
            visit(value, callback);
        }
    }
}
