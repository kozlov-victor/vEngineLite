
export class ObjectPool<T> {

    private readonly collection: T[] = [];
    private readonly free: T[] = [];

    constructor(
        capacity: number,
        factory: () => T
    ) {
        for (let i = 0; i < capacity; i++) {
            const item = factory();
            this.free.push(item);
            this.collection.push(item);
        }
    }

    public acquire(): T | null {
        return this.free.pop() ?? null;
    }

    public release(object: T): void {
        this.free.push(object);
    }

    public getAll() {
        return this.collection as ReadonlyArray<T>;
    }

}
