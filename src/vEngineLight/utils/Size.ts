import {ObservableEntity} from "./ObservableEntity";

export class Size extends ObservableEntity {
    protected _w: number;
    protected _h: number;

    constructor(w = 0, h = w) {
        super();
        this._w = w;
        this._h = h;
    }

    set w(val: number) {
        this._w = val;
        this.notifyChange();
    }

    get w() {
        return this._w;
    }

    set h(val: number) {
        this._h = val;
        this.notifyChange();
    }

    get h() {
        return this._h;
    }

    wh(width: number, height = width) {
        this._w = width;
        this._h = height;
        this.notifyChange();
    }

    from(other:Size) {
        this.wh(other.w, other.h);
    }

}
