import {n2} from "@vEngineLite/types";

export interface IPointerEvent {
    type: PointerEventType;
    x: number;
    y: number;
    mouseDown: boolean;
}

export type PointerCallback = (event: IPointerEvent) => void;

export enum PointerEventType {
    MOUSE_DOWN = 'mousedown',
    MOUSE_UP = 'mouseup',
    MOUSE_MOVE = 'mousemove',
    MOUSE_LEAVE = 'mouseleave',
}

/**
 p1-----------p2
 |           |
 |           |
 |           |
 p3-----------p4
 */
export interface HitTrapezium {
    p1: n2;
    p2: n2;
    p3: n2;
    p4: n2;
}

export interface IPointerHitArea {
    on(event: PointerEventType, callback: PointerCallback): void;
    off(event: PointerEventType, callback: PointerCallback): void;
    interactive: boolean;
}

export class PointerHitArea implements IPointerHitArea {
    private listeners: Map<PointerEventType, PointerCallback[]> = new Map();
    private _interactive = false;
    private readonly hitTrapezium: HitTrapezium = {
        p1: [0,0],
        p2: [0,0],
        p3: [0,0],
        p4: [0,0]
    };

    public on(event: PointerEventType, callback: PointerCallback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        const eventListeners = this.listeners.get(event)!;
        if (!eventListeners.includes(callback)) {
            eventListeners.push(callback);
        }
        this._interactive = true;
    }

    public off(event: PointerEventType, callback: PointerCallback) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(callback);
            if (index !== -1) {
                eventListeners.splice(index, 1);
            }
        }
        let hasListeners = false;
        for (const eventListener of this.listeners) {
            if (eventListener.length > 0) {
                hasListeners = true;
                break;
            }
        }
        this._interactive = hasListeners;
    }

    public triggerEvent(type: PointerEventType, pointerEvent: IPointerEvent) {
        const eventListeners = this.listeners.get(type);
        if (eventListeners) {
            for (const callback of eventListeners) {
                callback(pointerEvent);
            }
        }
    }

    public get interactive() {
        return this._interactive;
    }

    public updateHitPoint(index:1|2|3|4,point:n2) {
        this.hitTrapezium[`p${index}`][0] = point[0];
        this.hitTrapezium[`p${index}`][1] = point[1];
    }

    public doesPointHitTrapezium(point: n2): boolean {
        const { p1, p2, p3, p4 } = this.hitTrapezium;

        // order around the polygon
        const poly: n2[] = [p1, p2, p4, p3];

        let sign: number | null = null;
        const eps = 1e-6;

        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = poly[(i + 1) % poly.length];

            const cross =
                (b[0] - a[0]) * (point[1] - a[1]) -
                (b[1] - a[1]) * (point[0] - a[0]);

            const s = cross >= -eps ? 1 : -1;

            if (sign === null) sign = s;
            else if (sign !== s) return false;
        }

        return true;
    }

}
