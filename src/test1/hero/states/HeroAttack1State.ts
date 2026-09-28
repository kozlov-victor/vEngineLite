import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";

export class HeroAttack1State extends HeroAbstractMovingState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super(scene, hero);
    }

    override onEnter() {
        this.setHeroVelocity();
        return this.hero.attack1Animation;
    }

    override onAnimationCompleted(): string | null {
        return HeroIdleState.name;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'walk': return HeroAttack1State.name;
        }
        return null;
    }




}
