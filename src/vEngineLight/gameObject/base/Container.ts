import {Transform} from "../../components/Transform";
import {Size} from "../../utils/Size";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {RigidBody} from "../../physics/ArcadePhysics";
import {Scene} from "../../application/Scene";

export class Container {

    public body?: RigidBody;
    protected readonly transform = new Transform();

    public readonly size = new Size();
    public readonly position = this.transform.position;
    public readonly scale = this.transform.scale;
    public readonly pivot = this.transform.pivot;

    constructor(protected scene: Scene) {
    }

    private readonly children: Container[] = [];

    set rotation(value: number) {
        this.transform.rotation = value;
    }

    get rotation() {
        return this.transform.rotation;
    }

    public enterFrame(renderer: TriangleBatchRenderer) {}

    public update(dt: number): void {
        if (this.body) {
            this.scene.app.physics.applyGravity(this.body, dt);
            this.body.position.x+=this.body.velocity.x * dt / 1000;
            this.body.position.y+=this.body.velocity.y * dt / 1000;
        }
    }


    // public addChild

}
