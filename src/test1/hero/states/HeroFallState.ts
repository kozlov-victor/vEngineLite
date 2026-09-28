import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroAttack1State} from "./HeroAttack1State";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";
import {HeroFireState} from "./HeroFireState";
import {HeroAttack2State} from "./HeroAttack2State";

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
            case 'attack1': return HeroAttack1State.name;
            case 'attack2': return HeroAttack2State.name;
            case 'ground': return HeroIdleState.name;
            case 'walk': return HeroFallState.name;
            case 'fire': return HeroFireState.name;
        }
        return null;
    }




}
