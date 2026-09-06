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

    public pack(psd: Psd): IPackedSpriteSheet {

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

        const texturePacker = new TexturePacker(frames);
        const result = texturePacker.pack();

        return {
            width: result.width,
            height: result.height,
            frames
        };
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
