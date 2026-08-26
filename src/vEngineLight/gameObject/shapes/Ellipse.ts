import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {Color} from "../../rendering/Color";
import {GLUtils} from "../../utils/GLUtils";
import {Vector2} from "../../utils/Vector2";
import {Size} from "../../utils/Size";
import {MeshFactory} from "../../utils/MeshFactory";
import {Triangle} from "../../types";
import {RenderableContainer} from "../base/RenderableContainer";
import {Scene} from "../../application/Scene";

export class Ellipse extends RenderableContainer {

    public readonly color = Color.WHITE();

    private mash:Triangle[];
    private _radiusX: number;
    private _radiusY: number;
    private dirty: boolean;

    public constructor(scene: Scene, radiusX: number, radiusY = radiusX) {
        super(scene);
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.textureInfo = {
            texture: GLUtils.getEmptyTexture(),
            color: this.color,
            rect: {
                uv: new Vector2(),
                size: new Size(1)
            }
        }
    }

    public radiusXY(radiusX: number, radiusY = radiusX) {
        this.radiusX = radiusX;
        this.radiusY = radiusY;
    }

    set radiusX(radius: number) {
        this.dirty = this.dirty || this._radiusX!==radius;
        this._radiusX = radius;
    }

    get radiusX(): number {
        return this._radiusX;
    }

    get radiusY(): number {
        return this._radiusY;
    }

    set radiusY(radius: number) {
        this.dirty = this.dirty || this._radiusY!==radius;
        this._radiusY = radius;
    }

    override render(renderer: TriangleBatchRenderer) {
        this.checkDirty();
        for (const triangle of this.mash) {
            renderer.batchTriangle(triangle, this.textureInfo.texture, this.transform.getWorldMatrix())
        }
    }

    private checkDirty() {
        if (!this.dirty) return;
        this.dirty = false;
        this.mash = MeshFactory.createEllipse(this._radiusX, this._radiusY, this.color.getNormalized());
    }

}
