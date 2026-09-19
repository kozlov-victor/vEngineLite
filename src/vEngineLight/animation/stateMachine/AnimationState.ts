import {FrameAnimation} from "../FrameAnimation";

export abstract class AnimationState {
    public abstract onEnter(): FrameAnimation;
    public onExit() {};
    public onAnimationCompleted(): string|null {
        return null;
    }
    public abstract receiveCommand(command:string):string|null;
}
