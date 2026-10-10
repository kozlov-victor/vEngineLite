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
import {If, Loop} from "@engine/renderable/tsx/base/base-flow";
import {ReactiveForm} from "@engine/renderable/tsx/dom/forms/reactive.form";

type tPackType = 'spriteSheet'|'tileMap';

@DI.CSS('PsdPage.css')
export class PsdPage extends BaseTsxComponent {

    private readonly form =
        ReactiveForm.defineControls({
            cols: {initialValue: 8, required: true, numeric: true, maxLength: 3, min: 1, max: 100},
            trim: {initialValue: true, required: false},
            packType: {initialValue: 'spriteSheet' as tPackType, required: true}
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
            if (!blob) {
                console.error('Failed to export sprite sheet');
                return;
            }
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
                        <>
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
                            </div>
                            <table className={'form-table'}>
                                <tr>
                                    <td>Тип</td>
                                    <td>
                                        <select {...this.form.bindSelect('packType')}>
                                            <option value={'spriteSheet'}>spriteSheet</option>
                                            <option value={'tileMap'}>tileMap</option>
                                        </select>
                                        <div className={'error'}>
                                            &nbsp;{this.form.getError('packType')}
                                        </div>
                                    </td>
                                </tr>
                                <If condition={this.form.packType === 'tileMap'}>
                                    {()=>
                                        <>
                                            <tr>
                                                <td>
                                                    cols
                                                </td>
                                                <td>
                                                    <input
                                                        classNames={{invalid: this.form.isInvalid('cols')}}
                                                        {...this.form.bindInput('cols')}/>
                                                    <div className={'error'}>
                                                        &nbsp;{this.form.getError('cols')}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>sortByName</td>
                                                <td><button onclick={this.applySortByName}>sort</button></td>
                                                <td></td>
                                            </tr>
                                        </>
                                    }
                                </If>
                                <If condition={this.form.packType === 'spriteSheet'}>
                                    {()=>
                                        <tr>
                                            <td>trim</td>
                                            <td>
                                                <input type={'checkbox'} {...this.form.bindCheckBox('trim')}/>
                                                <div className={'error'}>
                                                    &nbsp;{this.form.getError('trim')}
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                </If>
                            </table>
                        </>
                    }
                    <div>
                        <button
                            disabled={this.form.isFormInvalid()}
                            onclick={this.export}>Експорт</button>
                    </div>
                </If>
            </>
        );
    }

}
