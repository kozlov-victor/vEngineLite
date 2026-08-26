type Callback = ()=>void;

const KEY_DOWN = 'keydown';
const KEY_UP = 'keyup';


export class KeyboardInputControl {

    private listeners: Map<string, Map<string,Callback[]>> = new Map();
    private keyBuffer = new Set<string>();

    constructor() {
        this.keyDownListener = this.keyDownListener.bind(this);
        this.keyUpListener = this.keyUpListener.bind(this);
    }

    public start(): void {
        window.addEventListener(KEY_DOWN, this.keyDownListener);
        window.addEventListener(KEY_UP, this.keyUpListener);
    }

    public stop(): void {
        window.removeEventListener(KEY_DOWN, this.keyDownListener);
        window.removeEventListener(KEY_UP, this.keyUpListener);
    }

    private readonly keyDownListener = (event: KeyboardEvent)=> {
        if (event.repeat) return;
        this.keyBuffer.add(event.code);
        const listeners = this.getListeners(KEY_DOWN,event.code);
        if (!listeners) return;
        for (const listener of listeners) listener();
    }

    private readonly keyUpListener = (event: KeyboardEvent)=> {
        this.keyBuffer.delete(event.code);
        const listeners = this.getListeners(KEY_UP,event.code);
        if (!listeners) return;
        for (const listener of listeners) listener();
    }

    private addListener(eventName: string,btn: string,callback: Callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName,new Map());
        }
        if (!this.listeners.get(eventName)!.has(btn)) {
            this.listeners.get(eventName)!.set(btn, []);
        }
        this.listeners.get(eventName)!.get(btn)!.push(callback);
    }

    private removeListener(eventName: string, btn: string, callback: Callback) {
        const events = this.listeners.get(eventName)?.get(btn);
        if (!events) return false;
        const index = events.indexOf(callback);
        if (index<0) return false;
        events.splice(index, 1);
        return true;
    }

    private getListeners(eventName: string, btn: string) {
        return this.listeners.get(eventName)?.get(btn);
    }

    public onKeyDown(btn: string, callback: Callback) {
        this.addListener(KEY_DOWN, btn, callback);
    }

    public offKeyDown(btn: string, callback: Callback) {
        return this.removeListener(KEY_DOWN, btn, callback);
    }

    public onKeyUp(btn: string, callback: Callback) {
        this.addListener(KEY_UP, btn, callback);
    }

    public offKeyUp(btn: string, callback: Callback) {
        return this.removeListener(KEY_UP, btn, callback);
    }

    public isPressed(btn: string) {
        return this.keyBuffer.has(btn);
    }

}
