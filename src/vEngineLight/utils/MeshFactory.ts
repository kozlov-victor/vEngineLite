import {n2, n4, Triangle, Vertex} from "../types";

export class MeshFactory {

    public static createEllipse(
        radiusX: number,
        radiusY: number,
        color: n4,
        center: n2 = [0, 0],
        maxSegmentLength = 4
    ): Triangle[] {

        const radius = Math.max(radiusX, radiusY);

        const segments = Math.min(
            128,
            Math.max(
                3,
                Math.ceil(
                    Math.PI /
                    Math.asin(
                        Math.min(1, maxSegmentLength / (2 * radius))
                    )
                )
            )
        );

        const triangles: Triangle[] = [];

        const centerVertex: Vertex = {
            position: center,
            textCoord: [0.5, 0.5],
            colorTint: color
        };

        const vertices: Vertex[] = [];

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            vertices.push({
                position: [
                    center[0] + cos * radiusX,
                    center[1] + sin * radiusY
                ],

                textCoord: [
                    0.5 + cos * 0.5,
                    0.5 + sin * 0.5
                ],

                colorTint: color
            });
        }

        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;

            triangles.push({
                v1: centerVertex,
                v2: vertices[i],
                v3: vertices[next]
            });
        }

        return triangles;
    }

}
