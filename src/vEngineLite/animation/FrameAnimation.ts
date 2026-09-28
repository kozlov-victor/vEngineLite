import {Sprite} from "../gameObject/Sprite";
import {SpriteFrame, SpriteSheet} from "../types";

export class FrameAnimation {

    private readonly frameDuration: number;
    private time: number;
    private currentFrame:SpriteFrame;
    private currentLoop: number;
    private completed: boolean;

    public static framesFromRegularSpriteSheet(textureWidth: number, textureHeight: number, tilesetCols: number, tilesetRows: number) {
        const frames: SpriteFrame[] = [];
        const width = textureWidth / tilesetCols;
        const height = textureHeight / tilesetRows;
        for (let y = 0; y < tilesetRows; y++) {
            for (let x = 0; x < tilesetCols; x++) {
                frames.push({x: x * width, y: y * height, width, height, left: 0, top: 0, name: ''});
            }
        }
        return frames;
    }

    public static spriteSheetFramesByName(spriteSheet: SpriteSheet, names: string[]) {
        const result:SpriteFrame[] = [];
        for (const name of names) {
            const f = spriteSheet.frames.find(frame => frame.name === name);
            if (!f) {
                throw new Error(`Cannot find frame by name: ${name}`);
            }
            result.push({...f});
        }
        return result;
    }

    constructor(private readonly gameObject: Sprite, private readonly frames: SpriteFrame[], private readonly duration: number, private readonly loops = Infinity, startFrameIndex = 0 ) {
        this.frameDuration = ~~(duration / frames.length);
        this.currentFrame = frames[startFrameIndex];
        this.updateGameObject();
    }

    public update(dt: number) {
        if (this.completed) return;
        this.time+=dt;
        if (this.time>this.duration) {
            this.time%=this.duration;
            this.currentLoop++;
            if (this.currentLoop >= this.loops) {
                this.completed = true;
                return;
            }
        }

        let currentFrameIndex = Math.floor(this.time / this.frameDuration);
        this.currentFrame = this.frames[currentFrameIndex];
        this.updateGameObject();


    }

    public getCurrentFrame() {
        return this.frames.indexOf(this.currentFrame);
    }

    public getLoop() {
        return this.currentLoop;
    }

    public isCompleted() {
        return this.completed;
    }

    public reset() {
        this.time = 0;
        this.currentLoop = 0;
        this.completed = false;
    }

    private updateGameObject() {
        const frame = this.currentFrame;
        this.gameObject.setFrame(frame);
    }

}
