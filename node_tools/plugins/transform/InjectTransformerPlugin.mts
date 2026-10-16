// @ts-ignore
import swc from '@swc/core';
import * as path from 'node:path';
// @ts-ignore
import type {OnLoadArgs, PluginBuild} from 'esbuild';
// @ts-ignore
import type {MiniBundlerTransformPlugin} from "../base/MiniBundlerTransformPlugin.mts";
import {API, SymbolFlags} from 'typescript/unstable/sync';

export class InjectTransformerPlugin implements MiniBundlerTransformPlugin {

    private readonly api = new API({cwd: process.cwd()});
    private snapshot: ReturnType<API['updateSnapshot']> | undefined;
    private project: ReturnType<ReturnType<API['updateSnapshot']>['getProject']> | undefined;
    private readonly configFile = path.resolve('tsconfig.json');

    async onBuildStarted(_build: PluginBuild) {
        const previousSnapshot = this.snapshot;
        this.snapshot = this.api.updateSnapshot(previousSnapshot
            ? {fileChanges: {invalidateAll: true}}
            : {openProjects: [this.configFile]}
        );
        previousSnapshot?.dispose();
        this.project = this.snapshot.getProject(this.configFile);
        if (!this.project) {
            throw new Error(`DI injection transformer could not load ${this.configFile}`);
        }
    }

    async transform(code: string, _build: PluginBuild, args: OnLoadArgs) {
        const ast = swc.parseSync(code, {
            syntax: 'typescript',
            tsx: args.path.endsWith('.tsx'),
            decorators: true
        });

        let changed = false;
        visit(ast, node => {
            if (node.type !== 'ClassProperty' || !Array.isArray(node.decorators)) {
                return;
            }

            for (const decorator of node.decorators) {
                const call = decorator?.expression;
                if (!isEmptyInjectCall(call)) {
                    continue;
                }

                const typeName = node.typeAnnotation?.typeAnnotation?.typeName;
                if (!typeName || typeName.type !== 'Identifier') {
                    const propertyName = node.key?.value ?? '<unknown>';
                    throw new Error(
                        `DI.Inject() requires a field typed as a runtime class identifier: ${propertyName}`
                    );
                }
                if (isTypeOnlyImport(ast, typeName.value)) {
                    const {line, column} = getSourceLocation(code, typeName.span.start);
                    console.error(
                        `${args.path}:${line}:${column}: DI.Inject() cannot use type-only import '${typeName.value}'; import the runtime class instead`
                    );
                    throw new Error(
                        `DI.Inject() cannot use type-only import ${typeName.value}; import the runtime class instead`
                    );
                }
                this.assertClassType(
                    args.path,
                    code,
                    typeName,
                    node.key?.value ?? '<unknown>'
                );

                call.arguments.push({
                    spread: null,
                    expression: {
                        type: 'ArrowFunctionExpression',
                        span: call.span,
                        ctxt: 0,
                        params: [],
                        body: {...typeName},
                        async: false,
                        generator: false,
                        typeParameters: null,
                        returnType: null
                    }
                });
                changed = true;
            }
        });

        return {code: changed ? swc.printSync(ast).code : code};
    }

    async onBuildFinished(_build: PluginBuild) {
    }

    private assertClassType(filePath: string, code: string, typeName: any, propertyName: string) {
        const byteOffset = typeName.span.start - 1;
        const sourceOffset = Buffer.from(code).subarray(0, byteOffset).toString().length;
        const type = this.project?.checker.getTypeAtPosition(filePath, sourceOffset - 1);
        const symbol = type?.getSymbol();
        const reference = this.project?.checker.getSymbolAtPosition(filePath, sourceOffset);
        if (
            !symbol ||
            (symbol.flags & SymbolFlags.Class) === 0 ||
            (reference!.flags & SymbolFlags.TypeAlias) !== 0
        ) {
            throw new Error(
                `DI.Inject() requires a runtime class type; type '${typeName.value}' on field '${propertyName}' is not a class`
            );
        }
    }
}

function isTypeOnlyImport(ast: any, name: string): boolean {
    let found = false;
    visit(ast, node => {
        if (node.type !== 'ImportDeclaration') {
            return;
        }
        for (const specifier of node.specifiers ?? []) {
            if (
                specifier.local?.value === name &&
                (node.typeOnly || specifier.isTypeOnly)
            ) {
                found = true;
            }
        }
    });
    return found;
}

function getSourceLocation(code: string, byteOffset: number): {line: number; column: number} {
    const sourceOffset = Buffer.from(code).subarray(0, byteOffset - 1).toString().length;
    const precedingText = code.slice(0, sourceOffset);
    const lines = precedingText.split(/\r\n|\r|\n/);
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

function isEmptyInjectCall(node: any): boolean {
    return node?.type === 'CallExpression' &&
        node.callee?.type === 'MemberExpression' &&
        node.callee.object?.type === 'Identifier' &&
        node.callee.object.value === 'DI' &&
        node.callee.property?.type === 'Identifier' &&
        node.callee.property.value === 'Inject' &&
        node.arguments?.length === 0;
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
