import {IPointerEvent, PointerEventType} from "@vEngineLite/inputControl/pointer/PointerHitArea";
import {VEngineLiteApplication} from "@vEngineLite/application/VEngineLiteApplication";
import {n2} from "@vEngineLite/types";
import type {RenderableContainer} from "@vEngineLite/gameObject/base/RenderableContainer";

export class PointerInputControl {
    private hoveredTarget?: RenderableContainer;

    constructor(private readonly app: VEngineLiteApplication) {
        app.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
        app.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
        app.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
        app.canvas.addEventListener('pointerleave', this.onPointerLeave.bind(this));
    }

    private onPointerDown(event: PointerEvent) {
        this.dispatchPointerEvent(this.createPointerEvent(event, PointerEventType.MOUSE_DOWN, true));
    }

    private onPointerUp(event: PointerEvent) {
        this.dispatchPointerEvent(this.createPointerEvent(event, PointerEventType.MOUSE_UP, false));
    }

    private onPointerMove(event: PointerEvent) {
        this.dispatchPointerEvent(this.createPointerEvent(event, PointerEventType.MOUSE_MOVE, event.buttons === 1));
    }

    private onPointerLeave(event: PointerEvent) {
        if (!this.hoveredTarget) return;

        const pointerEvent = this.createPointerEvent(event, PointerEventType.MOUSE_LEAVE, event.buttons === 1);
        this.hoveredTarget.triggerEvent(PointerEventType.MOUSE_LEAVE, pointerEvent);
        this.hoveredTarget = undefined;
    }

    private createPointerEvent(event: PointerEvent, type: PointerEventType, mouseDown: boolean): IPointerEvent {
        const rect = this.app.canvas.getBoundingClientRect();
        return {
            type,
            x: (event.clientX - rect.left) * this.app.size.w / rect.width,
            y: (event.clientY - rect.top) * this.app.size.h / rect.height,
            mouseDown
        };
    }

    private dispatchPointerEvent(event: IPointerEvent) {
        const cameraLocal: n2 = [event.x, event.y];
        const worldPoint = this.app.camera.getWorldMatrix().transformPoint(cameraLocal);
        const objects = this.app.renderer.interactiveRenderedStack;

        let target: RenderableContainer | undefined;
        for (let i = objects.length - 1; i >= 0; i--) {
            const object = objects[i];
            if (object.pointerHitArea?.interactive && object.pointerHitArea.doesPointHitTrapezium(worldPoint)) {
                target = object;
                break;
            }
        }

        if (event.type === PointerEventType.MOUSE_MOVE) {
            if (this.hoveredTarget !== target) {
                this.hoveredTarget?.triggerEvent(PointerEventType.MOUSE_LEAVE, {
                    ...event,
                    type: PointerEventType.MOUSE_LEAVE
                });
                this.hoveredTarget = target;
            }
        }

        if (target) {
            target.triggerEvent(event.type, event);
        }
    }

}
