import {Psd, PsdLayer} from "../psd/PsdParser";
import {SpriteFrame, SpriteSheet} from "../../vEngineLight/types";
import {TexturePacker} from "./TexturePacker";

export interface IPackedLayerInfo extends SpriteFrame{
    layer: PsdLayer,
    psd: Psd;
}

export interface IPackedSpriteSheet extends SpriteSheet {
    width: number;
    height: number;
    frames:IPackedLayerInfo[];
}

export class SpriteSheetPacker {

    private createFrames(psd: Psd) {
        const frames:IPackedLayerInfo[] = [];
        for (const layer of psd.layers) {
            frames.push({
                x: 0,
                y: 0,
                width: psd.header.width,
                height: psd.header.height,
                name: layer.name,
                layer,
                psd
            })
        }
        return frames;
    }


    public packSpriteSheet(psd: Psd): IPackedSpriteSheet {

        const frames = this.createFrames(psd);

        const texturePacker = new TexturePacker(frames);
        const result = texturePacker.pack();

        return {
            width: result.width,
            height: result.height,
            frames
        };
    }

    public packTileMap(psd: Psd, cols: number): IPackedSpriteSheet {
        const frames = this.createFrames(psd);
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
            frames
        }
    }

    public asRegularSpriteSheet(packed: IPackedSpriteSheet): SpriteSheet {
        const frames:SpriteFrame[] = [];
        for (const packedFrame of packed.frames) {
            frames.push({
                name: `${packedFrame.psd.name}_${packedFrame.name}`,
                width: packedFrame.width,
                height: packedFrame.height,
                x: packedFrame.x,
                y: packedFrame.y
            })
        }
        return {
            width: packed.width,
            height: packed.height,
            frames
        };
    }

}
