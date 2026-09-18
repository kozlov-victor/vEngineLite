import {AnimationState} from "./AnimationState";

export class AnimationStateMachine {

    private states:Record<string, AnimationState> = {};
    private currentState:AnimationState;

    public addStates(...states:AnimationState[]) {
        for (const state of states) {
            this.states[state.constructor.name] = state;
        }
    }

    public setInitialState(state:string) {
        this.currentState = this.getState(state);
        this.currentState.onEnter();
    }

    public sendCommand(message:string) {
        if (!this.currentState) return false;
        const nextStateName = this.currentState.receiveCommand(message);
        if (nextStateName) {
            this.currentState.onExit();
            this.currentState = this.getState(nextStateName);
            this.currentState.onEnter();
            //console.log('onEntered',this.currentState);
            return true;
        }
        return false;
    }

    private getState(name:string) {
        const state = this.states[name];
        if (!state) throw new Error(`State ${name} not found`);
        return state;
    }

}
