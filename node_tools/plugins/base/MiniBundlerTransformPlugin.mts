// @ts-ignore
import type {OnLoadArgs, PluginBuild} from 'esbuild';

export interface MiniBundlerTransformPlugin {
    configure?(build: PluginBuild): void | Promise<void>;
    onBuildStarted: (build: PluginBuild)=>Promise<void>;
    transform: (code: string, build: PluginBuild, args: OnLoadArgs)=>Promise<{code:string,watchFiles?:string[]}>;
    onBuildFinished: (build: PluginBuild)=>Promise<void>;
}

export interface MiniBundlerPostTransformPlugin {
    configure?(build: PluginBuild): void | Promise<void>;
    onBuildFinished: (build: PluginBuild)=>Promise<void>;
    getWatchFiles(build: PluginBuild):string[];
}
