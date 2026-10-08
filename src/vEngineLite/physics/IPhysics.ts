import {Vector2} from "../utils/Vector2";
import {IFrame, IGeometry} from "../types";
import {Size} from "../utils/Size";
import {CollisionGroup, CollisionGroupManager} from "./CollisionGroupManager";

export interface IRigidBodyParamsBase {
    restitution?: number;
    collisionGroup?: CollisionGroup;
    collideWithGroup?: CollisionGroup;
    ignoreCollisionWithGroup?: CollisionGroup;
    nonBlockingCollisionWithGroup?: CollisionGroup;
}

export interface IRigidBodyParams extends IRigidBodyParamsBase {
    target: IGeometry;
    rect?: IFrame;
    velocity?: Vector2;
}

export abstract class RigidBody {

    public readonly target: {size:Size,position:Vector2};
    public rect: IFrame;
    public readonly velocity: Vector2;
    public collisionGroup: CollisionGroup;
    public collideWithGroup: CollisionGroup;
    public ignoreCollisionWithGroup: CollisionGroup;
    public nonBlockingCollisionWithGroup: CollisionGroup;
    public restitution: number;

    protected constructor(params: IRigidBodyParams) {
        if (!params.rect) {
            this.rect = {
                x: 0, y: 0,
                width: params.target.size.w,
                height: params.target.size.h,
            }
        }
        else {
            this.rect = {...params.rect};
        }
        this.target = params.target;
        this.velocity = params.velocity ?? new Vector2();
        this.collisionGroup = params.collisionGroup ?? CollisionGroupManager.getDefaultGroup();
        this.collideWithGroup = params.collideWithGroup ?? CollisionGroupManager.getDefaultGroup();
        this.ignoreCollisionWithGroup = params.ignoreCollisionWithGroup ?? CollisionGroupManager.getNoneGroup();
        this.nonBlockingCollisionWithGroup = params.nonBlockingCollisionWithGroup ?? CollisionGroupManager.getNoneGroup();
        this.restitution = params.restitution ?? 0;
    }
}

export interface IPhysics<T,U extends RigidBody> {
    createRigidBody(params: T): U;
    updateBody(body: U, dt: number): void;
    prepareWorld(dt: number): void;
    updateWorld(dt: number): void;
}
