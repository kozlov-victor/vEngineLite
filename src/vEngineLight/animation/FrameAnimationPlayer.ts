import {FrameAnimation} from "./FrameAnimation";

export class FrameAnimationPlayer {

    private currentAnimation: FrameAnimation|undefined;

    public play(fa: FrameAnimation) {
        fa.reset();
        this.currentAnimation = fa;
    }

    public stop() {
        this.currentAnimation = undefined;
    }

    public update(time: number) {
        if(this.currentAnimation) this.currentAnimation.update(time);
    }

}
