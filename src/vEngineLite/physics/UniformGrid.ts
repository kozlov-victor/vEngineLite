import {ArcadeRigidBody, ArcadeRigidBodyType} from "./ArcadePhysics";

type BodyPair = [ArcadeRigidBody, ArcadeRigidBody];

export class UniformGrid {

    private readonly cells = new Map<number, Map<number, ArcadeRigidBody[]>>();
    private readonly pairKeys = new Set<number>();
    private readonly pairs: BodyPair[] = [];
    private readonly inverseCellSize: number;

    constructor(
        private readonly cellSize: number
    ) {
        this.inverseCellSize = 1 / cellSize;
    }

    public getPotentialPairs(bodies: ArcadeRigidBody[]): BodyPair[] {

        this.cells.clear();
        this.pairKeys.clear();
        this.pairs.length = 0;

        let maxBodyId = 0;

        for (const body of bodies) {
            this.insertBody(body);
            if (body.id > maxBodyId) {
                maxBodyId = body.id;
            }
        }

        const pairStride = maxBodyId + 1;
        const pairs = this.pairs;
        const pairKeys = this.pairKeys;

        this.cells.forEach(column => {
            column.forEach(cellBodies => {
                this.collectCellPairs(cellBodies, pairStride, pairKeys, pairs);
            });
        });

        return pairs;
    }


    private insertBody(body: ArcadeRigidBody) {
        const inverseCellSize = this.inverseCellSize;

        const posX = body.target.position.x + body.rect.x;
        const posY = body.target.position.y + body.rect.y;

        const minCellX =
            Math.floor(
                posX *
                inverseCellSize
            );

        const minCellY =
            Math.floor(
                posY *
                inverseCellSize
            );

        const maxCellX =
            Math.floor(
                (
                    posX +
                    body.rect.width
                ) *
                inverseCellSize
            );

        const maxCellY =
            Math.floor(
                (
                    posY +
                    body.rect.height
                ) *
                inverseCellSize
            );

        for (
            let cellX = minCellX;
            cellX <= maxCellX;
            cellX++
        ) {
            for (
                let cellY = minCellY;
                cellY <= maxCellY;
                cellY++
            ) {
                let column = this.cells.get(cellX);

                if (!column) {
                    column = new Map<number, ArcadeRigidBody[]>();
                    this.cells.set(cellX, column);
                }

                let cell = column.get(cellY);

                if (!cell) {
                    cell = [];
                    column.set(cellY, cell);
                }

                cell.push(body);
            }
        }
    }

    private collectCellPairs(
        cellBodies: ArcadeRigidBody[],
        pairStride: number,
        pairKeys: Set<number>,
        pairs: BodyPair[]
    ) {
        for (
            let i = 0;
            i < cellBodies.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < cellBodies.length;
                j++
            ) {
                const a = cellBodies[i];
                const b = cellBodies[j];

                if (!this.canBodiesSharePair(a, b)) {
                    continue;
                }

                const pairKey = this.getPairKey(a, b, pairStride);

                if (pairKeys.has(pairKey)) {
                    continue;
                }

                pairKeys.add(pairKey);
                pairs.push([a, b]);
            }
        }
    }

    private canBodiesSharePair(a: ArcadeRigidBody, b: ArcadeRigidBody) {
        if (
            a.type !== ArcadeRigidBodyType.DYNAMIC &&
            b.type !== ArcadeRigidBodyType.DYNAMIC
        ) {
            return false;
        }

        const aCollisionGroup = a.collisionGroup.bitMask;
        const bCollisionGroup = b.collisionGroup.bitMask;

        const ignored =
            (aCollisionGroup & b.ignoreCollisionWithGroup.bitMask) !== 0 ||
            (bCollisionGroup & a.ignoreCollisionWithGroup.bitMask) !== 0;

        if (ignored) {
            return false;
        }

        return (
            (aCollisionGroup & b.collideWithGroup.bitMask) !== 0 ||
            (bCollisionGroup & a.collideWithGroup.bitMask) !== 0 ||
            (aCollisionGroup & b.nonBlockingCollisionWithGroup.bitMask) !== 0 ||
            (bCollisionGroup & a.nonBlockingCollisionWithGroup.bitMask) !== 0
        );
    }


    private getPairKey(
        a: ArcadeRigidBody,
        b: ArcadeRigidBody,
        stride: number
    ): number {
        const minId = a.id < b.id ? a.id : b.id;
        const maxId = a.id < b.id ? b.id : a.id;
        return minId * stride + maxId;
    }
}
