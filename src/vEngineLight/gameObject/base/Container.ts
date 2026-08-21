import {Transform} from "../../components/Transform";
import {Size} from "../../utils/Size";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";

export class Container {

    protected readonly transform = new Transform();

    public readonly size = new Size();
    public readonly position = this.transform.position;
    public readonly scale = this.transform.scale;
    public readonly pivot = this.transform.pivot;

    private readonly children: Container[] = [];

    set rotation(value: number) {
        this.transform.rotation = value;
    }

    get rotation() {
        return this.transform.rotation;
    }

    public enterFrame(renderer: TriangleBatchRenderer) {}

    public update(time: number): void {}

    // public addChild

}
