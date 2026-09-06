import {IFrame} from "../../vEngineLight/types";


const nextPowerOfTwo = (num:number) => {
    if (num > 0 && (num & (num - 1)) === 0)
        return num;
    let result = 1;

    while (num > 0) {
        result = result << 1
        num = num >> 1
    }
    return result;
}

class StripLevel{

    public width: number;
    public availableWidth:number;
    public top:number;

    constructor(width:number, top:number){
        this.width = width;
        this.availableWidth = width;
        this.top = top;
    }

    fitRectangle(r:IFrame){
        const leftOver = this.availableWidth - r.width;
        if (leftOver >= 0){
            r.x = this.width - this.availableWidth;
            r.y = this.top;
            this.availableWidth = leftOver;
            return true;
        }
        return false;
    }

    public canFit(r:IFrame){
        return this.availableWidth - r.width >= 0;
    }
}

// https://github.com/papuja/2DPackingAlgorithmDemo/tree/master/src/org/packer
class PackerDH {

    public levels:StripLevel[] = [];

    constructor(public stripWidth:number, public readonly rectangles:IFrame[]){

    }

    public bestFitDecreasingHeight() { // bfdh
        let top = 0;
        this.sortByNonIncreasingHeight(this.rectangles);
        for (const r of this.rectangles){
            let levelWithSmallestResidual = null;
            for (const level of this.levels){
                if (level.canFit(r)){
                    if (levelWithSmallestResidual != null && levelWithSmallestResidual.availableWidth > level.availableWidth){
                        levelWithSmallestResidual = level;
                    }else if (levelWithSmallestResidual == null){
                        levelWithSmallestResidual = level;
                    }
                }
            }
            if (levelWithSmallestResidual == null){
                const level = new StripLevel(this.stripWidth, top);
                level.fitRectangle(r);
                this.levels.push(level);
                top += r.height;
            } else{
                levelWithSmallestResidual.fitRectangle(r);
            }

        }
        return this.rectangles;
    }

    // First-Fit Decreasing Height
    public firstFitDecreasingHeight() { // ffdh
        this.sortByNonIncreasingHeight(this.rectangles);
        let top = 0;
        for (const r of this.rectangles){
            let fitsOnALevel = false;
            for (const level of this.levels){
                fitsOnALevel = level.fitRectangle(r);
                if (fitsOnALevel) break;
            }
            if (!fitsOnALevel){
                const level = new StripLevel(this.stripWidth, top);
                level.fitRectangle(r);
                this.levels.push(level);
                top += r.height;
            }
        }
        return this.rectangles;
    }

    // Next-Fit Decreasing Height
    public nextFitDecreasingHeight() { // nfdh
        this.sortByNonIncreasingHeight(this.rectangles);
        let top = 0;
        let currentLevel = null;
        for (const r of this.rectangles){
            if (currentLevel == null || !currentLevel.fitRectangle(r)){
                currentLevel = new StripLevel(this.stripWidth, top);
                currentLevel.fitRectangle(r);
                top += r.height;
            }
        }
        return this.rectangles;
    }

    public sortByNonIncreasingHeight(rectangles:IFrame[]){
        rectangles.sort((o1,o2)=>o2.height>o1.height?1:-1);
    }

}

class StrictRectResolver {
    private readonly rects:IFrame[];

    constructor(rects:IFrame[]) {
        this.rects = rects;
    }

    public resolveBestWidth(){
        const rects = this.rects;
        let totalSquare = 0;
        rects.forEach(r=>{
            totalSquare+=r.width*r.height;
        });
        const side = Math.sqrt(totalSquare);
        let bestSideWidth = nextPowerOfTwo(side);
        const maxRectWidth = Math.max(...rects.map(r=>r.width));
        if (maxRectWidth>bestSideWidth) bestSideWidth = nextPowerOfTwo(maxRectWidth);
        return bestSideWidth;
    }

    resolveBestHeight() {
        const sideHeight = Math.max(...this.rects.map(r => r.y + r.height));
        return nextPowerOfTwo(sideHeight)
    }

}

export class TexturePacker {

    constructor(public readonly rects:IFrame[]) {

    }

    public pack(){
        const rects = this.rects;
        const strictRectResolver = new StrictRectResolver(rects);
        const bestWidth = strictRectResolver.resolveBestWidth();
        const packer = new PackerDH(bestWidth,rects);
        packer.bestFitDecreasingHeight();
        const bestHeight = strictRectResolver.resolveBestHeight();
        return {
            width:bestWidth,
            height:bestHeight,
            rects
        }
    }

}

