import {AnimationState} from "@vEngineLite/animation/stateMachine/AnimationState";
import {HeroGameObject} from "../HeroGameObject";
import {HeroIdleState} from "./HeroIdleState";
import {HeroFallState} from "./HeroFallState";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroLookUpFireState} from "./HeroLookUpFireState";

export class HeroLookUpState extends AnimationState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super();
    }

    override onEnter() {
        return this.hero.lookUpAnimation;
    }

    receiveCommand(command: string): string | null {
        switch (command) {
            case 'stopLookUp': return HeroIdleState.name;
            case 'fire': return HeroLookUpFireState.name;
            case 'unground': return HeroFallState.name;
        }
        return null;
    }




}
