import {VEngineLiteApplication} from "./VEngineLiteApplication";
import {Container} from "../gameObject/base/Container";
import {KeyboardInputControl} from "../inputControl/KeyboardInputControl";
import {Size} from "../utils/Size";


export abstract class Scene {

    public readonly size = new Size(this.app.width,this.app.height);
    public readonly input = {
        keyboard: new KeyboardInputControl()
    } as const

    private readonly objects:Container[] = [];

    constructor(public readonly app: VEngineLiteApplication) {

    }

    public calculateBounds() {
        this.size.wh(
            Math.max(...this.objects.map(it=>it.position.x+it.size.w)),
            Math.max(...this.objects.map(it=>it.position.y+it.size.h))
        );
    }

    public onPreloadStarted() {

    }

    public onProgress(percents: number) {

    }

    public onReady() {

    }

    public onUpdate(dt: number) {

        this.app.physics.prepareWorld(dt);

        for (const obj of this.objects) {
            obj.update(dt);
        }

        this.app.physics.updateWorld(dt);
        this.app.camera.update(dt);

    }

    public render() {
        this.app.renderer.clearRenderBuffer();
        for (const obj of this.objects) {
            obj.enterFrame(this.app.renderer);
        }
        this.app.renderer.flush();
    }

    public addObject(obj: Container) {
        this.objects.push(obj);
    }

    public removeObject(obj: Container) {
        this.objects.splice(this.objects.indexOf(obj), 1);
    }

    public getObjects() {
        return this.objects;
    }

}
