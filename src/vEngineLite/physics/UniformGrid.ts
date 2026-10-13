import {ArcadeRigidBody, ArcadeRigidBodyType} from "./ArcadePhysics";

type BodyPair = [ArcadeRigidBody, ArcadeRigidBody];

interface IndexedBodyState {
    minCellX: number;
    minCellY: number;
    maxCellX: number;
    maxCellY: number;
    type: ArcadeRigidBodyType;
    collisionGroup: number;
    collideWithGroup: number;
    ignoreCollisionWithGroup: number;
    nonBlockingCollisionWithGroup: number;
}

export class UniformGrid {

    private readonly cells = new Map<number, Map<number, ArcadeRigidBody[]>>();
    private readonly pairKeys = new Set<number>();
    private readonly pairs: BodyPair[] = [];
    private readonly indexedStates = new Map<number, IndexedBodyState>();
    private readonly inverseCellSize: number;
    private indexedBodyCount = 0;

    constructor(
        private readonly cellSize: number
    ) {
        this.inverseCellSize = 1 / cellSize;
    }

    public getPotentialPairs(bodies: ArcadeRigidBody[]): BodyPair[] {

        this.cells.clear();
        this.pairKeys.clear();
        this.pairs.length = 0;
        this.indexedStates.clear();
        this.indexedBodyCount = bodies.length;

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

    public havePotentialPairsChanged(bodies: ArcadeRigidBody[]) {
        if (bodies.length !== this.indexedBodyCount) {
            return true;
        }

        for (const body of bodies) {
            const indexed = this.indexedStates.get(body.id);
            if (!indexed) {
                return true;
            }

            const current = this.getIndexedBodyState(body);
            if (
                current.minCellX !== indexed.minCellX ||
                current.minCellY !== indexed.minCellY ||
                current.maxCellX !== indexed.maxCellX ||
                current.maxCellY !== indexed.maxCellY ||
                current.type !== indexed.type ||
                current.collisionGroup !== indexed.collisionGroup ||
                current.collideWithGroup !== indexed.collideWithGroup ||
                current.ignoreCollisionWithGroup !== indexed.ignoreCollisionWithGroup ||
                current.nonBlockingCollisionWithGroup !== indexed.nonBlockingCollisionWithGroup
            ) {
                return true;
            }
        }

        return false;
    }

    private insertBody(body: ArcadeRigidBody) {
        const inverseCellSize = this.inverseCellSize;

        const state = this.getIndexedBodyState(body);
        this.indexedStates.set(body.id, state);

        for (
            let cellX = state.minCellX;
            cellX <= state.maxCellX;
            cellX++
        ) {
            for (
                let cellY = state.minCellY;
                cellY <= state.maxCellY;
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

    private getIndexedBodyState(body: ArcadeRigidBody): IndexedBodyState {
        const posX = body.target.position.x + body.rect.x;
        const posY = body.target.position.y + body.rect.y;

        return {
            minCellX: Math.floor(posX * this.inverseCellSize),
            minCellY: Math.floor(posY * this.inverseCellSize),
            maxCellX: Math.floor((posX + body.rect.width) * this.inverseCellSize),
            maxCellY: Math.floor((posY + body.rect.height) * this.inverseCellSize),
            type: body.type,
            collisionGroup: body.collisionGroup.bitMask,
            collideWithGroup: body.collideWithGroup.bitMask,
            ignoreCollisionWithGroup: body.ignoreCollisionWithGroup.bitMask,
            nonBlockingCollisionWithGroup: body.nonBlockingCollisionWithGroup.bitMask
        };
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
