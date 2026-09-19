import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {Scene} from "../../../vEngineLight/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";

export class HeroAttackState extends HeroAbstractMovingState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super(scene, hero);
    }

    override onEnter() {
        this.setHeroVelocity();
        return this.hero.attackAnimation;
    }

    override onAnimationCompleted(): string | null {
        return HeroIdleState.name;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'walk': return HeroAttackState.name;
        }
        return null;
    }




}
