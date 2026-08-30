import {Vector2} from "../utils/Vector2";
import {Size} from "../utils/Size";

export abstract class RigidBody {

    protected constructor(
        public readonly position: Vector2,
        public readonly size: Size,
        public readonly velocity: Vector2) {

    }
}

export interface IPhysics<T,U extends RigidBody> {
    createRigidBody(params: T): U;
    updateBody(body: U, dt: number): void;
    updateWorld(bodies: U[], dt: number): void;
}
