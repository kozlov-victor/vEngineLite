import {HeroGameObject, ShootType} from "../HeroGameObject";
import {Scene} from "@vEngineLite/application/Scene";
import {HeroAbstractMovingState} from "./abstracts/HeroAbstractMovingState";
import {HeroIdleState} from "./HeroIdleState";

export class HeroLookUpFireState extends HeroAbstractMovingState {

    constructor(private readonly scene: Scene, private readonly hero: HeroGameObject) {
        super(scene, hero);
    }

    override onEnter() {
        return this.hero.lookUpFireAnimation;
    }

    override onAnimationStarted() {
        this.hero.shoot(ShootType.UP); // постріл
    }

    override onAnimationCompleted(): string | null {
        return HeroIdleState.name;
    }

    receiveCommand(command: string): string | null {
        return null;
    }




}
