import {FrameAnimation} from "./FrameAnimation";
import {IUpdateable} from "../types";

export class FrameAnimationPlayer implements IUpdateable {

    private currentAnimation: FrameAnimation|undefined;
    private completed: boolean;

    public play(fa: FrameAnimation) {
        if (fa===this.currentAnimation) return false;
        fa.reset();
        this.completed = false;
        this.currentAnimation = fa;
        return true;
    }

    public stop() {
        this.currentAnimation = undefined;
    }

    public isAnimationCompleted() {
        return this.completed;
    }

    public update(dt: number) {
        if(!this.currentAnimation) return;
        this.currentAnimation.update(dt);
        this.completed = this.currentAnimation.isCompleted();
    }

}
