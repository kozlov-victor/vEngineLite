import {FpsCounter} from "../utils/FpsCounter";
import {Scene} from "./Scene";
import {AssetManager} from "../resource/AssetManager";
import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {Camera} from "../camera/Camera";
import {GLUtils} from "../utils/GLUtils";
import {ArcadePhysics} from "../physics/ArcadePhysics";
import {Size} from "../utils/Size";
import {AbstractScaleStrategy} from "../rendering/scaleStrategy/AbstractScaleStrategy";
import {NoopScaleStrategy} from "../rendering/scaleStrategy/NoopScaleStrategy";

export class VEngineLiteApplication {
    public readonly fpsCounter = new FpsCounter();
    public readonly renderer: TriangleBatchRenderer;
    public readonly assetManager = new AssetManager();
    public readonly camera = new Camera(this);
    public readonly physics = new ArcadePhysics();
    public readonly viewPort = new Size(); // todo

    private scene: Scene;
    private running  = false;
    private lastTime: number;

    private readonly FIXED_STEP = 1000 / 60;
    private readonly MAX_DELTA = 250;
    private readonly MAX_STEPS = 10;
    private accumulator = 0;

    constructor(private readonly canvas: HTMLCanvasElement, public readonly size: Size, scaleStrategy:AbstractScaleStrategy = new NoopScaleStrategy()) {
        GLUtils.createAndHoldContext(canvas);

        canvas.width = size.w;
        canvas.height = size.h;

        this.listenToResize(scaleStrategy);

        this.renderer = new TriangleBatchRenderer(this);
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

    private listenToResize(scaleStrategy: AbstractScaleStrategy) {
        window.addEventListener("resize", () => {
            scaleStrategy.onResize(this,this.canvas);
        });
        scaleStrategy.onResize(this,this.canvas);
    }

    private onNextUpdate(dt: number) {
        this.scene.onUpdate(dt);
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

    public getCurrentScene() {
        return this.scene;
    }

}
