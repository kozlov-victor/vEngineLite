import {BaseTsxComponent} from "@engine/renderable/tsx/base/baseTsxComponent";
import {VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {Reactive} from "@engine/renderable/tsx/decorator/reactive";
import {Files} from "../services/files";
import {PsdHeader, PsdLayer, PsdParser} from "../psd/PsdParser";
import {BinaryReader} from "../psd/BinaryReader";
import {DI} from "@engine/core/ioc";
import {PsdLayerComponent} from "./PsdLayerComponent";
import {SpriteSheetRenderer} from "../spritesheet/SpriteSheetRenderer";
import {SpriteSheetPacker} from "../spritesheet/SpriteSheetPacker";

@DI.CSS('PsdPage.css')
export class PsdPage extends BaseTsxComponent {

    private layers: PsdLayer[] = [];
    private header: PsdHeader;
    private selected:PsdLayer[] = [];

    @Reactive.Method()
    private async openPsd() {
        const file = await Files.openFile(['psd']);
        if (!file.file) return;
        const arrayBuffer = await file.file.arrayBuffer();
        const parser = new PsdParser(new BinaryReader(new Uint8Array(arrayBuffer)));
        const psd = parser.parse();
        console.log(psd);
        this.header = psd.header;
        this.layers = psd.layers;
        this.selected = [...this.layers];
    }

    @Reactive.Method()
    private toggleSelection(l: PsdLayer) {
        if (this.selected.includes(l)) {
            this.selected.splice(this.selected.indexOf(l), 1);
        }
        else {
            this.selected.push(l);
        }
    }

    @Reactive.Method()
    private export() {
        const packer = new SpriteSheetPacker();
        const spriteSheet = packer.pack(this.header, this.layers);

        const spriteSheetRenderer = new SpriteSheetRenderer();
        const canvas = spriteSheetRenderer.render(this.header, this.layers, spriteSheet);
        canvas.toBlob(async (blob)=>{
            if (blob) await Files.saveToFile(blob, 'spritesheet.png');
        },'image/png');
    }

    render(): JSX.Element {
        return (
            <>
                <div>
                    <button onclick={this.openPsd}>Відкрити PSD</button>
                </div>
                <div>
                    {
                        this.layers.map((l, i) =>
                            <div
                                onclick={_=>this.toggleSelection(l)}
                                classNames={{'psd-frame':true, selected:this.selected.includes(l)}} key={i}>
                                <PsdLayerComponent
                                    header={this.header}
                                    trackBy={`_${i}`}
                                    layer={l}
                                />
                                <div className={'psd-layer-name'}>
                                    {l.name}
                                </div>
                            </div>
                        )
                    }

                    {this.layers.length>0 &&
                        <div>
                            <button onclick={this.export}>Експорт</button>
                        </div>
                    }

                </div>
            </>
        );
    }

}
