import {HeroGameObject} from "../HeroGameObject";
import {HeroFallState} from "./HeroFallState";
import {HeroIdleState} from "./HeroIdleState";
import {HeroAttackState} from "./HeroAttackState";
import {Scene} from "../../../vEngineLight/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";
import {HeroFireState} from "./HeroFireState";

export class HeroWalkState extends HeroAbstractMovingState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super(scene, hero);
    }

    override onEnter() {
        this.setHeroVelocity();
        return this.hero.walkAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'walk': return HeroWalkState.name;
            case 'stop': return HeroIdleState.name;
            case 'unground': return HeroFallState.name;
            case 'attack': return HeroAttackState.name;
            case 'fire': return HeroFireState.name;
        }
        return null;
    }

}
