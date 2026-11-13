import {BaseTsxComponent} from "@engine/renderable/tsx/base/baseTsxComponent";
import {DI} from "@engine/core/ioc";
import {VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {Files} from "../../services/files";
import {Reactive} from "@engine/renderable/tsx/decorator/reactive";
import {BitmapFontAtlas, BitmapFontPage} from "../../ttf/BitmapFontAtlasBuilder";
import {CYR_CHARS, LAT_CHARS, STANDARD_SYMBOLS} from "@vEngineLite/gameObject/text/font-factory/create-font-from-css";
import {TtfFontToAtlasConverter} from "../../ttf/TtfFontToAtlasConverter";
import {ReactiveForm} from "@engine/renderable/tsx/dom/forms/reactive.form";
import {If, Loop} from "@engine/renderable/tsx/base/base-flow";

@DI.Injectable()
export class TtfPage extends BaseTsxComponent {

    private readonly form = ReactiveForm.defineControls({
        size: {initialValue: 32, required: true, numeric: true, maxLength: 3, min: 1, max: 100},
        charset: {initialValue: LAT_CHARS + CYR_CHARS + STANDARD_SYMBOLS, required: true, maxLength: 1000}
    });

    private font: {file:File, arrayBuffer: ArrayBuffer};
    private atlas: BitmapFontAtlas;
    @Reactive.Property() private activePageIndex = 0;

    render(): JSX.Element {
        return (
            <>
                <table className={'form-table'}>
                    <tr>
                        <td><label>Font size:</label></td>
                        <td><input type="number" {...this.form.bindInput('size')}/></td>
                    </tr>
                    <tr>
                        <td><label>Charset:</label></td>
                        <td><input type="text" {...this.form.bindInput('charset')}/></td>
                    </tr>
                </table>
                <div>
                    <button onclick={this.openFile}>ttf</button>
                </div>
                <div>
                    <button onclick={this.convert}>Convert</button>
                </div>
                <div>
                    <If condition={this.atlas!==undefined}>
                        {()=>
                            <Loop array={this.atlas.pages}>
                                {(page:BitmapFontPage,i:number)=>
                                    <>
                                        <button onclick={() => this.activePageIndex = i}>Page {i+1}</button>
                                    </>
                                }
                            </Loop>
                        }
                    </If>
                    <If condition={this.atlas!==undefined && this.atlas.pages[this.activePageIndex]!==undefined}>
                        {()=>
                           <>
                               <div>
                                   <canvas width={this.atlas.pages[this.activePageIndex].bitmap.width}
                                           height={this.atlas.pages[this.activePageIndex].bitmap.height}
                                           ref={canvas => this.atlas.pages[this.activePageIndex].bitmap.drawToCanvas(canvas)}/>
                               </div>
                               <div>
                                   <button onclick={this.save}>Save</button>
                               </div>
                           </>
                        }
                    </If>
                </div>
            </>
        );
    }

    @Reactive.Method()
    private async openFile() {
        try {
            const file = await Files.openFile(['ttf']);
            if (!file || !file.file) {
                console.error('No file opened');
                return;
            }
            const arrayBuffer = await file.file?.arrayBuffer?.();
            if (!arrayBuffer) {
                console.error(`no arrayBuffer for file ${file.file?.name}`);
                return;
            }
            this.font = {file: file.file,arrayBuffer};
        }
        catch (error) {
            console.error(error);
        }
    }

    @Reactive.Method()
    private async convert() {
        if (!this.font) {
            console.error('No font file loaded');
            return;
        }
        const converter = new TtfFontToAtlasConverter();
        this.atlas = converter.convert(this.font.arrayBuffer,this.form.size, 1, 1024,this.form.charset);
    }

    @Reactive.Method()
    private async save() {
        if (!this.font) {
            console.error('No font file loaded');
            return;
        }
        if (!this.atlas) {
            console.error('No atlas converted');
            return;
        }
        let  i = 0;
        const pages:string[] = [];
        const fileNameClean = Files.getFileNameNoExt(this.font.file.name);
        for (const bitmap of this.atlas.pages.map(it=>it.bitmap)) {
            const pageFileName = `${fileNameClean}_${i++}.png`;
            await bitmap.saveAsPng(pageFileName);
            pages.push(pageFileName);
        }

        const data = {pages,glyphs:this.atlas.glyphs};
        await Files.saveToFile(JSON.stringify(data),`${fileNameClean}.json`);
    }

}
