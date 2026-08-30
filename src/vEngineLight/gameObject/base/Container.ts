import {Transform} from "../../components/Transform";
import {Size} from "../../utils/Size";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {Scene} from "../../application/Scene";
import {IUpdateable} from "../../types";
import {RigidBody} from "../../physics/IPhysics";

export class Container implements IUpdateable {

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
            this.scene.app.physics.updateBody(this.body, dt);
        }
    }

    // public addChild

}
