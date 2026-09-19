import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroLookUpState} from "./HeroLookUpState";
import {HeroWalkState} from "./HeroWalkState";
import {HeroFallState} from "./HeroFallState";
import {HeroSitState} from "./HeroSitState";
import {HeroAttackState} from "./HeroAttackState";

export class HeroIdleState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter() {
        return this.hero.idleAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'walk': return HeroWalkState.name;
            case 'lookUp': return HeroLookUpState.name;
            case 'unground': return HeroFallState.name;
            case 'sit': return HeroSitState.name;
            case 'attack': return HeroAttackState.name;
        }
        return null;
    }



}
