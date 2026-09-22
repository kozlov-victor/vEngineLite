// @ts-ignore
import type {OnLoadArgs, PluginBuild} from 'esbuild';

export interface MiniBundlerTransformPlugin {
    onBuildStarted: (build: PluginBuild)=>Promise<void>;
    transform: (code: string, build: PluginBuild, args: OnLoadArgs)=>Promise<{code:string,watchFiles?:string[]}>;
    onBuildFinished: (build: PluginBuild)=>Promise<void>;
}

export interface MiniBundlerPostTransformPlugin {
    onBuildFinished: (build: PluginBuild)=>Promise<void>;
    getWatchFiles(build: PluginBuild):string[];
}
