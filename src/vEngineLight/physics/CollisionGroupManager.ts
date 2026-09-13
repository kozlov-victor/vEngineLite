
class CollisionGroup {

    constructor(public readonly bitMask: number) {
    }
}

export type {CollisionGroup}

export class CollisionGroupManager {

    private base = 1;
    private count  = 0;

    public nextGroup() {
        if (this.count >= 31) {
            throw new Error("Maximum number of collision categories reached");
        }
        const result = this.base;
        this.base <<= 1;
        this.count++;
        return new CollisionGroup(result);
    }

    public static combine(categories: CollisionGroup[]) {
        let result = 0;
        for (const category of categories) {
            result|=category.bitMask;
        }
        return new CollisionGroup(result);
    }

    private static defaultGroup = new CollisionGroup(1);

    public static getDefaultGroup() {
        return this.defaultGroup;
    }
}
