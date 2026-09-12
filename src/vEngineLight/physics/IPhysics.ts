import {Vector2} from "../utils/Vector2";
import {IFrame, IGeometry} from "../types";
import {Size} from "../utils/Size";

export interface IRigidBodyParams {
    target: IGeometry;
}

export abstract class RigidBody {

    public readonly target: {size:Size,position:Vector2};
    public readonly rect: IFrame;
    public readonly velocity: Vector2;

    protected constructor(target: IGeometry, rect: IFrame | undefined, velocity: Vector2) {
        if (!rect) {
            rect = {
                x: 0, y: 0,
                width: target.size.w,
                height: target.size.h,
            }
        }
        this.target = target;
        this.rect = rect;
        this.velocity = velocity;
    }
}

export interface IPhysics<T,U extends RigidBody> {
    createRigidBody(params: T): U;
    updateBody(body: U, dt: number): void;
    prepareWorld(dt: number): void;
    updateWorld(dt: number): void;
}
