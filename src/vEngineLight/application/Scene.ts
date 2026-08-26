
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

        for (const obj of this.objects) {
            obj.update(dt);
        }

        const bodies = this.objects.filter(it=>it.body!==undefined); // todo
        for (let i=0;i<bodies.length;i++) {
            for (let j=i+1;j<bodies.length;j++) {
                const a = bodies[i].body!;
                const b = bodies[j].body!;
                const collision = this.app.physics.detectCollision(a,b);
                if (collision) this.app.physics.resolveCollision(a,b,collision);
            }
        }
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
