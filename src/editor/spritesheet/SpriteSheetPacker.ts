import {Psd, PsdLayer} from "../psd/PsdParser";
import {SpriteFrame, SpriteSheet} from "../../vEngineLight/types";
import {TexturePacker} from "./TexturePacker";
import {MathEx} from "../../vEngineLight/utils/MathEx";

export interface IPackedLayerInfo extends SpriteFrame {
    layer: PsdLayer,
    psd: Psd;
}

export interface IPackedSpriteSheet extends SpriteSheet {
    width: number;
    height: number;
    padding: number;
    frames:IPackedLayerInfo[];
    trim:boolean;
}

export class SpriteSheetPacker {

    private createFrames(psd: Psd,padding: number, trim: boolean) {
        const frames:IPackedLayerInfo[] = [];
        for (const layer of psd.layers) {
            frames.push({
                x: 0,
                y: 0,
                width: this.calcLayerRealWidth(layer,psd,trim) + padding,
                height: this.calcLayerRealHeight(layer,psd,trim) + padding,
                name: layer.name,
                left: trim?MathEx.clamp(layer.left,0,psd.header.width):0,
                top: trim?MathEx.clamp(layer.top,0,psd.header.height):0,
                layer,
                psd
            })
        }
        return frames;
    }

    private calcLayerRealWidth(layer: PsdLayer, psd: Psd, trim: boolean) {
        if (!trim) return layer.width;
        const left = MathEx.clamp(layer.left,0,psd.header.width);
        const right = MathEx.clamp(layer.right,0,psd.header.width);
        return right - left;
    }

    private calcLayerRealHeight(layer: PsdLayer, psd: Psd, trim: boolean) {
        if (!trim) return layer.height;
        const top = MathEx.clamp(layer.top,0,psd.header.height);
        const bottom = MathEx.clamp(layer.bottom,0,psd.header.height);
        return bottom - top;
    }


    public packSpriteSheet(psd: Psd, padding: number, trim:boolean): IPackedSpriteSheet {

        const frames = this.createFrames(psd,padding,trim);

        const texturePacker = new TexturePacker(frames);
        const result = texturePacker.pack();

        return {
            width: result.width,
            height: result.height,
            frames, padding, trim
        };
    }

    public packTileMap(psd: Psd, cols: number): IPackedSpriteSheet {
        const padding = 0;
        const frames = this.createFrames(psd,padding,false);
        let x = 0;
        let y = 0;
        let currY = y;
        for (const frame of frames) {
            frame.x = x * psd.header.width;
            frame.y = y * psd.header.height;
            currY = y;
            x++;
            if (x===cols) {
                x=0;
                y++;
            }
        }
        const width = cols * psd.header.width;
        const height = currY * psd.header.height + psd.header.height;
        return {
            width,
            height,
            frames,
            padding,
            trim: false,
        }
    }

    public asRegularSpriteSheet(packed: IPackedSpriteSheet): SpriteSheet {
        const frames:SpriteFrame[] = [];
        for (const packedFrame of packed.frames) {
            frames.push({
                name: `${packedFrame.psd.name}_${packedFrame.name}`,
                width: packedFrame.width - packed.padding,
                height: packedFrame.height - packed.padding,
                x: packedFrame.x,
                y: packedFrame.y,
                left: packedFrame.left,
                top: packedFrame.top,
            })
        }
        return {
            width: packed.width,
            height: packed.height,
            frames
        };
    }

}
