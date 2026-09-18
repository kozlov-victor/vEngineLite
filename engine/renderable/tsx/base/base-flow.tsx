import {IBaseProps} from "@engine/renderable/tsx/_genetic/virtualNode";
import { VEngineTsxFactory } from "../_genetic/vEngineTsxFactory.h";

export const If = (props: IBaseProps & {condition:boolean})=>{
    if (!props.condition) return null;
    if (!props.children) return null;
    const result:JSX.Element[] = [];
    for (const child of props.children) {
        if (child.call!==undefined) {
            result.push(child());
        }
        else {
            result.push(child);
        }
    }
    return <>{result}</>;
}

export const Loop = <T extends unknown>(props: IBaseProps & {array:T[]})=>{
    if (!props.children) return null;
    const result:JSX.Element[] = [];
    let i = 0;
    for (const item of props.array) {
        for (const child of props.children) {
            if (child.call!==undefined) {
                result.push(child(item,i++));
            }
            else {
                result.push(child);
            }
        }
    }
    return <>{result}</>;
}
