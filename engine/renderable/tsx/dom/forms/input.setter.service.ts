import {Reactive} from "@engine/renderable/tsx/decorator/reactive";
import {DI} from "@engine/core/ioc";
import {IFormChangeListener} from "@engine/renderable/tsx/dom/forms/IFormChangeListener";

export type tInputEvent =
    Event & {target: HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement};

@DI.Injectable()
export class InputSetterService {

    private listeners: IFormChangeListener[] = [];

    public addListener(l: IFormChangeListener): void {
        this.listeners.push(l);
    }

    public removeListener(l: IFormChangeListener): void {
        const index = this.listeners.indexOf(l);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    @Reactive.Method()
    private setValue<K extends keyof U,U>(e: tInputEvent, model: U,key: K, parser: (raw: string) => U[K]) {
        if ((parser as any)===Boolean) {
            model[key] = (e.target  as any).checked
        }
        else {
            model[key] = parser(e.target.value);
        }
    }

    public bind<K extends keyof U,U>(model: U,key: K, parser: (raw: string) => U[K],phase:'onchange'|'oninput' = 'onchange') {
        if ((parser as any)===Boolean) {
            return {
                checked: model[key] as boolean,
                [phase]: (e: tInputEvent)=>this.setValue(e,model,key,parser),
            }
        }
        else {
            return {
                value: `${model[key] ?? ''}`,
                [phase]: (e: tInputEvent)=>this.setValue(e,model,key,parser),
            }
        }
    }

}

export const Numeric = (val:string)=>{
    if (!val) return NaN;
    return +val;
}
