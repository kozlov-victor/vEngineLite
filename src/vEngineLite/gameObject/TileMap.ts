import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {Size} from "../utils/Size";
import {Vector2} from "../utils/Vector2";
import {Texture} from "../rendering/Texture";
import {TextureInfo} from "../components/TextureInfo";
import {Color} from "../rendering/Color";
import {RenderableContainer} from "./base/RenderableContainer";
import {Scene} from "../application/Scene";
import {IRigidBodyParamsBase, RigidBody} from "../physics/IPhysics";
import {ArcadeRigidBodyType} from "../physics/ArcadePhysics";
import {IGeometry} from "../types";

export interface ITileAnimationFrame {
    tileId: number;
    duration: number;
}

export interface ITileSet {
    mapWidthInTiles: number,
    tilesetCols: number,
    tilesetRows: number,
    aminatedTiles?: Record<number, ITileAnimationFrame[]>;
}

export interface ITileLayer {
    data: number[];
    parallax?: number;
    parallaxX?: number;
    parallaxY?: number;
}

interface Tile extends IGeometry {
    readonly tileIndex: number;
    readonly size: Size;
    readonly position: Vector2;
    readonly uv: Vector2;
    readonly animated: boolean;
}

interface RenderableLayer {
    readonly tiles: Tile[];
    readonly parallaxX: number;
    readonly parallaxY: number;
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

    private time: number;

    constructor(
        scene: Scene,
        private readonly layers: ITileLayer[],
        private readonly tileSet: ITileSet,
        texture: Texture
    ) {
        super(scene);
        const tileWidth = Math.floor(texture.width / tileSet.tilesetCols);
        const tileHeight = Math.floor(texture.height / tileSet.tilesetRows);
        this.tileSize = new Size(tileWidth, tileHeight);
        this.mapHeightInTiles = Math.ceil(layers[0].data.length / tileSet.mapWidthInTiles);

        this.spriteRenderer = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(Math.max(0, tileWidth - 1), Math.max(0, tileHeight - 1)),
            },
            color: Color.WHITE(),
        }

        for (const layer of layers) {
            const tiles = this.createTiles(
                layer.data,
                this.tileSet
            );
            this.renderableLayers.push({
                tiles,
                parallaxX: layer.parallaxX ?? layer.parallax ?? 1,
                parallaxY: layer.parallaxY ?? layer.parallax ?? 1,
            });
        }

        this.size.wh(this.tileSet.mapWidthInTiles * tileWidth, this.mapHeightInTiles * tileHeight)
    }

    public createCollisionBodies(solidTiles: number[], params?: IRigidBodyParamsBase) {
        for (const layer of this.layers) {
            this.createMergedCollisionBodies(
                layer.data, this.tileSet.mapWidthInTiles,
                this.mapHeightInTiles,
                this.tileSize.w,
                this.tileSize.h,
                solidTiles, params
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
            const parallaxOffsetX =
                this.scene.app.camera.position.x * (1 - layer.parallaxX);
            const parallaxOffsetY =
                this.scene.app.camera.position.y * (1 - layer.parallaxY);
            for (const tile of layer.tiles) {
                if (tile.animated) this.updateAnimatedTileUV(tile);
                this.spriteRenderer.rect.uv.from(tile.uv);
                renderer.batchSprite(
                    this.tileSize,
                    this.spriteRenderer,
                    worldMatrix,
                    undefined,
                    tile.position.x + parallaxOffsetX, tile.position.y + parallaxOffsetY
                );
            }
        }
    }


    private createTiles(
        data: number[],
        tileSet: ITileSet,
    ) {
        const tiles: Tile[] = [];
        for (let i = 0; i < data.length; i++) {
            let tileIndex = data[i];
            if (tileIndex === 0) continue; // Припускаємо, що 0 - це порожній тайл
            tileIndex--; // рахунок саміх тайлів також починається з 0

            const tile:Tile = {
                tileIndex,
                position: new Vector2(
                    (i % tileSet.mapWidthInTiles) * this.tileSize.w,
                    Math.floor(i / tileSet.mapWidthInTiles) * this.tileSize.h
                ),
                uv: new Vector2(),
                size: this.tileSize,
                animated: tileSet.aminatedTiles?.[i]!==undefined
            };
            this.setTileUvByTileIndex(tile,tileIndex);
            tiles.push(tile);
        }
        return tiles;
    }

    private updateAnimatedTileUV(tile: Tile) {
        const now = this.scene.app.getTime();
        if (!this.time) this.time = now;
        const delta = this.time - now;
        // визначити поточний фрейм анімації
        this.tileSet.aminatedTiles[tile.tileIndex]

        this.time = now;
    }

    private setTileUvByTileIndex(tile: Tile, tileIndex: number) {
        const u = (tileIndex % this.tileSet.tilesetCols) * tileIndex + 0.5;
        const v = Math.floor(tileIndex / this.tileSet.tilesetCols) * this.tileSize.h + 0.5;
        tile.uv.uv(u,v);
    }

    private createMergedCollisionBodies(
        data: number[],
        mapWidthInTiles: number,
        mapHeightInTiles: number,
        tileWidth: number,
        tileHeight: number,
        solidTiles: number[],
        params?: IRigidBodyParamsBase
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
                solidTiles.includes(data[index] - 1) &&
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
                    height * tileHeight,
                    params
                );
            }
        }
    }

    private createCollisionBody(
        x: number,
        y: number,
        width: number,
        height: number,
        params: IRigidBodyParamsBase = {}
    ) {
        const target: IGeometry = {
            position: new Vector2(x, y),
            size: new Size(width, height),
        };

        this.bodies.push(
            this.scene.app.physics.createRigidBody({
                ...params,
                type: ArcadeRigidBodyType.STATIC,
                target
            })
        );
    }

}
