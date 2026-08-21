import {FpsCounter} from "../utils/FpsCounter";
import {Scene} from "./Scene";
import {AssetManager} from "../resource/AssetManager";
import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {Camera} from "../camera/Camera";
import {GLUtils} from "../utils/GLUtils";

export class VEngineLiteApplication {
    public readonly fpsCounter = new FpsCounter();
    public readonly gl: WebGLRenderingContext;
    public readonly renderer: TriangleBatchRenderer;
    public readonly assetManager = new AssetManager();
    public readonly camera = new Camera();
    private scene: Scene;
    private running  = false;

    constructor(canvas: HTMLCanvasElement, public readonly width: number, public readonly height: number) {
        GLUtils.createAndHoldContext(canvas);

        canvas.width = width;
        canvas.height = height;
        this.renderer = new TriangleBatchRenderer(canvas.width, canvas.height);
        this.renderer.setCamera(this.camera);
        this.renderer.bind();
    }

    private runAppIfNotRunning() {
        if (this.running) return;
        this.running = true;
        const step = (timestamp: number) => {
            this.fpsCounter.update(timestamp);
            this.scene.onUpdate(timestamp);
            this.scene.render();
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    public runScene(scene: Scene) {
        this.scene = scene;
        this.runAppIfNotRunning();
        scene.onPreloadStarted();
        this.assetManager.
            load(progress=>scene.onProgress(progress)).
            then(()=>scene.onReady()).
            catch(e=>{
               console.error(e);
            });
    }
}
