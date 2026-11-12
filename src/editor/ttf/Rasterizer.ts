import {Bitmap} from "./Bitmap";
import {GlyphSegment} from "./TrueTypeFont";

export interface Point {
    x: number;
    y: number;
}

export interface GlyphContour {
    segments: GlyphSegment[];
}

export class Rasterizer {

    private static quadraticBezier(
        p0: Point,
        p1: Point,
        p2: Point,
        t: number
    ): Point {
        const mt = 1 - t;

        return {
            x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
            y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
        };
    }

    static flattenContour(
        contour: GlyphContour,
        curveSteps = 8
    ): Point[] {
        const points: Point[] = [];

        if (contour.segments.length === 0) {
            return points;
        }

        const first = contour.segments[0];
        points.push({ x: first.p0.x, y: first.p0.y });

        for (const segment of contour.segments) {
            if (segment.type === "line") {
                points.push({
                    x: segment.p1.x,
                    y: segment.p1.y
                });
            } else {
                const control = segment.control!;

                for (let i = 1; i <= curveSteps; i++) {
                    const t = i / curveSteps;

                    points.push(this.quadraticBezier(
                        segment.p0,
                        control,
                        segment.p1,
                        t
                    ));
                }
            }
        }

        return points;
    }

    static flattenContours(
        contours: GlyphContour[],
        curveSteps = 8
    ): Point[][] {
        return contours.map(contour =>
            this.flattenContour(contour, curveSteps)
        );
    }

    static fillContours(
        bitmap: Bitmap,
        contours: Point[][],
        antialias = false,
        samples = 4
    ): void {
        if (contours.length === 0) {
            return;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const points of contours) {
            for (const point of points) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }
        }

        if (!Number.isFinite(minX)) {
            return;
        }

        const startX = Math.max(0, Math.floor(minX));
        const startY = Math.max(0, Math.floor(minY));
        const endX = Math.min(bitmap.width, Math.ceil(maxX));
        const endY = Math.min(bitmap.height, Math.ceil(maxY));

        const sampleCount = antialias ? Math.max(1, Math.floor(samples)) : 1;
        const totalSamples = sampleCount * sampleCount;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                let coverage = 0;

                for (let sy = 0; sy < sampleCount; sy++) {
                    for (let sx = 0; sx < sampleCount; sx++) {
                        const px = x + (sx + 0.5) / sampleCount;
                        const py = y + (sy + 0.5) / sampleCount;

                        if (this.isPointInsideContours(px, py, contours)) {
                            coverage++;
                        }
                    }
                }

                bitmap.setPixel(
                    x,
                    y,
                    Math.round(coverage * 255 / totalSamples)
                );
            }
        }
    }

    private static isPointInsideContours(
        x: number,
        y: number,
        contours: Point[][]
    ): boolean {
        let windingNumber = 0;

        for (const points of contours) {
            for (let i = 0; i < points.length; i++) {
                const a = points[i];
                const b = points[(i + 1) % points.length];

                const isLeft =
                    (b.x - a.x) * (y - a.y) -
                    (x - a.x) * (b.y - a.y);

                if (a.y <= y) {
                    if (b.y > y && isLeft > 0) {
                        windingNumber++;
                    }
                } else {
                    if (b.y <= y && isLeft < 0) {
                        windingNumber--;
                    }
                }
            }
        }

        return windingNumber !== 0;
    }

    private static isPointInsidePolygon(
        x: number,
        y: number,
        points: Point[]
    ): boolean {
        let windingNumber = 0;

        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];

            if (a.y <= y) {
                if (b.y > y && this.isLeft(a, b, x, y) > 0) {
                    windingNumber++;
                }
            } else {
                if (b.y <= y && this.isLeft(a, b, x, y) < 0) {
                    windingNumber--;
                }
            }
        }

        return windingNumber !== 0;
    }

    private static isLeft(
        a: Point,
        b: Point,
        x: number,
        y: number
    ): number {
        return (b.x - a.x) * (y - a.y) -
            (x - a.x) * (b.y - a.y);
    }

}
