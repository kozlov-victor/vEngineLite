import {Container} from "./Container";
import {TextureInfo} from "../../components/TextureInfo";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {IMouseComponent, MouseCallback, MouseComponent, MouseEventType} from "@vEngineLite/inputControl/MouseComponent";



export abstract class RenderableContainer extends Container implements IMouseComponent {
    protected textureInfo: TextureInfo;
    private mouseComponent: MouseComponent|undefined;

    public abstract render(renderer: TriangleBatchRenderer): void;


    override enterFrame(renderer: TriangleBatchRenderer) {
        this.render(renderer);
    }

    public on(event: MouseEventType, callback: MouseCallback) {
        if (!this.mouseComponent) {
            this.mouseComponent = new MouseComponent();
        }
        this.mouseComponent.on(event, callback);
    }

    public off(event: MouseEventType, callback: MouseCallback) {
        if (this.mouseComponent) {
            this.mouseComponent.off(event, callback);
        }
    }

    public get interactive() {
        return this.mouseComponent ? this.mouseComponent.interactive : false;
    }

}
