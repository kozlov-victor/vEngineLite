
export class FpsCounter {
    private lastTime = 0;
    private frameCount = 0;
    private lastFpsUpdate = 0;
    private fps = 0;

    public update(timestamp: number) {
        this.lastTime = timestamp;

        this.frameCount++;
        if (timestamp - this.lastFpsUpdate > 1000) { // update every second
            this.fps = Math.floor(this.frameCount / ((timestamp - this.lastFpsUpdate) / 1000));
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }
    }

    public getFps() {
        return this.fps;
    }

}
