import {UrlLoader} from "./UrlLoader";

type AssetType = 'image' | 'audio' | 'json'|'text';

interface AssetManifestItem {
    key: string;
    type: AssetType;
    path: string;
}

type ProgressCallback = (progress: number) => void;
type CompleteCallback = () => void;

export class AssetManager {
    private readonly cache = new Map<string, any>();
    private readonly manifest: AssetManifestItem[] = [];
    private baseUrl = '';

    public setBaseUrl(value: string) {
        this.baseUrl = value;
        return this;
    }

    public add(key: string, type: AssetType, path: string): this {
        path = this.baseUrl + path;
        this.manifest.push({ key, type, path });
        return this;
    }

    public getImage(key: string) {
        return this.get<HTMLImageElement>(key,'image');
    }

    public getJson<T>(key: string) {
        return this.get<T>(key,'json');
    }

    private get<T>(key:string, type: AssetType): T {
        const manifestItem = this.manifest.find(item => item.key === key);
        if (!manifestItem) {
            throw new Error(`Manifest entry for key "${key}" not found.`);
        }
        if (manifestItem.type !== type) {
            throw new Error(`Asset with key "${key}" has the wrong type. ${type} expected, but ${manifestItem.type} found.}`);
        }
        const asset = this.cache.get(key);
        if (!asset) {
            throw new Error(`Asset with key "${key}" not found.`);
        }
        return asset as T;
    }

    public async load(onProgress?: ProgressCallback, onComplete?: CompleteCallback): Promise<void> {
        if (this.manifest.length === 0) {
            onProgress?.(1);
            onComplete?.();
            return;
        }

        const totalAssets = this.manifest.length;
        let loadedCount = 0;

        const promises = this.manifest.map(item => {
            let loadPromise: Promise<any>;

            switch (item.type) {
                case 'image':
                    loadPromise = this.loadImage(item.path);
                    break;
                case 'json':
                    loadPromise =
                        this.loadJson(item.path,n=>{
                            const progress = (loadedCount + n) / totalAssets;
                            onProgress?.(progress);
                        });
                    break;
                default:
                    throw new Error(`Unknown asset type: ${item.type}`);
            }

            return loadPromise.then(asset => {
                this.cache.set(item.key, asset);
                loadedCount++;
                const progress = loadedCount / totalAssets;
                onProgress?.(progress);
            });
        });

        await Promise.all(promises);

        onComplete?.();
    }

    private loadImage(path: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image at ${path}`));
            // img.onprogress = (e)=>{
            //     console.log(e);
            // }
            img.src = UrlLoader.addUrlParameter(path,'BUILD_ID',BUILD_ID);
        });
    }

    private loadJson<T>(path: string,onProgress?:(n:number)=>void): Promise<T> {
        const loader = new UrlLoader();
        return loader.load(path,"json",onProgress);
    }

}
