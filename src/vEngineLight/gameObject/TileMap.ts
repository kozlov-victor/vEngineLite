import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {Size} from "../utils/Size";
import {Vector2} from "../utils/Vector2";
import {Mat2d} from "../utils/Mat2d";
import {Texture} from "../rendering/Texture";
import {TextureInfo} from "../components/TextureInfo";
import {Color} from "../rendering/Color";
import {RenderableContainer} from "./base/RenderableContainer";
import {Scene} from "../application/Scene";
import {RigidBody} from "../physics/IPhysics";
import {ArcadeRigidBodyType} from "../physics/ArcadePhysics";
import {IGeometry} from "../types";

const epsilon = 0.3;

// Спрощена структура для зберігання даних тайла
interface Tile extends IGeometry {
    readonly size: Size;
    readonly position: Vector2;
    readonly uv: Vector2;
}

export class TileMap extends RenderableContainer {

    private readonly tiles: Tile[] = [];
    private readonly spriteRenderer: TextureInfo;
    private readonly tileSize: Size;
    private readonly bodies:RigidBody[] = [];

    // Матриці для розрахунків, щоб не створювати їх у циклі render
    private readonly localTileMatrix = new Mat2d();
    private readonly worldTileMatrix = new Mat2d();

    constructor(
        scene: Scene,
        data: number[],
        mapWidthInTiles: number,
        tilesetCols: number,
        tilesetRows: number,
        texture: Texture
    ) {
        super(scene);
        const tileWidth = Math.floor(texture.width / tilesetCols);
        const tileHeight = Math.floor(texture.height / tilesetRows);
        const mapHeightInTiles = Math.ceil(data.length / mapWidthInTiles);

        this.spriteRenderer = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(tileWidth, tileHeight),
            },
            color: Color.WHITE(),
        }
        this.tileSize = new Size(tileWidth + epsilon, tileHeight + epsilon);

        this.createTiles(data, mapWidthInTiles, tilesetCols, tileWidth, tileHeight);
        this.createMergedCollisionBodies(data, mapWidthInTiles, mapHeightInTiles, tileWidth, tileHeight);
        this.size.wh(mapWidthInTiles * tileWidth, mapHeightInTiles * tileHeight)
    }


    override update(dt: number) {
        super.update(dt);
        for (const body of this.bodies) {
            this.scene.app.physics.updateBody(body, dt);
        }
    }

    public override render(renderer: TriangleBatchRenderer) {
        // 1. Отримуємо світову матрицю для всієї карти ОДИН РАЗ
        const tilemapWorldMatrix = this.getWorldMatrix();

        for (const tile of this.tiles) {
            // 2. Створюємо локальну матрицю для тайла (без створення нових об'єктів)
            Mat2d.fromTranslation(tile.position.x, tile.position.y, this.localTileMatrix);

            // 3. Множимо матрицю карти на локальну матрицю тайла
            tilemapWorldMatrix.multiply(this.localTileMatrix, this.worldTileMatrix);

            // 4. Відправляємо в рендерер фінальну матрицю
            this.spriteRenderer.rect.uv.uv(tile.uv.u, tile.uv.v);
            renderer.batchSprite(
                this.tileSize,
                this.spriteRenderer,
                this.worldTileMatrix
            );
        }
    }


    private createTiles(
        data: number[],
        mapWidthInTiles: number,
        tilesetCols: number,
        tileWidth: number,
        tileHeight: number
    ) {
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

            this.tiles.push(tile);
        }
    }

    private createMergedCollisionBodies(
        data: number[],
        mapWidthInTiles: number,
        mapHeightInTiles: number,
        tileWidth: number,
        tileHeight: number
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
                data[index] !== 0 &&
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
