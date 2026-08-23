import {PsdHeader, PsdLayer} from "../psd/PsdParser";

export interface SpriteFrame {
    name: string;

    x: number;
    y: number;

    width: number;
    height: number;
}

export interface SpriteSheet {
    width: number;
    height: number;

    frames: SpriteFrame[];
}

export class SpriteSheetPacker {

    constructor(
        private readonly padding = 0,
        private readonly maxWidth = 2048
    ) {
    }

    public pack(
        header: PsdHeader,
        layers: PsdLayer[]
    ): SpriteSheet {

        const frames: SpriteFrame[] = [];

        let x = this.padding;
        let y = this.padding;

        let rowHeight = 0;

        let sheetWidth = 0;
        let sheetHeight = 0;

        for (const layer of layers) {

            const width =
                header.width;

            const height =
                header.height;

            // Переносимо sprite
            // на наступний рядок.
            if (
                x + width + this.padding >
                this.maxWidth
            ) {
                x = this.padding;

                y +=
                    rowHeight +
                    this.padding;

                rowHeight = 0;
            }

            frames.push({
                name: layer.name,

                x,
                y,

                width,
                height
            });

            x +=
                width +
                this.padding;

            rowHeight =
                Math.max(
                    rowHeight,
                    height
                );

            sheetWidth =
                Math.max(
                    sheetWidth,
                    x
                );

            sheetHeight =
                Math.max(
                    sheetHeight,
                    y + height + this.padding
                );
        }

        return {
            width: sheetWidth,
            height: sheetHeight,
            frames
        };
    }
}
