import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroFallState} from "./HeroFallState";
import {Scene} from "../../../vEngineLight/application/Scene";
import {HeroAttackState} from "./HeroAttackState";
import {HeroFireState} from "./HeroFireState";

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
            case 'attack': return HeroAttackState.name;
            case 'unground': return HeroFallState.name;
            case 'fire': return HeroFireState.name;
        }
        return null;
    }




}
