import {AnimationState} from "../../../../vEngineLight/animation/stateMachine/AnimationState";
import {Scene} from "../../../../vEngineLight/application/Scene";
import {KeyboardKey} from "../../../../vEngineLight/inputControl/KeyboardKey";
import {HeroGameObject} from "../../HeroGameObject";

export abstract class HeroAbstractMovingState extends AnimationState {

    private _scene: Scene;
    private _hero: HeroGameObject;

    protected constructor(scene: Scene, hero: HeroGameObject) {
        super();
        this._scene = scene;
        this._hero = hero;
    }

    protected setHeroVelocity() {
        let vel: number|undefined;
        if (this._scene.input.keyboard.isPressed(KeyboardKey.RIGHT)) vel = this._hero.walkVelocity;
        else if (this._scene.input.keyboard.isPressed(KeyboardKey.LEFT)) vel = -this._hero.walkVelocity;
        if (vel!==undefined) this._hero.getRigidBody().velocity.x = vel;
    }

}
