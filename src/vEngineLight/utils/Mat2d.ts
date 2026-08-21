import {n2, n9} from "../types";


export class Mat2d {
    // Underlying flat array mapping to: [a, b, c, d, tx, ty]
    private readonly values: [number, number, number, number, number, number];

    constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        this.values = [a, b, c, d, tx, ty];
    }

    // Create an identity matrix
    static identity(out = new Mat2d()): Mat2d {
        return out.from(1, 0, 0, 1, 0, 0);
    }

    // Create a matrix from Translation, Rotation (radians), Scale, and Pivot
    public static fromTRS(
        x: number, y: number,
        angle: number,
        scaleX: number, scaleY: number,
        pivotX: number, pivotY: number,
        out = new Mat2d()
    ): Mat2d {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        const a = cos * scaleX;
        const b = sin * scaleX;
        const c = -sin * scaleY;
        const d = cos * scaleY;

        // The final translation is the desired position MINUS the pivot's
        // position after it has been rotated and scaled.
        const tx = x - (pivotX * a + pivotY * c);
        const ty = y - (pivotX * b + pivotY * d);

        return out.from(a, b, c, d, tx, ty);
    }

    static fromTranslation(x: number, y: number, out = new Mat2d()): Mat2d {
        return out.from(
            1, 0,
            0, 1,
            x, y
        );
    }

    static projection(width: number, height: number, out = new Mat2d()): Mat2d {
        return out.from(
            2 / width, 0,
            0, -2 / height,
            -1, 1
        );
    }

    public copyFrom(other: Mat2d): this {
        this.values[0] = other.values[0];
        this.values[1] = other.values[1];
        this.values[2] = other.values[2];
        this.values[3] = other.values[3];
        this.values[4] = other.values[4];
        this.values[5] = other.values[5];
        return this;
    }

    public from(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        this.values[0] = a;
        this.values[1] = b;
        this.values[2] = c;
        this.values[3] = d;
        this.values[4] = tx;
        this.values[5] = ty;
        return this;
    }

    public invert(out: Mat2d = new Mat2d()) {

        const a = this.values[0];
        const b = this.values[1];
        const c = this.values[2];
        const d = this.values[3];
        const tx = this.values[4];
        const ty = this.values[5];

        let det = a * d - b * c;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        out.from(
            d * det,
            -b * det,
            -c * det,
            a * det,
            (c * ty - d * tx) * det,
            (b * tx - a * ty) * det
        );
        return out;
    }

    // Multiply this matrix by another Mat2d
    public multiply(other: Mat2d, out: Mat2d = new Mat2d()): Mat2d {
        const a1 = this.values[0], b1 = this.values[1], c1 = this.values[2], d1 = this.values[3], tx1 = this.values[4], ty1 = this.values[5];
        const a2 = other.values[0], b2 = other.values[1], c2 = other.values[2], d2 = other.values[3], tx2 = other.values[4], ty2 = other.values[5];

        return out.from(
            a1 * a2 + c1 * b2,
            b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2,
            b1 * c2 + d1 * d2,
            a1 * tx2 + c1 * ty2 + tx1,
            b1 * tx2 + d1 * ty2 + ty1
        );
    }

    public toMat3Vec(out :n9 = [0,0,0,0,0,0,0,0,0]): n9 {
        const a = this.values[0];
        const b = this.values[1];
        const c = this.values[2];
        const d = this.values[3];
        const tx = this.values[4];
        const ty = this.values[5];

        out[0] = a;
        out[1] = b;
        out[2] = 0;
        out[3] = c;
        out[4] = d;
        out[5] = 0;
        out[6] = tx;
        out[7] = ty;
        out[8] = 1;

        return out;
    }

    public transformPoint(x: number, y: number, out: n2 = [0,0]): n2 {
        const [a, b, c, d, tx, ty] = this.values;
        out[0] = a * x + c * y + tx;
        out[1] = b * x + d * y + ty;
        return out;
    }
}
