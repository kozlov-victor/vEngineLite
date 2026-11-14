import {Files} from "../services/files";
import {Color} from "@vEngineLite/rendering/Color";

export class Bitmap {
    readonly pixels: Uint8Array;

    constructor(
        readonly width: number,
        readonly height: number
    ) {
        this.pixels = new Uint8Array(width * height);
    }

    setPixel(x: number, y: number, value = 255): void {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }

        this.pixels[y * this.width + x] = value;
    }

    getPixel(x: number, y: number): number {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return 0;
        }

        return this.pixels[y * this.width + x];
    }

    clear(): void {
        this.pixels.fill(0);
    }

    public drawToCanvas(canvas: HTMLCanvasElement, fillColor: Color) {
        canvas.width = this.width;
        canvas.height = this.height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Canvas 2D context is unavailable");
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const imageData = ctx.createImageData(
            this.width,
            this.height
        );

        const normColor = fillColor.getNormalized();
        const r = Math.floor(normColor[0] * normColor[3] * 255);
        const g = Math.floor(normColor[1] * normColor[3] * 255);
        const b = Math.floor(normColor[2] * normColor[3] * 255);

        for (let i = 0; i < this.pixels.length; i++) {
            const offset = i * 4;

            imageData.data[offset    ] = r;
            imageData.data[offset + 1] = g;
            imageData.data[offset + 2] = b;
            imageData.data[offset + 3] = this.pixels[i];
        }

        ctx.putImageData(imageData, 0, 0);
    }

    public async saveAsPng(fileName: string, fillColor = Color.WHITE()): Promise<void> {
        const canvas = document.createElement("canvas");
        this.drawToCanvas(canvas, fillColor);

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(result => {
                if (!result) {
                    reject(new Error("Failed to encode bitmap as PNG"));
                    return;
                }
                resolve(result);
            }, "image/png");
        });

        await Files.saveToFile(blob, fileName, undefined, "image/png");
    }

}
