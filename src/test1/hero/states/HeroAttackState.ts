import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";

export class HeroAttackState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter() {
        return this.hero.attackAnimation;
    }

    override onAnimationCompleted(): string | null {
        return HeroIdleState.name;
    }

    receiveCommand(command: string): string | null {
        return null;
    }




}
