import {Vector2} from "../utils/Vector2";
import {Size} from "../utils/Size";
import {IPhysics, RigidBody} from "./IPhysics";

interface Collision {
    normal: Vector2;
    depth: number;
}

export enum ArcadeRigidBodyType {
    STATIC,
    DYNAMIC,
    KINEMATIC
}

class ArcadeRigidBody extends RigidBody {
    readonly id: number;
    type: ArcadeRigidBodyType;
    readonly frameMovement = new Vector2();
    support?: ArcadeRigidBody;
    mass: number;
    friction: number; // px/s²

    constructor(params: ArcadeRigidBodyParams, id: number) {
        super(params.position,params.size,params.velocity ?? new Vector2());
        this.id = id;
        this.type = params.type;
        this.mass = params.mass || 1;
        this.friction = params.friction ?? 800;
    }

    public onGround() {
        return this.support !== undefined;
    }

    public jump(v0: number) {
        this.velocity.y = v0;
        this.support = undefined;
    }

}
export type {ArcadeRigidBody}


export interface ArcadeRigidBodyParams {
    position: Vector2;
    size: Size;
    velocity?: Vector2;
    type: ArcadeRigidBodyType,
    mass?: number;
    friction?: number; // px/s²
}

export class ArcadePhysics implements IPhysics<ArcadeRigidBodyParams, ArcadeRigidBody> {

    public gravity = 300;

    private nextId = 0;

    public createRigidBody(params: ArcadeRigidBodyParams): ArcadeRigidBody {
        return new ArcadeRigidBody(params,this.nextId++);
    }

    public updateBody(body: RigidBody, dt: number): void {
        this.integratePhysics(body as ArcadeRigidBody, dt);
    }

    public updateWorld(rigidBodies: RigidBody[], dt: number): void {

        const bodies = rigidBodies as ArcadeRigidBody[];
        // ---------------------------------------
        // 1. Carry by previous support
        // ---------------------------------------

        for (const body of bodies) {

            if (
                body.type === ArcadeRigidBodyType.DYNAMIC &&
                body.support?.type === ArcadeRigidBodyType.KINEMATIC
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
                        this.detectCollision(a, b);

                    if (!collision) {
                        continue;
                    }

                    this.resolveCollision(a,b,collision);

                    // ---------------------------------------
                    // Визначаємо support на останній ітерації
                    // ---------------------------------------

                    if (
                        iteration ===
                        SOLVER_ITERATIONS - 1
                    ) {
                        this.resolveSupport(
                            a,
                            b,
                            collision
                        );
                    }
                }
            }
        }

        for (const body of bodies) {
            this.applyFriction(body, dt);
        }
    }

    private detectCollision(
        a: ArcadeRigidBody,
        b: ArcadeRigidBody
    ): Collision | null {

        // Межі першого об'єкта
        const aLeft   = a.position.x;
        const aRight  = a.position.x + a.size.w;
        const aTop    = a.position.y;
        const aBottom = a.position.y + a.size.h;

        // Межі другого об'єкта
        const bLeft   = b.position.x;
        const bRight  = b.position.x + b.size.w;
        const bTop    = b.position.y;
        const bBottom = b.position.y + b.size.h;

        // ---------------------------------------
        // Перевіряємо, чи є перетин
        // ---------------------------------------

        const overlapX =
            Math.min(aRight, bRight) -
            Math.max(aLeft, bLeft);

        const overlapY =
            Math.min(aBottom, bBottom) -
            Math.max(aTop, bTop);


        // Немає колізії
        if (overlapX <= 0 || overlapY <= 0) {
            return null;
        }


        // ---------------------------------------
        // Вибираємо вісь найменшого проникнення
        // ---------------------------------------

        // Якщо по X проникнення менше,
        // значить розсувати об'єкти треба по X.
        if (overlapX < overlapY) {

            // A знаходиться лівіше B
            if (a.position.x < b.position.x) {

                return {
                    normal: new Vector2(-1, 0),
                    depth: overlapX
                };

            } else {

                return {
                    normal: new Vector2(1, 0), // todo cache
                    depth: overlapX
                };
            }
        }


        // Інакше розсуваємо по Y.

        // A знаходиться вище B
        if (a.position.y < b.position.y) {

            return {
                normal: new Vector2(0, -1),
                depth: overlapY
            };

        } else {

            return {
                normal: new Vector2(0, 1),
                depth: overlapY
            };
        }
    }

    private integratePhysics(body: ArcadeRigidBody, dt: number) {

        const seconds = dt / 1000;
        body.frameMovement.xy(0, 0);

        if (body.type === ArcadeRigidBodyType.STATIC) {
            return;
        }

        // Gravity тільки для dynamic
        if (body.type === ArcadeRigidBodyType.DYNAMIC) {
            body.velocity.y +=
                this.gravity * seconds;
        }

        // І dynamic, і kinematic рухаються
        const dx =
            body.velocity.x * seconds;

        const dy =
            body.velocity.y * seconds;

        body.position.x += dx;
        body.position.y += dy;

        body.frameMovement.xy(dx, dy);
    }

    private resolveSupport(
        a: ArcadeRigidBody,
        b: ArcadeRigidBody,
        collision: Collision
    ) {
        const { normal } = collision;

        // A стоїть на B
        if (
            normal.y === -1 &&
            a.type === ArcadeRigidBodyType.DYNAMIC
        ) {
            a.support = b;
        }

        // B стоїть на A
        if (
            normal.y === 1 &&
            b.type === ArcadeRigidBodyType.DYNAMIC
        ) {
            b.support = a;
        }
    }

    public applyFriction(body: ArcadeRigidBody, dt: number) {
        if (body.type !== ArcadeRigidBodyType.DYNAMIC) {
            return;
        }

        if (!body.support) {
            return;
        }

        const seconds = dt / 1000;

        const frictionDelta =
            body.friction * seconds;

        if (body.velocity.x > 0) {
            body.velocity.x =
                Math.max(
                    0,
                    body.velocity.x - frictionDelta
                );
        } else if (body.velocity.x < 0) {
            body.velocity.x =
                Math.min(
                    0,
                    body.velocity.x + frictionDelta
                );
        }
    }

    private getInverseMass(body: ArcadeRigidBody): number {

        if (body.type !== ArcadeRigidBodyType.DYNAMIC) {
            return 0;
        }

        if (body.mass <= 0) {
            throw new Error(
                'Dynamic rigid body must have mass > 0'
            );
        }

        return 1 / body.mass;
    }

    private resolveCollision(
        a: ArcadeRigidBody,
        b: ArcadeRigidBody,
        collision: Collision
    ) {
        const { normal, depth } = collision;

        const invMassA = this.getInverseMass(a);
        const invMassB = this.getInverseMass(b);

        const invMassSum = invMassA + invMassB;

        // Обидва static
        if (invMassSum === 0) {
            return;
        }


        // ---------------------------------------
        // 1. Position correction
        // ---------------------------------------

        const SLOP = 0.001;
        const PERCENT = 1.0;

        const correctionDepth =
            Math.max(depth - SLOP, 0) * PERCENT;

        const correction =
            correctionDepth / invMassSum;

        a.position.x +=
            normal.x * correction * invMassA;

        a.position.y +=
            normal.y * correction * invMassA;

        b.position.x -=
            normal.x * correction * invMassB;

        b.position.y -=
            normal.y * correction * invMassB;


        // ---------------------------------------
        // 2. Relative velocity
        // ---------------------------------------

        const relativeVelocityX =
            a.velocity.x - b.velocity.x;

        const relativeVelocityY =
            a.velocity.y - b.velocity.y;

        const velocityAlongNormal =
            relativeVelocityX * normal.x +
            relativeVelocityY * normal.y;


        // Якщо тіла вже розходяться —
        // нічого робити не треба.
        if (velocityAlongNormal >= 0) {
            return;
        }


        // ---------------------------------------
        // 3. Collision impulse
        // ---------------------------------------

        const impulseMagnitude =
            -velocityAlongNormal / invMassSum;

        const impulseX =
            normal.x * impulseMagnitude;

        const impulseY =
            normal.y * impulseMagnitude;


        a.velocity.x +=
            impulseX * invMassA;

        a.velocity.y +=
            impulseY * invMassA;

        b.velocity.x -=
            impulseX * invMassB;

        b.velocity.y -=
            impulseY * invMassB;
    }

}
