import {IFrame} from "../../types";
import {Size} from "../../utils/Size";
import {Vector2} from "../../utils/Vector2";

export class ScaleHelper {

    public static calcMetrixToFitRectToWindow(rect:Size, window:Size):{scale:Vector2,pos:Vector2,size:Size} {
        const rectRatio = rect.h / rect.w;
        const windowRatio = window.h / window.w;
        let width:number;
        let height:number;
        if (windowRatio < rectRatio) {
            height = window.h;
            width = height / rectRatio;
        } else {
            width = window.w;
            height = width * rectRatio;
        }

        return {
            scale: new Vector2(width / rect.w, height / rect.h),
            pos: new Vector2((window.w - width)/2,(window.h - height)/2),
            size: new Size(width,height),
        }
    }

}
