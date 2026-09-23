import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {SpriteFrame} from "../types";
import {RenderableContainer} from "./base/RenderableContainer";
import {Scene} from "../application/Scene";
import {Vector2} from "../utils/Vector2";
import {Texture} from "../rendering/Texture";
import {Size} from "../utils/Size";
import {Color} from "../rendering/Color";


export class Sprite extends RenderableContainer {

    public readonly offset = new Vector2();

    constructor(scene: Scene, texture: Texture) {
        super(scene);
        this.textureInfo = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(texture.width, texture.height),
            },
            color: Color.WHITE(),
        };
        this.size.from(this.textureInfo.rect.size);
    }

    public render(renderer: TriangleBatchRenderer) {
        renderer.batchSprite(
            this.size,
            this.textureInfo,
            this.getWorldMatrix(),
            this.offset.x, this.offset.y,
        );
    }

    public setFrame(frame: SpriteFrame) {
        this.offset.xy(frame.left, frame.top);
        this.size.wh(frame.width, frame.height);
        this.textureInfo.rect.uv.uv(frame.x, frame.y);
        this.textureInfo.rect.size.wh(frame.width, frame.height);
    }

}
