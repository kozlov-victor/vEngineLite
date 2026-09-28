
export class ObjectPool<T> {

    private readonly free: T[] = [];

    constructor(
        capacity: number,
        factory: () => T
    ) {
        for (let i = 0; i < capacity; i++) {
            this.free.push(factory());
        }
    }

    public acquire(): T | null {
        return this.free.pop() ?? null;
    }

    public release(object: T): void {
        this.free.push(object);
    }
}
