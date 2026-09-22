import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {Scene} from "../../../vEngineLight/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";

export class HeroFireState extends HeroAbstractMovingState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super(scene, hero);
    }

    override onEnter() {
        this.setHeroVelocity();
        return this.hero.fireAnimation;
    }

    override onAnimationStarted() {
        this.hero.getRigidBody().velocity.x = -100 * this.hero.scale.x; // віддача
    }

    override onAnimationCompleted(): string | null {
        return HeroIdleState.name;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'walk': return HeroFireState.name;
        }
        return null;
    }




}
