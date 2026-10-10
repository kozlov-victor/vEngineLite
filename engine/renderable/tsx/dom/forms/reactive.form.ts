import {Reactive} from "@engine/renderable/tsx/decorator/reactive";

type tInputEvent =
    Event & {target: HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement};

export interface IReactiveFormControlDesc<U> {
    value: U;
    required?: boolean;
    numeric?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: ((value: any) => {code:string,valid:boolean,message?:string})[];
}

const Numeric = (val:string):number=>{
    const numeric = +val;
    if (!val || isNaN(numeric)) {
        return undefined!;
    }
    return numeric;
}

export class ReactiveForm<U> {

    private controls: Record<string, IReactiveFormControlDesc<unknown>>;
    private validationErrors: Record<string, any[]> = {};
    private valid = true;
    private values: Record<string, any> = {};

    private constructor() {
    }

    public static defineControls<TControls extends Record<string, IReactiveFormControlDesc<unknown>>>(
        controls: TControls
    ): ReactiveForm<{[P in keyof TControls]: TControls[P]['value']}>
        & {[P in keyof TControls]: TControls[P]['value']} {
        const form = new ReactiveForm<{[P in keyof TControls]: TControls[P]['value']}>();
        form.controls = controls;
        form.initializeValues();
        return form as ReactiveForm<{[P in keyof TControls]: TControls[P]['value']}>
            & {[P in keyof TControls]: TControls[P]['value']};
    }

    private initializeValues() {
        for (const key in this.controls) {
            const control = this.controls[key];
            (this as any)[key] = control.value;
            this.values[key] = control.value;
        }
    }

    private validateControl(key: string): boolean {
        const control = this.controls[key];
        let valid = true;
        const value = this.values[key];
        const numericValue = control.numeric?Number(this.values[key]):undefined;
        const valueEmpty = value === null || value === undefined || value === '';

        if (!control.required && valueEmpty) {
            // If the field is not required and the value is empty, skip further validation
            return valid;
        }

        if (control.required && valueEmpty) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({'required': true});
            valid = false;
        }

        if (control.numeric) {
            if (typeof numericValue !== 'number' || isNaN(numericValue)) {
                this.validationErrors[key] = this.validationErrors[key] || [];
                this.validationErrors[key].push({'numeric': true});
                valid = false;
            }
        }
        if (control.minLength !== undefined && typeof value === 'string' && value.length < control.minLength) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({minLength: control.minLength});
            valid = false;
        }
        if (control.maxLength !== undefined && typeof value === 'string' && value.length > control.maxLength) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({maxLength: control.maxLength});
            valid = false;
        }
        if (control.min !== undefined && numericValue!==undefined && numericValue < control.min) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({min: control.min});
            valid = false;
        }
        if (control.max !== undefined && numericValue!==undefined && numericValue > control.max) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({max: control.max});
            valid = false;
        }
        if (control.pattern !== undefined && typeof value === 'string' && !control.pattern.test(value)) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({pattern: control.pattern});
            valid = false;
        }
        if (control.custom !== undefined) {
            for (const validator of control.custom) {
                const result = validator(value);
                if (!result.valid) {
                    this.validationErrors[key] = this.validationErrors[key] || [];
                    this.validationErrors[key].push({[result.code]: result.message ?? value});
                    valid = false;
                }
            }
        }
        return valid;
    }

    public validate() {
        this.validationErrors = {};
        let isValid = true;
        for (const key in this.controls) {
            if (!this.validateControl(key)) {
                isValid = false;
            }
        }
        this.valid = isValid;
        return isValid;
    }

    public isFormValid() {
        return this.valid;
    }

    public isFormInvalid() {
        return !this.valid;
    }

    public isValid(key: keyof U) {
        const k = key as string;
        return !this.validationErrors[k] || this.validationErrors[k].length === 0;
    }

    public isInvalid(key: keyof U) {
        return !this.isValid(key);
    }

    public getErrors() {
        return this.validationErrors;
    }

    public getError(key: keyof U): string | undefined {
        const k = key as string;
        const fieldErrors = this.validationErrors[k] || [];
        if (fieldErrors.length === 0) return undefined;
        const errorCodeObj = fieldErrors[0];
        const errorCode = Object.keys(errorCodeObj)[0];
        switch (errorCode) {
            case 'required':
                return 'This field is required';
            case 'numeric':
                return 'This field must be a number';
            case 'minLength':
                return `Minimum length is ${errorCodeObj[errorCode]}`;
            case 'maxLength':
                return `Maximum length is ${errorCodeObj[errorCode]}`;
            case 'min':
                return `Minimum value is ${errorCodeObj[errorCode]}`;
            case 'max':
                return `Maximum value is ${errorCodeObj[errorCode]}`;
            case 'pattern':
                return `Value does not match the required pattern`;
        }
        return errorCodeObj[errorCode];
    }

    private setSerializedFormValue(key: string) {
        let value = this.values[key];
        if (this.controls[key].numeric) {
            value = Numeric(value);
        }
        (this as any)[key] = value;
        return value;
    }

    private onFormChange(key: string): void {
        this.setSerializedFormValue(key);
        this.validate();
    }

    @Reactive.Method()
    private setInputValue(e: tInputEvent, key: string) {
        this.values[key] = e.target.value;
        this.onFormChange(key as string);
    }

    @Reactive.Method()
    private setCheckBoxValue(e: tInputEvent, key: string) {
        this.values[key] = (e.target as any).checked;
        this.onFormChange(key as string);
    }

    public bindSelect(key: keyof U) {
        return {
            value: this.values[key as string] as string,
            onchange: (e: tInputEvent)=>this.setInputValue(e,key as string),
        }
    }

    public bindInput(key: keyof U, phase:'onchange'|'oninput' = 'oninput') {
        return {
            value: this.values[key as string] as string,
            [phase]: (e: tInputEvent)=>this.setInputValue(e,key as string),
        }
    }

    public bindCheckBox(key: keyof U) {
        return {
            checked: this.values[key as string] as boolean,
            onchange: (e: tInputEvent)=>this.setCheckBoxValue(e,key as string),
        }
    }

    public serialize(): U {
        const result:Record<string, any> = {};
        const keys = Object.keys(this.controls);
        for (const key of keys) {
            result[key] = this.setSerializedFormValue(key);
        }
        return result as U;
    }

}
