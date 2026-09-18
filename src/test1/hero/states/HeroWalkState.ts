import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroFallState} from "./HeroFallState";
import {HeroIdleState} from "./HeroIdleState";

export class HeroWalkState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter(): void {
        this.hero.animationPlayer.play(this.hero.walkAnimation);
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'stop': return HeroIdleState.name;
            case 'unground': return HeroFallState.name;
            case 'walk': return HeroWalkState.name;
        }
        return null;
    }

}
