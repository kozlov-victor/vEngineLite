import {IPointerEvent, PointerEventType} from "@vEngineLite/inputControl/pointer/PointerHitArea";
import {VEngineLiteApplication} from "@vEngineLite/application/VEngineLiteApplication";
import {n2} from "@vEngineLite/types";

export class PointerInputControl {

    constructor(private readonly app: VEngineLiteApplication) {
        app.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
        app.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
        app.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    }

    private onPointerDown(event: PointerEvent) {
        const pointerEvent: IPointerEvent = {
            type: PointerEventType.MOUSE_DOWN,
            x: event.offsetX,
            y: event.offsetY,
            mouseDown: true
        };
        this.dispatchPointerEvent(pointerEvent);
    }

    private onPointerUp(event: PointerEvent) {
        const pointerEvent: IPointerEvent = {
            type: PointerEventType.MOUSE_UP,
            x: event.offsetX,
            y: event.offsetY,
            mouseDown: false
        };
        this.dispatchPointerEvent(pointerEvent);
    }

    private onPointerMove(event: PointerEvent) {
        const pointerEvent: IPointerEvent = {
            type: PointerEventType.MOUSE_MOVE,
            x: event.offsetX,
            y: event.offsetY,
            mouseDown: event.buttons === 1
        };
        this.dispatchPointerEvent(pointerEvent);
    }

    private dispatchPointerEvent(event: IPointerEvent) {
        // Here you would typically dispatch the event
        // to the appropriate PointerHitArea instances.
        // This is a placeholder for the actual implementation.
        const cameraLocal: n2 = [
            (event.x) * this.app.size.w / this.app.viewPort.w,
            (event.y) * this.app.size.h / this.app.viewPort.h,
        ];
        const worldPoint = this.app.camera.getWorldMatrix().transformPoint(cameraLocal);
        const objects = this.app.renderer.interactiveRenderedStack;
        let l = objects.length;
        while (l--) {
            const obj = objects[l];
            if (obj.pointerHitArea && obj.pointerHitArea.interactive) {
                if (obj.pointerHitArea.doesPointHitTrapezium(worldPoint)) {
                    obj.triggerEvent(event.type, event);
                    break;
                }
            }
        }
    }

}
