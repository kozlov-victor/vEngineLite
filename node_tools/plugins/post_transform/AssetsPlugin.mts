// @ts-ignore
import type {MiniBundlerPostTransformPlugin} from "../base/MiniBundlerTransformPlugin.mts";
// @ts-ignore
import type {PluginBuild} from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";

export interface AssetsFolderCopyInfo {
    from: string;
    to: string;
    filters?: string[];
}

const defaultFilters = ['png','jpg','jpeg','gif','svg','ico','webp','woff','woff2','ttf','eot','mp3','wav','ogg','json','xml','txt','csv','md','html','css','js'];

export class AssetsPlugin implements MiniBundlerPostTransformPlugin {

    private readonly assetFolders: AssetsFolderCopyInfo[] = [];
    private outDir = '';

    constructor(assetFolders: AssetsFolderCopyInfo[]) {
        this.assetFolders = assetFolders;
    }

    configure(build: PluginBuild): void | Promise<void> {
        const outdir = build.initialOptions.outdir;
        if (!outdir) {
            throw new Error('IndexHtmlPlugin: "outdir" is required');
        }
        this.outDir = outdir;
        return undefined;
    }

    async onBuildFinished(build: PluginBuild) {
        for (const assetFolder of this.assetFolders) {
            const filters = assetFolder.filters ?? defaultFilters;
            const outputPath = path.join(this.outDir, assetFolder.to);
            await fs.rm(outputPath, {recursive: true, force: true});
            await this.copyAssets(assetFolder.from, outputPath, filters);
        }
        return Promise.resolve(undefined);
    }

    private async copyAssets(sourcePath: string, outputPath: string, filters: string[]) {
        const entries = await fs.readdir(sourcePath, {withFileTypes: true});
        await fs.mkdir(outputPath, {recursive: true});

        for (const entry of entries) {
            const srcFile = path.join(sourcePath, entry.name);
            const destFile = path.join(outputPath, entry.name);

            if (entry.isDirectory()) {
                await this.copyAssets(srcFile, destFile, filters);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).substring(1).toLowerCase();
                if (filters.includes(ext)) {
                    await fs.copyFile(srcFile, destFile);
                }
            }
        }
    }

    getWatchFiles(build: PluginBuild): string[] {
        return [];
    }



}
