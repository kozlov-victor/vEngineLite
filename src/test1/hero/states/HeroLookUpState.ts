import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroFallState} from "./HeroFallState";

export class HeroLookUpState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter() {
        return this.hero.lookUpAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'stopLookUp': return HeroIdleState.name;
            //case 'walk': return HeroWalkState.name;
            case 'unground': return HeroFallState.name;
        }
        return null;
    }




}
