import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";

export class HeroFallState extends AnimationState {

    constructor(private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter(): void {
        this.hero.animationPlayer.play(this.hero.fallAnimation);
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'ground': return HeroIdleState.name;
        }
        return null;
    }




}
