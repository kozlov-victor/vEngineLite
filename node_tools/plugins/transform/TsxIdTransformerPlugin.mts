// @ts-ignore
import swc from '@swc/core';
// @ts-ignore
import type {OnLoadArgs, PluginBuild} from 'esbuild';
// @ts-ignore
import type {MiniBundlerTransformPlugin} from "../base/MiniBundlerTransformPlugin.mts";

export class TsxIdTransformerPlugin implements MiniBundlerTransformPlugin {

    private counter = 0;

    async onBuildStarted(build: PluginBuild) {
        this.counter = 0;
    }

    async transform(code: string,build: PluginBuild,args: OnLoadArgs) {

        if (!args.path.endsWith('.tsx')) return {code};

        const ast = swc.parseSync(code, {
            syntax: 'typescript',
            tsx: true,
            decorators: true
        });

        this.visit(ast);
        code = swc.printSync(ast).code;
        return {code};
    }

    async onBuildFinished(build: PluginBuild) {

    }

    private visit(node: any) {

        if (!node || typeof node !== 'object') {
            return;
        }

        // JSX opening element:
        //
        // <div>
        // <Component>
        //
        if (node.type === 'JSXOpeningElement') {

            const attributes:any[] = node.attributes ?? [];

            const hasId = attributes.some(
                attribute =>
                    attribute.type === 'JSXAttribute' &&
                    attribute.name?.type === 'Identifier' &&
                    attribute.name.value === '__id'
            );

            if (!hasId) {
                attributes.push({
                    type: 'JSXAttribute',

                    span: {
                        start: 0,
                        end: 0
                    },

                    name: {
                        type: 'Identifier',
                        value: '__id',

                        span: {
                            start: 0,
                            end: 0
                        }
                    },

                    value: {
                        type: 'JSXExpressionContainer',

                        span: {
                            start: 0,
                            end: 0
                        },

                        expression: {
                            type: 'NumericLiteral',
                            value: this.counter++,

                            span: {
                                start: 0,
                                end: 0
                            }
                        }
                    }
                });
            }
        }

        // Рекурсивний обхід AST
        for (const key of Object.keys(node)) {

            if (
                key === 'span' ||
                key === 'loc'
            ) {
                continue;
            }

            const value = node[key];

            if (Array.isArray(value)) {

                for (const child of value) {
                    this.visit(child);
                }

            } else if (
                value &&
                typeof value === 'object'
            ) {
                this.visit(value);
            }
        }
    }
}
