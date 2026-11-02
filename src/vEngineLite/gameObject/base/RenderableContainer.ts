import {Container} from "./Container";
import {TextureInfo} from "../../components/TextureInfo";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {
    IPointerHitArea,
    PointerCallback,
    PointerHitArea,
    PointerEventType,
    IPointerEvent
} from "@vEngineLite/inputControl/pointer/PointerHitArea";



export abstract class RenderableContainer extends Container implements IPointerHitArea {
    protected textureInfo: TextureInfo;
    private _pointerHitArea: PointerHitArea|undefined;

    public abstract render(renderer: TriangleBatchRenderer): void;


    override enterFrame(renderer: TriangleBatchRenderer) {
        this.render(renderer);
    }

    public on(event: PointerEventType, callback: PointerCallback) {
        if (!this._pointerHitArea) {
            this._pointerHitArea = new PointerHitArea();
        }
        this._pointerHitArea.on(event, callback);
    }

    public off(event: PointerEventType, callback: PointerCallback) {
        if (this._pointerHitArea) {
            this._pointerHitArea.off(event, callback);
        }
    }

    public triggerEvent(type: PointerEventType, pointerEvent: IPointerEvent) {
        if (this._pointerHitArea) {
            this._pointerHitArea.triggerEvent(type, pointerEvent);
        }
    }

    public get interactive() {
        return this._pointerHitArea ? this._pointerHitArea.interactive : false;
    }

    public get pointerHitArea() {
        return this._pointerHitArea;
    }

}
