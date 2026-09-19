import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroFallState} from "./HeroFallState";
import {HeroIdleState} from "./HeroIdleState";
import {HeroAttackState} from "./HeroAttackState";

export class HeroWalkState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter() {
        return this.hero.walkAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'stop': return HeroIdleState.name;
            case 'unground': return HeroFallState.name;
            case 'attack': return HeroAttackState.name;
            case 'walk': return HeroWalkState.name;
        }
        return null;
    }

}
