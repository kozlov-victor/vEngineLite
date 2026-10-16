type Constructor<T = Record<any, any>> = new (...args: any[]) => T;
type InjectionToken<T> = Constructor<T> | (() => Constructor<T>);
const DIContext:Record<string, any> = {};

function isConstructor<T>(token: InjectionToken<T>): token is Constructor<T> {
    return Object.prototype.hasOwnProperty.call(token, 'prototype');
}

export const DI = {
    CSS: (
        filePath: string,
        params?: { global?: boolean }
    )=>{
        return function ClassDecorator<C extends Constructor>(
            target: C,
            ctx: ClassDecoratorContext,
        ) {
            return class extends target {
                public static readonly __injectable = target.prototype.constructor.__injectable ?? target.name;
                public static readonly __scope =
                    params?.global? undefined :
                    target.prototype.constructor.__injectable ?? target.name;
            };
        };
    },
    registerInstance: (instance:any):void=>{
        const tkn = instance.constructor.name;
        instance.constructor.__injectable = tkn;
        DIContext[tkn] = instance;
    },
    getInstance: <T>(tkn:string):T=>{
        const res = DIContext[tkn];
        if (!res) {
            throw new Error(`instance is not registered: ${tkn}`);
        }
        return res as T;
    },
    Injectable: ()=> {
        return function ClassDecorator<C extends Constructor>(
            target: C,
            ctx: ClassDecoratorContext,
        ) {
            return class extends target {
                public static readonly __injectable = target.prototype.constructor.__injectable ?? target.name;
                public static readonly __constructorArgumentsLength = target.length;
                constructor(...args: any[]) {
                    super(...args);
                    DIContext[target.name] = this;
                }
            };
        };
    },
    Inject: <T = unknown>(token?:InjectionToken<T>)=>{
        return <This,Value extends T>(value: undefined, context: ClassFieldDecoratorContext<This,Value>):void => {
            context.addInitializer(function(){
                const thisToken = (this as any).constructor.__injectable as string;
                if (!thisToken) {
                    console.error(this);
                    throw new Error(`not injectable: ${(this as any).constructor.name}`);
                }
                Object.defineProperty(this, context.name, {
                    get: () => {
                        if (!token) {
                            throw new Error(`can not inject ${String(context.name)}: no runtime type was provided; use the DI injection transformer`);
                        }
                        const clazz = isConstructor(token) ? token : token();
                        const injectToken = (clazz as any).__injectable;
                        if (!injectToken) {
                            throw new Error(`not injectable: consider adding @Injectable() decorator to class ${clazz.name}`);
                        }
                        if (!DIContext[injectToken]) {
                            const constructorArgumentsLength = (clazz as any).__constructorArgumentsLength as number;
                            if (constructorArgumentsLength>0) {
                                throw new Error(`can not inject ${injectToken}: no default constructor`);
                            }
                            DIContext[injectToken] = new clazz();
                        }
                        return DIContext[injectToken];
                    },
                    set: val => {
                        // pass
                    }
                });
            });
        };
    },
}
