import {Transform} from "../components/Transform";
import {ITransformable, IUpdateable} from "../types";
import {CameraFollowStrategy} from "./follow/CameraFollowStrategy";
import {Container} from "../gameObject/base/Container";
import {VEngineLiteApplication} from "../application/VEngineLiteApplication";

export class Camera implements IUpdateable, ITransformable {

    private transform = new Transform();

    public readonly position = this.transform.position;
    public readonly scale = this.transform.scale;
    public readonly pivot = this.transform.pivot;

    public followTarget?: Container;
    public followStrategy?: CameraFollowStrategy;


    constructor(public readonly app: VEngineLiteApplication) {
    }

    public getWorldMatrix() {
        return this.transform.getWorldMatrix();
    }

    public update(dt: number) {
        if (
            this.followTarget &&
            this.followStrategy
        ) {
            this.followStrategy.update(
                this,
                this.followTarget,
                dt
            );
        }
    }

}
