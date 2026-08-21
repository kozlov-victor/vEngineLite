import {Container} from "./Container";
import {TextureInfo} from "../../components/TextureInfo";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";

export abstract class RenderableContainer extends Container {
    protected textureInfo: TextureInfo;
    public abstract render(renderer: TriangleBatchRenderer): void;


    override enterFrame(renderer: TriangleBatchRenderer) {
        this.render(renderer);
    }
}
