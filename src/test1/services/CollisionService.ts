import {DI} from "@engine/core/ioc";
import {CollisionGroupManager} from "@vEngineLite/physics/CollisionGroupManager";

@DI.Injectable()
export class CollisionService {
    private readonly col = new CollisionGroupManager();
    public readonly rigidBodyGroup = this.col.nextGroup();
    public readonly heroBodyGroup = this.col.nextGroup();
    public readonly bulletGroup = this.col.nextGroup();
    public readonly particleGroup = this.col.nextGroup();
}
