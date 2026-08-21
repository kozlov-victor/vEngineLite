import {Sprite} from "../gameObject/Sprite";
import {IFrame} from "../types";

export class FrameAnimation {

    private readonly frameDuration: number;
    private started = 0;
    private currentFrame:IFrame;
    private currentLoop = 0;

    public static framesFromRegularSpriteSheet(textureWidth: number, textureHeight: number, tilesetCols: number, tilesetRows: number) {
        const frames: IFrame[] = [];
        const width = textureWidth / tilesetCols;
        const height = textureHeight / tilesetRows;
        for (let y = 0; y < tilesetRows; y++) {
            for (let x = 0; x < tilesetCols; x++) {
                frames.push({x: x * width, y: y * height, width, height});
            }
        }
        return frames;
    }

    constructor(private readonly gameObject: Sprite, private readonly frames: IFrame[], duration: number, private readonly loops = Infinity, startFrameIndex = 0 ) {
        this.frameDuration = ~~(duration / frames.length);
        this.currentFrame = frames[startFrameIndex];
        this.updateGameObject();
    }

    public update(time: number) {
        if (!this.started) this.started = time;
        const delta = time - this.started;
        let currentFrameIndex = ~~(delta / this.frameDuration);
        if (currentFrameIndex >= this.frames.length) {
            this.currentLoop++;
        }
        if (this.currentLoop >= this.loops) return;
        currentFrameIndex %= this.frames.length;
        this.currentFrame = this.frames[currentFrameIndex];
        this.updateGameObject();
    }

    public getCurrentFrame() {
        return this.frames.indexOf(this.currentFrame);
    }

    public getLoop() {
        return this.currentLoop;
    }

    public reset() {
        this.started = 0;
        this.currentLoop = 0;
    }

    private updateGameObject() {
        const frame = this.currentFrame;
        this.gameObject.setFrame(frame);
    }

}
