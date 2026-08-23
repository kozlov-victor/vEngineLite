import ts  from "typescript";
import fs from "fs/promises";
import path from "path";

export class ImportCssPlugin {
    constructor(options = {}) {
        this.decoratorName = options.decoratorName || "CSS";
        this.output = options.output || "bundle.css";

        this.cache = new Map(); // file -> parsed css paths
        this.cssCache = new Map(); // cssPath -> content
    }

    async exists(p) {
        try {
            await fs.stat(p);
            return true;
        } catch {
            return false;
        }
    }

    apply(compiler) {
        compiler.hooks.thisCompilation.tap("ImportCssPlugin", (compilation) => {

            compilation.hooks.processAssets.tapPromise(
                {
                    name: "ImportCssPlugin",
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
                },
                async () => {

                    const cssSet = new Set();
                    const modulesToCheck = new Set();

                    // --- modules ---
                    for (const module of compilation.modules) {
                        if (module.resource && module.resource.endsWith(".ts") || module.resource?.endsWith(".tsx")) {
                            let source;
                            try {
                                source = module.originalSource()?.source()?.toString();
                            } catch {
                                continue;
                            }

                            if (source) {
                                modulesToCheck.add({
                                    file: module.resource,
                                    source
                                });
                            }
                        }
                    }

                    // --- entry files ---
                    const entryFiles = this._extractEntryFiles(compilation.options.entry);
                    for (const entryPath of entryFiles) {
                        const abs = path.resolve(compiler.context, entryPath);
                        if (await this.exists(abs)) {
                            modulesToCheck.add({
                                file: abs,
                                source: await fs.readFile(abs, "utf8")
                            });
                        }
                    }

                    // --- parse each file ---
                    for (const { file, source } of modulesToCheck) {

                        let cssPaths;

                        if (this.cache.has(file)) {
                            cssPaths = this.cache.get(file);
                        } else {
                            cssPaths = this._extractCssFromAst(source);
                            this.cache.set(file, cssPaths);
                        }

                        const dir = path.dirname(file);

                        for (const rel of cssPaths) {
                            const abs = path.resolve(dir, rel);

                            if (await this.exists(abs)) {
                                compilation.fileDependencies.add(abs);
                                cssSet.add(abs);
                            } else {
                                compilation.errors.push(
                                    new Error(`ImportCssPlugin: CSS not found: ${abs}`)
                                );
                            }
                        }
                    }

                    // --- read CSS (with cache) ---
                    const cssContents = [];

                    for (const cssPath of cssSet) {
                        let content;

                        if (this.cssCache.has(cssPath)) {
                            content = this.cssCache.get(cssPath);
                        } else {
                            content = await fs.readFile(cssPath, "utf8");
                            this.cssCache.set(cssPath, content);
                        }

                        cssContents.push(content);
                    }

                    const finalCss = cssContents.join("\n");

                    const { RawSource } = compiler.webpack.sources;
                    compilation.emitAsset(this.output, new RawSource(finalCss));
                }
            );
        });
    }

    _extractCssFromAst(source) {
        const result = [];

        const sf = ts.createSourceFile(
            "temp.ts",
            source,
            ts.ScriptTarget.Latest,
            true
        );

        function visit(node) {
            // шукаємо DI.CSS(...)
            if (
                ts.isCallExpression(node) &&
                ts.isPropertyAccessExpression(node.expression)
            ) {
                const obj = node.expression.expression;
                const prop = node.expression.name;

                if (
                    ts.isIdentifier(obj) &&
                    obj.text === "DI" &&
                    prop.text === "CSS"
                ) {
                    const arg = node.arguments[0];

                    // тільки string literal
                    if (arg && ts.isStringLiteral(arg)) {
                        result.push(arg.text);
                    }
                    else {

                    }
                }
            }

            ts.forEachChild(node, visit);
        }

        visit(sf);

        return result;
    }

    _extractEntryFiles(entry) {
        if (typeof entry === "string") return [entry];
        if (Array.isArray(entry)) return entry;
        if (typeof entry === "object") {
            let result = [];
            for (const key of Object.keys(entry)) {
                result = result.concat(this._extractEntryFiles(entry[key]));
            }
            return result;
        }
        return [];
    }
}
