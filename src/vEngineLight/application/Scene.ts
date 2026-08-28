
import {VEngineLiteApplication} from "./VEngineLiteApplication";
import {Container} from "../gameObject/base/Container";
import {KeyboardInputControl} from "../inputControl/KeyboardInputControl";
import {BodyType} from "../physics/ArcadePhysics";


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

        const bodies = this.objects
            .filter(it => it.body !== undefined)
            .map(it => it.body!);


        // ---------------------------------------
        // 1. Carry by previous support
        // ---------------------------------------

        for (const body of bodies) {

            if (
                body.type === BodyType.DYNAMIC &&
                body.support?.type === BodyType.KINEMATIC
            ) {
                body.position.x +=
                    body.support.frameMovement.x;

                body.position.y +=
                    body.support.frameMovement.y;
            }
        }


        // ---------------------------------------
        // 2. Забуваємо support попереднього кадру
        // ---------------------------------------

        for (const body of bodies) {
            body.support = undefined;
        }


        // ---------------------------------------
        // 3. Collision solver
        // ---------------------------------------

        const SOLVER_ITERATIONS = 10;

        for (
            let iteration = 0;
            iteration < SOLVER_ITERATIONS;
            iteration++
        ) {
            for (let i = 0; i < bodies.length; i++) {
                for (let j = i + 1; j < bodies.length; j++) {

                    const a = bodies[i];
                    const b = bodies[j];

                    const collision =
                        this.app.physics.detectCollision(a, b);

                    if (!collision) {
                        continue;
                    }

                    this.app.physics.resolveCollision(
                        a,
                        b,
                        collision
                    );


                    // ---------------------------------------
                    // Визначаємо support на останній ітерації
                    // ---------------------------------------

                    if (
                        iteration ===
                        SOLVER_ITERATIONS - 1
                    ) {
                        this.app.physics.resolveSupport(
                            a,
                            b,
                            collision
                        );
                    }
                }
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
