import {Mat2d} from "../utils/Mat2d";
import {Vector2} from "../utils/Vector2";

export class Transform {

    public position: Vector2;
    public scale: Vector2;
    public pivot: Vector2;
    private _rotation = 0;

    private _dirty = true;
    private readonly localMatrix = new Mat2d();
    private readonly worldMatrix = new Mat2d();

    private _parent: Transform | undefined;
    public readonly children: Transform[] = [];

    constructor() {
        const setDirty = () => this.setDirty();
        this.position = new Vector2(0, 0, setDirty);
        this.scale = new Vector2(1, 1, setDirty);
        this.pivot = new Vector2(0, 0, setDirty);
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(value: number) {
        if (this._rotation === value) return;
        this._rotation = value;
        this.setDirty();
    }

    get parent(): Transform | undefined {
        return this._parent;
    }

    set parent(newParent: Transform | undefined) {
        if (this._parent === newParent) return;

        if (this._parent) {
            const index = this._parent.children.indexOf(this);
            if (index > -1) {
                this._parent.children.splice(index, 1);
            }
        }

        this._parent = newParent;
        if (newParent) {
            newParent.children.push(this);
        }
        this.setDirty();
    }

    public getWorldMatrix(): Mat2d {
        if (this._dirty) {
            this.updateWorldMatrix();
        }
        return this.worldMatrix;
    }

    private setDirty() {
        if (!this._dirty) {
            this._dirty = true;
            for (const child of this.children) {
                child.setDirty();
            }
        }
    }

    public updateWorldMatrix(force = false) {
        if (!this._dirty && !force) {
            return;
        }

        Mat2d.fromTRS(
            this.position.x, this.position.y,
            this._rotation,
            this.scale.x, this.scale.y,
            this.pivot.x, this.pivot.y,
            this.localMatrix
        );

        if (this._parent) {
            this._parent.getWorldMatrix().multiply(this.localMatrix, this.worldMatrix);
        } else {
            this.worldMatrix.copyFrom(this.localMatrix);
        }

        this._dirty = false;

        for (const child of this.children) {
            child.updateWorldMatrix(true);
        }
    }
}
