import {AnimationState} from "@vEngineLite/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroLookUpState} from "./HeroLookUpState";
import {HeroWalkState} from "./HeroWalkState";
import {HeroFallState} from "./HeroFallState";
import {HeroSitState} from "./HeroSitState";
import {HeroAttack1State} from "./HeroAttack1State";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroFireState} from "./HeroFireState";
import {HeroAttack2State} from "./HeroAttack2State";

export class HeroIdleState extends AnimationState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter() {
        return this.hero.idleAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'walk': return HeroWalkState.name;
            case 'lookUp': return HeroLookUpState.name;
            case 'unground': return HeroFallState.name;
            case 'sit': return HeroSitState.name;
            case 'attack1': return HeroAttack1State.name;
            case 'attack2': return HeroAttack2State.name;
            case 'fire': return HeroFireState.name;
        }
        return null;
    }



}
