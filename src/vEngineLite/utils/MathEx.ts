
export class MathEx {

    public static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public static clamp(value:number, min: number, max: number) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

}
