
export abstract class AnimationState {
    public onEnter() {}
    public onExit() {};
    public abstract receiveCommand(command:string):string|null;
}
