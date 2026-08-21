import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {Size} from "../utils/Size";
import {Vector2} from "../utils/Vector2";
import {Mat2d} from "../utils/Mat2d";
import {Texture} from "../rendering/Texture";
import {TextureInfo} from "../components/TextureInfo";
import {Color} from "../rendering/Color";
import {RenderableContainer} from "./base/RenderableContainer";

// Спрощена структура для зберігання даних тайла
interface Tile {
    position: Vector2;
    uv: Vector2;
}

export class TileMap extends RenderableContainer {

    private readonly tiles: Tile[] = [];
    private readonly spriteRenderer: TextureInfo;
    private readonly tileSize: Size;

    // Матриці для розрахунків, щоб не створювати їх у циклі render
    private readonly localTileMatrix = new Mat2d();
    private readonly worldTileMatrix = new Mat2d();

    constructor(
        data: number[],
        mapWidthInTiles: number,
        tilesetCols: number,
        tilesetRows: number,
        texture: Texture
    ) {
        super();
        const tileWidth = Math.floor(texture.width / tilesetCols);
        const tileHeight = Math.floor(texture.height / tilesetRows);

        this.spriteRenderer = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(tileWidth, tileHeight),
            },
            color: Color.WHITE(),
        }
        this.tileSize = new Size(tileWidth, tileHeight);

        for (let i = 0; i < data.length; i++) {
            let tileIndex = data[i];
            if (tileIndex === 0) continue; // Припускаємо, що 0 - це порожній тайл
            tileIndex--; // рахунок саміх тайлів також починається з 0

            this.tiles.push({
                position: new Vector2(
                    (i % mapWidthInTiles) * tileWidth,
                    Math.floor(i / mapWidthInTiles) * tileHeight
                ),
                uv: new Vector2(
                    (tileIndex % tilesetCols) * tileWidth,
                    Math.floor(tileIndex / tilesetCols) * tileHeight
                ),
            });
        }
    }

    public override render(renderer: TriangleBatchRenderer) {
        // 1. Отримуємо світову матрицю для всієї карти ОДИН РАЗ
        const tilemapWorldMatrix = this.transform.getWorldMatrix();

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

}
