export class Vector2 {
    protected _x = 0;
    protected _y = 0;

    constructor(x = 0, y = 0, protected readonly onChange = () => {}) {
        this._x = x;
        this._y = y;
    }

    get x(){
        return this._x;
    }
    set x(value: number){
        if (this._x===value) return;
        this._x = value;
        this.onChange();
    }

    get u(){
        return this._x;
    }
    set u(value: number){
        this.x = value;
    }

    get y(){
        return this._y;
    }
    set y(value: number){
        if (this._y===value) return;
        this._y = value;
        this.onChange();
    }

    get v(){
        return this._y;
    }
    set v(value: number){
        this.y = value;
    }

    public xy(x: number, y = x) {
        this.x = x;
        this.y = y;
    }

    public uv(u: number, v = u) {
        this.xy(u, v);
    }
}
