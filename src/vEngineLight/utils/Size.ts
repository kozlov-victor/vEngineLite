
export class Size {
    protected _w: number;
    protected _h: number;

    constructor(w = 0, h = w) {
        this._w = w;
        this._h = h;
    }

    set w(val: number) {
        this._w = val;
    }

    get w() {
        return this._w;
    }

    set h(val: number) {
        this._h = val;
    }

    get h() {
        return this._h;
    }

    wh(width: number, height = width) {
        this._w = width;
        this._h = height;
    }

}
