
// @ts-ignore
import type {MiniBundlerTransformPlugin} from "../base/MiniBundlerTransformPlugin.mjs";
// @ts-ignore
import type {OnLoadArgs, PluginBuild} from "esbuild";

export interface GlslTransformerOptions {
    minify?: boolean;
}

export class GlslTransformerPlugin implements MiniBundlerTransformPlugin {

    private readonly minify: boolean;

    constructor(options: GlslTransformerOptions = {}) {
        this.minify = options.minify ?? true;
    }

    async onBuildStarted(build: PluginBuild): Promise<void> {
    }

    async onBuildFinished(_build: PluginBuild): Promise<void> {
    }

    async transform(code: string, build: PluginBuild, args: OnLoadArgs) {
        if (!this.minify) {
            return {code};
        }
        return {code:this.transformGlsl(code)};
    }

    private transformGlsl(code: string): string {
        const marker = /\/\/\s*language\s*=\s*GLSL\s*[\r\n]+/g;

        let result = '';
        let lastIndex = 0;

        while (true) {
            const match = marker.exec(code);

            if (!match) {
                result += code.substring(lastIndex);
                break;
            }

            const templateStart = this.findTemplateStart(
                code,
                marker.lastIndex
            );

            if (templateStart === -1) {
                result += code.substring(lastIndex);
                break;
            }

            const templateEnd = this.findTemplateEnd(
                code,
                templateStart + 1
            );

            if (templateEnd === -1) {
                result += code.substring(lastIndex);
                break;
            }

            // До template literal включно.
            result += code.substring(lastIndex, templateStart + 1);

            const glsl = code.substring(
                templateStart + 1,
                templateEnd
            );

            result += this.minifyGlsl(glsl);
            result += '`';

            lastIndex = templateEnd + 1;
            marker.lastIndex = lastIndex;
        }

        return result;
    }

    private findTemplateStart(code: string, start: number): number {
        let i = start;

        while (i < code.length) {
            const char = code[i];

            if (char === '`') {
                return i;
            }

            // Якщо між annotation і template literal почався
            // інший statement, annotation не застосовується.
            if (char === ';' || char === '\n' && this.hasNonWhitespaceBefore(code, i)) {
                // Не перериваємо на звичайному newline — після annotation
                // declaration може бути на наступному рядку.
            }

            i++;
        }

        return -1;
    }

    private hasNonWhitespaceBefore(code: string, index: number): boolean {
        return code.substring(0, index).trim().length > 0;
    }

    private findTemplateEnd(code: string, start: number): number {
        let escaped = false;

        for (let i = start; i < code.length; i++) {
            const char = code[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (char === '`') {
                return i;
            }
        }

        return -1;
    }

    private minifyGlsl(source: string): string {
        let result = '';
        let i = 0;

        while (i < source.length) {
            const char = source[i];

            // Single-line comment
            if (char === '/' && source[i + 1] === '/') {
                i += 2;

                while (i < source.length && source[i] !== '\n') {
                    i++;
                }

                continue;
            }

            // Multi-line comment
            if (char === '/' && source[i + 1] === '*') {
                i += 2;

                while (
                    i < source.length &&
                    !(source[i] === '*' && source[i + 1] === '/')
                    ) {
                    i++;
                }

                i += 2;
                continue;
            }

            // Whitespace
            if (/\s/.test(char)) {
                let j = i + 1;

                while (j < source.length && /\s/.test(source[j])) {
                    j++;
                }

                const previous = result[result.length - 1];
                const next = source[j];

                // Не можна злити два GLSL tokens:
                //
                // vec2 position
                //
                // -> vec2position
                if (
                    this.isIdentifierChar(previous) &&
                    this.isIdentifierChar(next)
                ) {
                    result += ' ';
                }

                i = j;
                continue;
            }

            result += char;
            i++;
        }

        return result
            // punctuation
            .replace(/\s*([{}()[\];,:])\s*/g, '$1')

            // operators
            .replace(/\s*([=+\-*\/<>!&|])\s*/g, '$1')

            .trim();
    }

    private isIdentifierChar(char: string | undefined): boolean {
        return !!char && /[A-Za-z0-9_.]/.test(char);
    }
}
