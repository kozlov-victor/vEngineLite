import {VirtualCommentNode, VirtualNode} from "@engine/renderable/tsx/_genetic/virtualNode";
import {Optional} from "@engine/core/declarations";
import {AbstractElementCreator} from "@engine/renderable/tsx/_genetic/abstractElementCreator";
import {getComponentUuid, VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {BaseTsxComponent} from "@engine/renderable/tsx/base/baseTsxComponent";
import {VirtualFragment} from "@engine/renderable/tsx/_genetic/virtualFragment";

const getNodeIdentity = (node:VirtualNode):string|undefined => {
    const {key, trackBy, __id} = node.props;
    if (key!==undefined && key!==null) {
        return JSON.stringify([__id, key]);
    }
    if (trackBy!==undefined || __id!==undefined) {
        return JSON.stringify([__id, trackBy]);
    }
    return undefined;
};

export abstract class AbstractTsxDOMRenderer<T> {

    private oldVirtualDom:VirtualNode;
    private readonly allComponents: BaseTsxComponent[] = [];

    protected constructor(public readonly elementCreator:AbstractElementCreator<T>) {
    }

    public render(component:BaseTsxComponent, root:T):VirtualNode{
        const newVirtualNode = component.render() as VirtualNode|VirtualFragment;
        const newVirtualNodeChildren:VirtualNode[] = [];
        if (newVirtualNode.type==='virtualFragment') {
            newVirtualNodeChildren.push(...newVirtualNode.children);
        } else {
            newVirtualNodeChildren.push(newVirtualNode);
        }
        const newVirtualDom = new VirtualNode({},'root',newVirtualNodeChildren);
        this.reconcileChildren(newVirtualDom,this.oldVirtualDom,root);
        this.oldVirtualDom = newVirtualDom;

        for (const cmp of this.allComponents) {
            if (cmp.__shouldBeMounted) {
                cmp.__shouldBeMounted = false;
                cmp.onMounted();
            }
            cmp.onRendered();
        }
        this.allComponents.length = 0;

        return newVirtualDom;
    }

    private destroyNode(node:VirtualNode) {
        VEngineTsxFactory.destroyComponent(node);
        node.children.forEach(it=>this.destroyNode(it));
        node.parentComponent?.onDestroyed();
    }

    private replaceNode(node:T,oldVirtualNode:VirtualNode,newVirtualNode:VirtualNode,realParent:T,virtualParent:Optional<VirtualNode>) {
        const newNode = this.elementCreator.createElementByTagName(newVirtualNode);
        this.setGenericProps(newNode,newVirtualNode,undefined,realParent);
        this.elementCreator.replaceChild(realParent,node,newNode);
        const uuid = getComponentUuid(oldVirtualNode.props);
        if (virtualParent?.children.find(it=>getComponentUuid(it.props)===uuid)===undefined) {
            this.destroyNode(oldVirtualNode);
        }
        this.triggerOnRendered(newVirtualNode);
        return newNode;
    }

    private updateNode(node:T,newVirtualNode:VirtualNode,oldVirtualNode:VirtualNode,parent:T) {
        this.setGenericProps(node,newVirtualNode,oldVirtualNode,parent);
        this.triggerOnRendered(newVirtualNode);
    }

    private createNode(newVirtualNode:VirtualNode,parent:T) {
        const node = this.elementCreator.createElementByTagName(newVirtualNode);
        this.setGenericProps(node,newVirtualNode,undefined,parent);
        this.elementCreator.appendChild(parent,node);
        this.triggerOnRendered(newVirtualNode);
        return node;
    }

    private triggerOnRendered(newVirtualNode:VirtualNode) {
        if (newVirtualNode.parentComponent) {
            this.allComponents.push(newVirtualNode.parentComponent);
        }
    }

    private reconcile(
        newVirtualNode:Optional<VirtualNode>,
        oldVirtualNode:Optional<VirtualNode>,realNode:Optional<T>,
        parent:T,
        virtualParent:Optional<VirtualNode>
    ) {

        //render node
        let newRealNode:Optional<T> = realNode;
        if (newVirtualNode===undefined && oldVirtualNode!==undefined) {  // remove node
            if (newRealNode!==undefined) {
                this.elementCreator.removeElement(newRealNode);
                this.destroyNode(oldVirtualNode);
            }
        }
        else if (newVirtualNode!==undefined && oldVirtualNode!==undefined && newRealNode!==undefined) {
            if (
                newVirtualNode.props?.trackBy !==oldVirtualNode.props?.trackBy ||
                newVirtualNode.props?.__id !==oldVirtualNode.props?.__id ||
                newVirtualNode.tagName!==oldVirtualNode.tagName
            ) { // replace node
                newRealNode = this.replaceNode(newRealNode,oldVirtualNode,newVirtualNode,parent,virtualParent);
            } else {
                this.updateNode(newRealNode,newVirtualNode,oldVirtualNode,parent); // update node
            }
        }
        else if (newVirtualNode!==undefined && (oldVirtualNode===undefined || newRealNode===undefined)){ // create new node
            newRealNode = this.createNode(newVirtualNode,parent);
        }
        // render children
        if (newRealNode!==undefined) this.reconcileChildren(newVirtualNode,oldVirtualNode,newRealNode);
        return newRealNode;
    }

    //  діти тепер зіставляються за key, trackBy і згенерованим id, а не лише за позицією. При вставці чи видаленні renderer переміщує збережені вузли через insertChildAt, створює тільки нові, а onDestroyed викликає лише для справді видалених компонентів
    private reconcileChildren(newVirtualNode:Optional<VirtualNode>,oldVirtualNode:Optional<VirtualNode>,parent:T) {
        const newChildren = newVirtualNode?.children ?? [];
        const oldChildren = oldVirtualNode?.children ?? [];
        const realChildren:T[] = [];
        for (let i=0,max=this.elementCreator.getChildrenCount(parent);i<max;++i) {
            realChildren.push(this.elementCreator.getChildAt(parent,i));
        }

        const oldIndicesByIdentity = new Map<string, number[]>();
        for (let oldIndex = 0;oldIndex<oldChildren.length;++oldIndex) {
            const identity = getNodeIdentity(oldChildren[oldIndex]);
            if (identity===undefined) continue;
            const indices = oldIndicesByIdentity.get(identity) ?? [];
            indices.push(oldIndex);
            oldIndicesByIdentity.set(identity,indices);
        }

        const oldIndexForNewChild:number[] = new Array(newChildren.length).fill(-1);
        const matchedOldIndices = new Set<number>();
        const identityOffsets = new Map<string, number>();
        for (let newIndex = 0;newIndex<newChildren.length;++newIndex) {
            const newChild = newChildren[newIndex];
            const identity = getNodeIdentity(newChild);
            let oldIndex = -1;

            if (identity!==undefined) {
                const indices = oldIndicesByIdentity.get(identity);
                const offset = identityOffsets.get(identity) ?? 0;
                if (indices && offset<indices.length) {
                    oldIndex = indices[offset];
                    identityOffsets.set(identity,offset + 1);
                }
            } else if (
                newIndex<oldChildren.length &&
                !matchedOldIndices.has(newIndex) &&
                getNodeIdentity(oldChildren[newIndex])===undefined
            ) {
                oldIndex = newIndex;
            }

            if (oldIndex!==-1) {
                oldIndexForNewChild[newIndex] = oldIndex;
                matchedOldIndices.add(oldIndex);
            }
        }

        for (let oldIndex = 0;oldIndex<oldChildren.length;++oldIndex) {
            if (matchedOldIndices.has(oldIndex)) continue;
            this.elementCreator.removeElement(realChildren[oldIndex]);
            this.destroyNode(oldChildren[oldIndex]);
        }

        for (let newIndex = 0;newIndex<newChildren.length;++newIndex) {
            const oldIndex = oldIndexForNewChild[newIndex];
            const oldChild = oldIndex===-1 ? undefined : oldChildren[oldIndex];
            let realChild = oldIndex===-1 ? undefined : realChildren[oldIndex];

            realChild = this.reconcile(newChildren[newIndex],oldChild,realChild,parent,newVirtualNode);
            if (
                realChild!==undefined &&
                this.elementCreator.getChildAt(parent,newIndex)!==realChild
            ) {
                this.elementCreator.insertChildAt(parent,realChild,newIndex);
            }
        }
    }

    private setGenericProps(model:T,virtualNode:VirtualNode,oldVirtualNode:Optional<VirtualNode>,parent:T) {
        if (virtualNode?.props?.ref!==undefined) {
            if (virtualNode instanceof VirtualCommentNode) {
                virtualNode.props.ref(virtualNode.parentComponent);
            }
            else {
                virtualNode.props.ref(model);
            }
        }
        this.elementCreator.setProps(model,virtualNode,oldVirtualNode,parent);
    }

}
