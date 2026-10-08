import {IFormChangeListener} from "@engine/renderable/tsx/dom/forms/IFormChangeListener";
import {InputSetterService} from "@engine/renderable/tsx/dom/forms/input.setter.service";

export interface IReactiveFormControlDesc<U> {
    value: U;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: ((value: any) => {code:string,valid:boolean,message?:string})[];
}

export class ReactiveForm<U> implements IFormChangeListener{

    private controls: Record<string, IReactiveFormControlDesc<unknown>>;
    private validationErrors: Record<string, any[]> = {};
    private valid = true;

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

    public bind(inputSetter: InputSetterService) {
        inputSetter.addListener(this);
    }

    public unbind(inputSetter: InputSetterService) {
        inputSetter.removeListener(this);
    }

    private initializeValues() {
        for (const key in this.controls) {
            const control = this.controls[key];
            (this as any)[key] = control.value;
        }
    }

    private validateControl(key: string): boolean {
        const control = this.controls[key];
        let valid = true;
        const value = (this as any)[key];
        if (control.required && (value === null || value === undefined || value === '')) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({'required': true});
            valid = false;
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
        if (control.min !== undefined && typeof value === 'number' && value < control.min) {
            this.validationErrors[key] = this.validationErrors[key] || [];
            this.validationErrors[key].push({min: control.min});
            valid = false;
        }
        if (control.max !== undefined && typeof value === 'number' && value > control.max) {
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

    public isValid(key: keyof U) {
        const k = key as string;
        return !this.validationErrors[k] || this.validationErrors[k].length === 0;
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

    onFormChange(key: string, value: any): void {
        (this as any)[key] = value;
        this.validate();
    }

}
