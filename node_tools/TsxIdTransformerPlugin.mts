import swc from '@swc/core';

export class TsxIdTransformerPlugin {

    private counter = 0;

    async onBuildStarted(build: any) {
        this.counter = 0;
    }

    async onBuildFinished(build: any) {

    }

    transform(code: string,build: any,args: any) {

        if (!args.path.endsWith('.tsx')) return code;

        const ast = swc.parseSync(code, {
            syntax: 'typescript',
            tsx: true,
            decorators: true
        });

        this._visit(ast);

        return swc.printSync(ast).code;
    }

    _visit(node: any) {

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
                    this._visit(child);
                }

            } else if (
                value &&
                typeof value === 'object'
            ) {
                this._visit(value);
            }
        }
    }
}
