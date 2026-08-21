import {TriangleBatchRenderer} from "../rendering/TriangleBatchRenderer";
import {IFrame} from "../types";
import {RenderableContainer} from "./base/RenderableContainer";


export class Sprite extends RenderableContainer {

    public render(renderer: TriangleBatchRenderer) {
        renderer.batchSprite(
            this.size,
            this.textureInfo,
            this.transform.getWorldMatrix()
        );
    }

    public setFrame(frame: IFrame) {
        this.size.wh(frame.width, frame.height);
        this.textureInfo.rect.uv.uv(frame.x, frame.y);
        this.textureInfo.rect.size.wh(frame.width, frame.height);
    }

}
