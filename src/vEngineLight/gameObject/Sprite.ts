import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {IFrame} from "../types";
import {RenderableContainer} from "./base/RenderableContainer";
import {Scene} from "../application/Scene";
import {TextureInfo} from "../components/TextureInfo";


export abstract class Sprite extends RenderableContainer {

    protected constructor(scene: Scene, textureInfo: TextureInfo) {
        super(scene);
        this.textureInfo = textureInfo;
    }

    public render(renderer: TriangleBatchRenderer) {
        renderer.batchSprite(
            this.size,
            this.textureInfo,
            this.getWorldMatrix()
        );
    }

    public setFrame(frame: IFrame) {
        this.size.wh(frame.width, frame.height);
        this.textureInfo.rect.uv.uv(frame.x, frame.y);
        this.textureInfo.rect.size.wh(frame.width, frame.height);
    }

}
