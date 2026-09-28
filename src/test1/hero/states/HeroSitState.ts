import {AnimationState} from "@vEngineLite/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroFallState} from "./HeroFallState";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroAttack1State} from "./HeroAttack1State";
import {HeroFireState} from "./HeroFireState";
import {HeroAttack2State} from "./HeroAttack2State";

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
            case 'attack1': return HeroAttack1State.name;
            case 'attack2': return HeroAttack2State.name;
            case 'unground': return HeroFallState.name;
            case 'fire': return HeroFireState.name;
        }
        return null;
    }




}
