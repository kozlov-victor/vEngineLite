export class CssSelectorPreprocessor {

    public static scope(css: string, scope: string): string {
        return this.processRules(css, scope);
    }

    private static processRules(
        css: string,
        scope: string
    ): string {
        let result = '';
        let position = 0;

        while (position < css.length) {
            const openBrace = this.findNextOpenBrace(css, position);

            if (openBrace === -1) {
                result += css.slice(position);
                break;
            }

            const header = css.slice(position, openBrace);
            const closeBrace = this.findMatchingBrace(css, openBrace);

            if (closeBrace === -1) {
                result += css.slice(position);
                break;
            }

            const body = css.slice(openBrace + 1, closeBrace);

            if (this.isAtRule(header)) {
                if (this.isKeyframes(header)) {
                    // @keyframes selectors (from/to/percentages)
                    // must not be scoped.
                    result += header;
                    result += '{';
                    result += body;
                    result += '}';
                } else if (this.isNestedRule(header)) {
                    // @media, @supports, @container, etc.
                    result += header;
                    result += '{';
                    result += this.processRules(body, scope);
                    result += '}';
                } else {
                    // @font-face, @page, @property, etc.
                    // These contain declarations rather than selectors.
                    result += header;
                    result += '{';
                    result += body;
                    result += '}';
                }
            } else {
                result += this.scopeSelectors(header, scope);
                result += '{';
                result += body;
                result += '}';
            }

            position = closeBrace + 1;
        }

        return result;
    }

    private static scopeSelectors(
        source: string,
        scope: string
    ): string {
        const selectors = this.splitSelectors(source);

        return selectors
            .map(selector => {
                const trimmed = selector.trim();

                if (!trimmed) {
                    return selector;
                }

                return `${this.createScopeSelector(scope)}${trimmed}`;
            })
            .join(',');
    }

    private static createScopeSelector(scope: string): string {
        return `[data-scope="${scope}"]`;
    }

    private static splitSelectors(source: string): string[] {
        const result: string[] = [];

        let start = 0;
        let parentheses = 0;
        let brackets = 0;
        let quote: '"' | "'" | null = null;

        for (let i = 0; i < source.length; i++) {
            const char = source[i];

            if (quote) {
                if (char === '\\') {
                    i++;
                    continue;
                }

                if (char === quote) {
                    quote = null;
                }

                continue;
            }

            if (char === '"' || char === "'") {
                quote = char;
                continue;
            }

            switch (char) {
                case '(':
                    parentheses++;
                    break;

                case ')':
                    parentheses--;
                    break;

                case '[':
                    brackets++;
                    break;

                case ']':
                    brackets--;
                    break;

                case ',':
                    if (parentheses === 0 && brackets === 0) {
                        result.push(source.slice(start, i));
                        start = i + 1;
                    }
                    break;
            }
        }

        result.push(source.slice(start));

        return result;
    }

    private static findNextOpenBrace(
        css: string,
        start: number
    ): number {
        let quote: '"' | "'" | null = null;
        let comment = false;

        for (let i = start; i < css.length; i++) {
            const char = css[i];
            const next = css[i + 1];

            if (comment) {
                if (char === '*' && next === '/') {
                    comment = false;
                    i++;
                }

                continue;
            }

            if (quote) {
                if (char === '\\') {
                    i++;
                    continue;
                }

                if (char === quote) {
                    quote = null;
                }

                continue;
            }

            if (char === '/' && next === '*') {
                comment = true;
                i++;
                continue;
            }

            if (char === '"' || char === "'") {
                quote = char;
                continue;
            }

            if (char === '{') {
                return i;
            }
        }

        return -1;
    }

    private static findMatchingBrace(
        css: string,
        openBrace: number
    ): number {
        let depth = 1;
        let quote: '"' | "'" | null = null;
        let comment = false;

        for (let i = openBrace + 1; i < css.length; i++) {
            const char = css[i];
            const next = css[i + 1];

            if (comment) {
                if (char === '*' && next === '/') {
                    comment = false;
                    i++;
                }

                continue;
            }

            if (quote) {
                if (char === '\\') {
                    i++;
                    continue;
                }

                if (char === quote) {
                    quote = null;
                }

                continue;
            }

            if (char === '/' && next === '*') {
                comment = true;
                i++;
                continue;
            }

            if (char === '"' || char === "'") {
                quote = char;
                continue;
            }

            if (char === '{') {
                depth++;
            } else if (char === '}') {
                depth--;

                if (depth === 0) {
                    return i;
                }
            }
        }

        return -1;
    }

    private static isAtRule(header: string): boolean {
        return header.trimStart().startsWith('@');
    }

    private static isKeyframes(header: string): boolean {
        return /^@(?:-\w+-)?keyframes\b/i.test(header.trim());
    }

    private static isNestedRule(header: string): boolean {
        return /^@(media|supports|container|layer|scope|document)\b/i
            .test(header.trim());
    }
}
