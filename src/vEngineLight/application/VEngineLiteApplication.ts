import {FpsCounter} from "../utils/FpsCounter";
import {Scene} from "./Scene";
import {AssetManager} from "../resource/AssetManager";
import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {Camera} from "../camera/Camera";
import {GLUtils} from "../utils/GLUtils";
import {ArcadePhysics} from "../physics/ArcadePhysics";

export class VEngineLiteApplication {
    public readonly fpsCounter = new FpsCounter();
    public readonly renderer: TriangleBatchRenderer;
    public readonly assetManager = new AssetManager();
    public readonly camera = new Camera();
    public readonly physics = new ArcadePhysics();
    private scene: Scene;
    private running  = false;
    private lastTime: number;

    private readonly FIXED_STEP = 1000 / 60;
    private readonly MAX_DELTA = 250;
    private readonly MAX_STEPS = 10;
    private accumulator = 0;

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
            let delta = timestamp - this.lastTime;
            this.lastTime = timestamp;
            delta = Math.min(delta, this.MAX_DELTA);

            this.accumulator += delta;
            let stepCount = 0;
            while (
                this.accumulator >= this.FIXED_STEP &&
                stepCount < this.MAX_STEPS
                ) {
                this.onNextUpdate(this.FIXED_STEP);

                this.accumulator -= this.FIXED_STEP;
                stepCount++;
            }
            if (stepCount === this.MAX_STEPS) {
                this.accumulator = 0;
            }

            this.scene.render();
            requestAnimationFrame(step);
        };
        this.lastTime = performance.now();
        requestAnimationFrame(step);
    }

    private onNextUpdate(dt: number) {
        this.scene.onUpdate(this.FIXED_STEP);
        this.scene.input.keyboard.update(dt);
    }

    public runScene(scene: Scene) {
        if (this.scene) this.scene.input.keyboard.stop();
        scene.input.keyboard.start();
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

    public getTime() {
        return this.lastTime;
    }

}
