
type Validator = <T>(value: T) => boolean;

export interface Control<T extends string|boolean|number|undefined> {
    value: T;
    validators?: Validator[];
}

type ControlKeys<T> = {
    [K in keyof T]-?: T[K] extends Control<any> ? K : never
}[keyof T];

export abstract class BaseForm {

    private readonly controls:Control<any>[] = [];

    constructor(
    ) {
        Object.keys(this).forEach(key=>{
            if ((this as any)[key]?.value) {
                const control = (this as any)[key] as Control<any>;
                this.controls.push(control);
            }
        })
    }

    getError(field: ControlKeys<this>): string | undefined {
        return undefined;
    }

    isValid() {
        //
    }

}


export class TestForm extends BaseForm {
    public name: Control<string> = {
        value: '',
    }
    public bb: Control<number> = {
        value: 1,
    }
}

const form = new TestForm();
form.getError('bb')
