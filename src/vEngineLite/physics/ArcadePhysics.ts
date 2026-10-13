import {Vector2} from "../utils/Vector2";
import {IPhysics, IRigidBodyParams, RigidBody} from "./IPhysics";
import {IFrame} from "../types";
import {UniformGrid} from "./UniformGrid";

interface Collision {
    normal: Vector2;
    depth: number;
}

export enum ArcadeRigidBodyType {
    STATIC,
    DYNAMIC,
    KINEMATIC
}

export type {ArcadeRigidBody}

class ArcadeRigidBody extends RigidBody {
    readonly id: number;
    type: ArcadeRigidBodyType;
    readonly frameMovement = new Vector2();
    support?: ArcadeRigidBody;
    mass: number;
    friction: number; // px/s²

    constructor(params: ArcadeRigidBodyParams, id: number) {
        super(params);
        this.id = id;
        this.type = params.type;
        this.mass = params.mass ?? 1;
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


export interface ArcadeRigidBodyParams extends IRigidBodyParams {
    rect?: IFrame;
    velocity?: Vector2;
    type: ArcadeRigidBodyType,
    mass?: number;
    friction?: number; // px/s²
}

const cachedNormal = new Vector2();

export class ArcadePhysics implements IPhysics<ArcadeRigidBodyParams, ArcadeRigidBody> {

    public gravity = 300;

    private nextId = 0;
    private readonly carried  = new Set<number>();
    private readonly collisionEvents = new Set<string>();
    private readonly uniformGrid = new UniformGrid(128);
    private readonly allRigidBodies: ArcadeRigidBody[] = [];

    public createRigidBody(params: ArcadeRigidBodyParams): ArcadeRigidBody {
        return new ArcadeRigidBody(params,this.nextId++);
    }

    public updateBody(body: RigidBody, _dt: number): void {
        const arcadeRigidBody = body as ArcadeRigidBody;
        this.allRigidBodies.push(arcadeRigidBody);
    }

    public prepareWorld(dt: number): void {
        this.allRigidBodies.length = 0;
    }

    public updateWorld(dt: number): void {

        const carried = this.carried;
        this.collisionEvents.clear();
        const bodies = this.allRigidBodies;
        const substepCount = this.getSubstepCount(bodies, dt);
        const substepDt = dt / substepCount;

        for (let substep = 0; substep < substepCount; substep++) {
            for (const body of bodies) {
                this.integratePhysics(body, substepDt);
            }

            // Carry bodies by their supports before rebuilding support contacts.
            carried.clear();
            for (const body of bodies) {
                this.applySupportMovement(body, carried);
            }

            for (const body of bodies) {
                body.support = undefined;
            }


            const SOLVER_ITERATIONS = 4;
            let pairs = this.uniformGrid.getPotentialPairs(bodies);

            for (
                let iteration = 0;
                iteration < SOLVER_ITERATIONS;
                iteration++
            ) {
                if (
                    iteration > 0 &&
                    this.uniformGrid.havePotentialPairsChanged(bodies)
                ) {
                    pairs = this.uniformGrid.getPotentialPairs(bodies);
                }

                let solverChanged = false;
                for (const body of bodies) {
                    body.support = undefined;
                }

                for (const [a, b] of pairs) {
                    const collision = this.detectCollision(a, b);
                    if (!collision) continue;

                    solverChanged = this.resolveCollision(a,b,collision) || solverChanged;
                    const pairKey = this.getCollisionPairKey(a, b);
                    if (!this.collisionEvents.has(pairKey)) {
                        this.collisionEvents.add(pairKey);
                        a.onCollided?.(b);
                        b.onCollided?.(a);
                        solverChanged = true;
                    }

                    this.resolveSupport(a,b,collision);
                }

                if (!solverChanged) {
                    break;
                }
            }
        }

        for (const body of bodies) {
            this.applyFriction(body, dt);
        }
    }

    private getCollisionPairKey(a: ArcadeRigidBody, b: ArcadeRigidBody) {
        return a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
    }

    private getSubstepCount(bodies: ArcadeRigidBody[], dt: number) {
        let minimumExtent = Number.POSITIVE_INFINITY;
        let maximumMovement = 0;
        const seconds = dt / 1000;

        for (const body of bodies) {
            if (body.rect.width <= 0 || body.rect.height <= 0) {
                continue;
            }

            minimumExtent = Math.min(
                minimumExtent,
                body.rect.width,
                body.rect.height
            );

            if (body.type === ArcadeRigidBodyType.STATIC) {
                continue;
            }

            const velocityY = body.velocity.y +
                (body.type === ArcadeRigidBodyType.DYNAMIC
                    ? this.gravity * body.gravityFactor * seconds
                    : 0);
            maximumMovement = Math.max(
                maximumMovement,
                Math.abs(body.velocity.x * seconds),
                Math.abs(velocityY * seconds)
            );
        }

        if (!Number.isFinite(minimumExtent) || minimumExtent <= 0) {
            return 1;
        }

        return Math.max(1, Math.ceil(maximumMovement / (minimumExtent * 0.5)));
    }

    private detectCollision(a: ArcadeRigidBody, b: ArcadeRigidBody): Collision | null {

        // Межі першого об'єкта
        const aPos    = a.target.position;
        const aLeft   = aPos.x + a.rect.x;
        const aRight  = aLeft + a.rect.width;
        const aTop    = aPos.y + a.rect.y;
        const aBottom = aTop + a.rect.height;

        // Межі другого об'єкта
        const bPos = b.target.position;
        const bLeft   = bPos.x + b.rect.x;
        const bRight  = bLeft + b.rect.width;
        const bTop    = bPos.y + b.rect.y;
        const bBottom = bTop + b.rect.height;

        const aCenterX = (aLeft + aRight) * 0.5;
        const bCenterX = (bLeft + bRight) * 0.5;
        const aCenterY = (aTop + aBottom) * 0.5;
        const bCenterY = (bTop + bBottom) * 0.5;

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
            if (aCenterX < bCenterX) {
                cachedNormal.xy(-1, 0);
                return {
                    normal: cachedNormal,
                    depth: overlapX
                }
            } else {
                cachedNormal.xy(1, 0);
                return {
                    normal: cachedNormal,
                    depth: overlapX
                }
            }
        }


        // Інакше розсуваємо по Y.

        // A знаходиться вище B
        if (aCenterY < bCenterY) {
            cachedNormal.xy(0, -1);
            return {
                normal: cachedNormal,
                depth: overlapY
            }
        } else {
            cachedNormal.xy(0, 1);
            return {
                normal: cachedNormal,
                depth: overlapY
            }
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
                this.gravity * body.gravityFactor * seconds;
        }

        // І dynamic, і kinematic рухаються
        const dx =
            body.velocity.x * seconds;

        const dy =
            body.velocity.y * seconds;

        body.target.position.x += dx;
        body.target.position.y += dy;

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
    ): boolean {
        if (this.isNonBlockingCollision(a, b)) {
            return false;
        }

        const { normal, depth } = collision;

        const invMassA = this.getInverseMass(a);
        const invMassB = this.getInverseMass(b);

        const invMassSum = invMassA + invMassB;


        // ---------------------------------------
        // 1. Position correction
        // ---------------------------------------

        const SLOP = 0.001;
        const PERCENT = 0.8;

        const correctionDepth =
            Math.max(depth - SLOP, 0) * PERCENT;

        const correction =
            correctionDepth / invMassSum;

        a.target.position.x +=
            normal.x * correction * invMassA;

        a.target.position.y +=
            normal.y * correction * invMassA;

        b.target.position.x -=
            normal.x * correction * invMassB;

        b.target.position.y -=
            normal.y * correction * invMassB;

        const positionChanged = correctionDepth > 0;

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
            return positionChanged;
        }


        // ---------------------------------------
        // 3. Collision impulse
        // ---------------------------------------

        const restitution = (a.restitution + b.restitution)/2;

        const impulseMagnitude =
            -(1 + restitution) *
            velocityAlongNormal /
            invMassSum;

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

        return true;
    }

    private isNonBlockingCollision(a: ArcadeRigidBody, b: ArcadeRigidBody) {
        return (
            (a.collisionGroup.bitMask & b.nonBlockingCollisionWithGroup.bitMask) !== 0 ||
            (b.collisionGroup.bitMask & a.nonBlockingCollisionWithGroup.bitMask) !== 0
        );
    }

    private applySupportMovement(
        body: ArcadeRigidBody,
        carried: Set<number>
    ) {
        if (body.type !== ArcadeRigidBodyType.DYNAMIC) {
            return;
        }

        if (!body.support) {
            return;
        }

        if (carried.has(body.id)) {
            return;
        }

        // Захист від циклів.
        carried.add(body.id);

        // Спочатку переносимо support,
        // щоб його frameMovement вже містив
        // успадкований рух нижчих support'ів.
        this.applySupportMovement(
            body.support,
            carried
        );

        const dx =
            body.support.frameMovement.x;

        const dy =
            body.support.frameMovement.y;

        body.target.position.x += dx;
        body.target.position.y += dy;

        // Успадкований рух стає частиною
        // frameMovement цього body.
        body.frameMovement.x += dx;
        body.frameMovement.y += dy;
    }

}
