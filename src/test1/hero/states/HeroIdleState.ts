import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroLookUpState} from "./HeroLookUpState";
import {HeroWalkState} from "./HeroWalkState";
import {HeroFallState} from "./HeroFallState";
import {HeroSitState} from "./HeroSitState";

export class HeroIdleState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter(): void {
        this.hero.animationPlayer.play(this.hero.idleAnimation);
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'walk': return HeroWalkState.name;
            case 'lookUp': return HeroLookUpState.name;
            case 'unground': return HeroFallState.name;
            case 'sit': return HeroSitState.name;
        }
        return null;
    }



}
