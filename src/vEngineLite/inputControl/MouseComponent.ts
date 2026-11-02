import {n2} from "@vEngineLite/types";

export interface MouseEvent {
    type: MouseEventType;
    x: number;
    y: number;
    mouseDown: boolean;
}

export type MouseCallback = (event: MouseEvent) => void;

export enum MouseEventType {
    MOUSE_DOWN = 'mousedown',
    MOUSE_UP = 'mouseup',
    MOUSE_MOVE = 'mousemove'
}

/**
 p1-----------p2
 |           |
 |           |
 |           |
 p4-----------p3
 */
export interface HitTrapezium {
    p1: n2;
    p2: n2;
    p3: n2;
    p4: n2;
}

export interface IMouseComponent {
    on(event: MouseEventType, callback: MouseCallback): void;
    off(event: MouseEventType, callback: MouseCallback): void;
    interactive: boolean;
}

export class MouseComponent implements IMouseComponent {
    private listeners: Map<MouseEventType, MouseCallback[]> = new Map();
    private _interactive = false;
    private readonly hitTrapezium: HitTrapezium = {
        p1: [0,0],
        p2: [0,0],
        p3: [0,0],
        p4: [0,0]
    };

    public on(event: MouseEventType, callback: MouseCallback) {
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

    public off(event: MouseEventType, callback: MouseCallback) {
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

    public get interactive() {
        return this._interactive;
    }

    public updateHitTrapezium(p1: n2, p2: n2, p3: n2, p4: n2) {
        this.hitTrapezium.p1[0] = p1[0];
        this.hitTrapezium.p1[1] = p1[1];
        this.hitTrapezium.p2[0] = p2[0];
        this.hitTrapezium.p2[1] = p2[1];
        this.hitTrapezium.p3[0] = p3[0];
        this.hitTrapezium.p3[1] = p3[1];
        this.hitTrapezium.p4[0] = p4[0];
        this.hitTrapezium.p4[1] = p4[1];
    }

}
