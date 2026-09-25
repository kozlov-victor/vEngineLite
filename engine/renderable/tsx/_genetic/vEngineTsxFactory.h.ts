import {VirtualCommentNode, VirtualNode, VirtualTextNode} from "@engine/renderable/tsx/_genetic/virtualNode";
import {VirtualFragment} from "@engine/renderable/tsx/_genetic/virtualFragment";
import {BaseTsxComponent} from "@engine/renderable/tsx/base/baseTsxComponent";

const flattenDeep = <T>(arr: (T[] | T)[]): T[] => {

    const result: T[] = [];
    const stack: (T[] | T)[] = [...arr].reverse();

    while (stack.length > 0) {

        const value = stack.pop()!;

        if (Array.isArray(value)) {
            for (let i = value.length - 1; i >= 0; i--) {
                stack.push(value[i]);
            }
        } else {
            result.push(value);
        }
    }

    return result;
};

export const getComponentUuid = (props:Record<string, any>,index?:number)=>{
    let id = props.trackBy ?
        `${props.trackBy}_${props.__id}`:
        props.__id;
    if(index!==undefined) id += `_${index}`;
    return id;
}

const obj = {};
const isPlainObj = (value:any)=>{
    if (typeof value !== 'object' || value === null) return false;
    return Object.getPrototypeOf(value) === Object.getPrototypeOf(obj)
}

export class VEngineTsxFactory {

    private static componentInstances:Record<string, BaseTsxComponent> = {};

    private static _renderComponent(instance:BaseTsxComponent,props: Record<string, any>) {
        (instance as any).props = props;
        let node = instance.render() as VirtualNode|VirtualFragment;
        if (node===null || node===undefined) {
            node = new VirtualFragment([]);
        }
        else if (node.type==='virtualNode') { //це звичайний елемент
            node = new VirtualFragment([node]);
        }
        else if (node.type!=='virtualFragment') { // це текст
            node = new VirtualFragment([new VirtualTextNode(String(node))]);
        }
        const commentNode = new VirtualCommentNode(props,`cid:${getComponentUuid(props)}`);
        commentNode.parentComponent = instance;
        // for (const child of node.children) {
        //     if (child.type==='virtualNode') {
        //         (child as any).props.classNames ??={};
        //         (child as any).props.classNames[(instance.constructor as any).__injectable] = true;
        //     }
        // }
        node.children.unshift(commentNode);
        return node;
    }

    public static createElement(
        item:string|((props:Record<string, any>)=>VirtualNode|VirtualFragment)|{new: BaseTsxComponent},
        props:Record<string, any>,
        ...children: (VirtualNode|VirtualFragment|string|number|any)[]
    ):JSX.Element {
        if (props===null) props = {};

        const flattenedChildren:(VirtualNode|VirtualFragment)[] =
            flattenDeep(children).
            map((it,i)=>{
                if (
                    (it as unknown as string)?.substr!==undefined ||
                    (it as unknown as number)?.toFixed!==undefined ||
                    (it===true) ||
                    isPlainObj(it)
                ) {
                    return  new VirtualTextNode(String(it));
                }
                else return it;
            }).
            filter(it=>!!it); // remove null, false and undefined;
        const flattenedChildrenNoFragments:VirtualNode[] = [];
        for (const node of flattenedChildren) {
            if (node.type==='virtualFragment') {
                flattenedChildrenNoFragments.push(...node.children);
            }
            else flattenedChildrenNoFragments.push(node);
        }

        const propsWithChildren:Record<string, any> & {children:VirtualNode[]} =
            {...props,children:flattenedChildrenNoFragments};

        if ((item as any).__VEngineTsxComponent) {
            const uuid = getComponentUuid(props);
            let instance:BaseTsxComponent;
            if (VEngineTsxFactory.componentInstances[uuid]) {
                instance = VEngineTsxFactory.componentInstances[uuid];
                instance.onPropsReceived(props);
                return this._renderComponent(instance,propsWithChildren);
            } else {
                instance = new (item as any)(propsWithChildren) as BaseTsxComponent;
                VEngineTsxFactory.componentInstances[uuid] = instance;
            }
            return this._renderComponent(instance,propsWithChildren);
        }
        else if ((item as (props:Record<string, any>)=>VirtualNode).call!==undefined) {
            return (item as (arg: any) => VirtualNode)(propsWithChildren);
        }
        else {
            const tagName = item as string;
            return new VirtualNode(propsWithChildren, tagName, flattenedChildrenNoFragments);
        }
    }

    public static destroyComponent(el:VirtualNode) {
        const props: Record<string, any> = (el.parentComponent as any)?.props;
        if (!props) return;
        const uuid = getComponentUuid(props);
        delete this.componentInstances[uuid];
    }

    public static createFragment({children}:{children: VirtualNode[]}):VirtualFragment {
        return new VirtualFragment(children);
    }

    public static clean() {
        this.componentInstances = {};
    }

}
