import {IPointerEvent, PointerEventType} from "@vEngineLite/inputControl/pointer/PointerHitArea";
import {VEngineLiteApplication} from "@vEngineLite/application/VEngineLiteApplication";
import {n2} from "@vEngineLite/types";
import type {RenderableContainer} from "@vEngineLite/gameObject/base/RenderableContainer";

export class PointerInputControl {
    private readonly pressedTargets = new Map<number, RenderableContainer>();
    private readonly hoveredTargets = new Map<number, RenderableContainer>();

    constructor(private readonly app: VEngineLiteApplication) {
        app.canvas.style.touchAction = 'none';
        app.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
        app.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
        app.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
        app.canvas.addEventListener('pointerleave', this.onPointerLeave.bind(this));
        app.canvas.addEventListener('pointercancel', this.onPointerCancel.bind(this));
    }

    private onPointerDown(event: PointerEvent) {
        const pointerEvent = this.createPointerEvent(event, PointerEventType.MOUSE_DOWN);
        const target = this.findTarget(pointerEvent);
        if (!target) return;

        this.app.canvas.setPointerCapture(event.pointerId);
        this.pressedTargets.set(event.pointerId, target);
        this.updateHoveredTarget(event.pointerId, target, pointerEvent);
        target.triggerEvent(PointerEventType.MOUSE_DOWN, pointerEvent);
    }

    private onPointerUp(event: PointerEvent) {
        const pointerEvent = this.createPointerEvent(event, PointerEventType.MOUSE_UP);
        const target = this.pressedTargets.get(event.pointerId) ?? this.findTarget(pointerEvent);
        this.pressedTargets.delete(event.pointerId);

        target?.triggerEvent(PointerEventType.MOUSE_UP, pointerEvent);
        this.updateHoveredTarget(event.pointerId, this.findTarget(pointerEvent), pointerEvent);
    }

    private onPointerMove(event: PointerEvent) {
        const pointerEvent = this.createPointerEvent(event, PointerEventType.MOUSE_MOVE);
        const hitTarget = this.findTarget(pointerEvent);
        this.updateHoveredTarget(event.pointerId, hitTarget, pointerEvent);

        const target = this.pressedTargets.get(event.pointerId) ?? hitTarget;
        target?.triggerEvent(PointerEventType.MOUSE_MOVE, pointerEvent);
    }

    private onPointerLeave(event: PointerEvent) {
        const pointerEvent = this.createPointerEvent(event, PointerEventType.MOUSE_LEAVE);
        this.updateHoveredTarget(event.pointerId, undefined, pointerEvent);
    }

    private onPointerCancel(event: PointerEvent) {
        const pointerEvent = this.createPointerEvent(event, PointerEventType.POINTER_CANCEL);
        const target = this.pressedTargets.get(event.pointerId);
        this.pressedTargets.delete(event.pointerId);
        target?.triggerEvent(PointerEventType.POINTER_CANCEL, pointerEvent);
        this.updateHoveredTarget(event.pointerId, undefined, pointerEvent);
    }

    private createPointerEvent(event: PointerEvent, type: PointerEventType): IPointerEvent {
        const rect = this.app.canvas.getBoundingClientRect();
        return {
            type,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            x: (event.clientX - rect.left) * this.app.size.w / rect.width,
            y: (event.clientY - rect.top) * this.app.size.h / rect.height,
            mouseDown: event.buttons !== 0
        };
    }

    private findTarget(event: IPointerEvent): RenderableContainer | undefined {
        const cameraLocal: n2 = [event.x, event.y];
        const worldPoint = this.app.camera.getWorldMatrix().transformPoint(cameraLocal);
        const objects = this.app.renderer.interactiveRenderedStack;

        for (let i = objects.length - 1; i >= 0; i--) {
            const object = objects[i];
            if (object.pointerHitArea?.interactive && object.pointerHitArea.doesPointHitTrapezium(worldPoint)) {
                return object;
            }
        }

        return undefined;
    }

    private updateHoveredTarget(
        pointerId: number,
        target: RenderableContainer | undefined,
        event: IPointerEvent
    ) {
        const previousTarget = this.hoveredTargets.get(pointerId);
        if (previousTarget === target) return;

        if (previousTarget) {
            previousTarget.triggerEvent(PointerEventType.MOUSE_LEAVE, {
                ...event,
                type: PointerEventType.MOUSE_LEAVE
            });
        }

        if (target) {
            this.hoveredTargets.set(pointerId, target);
        } else {
            this.hoveredTargets.delete(pointerId);
        }
    }

}
