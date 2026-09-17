import {n4} from "../types";
import {ObservableEntity} from "../utils/ObservableEntity";


export class Color extends ObservableEntity {
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;
    private dirty: boolean;

    private readonly normalized:n4 = [0,0,0,0];

    constructor(r: number, g: number, b: number, a = 255) {
        super();
        this.rgba(r, g, b, a);
    }

    public static WHITE() {
        return new Color(255,255,255,255);
    }

    public static BLACK() {
        return new Color(0,0,0,255);
    }

    public fromCssColor(hex:string) {
        const groups = hex.substring(1).match(/..?/g);
        if (!groups) throw new Error(`Invalid hex string: ${hex}`);
        const r = Number.parseInt(groups[0],16);
        const g = Number.parseInt(groups[1],16);
        const b = Number.parseInt(groups[2],16);
        const a = groups[3]?
            Number.parseInt(groups[3],16):
            255;

        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }

    public toCssColor() {
        const r = this.r.toString(16).padStart(2, '0');
        const g = this.g.toString(16).padStart(2, '0');
        const b = this.b.toString(16).padStart(2, '0');
        const a = this.a.toString(16).padStart(2, '0');
        return `#${r}${g}${b}${a}`;
    }

    set r(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._r = val;
        this.notifyChange();
    }

    get r() { return this._r; }

    set g(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._g = val;
        this.notifyChange();
    }

    get g() { return this._g; }

    set b(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._b = val;
        this.notifyChange();
    }

    get b() { return this._b; }

    set a(val: number) {
        this.dirty = this.dirty || val!==this._r;
        this._a = val;
        this.notifyChange();
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
