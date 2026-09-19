import {AnimationState} from "../../../vEngineLight/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroAttackState} from "./HeroAttackState";
import {Scene} from "../../../vEngineLight/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";

export class HeroFallState extends HeroAbstractMovingState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super(scene, hero);
    }

    override onEnter() {
        this.setHeroVelocity();
        return this.hero.fallAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'attack': return HeroAttackState.name;
            case 'ground': return HeroIdleState.name;
            case 'walk': return HeroFallState.name;
        }
        return null;
    }




}
