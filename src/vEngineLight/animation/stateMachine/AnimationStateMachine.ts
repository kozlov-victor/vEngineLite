import {AnimationState} from "./AnimationState";
import {IUpdateable} from "../../types";
import {FrameAnimationPlayer} from "../FrameAnimationPlayer";

export class AnimationStateMachine implements IUpdateable {

    private states:Record<string, AnimationState> = {};
    private currentState:AnimationState;

    public constructor(private readonly player: FrameAnimationPlayer) {
    }

    public addStates(...states:AnimationState[]) {
        for (const state of states) {
            this.states[state.constructor.name] = state;
        }
    }

    public setInitialState(state:string) {
        this.currentState = this.getState(state);
        this.player.play(this.currentState.onEnter());
    }

    public sendCommand(message:string) {
        if (!this.currentState) return false;
        const nextStateName = this.currentState.receiveCommand(message);
        if (nextStateName) {
            this.toNextState(nextStateName);
            return true;
        }
        return false;
    }

    private getState(name:string) {
        const state = this.states[name];
        if (!state) throw new Error(`State ${name} not found`);
        return state;
    }

    private toNextState(nextStateName:string) {
        this.currentState.onExit();
        this.currentState = this.getState(nextStateName);
        this.player.play(this.currentState.onEnter());
    }

    public update(dt: number) {
        if (this.player.isAnimationCompleted()) {
            const nextStateName = this.currentState.onAnimationCompleted();
            if (nextStateName) {
                this.toNextState(nextStateName);
            }
        }
    }

}
