import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroFallState} from "./HeroFallState";
import {Scene} from "../../../vEngineLight/application/Scene";

export class HeroSitState extends AnimationState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter() {
        return this.hero.sitAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'stopSit': return HeroIdleState.name;
            case 'unground': return HeroFallState.name;
        }
        return null;
    }




}
