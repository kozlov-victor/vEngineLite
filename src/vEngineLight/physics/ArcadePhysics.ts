import {Vector2} from "../utils/Vector2";
import {Size} from "../utils/Size";

interface Collision {
    normal: Vector2;
    depth: number;
}

export interface RigidBody {
    readonly position: Vector2;
    readonly size: Size;
    readonly velocity: Vector2;
    static: boolean;
}

export class ArcadePhysics {

    public readonly gravity = 300; // px/s²

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

    public applyGravity(body: RigidBody, dt: number) {
        if (body.static) return;
        body.velocity.y += this.gravity * dt / 1000;
    }

    public resolveCollision(
        a: RigidBody,
        b: RigidBody,
        collision: Collision
    ) {
        const { normal, depth } = collision;

        // ---------------------------------------
        // 1. Обидва статичні
        // ---------------------------------------

        // Нерухомі об'єкти не треба виправляти.
        if (a.static && b.static) {
            return;
        }


        // ---------------------------------------
        // 2. Корекція позиції
        // ---------------------------------------

        if (a.static) {

            // A нерухомий, тому рухаємо тільки B.
            b.position.x -= normal.x * depth;
            b.position.y -= normal.y * depth;

        } else if (b.static) {

            // B нерухомий, тому рухаємо тільки A.
            a.position.x += normal.x * depth;
            a.position.y += normal.y * depth;

        } else {

            // Обидва рухомі.
            // Розділяємо correction між ними.
            const halfDepth = depth * 0.5;

            a.position.x += normal.x * halfDepth;
            a.position.y += normal.y * halfDepth;

            b.position.x -= normal.x * halfDepth;
            b.position.y -= normal.y * halfDepth;
        }


        // ---------------------------------------
        // 3. Корекція швидкості
        // ---------------------------------------

        if (a.static) {
            this.resolveVelocityIntoSurface(b, normal);
        } else if (b.static) {
            this.resolveVelocityIntoSurface(a, normal);
        } else {
            // Обидва рухаються.
            this.resolveDynamicVelocities(a, b, normal);
        }
    }

    private resolveVelocityIntoSurface(
        body: RigidBody,
        normal: Vector2
    ) {
        // Проекція швидкості на нормаль.
        const velocityNormal =
            body.velocity.x * normal.x +
            body.velocity.y * normal.y;

        // Якщо velocityNormal < 0,
        // тіло рухається в поверхню.
        if (velocityNormal < 0) {

            body.velocity.x -=
                normal.x * velocityNormal;

            body.velocity.y -=
                normal.y * velocityNormal;
        }
    }

    private resolveDynamicVelocities(
        a: RigidBody,
        b: RigidBody,
        normal: Vector2
    ) {
        // Відносна швидкість A відносно B.
        const relativeVelocityX =
            a.velocity.x - b.velocity.x;

        const relativeVelocityY =
            a.velocity.y - b.velocity.y;

        // Швидкість зближення вздовж нормалі.
        const velocityNormal =
            relativeVelocityX * normal.x +
            relativeVelocityY * normal.y;

        // Об'єкти вже розходяться.
        if (velocityNormal >= 0)
            return;

        // Для найпростішої моделі
        // ділимо імпульс порівну.
        const impulse = -velocityNormal * 0.5;

        a.velocity.x += normal.x * impulse;
        a.velocity.y += normal.y * impulse;

        b.velocity.x -= normal.x * impulse;
        b.velocity.y -= normal.y * impulse;
    }

}
