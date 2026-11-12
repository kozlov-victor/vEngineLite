import {HeroGameObject, ShootType} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";
import {HeroSitState} from "./HeroSitState";

export class HeroSitFireState extends HeroAbstractMovingState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super(scene, hero);
    }

    override onEnter() {
        this.setHeroVelocity();
        return this.hero.sitFireAnimation;
    }

    override onAnimationStarted() {
        this.hero.shoot(ShootType.SIT); // постріл
        this.hero.getRigidBody().velocity.x = -100 * this.hero.scale.x; // віддача
    }

    override onAnimationCompleted(): string | null {
        return HeroSitState.name;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'stopSit': return HeroIdleState.name;
        }
        return null;
    }




}
