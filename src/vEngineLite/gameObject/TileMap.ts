import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {Size} from "../utils/Size";
import {Vector2} from "../utils/Vector2";
import {Texture} from "../rendering/Texture";
import {TextureInfo} from "../components/TextureInfo";
import {Color} from "../rendering/Color";
import {RenderableContainer} from "./base/RenderableContainer";
import {Scene} from "../application/Scene";
import {RigidBody} from "../physics/IPhysics";
import {ArcadeRigidBodyType} from "../physics/ArcadePhysics";
import {IGeometry} from "../types";

export interface ITileLayer {
    data: number[];
}

interface Tile extends IGeometry {
    readonly size: Size;
    readonly position: Vector2;
    readonly uv: Vector2;
}

interface RenderableLayer {
    readonly tiles: Tile[];
}

export class TileMap extends RenderableContainer {

    public override readonly position: never;
    public override readonly scale: never;
    public override readonly pivot: never;

    private readonly renderableLayers: RenderableLayer[] = [];
    private readonly spriteRenderer: TextureInfo;
    private readonly tileSize: Size;
    private readonly bodies:RigidBody[] = [];
    private readonly mapHeightInTiles: number;


    constructor(
        scene: Scene,
        private readonly layers: ITileLayer[],
        private readonly mapWidthInTiles: number,
        tilesetCols: number,
        tilesetRows: number,
        texture: Texture
    ) {
        super(scene);
        const tileWidth = Math.floor(texture.width / tilesetCols);
        const tileHeight = Math.floor(texture.height / tilesetRows);
        this.mapHeightInTiles = Math.ceil(layers[0].data.length / this.mapWidthInTiles);

        this.spriteRenderer = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(Math.max(0, tileWidth - 1), Math.max(0, tileHeight - 1)),
            },
            color: Color.WHITE(),
        }
        this.tileSize = new Size(tileWidth, tileHeight);

        for (const layer of layers) {
            const tiles = this.createTiles(
                layer.data,
                mapWidthInTiles,
                tilesetCols,
                tileWidth,
                tileHeight
            );
            this.renderableLayers.push({tiles});
        }

        this.size.wh(mapWidthInTiles * tileWidth, this.mapHeightInTiles * tileHeight)
    }

    public createCollisionBodies(solidTiles: number[]) {
        for (const layer of this.layers) {
            this.createMergedCollisionBodies(
                layer.data, this.mapWidthInTiles,
                this.mapHeightInTiles,
                this.tileSize.w,
                this.tileSize.h,
                solidTiles
            );
        }
    }


    override update(dt: number) {
        super.update(dt);
        for (const body of this.bodies) {
            this.scene.app.physics.updateBody(body, dt);
        }
    }

    public override render(renderer: TriangleBatchRenderer) {
        const worldMatrix = this.getWorldMatrix();
        for (const layer of this.renderableLayers) {
            for (const tile of layer.tiles) {
                this.spriteRenderer.rect.uv.uv(tile.uv.u + 0.5, tile.uv.v + 0.5);
                renderer.batchSprite(
                    this.tileSize,
                    this.spriteRenderer,
                    worldMatrix,
                    tile.position.x, tile.position.y
                );
            }
        }
    }


    private createTiles(
        data: number[],
        mapWidthInTiles: number,
        tilesetCols: number,
        tileWidth: number,
        tileHeight: number
    ) {
        const tiles: Tile[] = [];
        for (let i = 0; i < data.length; i++) {
            let tileIndex = data[i];
            if (tileIndex === 0) continue; // Припускаємо, що 0 - це порожній тайл
            tileIndex--; // рахунок саміх тайлів також починається з 0

            const tile:Tile = {
                position: new Vector2(
                    (i % mapWidthInTiles) * tileWidth,
                    Math.floor(i / mapWidthInTiles) * tileHeight
                ),
                uv: new Vector2(
                    (tileIndex % tilesetCols) * tileWidth,
                    Math.floor(tileIndex / tilesetCols) * tileHeight
                ),
                size: this.tileSize,
            };
            tiles.push(tile);
        }
        return tiles;
    }

    private createMergedCollisionBodies(
        data: number[],
        mapWidthInTiles: number,
        mapHeightInTiles: number,
        tileWidth: number,
        tileHeight: number,
        solidTiles: number[]
    ) {
        const visited =
            new Array(data.length).fill(false);

        const isSolid = (
            x: number,
            y: number
        ): boolean => {
            if (
                x < 0 ||
                y < 0 ||
                x >= mapWidthInTiles ||
                y >= mapHeightInTiles
            ) {
                return false;
            }

            const index =
                y * mapWidthInTiles + x;

            return (
                solidTiles.includes(data[index]) &&
                !visited[index]
            );
        };


        for (
            let y = 0;
            y < mapHeightInTiles;
            y++
        ) {
            for (
                let x = 0;
                x < mapWidthInTiles;
                x++
            ) {

                if (!isSolid(x, y)) {
                    continue;
                }

                // --------------------------------
                // 1. Шукаємо ширину
                // --------------------------------

                let width = 1;

                while (
                    isSolid(x + width, y)
                    ) {
                    width++;
                }


                // --------------------------------
                // 2. Шукаємо висоту
                // --------------------------------

                let height = 1;

                while (true) {
                    const nextY = y + height;

                    if (
                        nextY >= mapHeightInTiles
                    ) {
                        break;
                    }

                    let fullRow = true;

                    for (
                        let dx = 0;
                        dx < width;
                        dx++
                    ) {
                        if (
                            !isSolid(x + dx, nextY)
                        ) {
                            fullRow = false;
                            break;
                        }
                    }

                    if (!fullRow) {
                        break;
                    }

                    height++;
                }


                // --------------------------------
                // 3. Позначаємо тайли використаними
                // --------------------------------

                for (
                    let dy = 0;
                    dy < height;
                    dy++
                ) {
                    for (
                        let dx = 0;
                        dx < width;
                        dx++
                    ) {
                        const index =
                            (y + dy) *
                            mapWidthInTiles +
                            (x + dx);

                        visited[index] = true;
                    }
                }


                // --------------------------------
                // 4. Створюємо один collider
                // --------------------------------

                this.createCollisionBody(
                    x * tileWidth,
                    y * tileHeight,
                    width * tileWidth,
                    height * tileHeight
                );
            }
        }
    }

    private createCollisionBody(
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        const target: IGeometry = {
            position: new Vector2(x, y),
            size: new Size(width, height),
        };

        this.bodies.push(
            this.scene.app.physics.createRigidBody({
                type: ArcadeRigidBodyType.STATIC,
                target
            })
        );
    }

}
