
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

export interface IMouseComponent {
    on(event: MouseEventType, callback: MouseCallback): void;
    off(event: MouseEventType, callback: MouseCallback): void;
    interactive: boolean;
}

export class MouseComponent implements IMouseComponent {
    private listeners: Map<MouseEventType, MouseCallback[]> = new Map();
    private _interactive = false;

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

}
