import {FrameAnimation} from "../FrameAnimation";

export abstract class AnimationState {
    public abstract onEnter(): FrameAnimation;
    public onAnimationStarted(): void {}
    public onAnimationCompleted(): string|null {
        return null;
    }
    public onExit() {};
    public abstract receiveCommand(command:string):string|null;
}
