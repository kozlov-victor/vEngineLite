import {VEngineLiteApplication} from "@vEngineLite/application/VEngineLiteApplication";
import {Size} from "@vEngineLite/utils/Size";
import {ScaleStrategyFitCanvasToScreen} from "@vEngineLite/rendering/scaleStrategy/ScaleStrategyFitCanvasToScreen";
import {MainScene} from "./test1/MainScene";
import {Test2Scene} from "./test2/Test2Scene";


const app =
    new VEngineLiteApplication(
        document.querySelector("#c") as HTMLCanvasElement,
        new Size(740, 480),
        new ScaleStrategyFitCanvasToScreen()
    );
app.runScene(new MainScene(app));

const fpsElem = document.querySelector("#fps")!;
fpsElem.textContent = `-`;
setInterval(()=>{
    fpsElem.textContent = `${app.fpsCounter.getFps()} fps`;
},1000);
