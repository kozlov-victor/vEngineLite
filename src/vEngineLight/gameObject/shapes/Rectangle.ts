import {Color} from "../../rendering/Color";
import {GLUtils} from "../../utils/GLUtils";
import {Vector2} from "../../utils/Vector2";
import {Size} from "../../utils/Size";
import {RenderableContainer} from "../base/RenderableContainer";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {Scene} from "../../application/Scene";

export class Rectangle extends RenderableContainer {

    public readonly color = Color.WHITE();

    constructor(scene: Scene) {
        super(scene);
        this.textureInfo = {
            color: this.color,
            texture: GLUtils.getEmptyTexture(),
            rect: {
                uv: new Vector2(),
                size: new Size(1),
            }
        };
        this.size.wh(32);
    }

    public render(renderer: TriangleBatchRenderer) {
        renderer.batchSprite(
            this.size,
            this.textureInfo,
            this.transform.getWorldMatrix()
        );
    }

}
