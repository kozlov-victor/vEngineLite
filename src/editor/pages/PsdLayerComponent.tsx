import {BaseTsxComponent} from "@engine/renderable/tsx/base/baseTsxComponent";
import {VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {PsdHeader, PsdLayer} from "../psd/PsdParser";
import {IBaseProps} from "@engine/renderable/tsx/_genetic/virtualNode";

export class PsdLayerComponent extends BaseTsxComponent {

    private el: HTMLCanvasElement;

    constructor(private readonly props: IBaseProps & {layer: PsdLayer, header: PsdHeader}) {
        super();
    }


    override onRendered() {
        const ctx = this.el.getContext("2d");
        if (!ctx) return;
        const layer = this.props.layer;
        const imageData = new ImageData(
            new Uint8ClampedArray(layer.pixels),
            layer.width,
            layer.height
        );

        ctx.putImageData(
            imageData,
            layer.left,
            layer.top
        );
    }

    override render(): JSX.Element {
        const header = this.props.header;
        return (
            <>
                <canvas
                    ref={el => this.el = el}
                    style={{
                        width: `${header.width}px`,
                        height: `${header.height}px`,
                    }}
                    width={header.width}
                    height={header.height}
                />
            </>
        );
    }

}
