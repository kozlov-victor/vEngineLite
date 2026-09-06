import {VEngineLiteApplication} from "./VEngineLiteApplication";
import {Container} from "../gameObject/base/Container";
import {KeyboardInputControl} from "../inputControl/KeyboardInputControl";


export abstract class Scene {

    public readonly input = {
        keyboard: new KeyboardInputControl()
    } as const

    private readonly objects:Container[] = [];

    constructor(public readonly app: VEngineLiteApplication) {

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
