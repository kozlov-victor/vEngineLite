import {BaseTsxComponent} from "@engine/renderable/tsx/base/baseTsxComponent";
import {VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {Reactive} from "@engine/renderable/tsx/decorator/reactive";
import {Files} from "../services/files";
import {Psd, PsdLayer, PsdParser} from "../psd/PsdParser";
import {BinaryReader} from "../psd/BinaryReader";
import {DI} from "@engine/core/ioc";
import {PsdLayerComponent} from "./PsdLayerComponent";
import {SpriteSheetRenderer} from "../spritesheet/SpriteSheetRenderer";
import {IPackedSpriteSheet, SpriteSheetPacker} from "../spritesheet/SpriteSheetPacker";
import {InputSetterService, Numeric} from "@engine/renderable/tsx/dom/forms/input.setter.service";
import {If, Loop} from "@engine/renderable/tsx/base/base-flow";
import {ReactiveForm} from "@engine/renderable/tsx/dom/forms/reactive.form";

type tPackType = 'spriteSheet'|'tileMap';

@DI.CSS('PsdPage.css')
export class PsdPage extends BaseTsxComponent {

    @DI.Inject(InputSetterService)
    private readonly setterService: InputSetterService;

    private readonly form =
        ReactiveForm.defineControls({
            cols: {value: 8, required: false},
            trim: {value: true, required: false},
            packType: {value: 'spriteSheet' as tPackType, required: true}
        });

    private psd: Psd;
    private selected:PsdLayer[] = [];

    @Reactive.Method()
    private async openPsd() {
        const fileHandler = await Files.openFile(['psd']);
        if (!fileHandler.file) return;
        const arrayBuffer = await fileHandler.file.arrayBuffer();
        const parser = new PsdParser(fileHandler.file.name, new BinaryReader(new Uint8Array(arrayBuffer)));
        this.psd = parser.parse();
        this.selected = [...this.psd.layers];
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
    private applySortByName() {
        this.psd.layers.sort((a,b)=>Number.parseInt(a.name) - Number.parseInt(b.name));
    }

    @Reactive.Method()
    private async export() {
        const filteredPsd: Psd = {
            name: this.psd.name,
            header: this.psd.header,
            layers: this.psd.layers.filter(it=>this.selected.includes(it))
        }
        const packer = new SpriteSheetPacker();
        let spriteSheet: IPackedSpriteSheet;
        if (this.form.packType==='spriteSheet') {
            spriteSheet = packer.packSpriteSheet(filteredPsd, 1, this.form.trim);
        }
        else {
            spriteSheet = packer.packTileMap(filteredPsd, this.form.cols ?? 8);
        }

        if (this.form.packType==='spriteSheet') {
            await Files.saveToFile(JSON.stringify(packer.asRegularSpriteSheet(spriteSheet),undefined,4),`${filteredPsd.name}.json`);
        }

        const spriteSheetRenderer = new SpriteSheetRenderer();
        const canvas = spriteSheetRenderer.render(spriteSheet);
        canvas.toBlob(async (blob)=>{
            if (!blob) return;
            await Files.saveToFile(blob, `${filteredPsd.name}.png`);
        },'image/png');
    }

    render(): JSX.Element {
        return (
            <>
                <div>
                    <button onclick={this.openPsd}>Відкрити PSD</button>
                </div>
                <If condition={Boolean(this.psd)}>
                    {()=>
                        <div>
                            <Loop array={this.psd.layers}>
                                {(l:PsdLayer,i:number)=>
                                    <div
                                        onclick={_ => this.toggleSelection(l)}
                                        classNames={{'psd-frame': true, selected: this.selected.includes(l)}}
                                        key={i}>
                                        <PsdLayerComponent
                                            header={this.psd.header}
                                            trackBy={`_${i}`}
                                            layer={l}
                                        />
                                        <div className={'psd-layer-name'}>
                                            {l.name}
                                        </div>
                                    </div>
                                }
                            </Loop>
                            <div>
                                <select {...this.setterService.bind(this.form, 'packType', v => v as tPackType)}>
                                    <option value={'spriteSheet'}>spriteSheet</option>
                                    <option value={'tileMap'}>tileMap</option>
                                </select>
                                <If condition={this.form.packType === 'tileMap'}>
                                    {()=>
                                        <>
                                            <div>
                                                cols: <input {...this.setterService.bind(this.form, 'cols', Numeric)}/>
                                            </div>
                                            <div>
                                                sortByName: <button onclick={this.applySortByName}>sort by name</button>
                                            </div>
                                        </>
                                    }
                                </If>
                                <If condition={this.form.packType === 'spriteSheet'}>
                                    {()=>
                                        <>
                                            trim: <input type={'checkbox'} {...this.setterService.bind(this.form, 'trim', Boolean)}/>
                                        </>
                                    }
                                </If>
                            </div>
                            <div>
                                <button onclick={this.export}>Експорт</button>
                            </div>
                        </div>
                    }
                </If>
            </>
        );
    }

}
