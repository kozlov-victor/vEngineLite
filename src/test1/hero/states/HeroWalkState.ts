import {HeroGameObject} from "../HeroGameObject";
import {HeroFallState} from "./HeroFallState";
import {HeroIdleState} from "./HeroIdleState";
import {HeroAttack1State} from "./HeroAttack1State";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";
import {HeroFireState} from "./HeroFireState";
import {HeroAttack2State} from "./HeroAttack2State";

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
            case 'attack1': return HeroAttack1State.name;
            case 'attack2': return HeroAttack2State.name;
            case 'fire': return HeroFireState.name;
        }
        return null;
    }

}
