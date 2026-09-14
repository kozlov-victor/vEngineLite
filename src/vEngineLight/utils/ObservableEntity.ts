type tCallback = ()=>void;

export abstract class ObservableEntity {

    private readonly callbacks:tCallback[] = [];

    public onChange(cb:tCallback) {
        this.callbacks.push(cb);
        return cb;
    }

    public offChange(cb:tCallback) {
        this.callbacks.splice(this.callbacks.indexOf(cb), 1);
    }

    protected notifyChange() {
        for (const callback of this.callbacks) {
            callback();
        }
    }

}
