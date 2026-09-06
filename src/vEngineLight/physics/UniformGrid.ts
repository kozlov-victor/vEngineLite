import {ArcadeRigidBody, ArcadeRigidBodyType} from "./ArcadePhysics";

type BodyPair = [ArcadeRigidBody, ArcadeRigidBody];

export class UniformGrid {

    private readonly cells = new Map<string, ArcadeRigidBody[]>();
    private readonly pairKeys = new Set<string>();

    constructor(
        private readonly cellSize: number
    ) {}

    public getPotentialPairs(bodies: ArcadeRigidBody[]): BodyPair[] {

        this.cells.clear();
        this.pairKeys.clear();

        for (const body of bodies) {
            this.insertBody(body);
        }

        const pairs: BodyPair[] = [];
        const pairKeys = this.pairKeys;

        this.cells.forEach(cellBodies => {
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

                    if (
                        a.type !== ArcadeRigidBodyType.DYNAMIC &&
                        b.type !== ArcadeRigidBodyType.DYNAMIC
                    ) {
                        continue;
                    }

                    const pairKey = this.getPairKey(a, b);

                    if (pairKeys.has(pairKey)) {
                        continue;
                    }

                    pairKeys.add(pairKey);

                    pairs.push([a, b]);
                }
            }
        });

        return pairs;
    }


    private insertBody(body: ArcadeRigidBody) {

        const posX = body.target.position.x + body.rect.x;
        const posY = body.target.position.y + body.rect.y;

        const minCellX =
            Math.floor(
                posX /
                this.cellSize
            );

        const minCellY =
            Math.floor(
                posY /
                this.cellSize
            );

        const maxCellX =
            Math.floor(
                (
                    posX +
                    body.rect.width
                ) /
                this.cellSize
            );

        const maxCellY =
            Math.floor(
                (
                    posY +
                    body.rect.height
                ) /
                this.cellSize
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

                const key =
                    this.getCellKey(
                        cellX,
                        cellY
                    );

                let cell = this.cells.get(key);

                if (!cell) {
                    cell = [];
                    this.cells.set(key, cell);
                }

                cell.push(body);
            }
        }
    }


    private getCellKey(
        x: number,
        y: number
    ): string {
        return `${x}:${y}`;
    }


    private getPairKey(
        a: ArcadeRigidBody,
        b: ArcadeRigidBody
    ): string {

        if (a.id < b.id) {
            return `${a.id}:${b.id}`;
        }

        return `${b.id}:${a.id}`;
    }
}
