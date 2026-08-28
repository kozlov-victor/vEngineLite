import {Vector2} from "../utils/Vector2";
import {Size} from "../utils/Size";

interface Collision {
    normal: Vector2;
    depth: number;
}

export enum BodyType {
    STATIC,
    DYNAMIC,
    KINEMATIC
}


export interface RigidBody {
    readonly position: Vector2;
    readonly size: Size;
    readonly velocity: Vector2;
    readonly frameMovement: Vector2;
    support?: RigidBody;
    type: BodyType;
    mass: number;
}

export class ArcadePhysics {

    public gravity = 300; // px/s²

    public detectCollision(
        a: RigidBody,
        b: RigidBody
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

    public integratePhysics(body: RigidBody, dt: number) {

        const seconds = dt / 1000;
        body.frameMovement.xy(0, 0);

        if (body.type === BodyType.STATIC) {
            return;
        }

        // Gravity тільки для dynamic
        if (body.type === BodyType.DYNAMIC) {
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

    public resolveSupport(
        a: RigidBody,
        b: RigidBody,
        collision: Collision
    ) {
        const { normal } = collision;

        // A стоїть на B
        if (
            normal.y === -1 &&
            a.type === BodyType.DYNAMIC
        ) {
            a.support = b;
        }

        // B стоїть на A
        if (
            normal.y === 1 &&
            b.type === BodyType.DYNAMIC
        ) {
            b.support = a;
        }
    }

    private getInverseMass(body: RigidBody): number {

        if (body.type !== BodyType.DYNAMIC) {
            return 0;
        }

        if (body.mass <= 0) {
            throw new Error(
                'Dynamic rigid body must have mass > 0'
            );
        }

        return 1 / body.mass;
    }

    public resolveCollision(
        a: RigidBody,
        b: RigidBody,
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
