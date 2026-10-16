import {n2, Triangle} from "@vEngineLite/types";
import {Size} from "@vEngineLite/utils/Size";

export class RenderingUtil {

    public static isTriangleIntersectScreen(p1:n2,p2:n2,p3:n2,size: Size) {
        const left = Math.min(p1[0],p2[0],p3[0]);
        const right = Math.max(p1[0],p2[0],p3[0]);
        const top = Math.min(p1[1],p2[1],p3[1]);
        const bottom = Math.max(p1[1],p2[1],p3[1]);
        return right >= 0 && left <= size.w && bottom >= 0 && top <= size.h;
    }

}
