import {n4} from "../types";


export class Color {
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;
    private dirty: boolean;

    private readonly normalized:n4 = [0,0,0,0];

    constructor(r: number, g: number, b: number, a = 255) {
        this.rgba(r, g, b, a);
    }

    public static WHITE() {
        return new Color(255,255,255,255);
    }

    set r(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._r = val;
    }

    get r() { return this._r; }

    set g(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._g = val;
    }

    get g() { return this._g; }

    set b(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._b = val;
    }

    get b() { return this._b; }

    set a(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._a = val;
    }

    get a() { return this._a; }

    public rgb(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = 255;
    }

    public rgba(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public getNormalized() {
        if (this.dirty) {
            this.normalized[0] = this._r / 255;
            this.normalized[1] = this._g / 255;
            this.normalized[2] = this._b / 255;
            this.normalized[3] = this._a / 255;
            this.dirty = false;
        }
        return this.normalized;
    }

}
