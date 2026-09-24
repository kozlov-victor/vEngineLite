import {VEngineLiteApplication} from "./vEngineLight/application/VEngineLiteApplication";
import {Size} from "./vEngineLight/utils/Size";
import {ScaleStrategyFitCanvasToScreen} from "./vEngineLight/rendering/scaleStrategy/ScaleStrategyFitCanvasToScreen";
import {MainScene} from "./test1/MainScene";
import {Test2Scene} from "./test2/Test2Scene";


const app =
    new VEngineLiteApplication(
        document.querySelector("#c") as HTMLCanvasElement,
        new Size(640, 480),
        new ScaleStrategyFitCanvasToScreen()
    );
app.runScene(new Test2Scene(app));

const fpsElem = document.querySelector("#fps")!;
fpsElem.textContent = `-`;
setInterval(()=>{
    fpsElem.textContent = `${app.fpsCounter.getFps()} fps`;
},1000);
