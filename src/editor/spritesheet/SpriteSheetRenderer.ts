import {PsdHeader, PsdLayer} from "../psd/PsdParser";
import {IPackedSpriteSheet} from "./SpriteSheetPacker";

export class SpriteSheetRenderer {

    public render(
       sheet: IPackedSpriteSheet,
    ): HTMLCanvasElement {

        const canvas =
            document.createElement("canvas");

        canvas.width = sheet.width;

        canvas.height = sheet.height;

        const ctx = canvas.getContext("2d")!;

        for (let i = 0; i < sheet.frames.length; i++) {

            const frame = sheet.frames[i];
            const layer = frame.layer;

            const imageData =
                this.cropLayerToDocument(
                    frame.psd.header,
                    layer
                );

            if (!imageData) {
                continue;
            }

            ctx.putImageData(
                imageData,
                frame.x + layer.left,
                frame.y + layer.top
            );
        }

        return canvas;
    }

    private cropLayerToDocument(
        header: PsdHeader,
        layer: PsdLayer
    ): ImageData | null {

        if (!layer.pixels) {
            return null;
        }

        const visibleLeft =
            Math.max(0, layer.left);

        const visibleTop =
            Math.max(0, layer.top);

        const visibleRight =
            Math.min(header.width, layer.right);

        const visibleBottom =
            Math.min(header.height, layer.bottom);

        // Повністю за межами документа
        if (
            visibleRight <= visibleLeft ||
            visibleBottom <= visibleTop
        ) {
            return null;
        }

        const width =
            visibleRight - visibleLeft;

        const height =
            visibleBottom - visibleTop;

        const sourceX =
            visibleLeft - layer.left;

        const sourceY =
            visibleTop - layer.top;

        const pixels =
            new Uint8ClampedArray(
                width * height * 4
            );

        for (let y = 0; y < height; y++) {

            const sourceOffset =
                (
                    (sourceY + y) *
                    layer.width +
                    sourceX
                ) * 4;

            const targetOffset =
                y * width * 4;

            pixels.set(
                layer.pixels.subarray(
                    sourceOffset,
                    sourceOffset + width * 4
                ),
                targetOffset
            );
        }

        return new ImageData(
            pixels,
            width,
            height
        );
    }

}
