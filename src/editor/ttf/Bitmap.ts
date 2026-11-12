
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

}

export function drawBitmapToCanvas(
    bitmap: Bitmap,
    canvas: HTMLCanvasElement
): void {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Canvas 2D context is unavailable");
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageData = ctx.createImageData(
        bitmap.width,
        bitmap.height
    );

    for (let i = 0; i < bitmap.pixels.length; i++) {
        const offset = i * 4;

        imageData.data[offset] = 0;
        imageData.data[offset + 1] = 0;
        imageData.data[offset + 2] = 0;
        imageData.data[offset + 3] = bitmap.pixels[i];
    }

    ctx.putImageData(imageData, 0, 0);
}
