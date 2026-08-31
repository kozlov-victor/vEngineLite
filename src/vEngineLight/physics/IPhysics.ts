import {Vector2} from "../utils/Vector2";
import {Container} from "../gameObject/base/Container";
import {IFrame} from "../types";

export interface IRigidBodyParams {
    target: Container;
}

export abstract class RigidBody {

    public readonly target: Container;
    public readonly rect: IFrame;
    public readonly velocity: Vector2;

    protected constructor(target: Container, rect: IFrame | undefined, velocity: Vector2) {
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
    updateWorld(bodies: U[], dt: number): void;
}
