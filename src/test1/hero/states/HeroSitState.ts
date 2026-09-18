import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroFallState} from "./HeroFallState";

export class HeroSitState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter(): void {
        this.hero.animationPlayer.play(this.hero.sidDownAnimation);
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'stopSit': return HeroIdleState.name;
            case 'unground': return HeroFallState.name;
        }
        return null;
    }




}
