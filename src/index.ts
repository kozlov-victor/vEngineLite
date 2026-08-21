import {VEngineLiteApplication} from "./vEngineLight/application/VEngineLiteApplication";
import {MainScene} from "./test1/MainScene";


const app = new VEngineLiteApplication(document.querySelector("#c") as HTMLCanvasElement, 640, 480);
app.runScene(new MainScene(app));

const fpsElem = document.querySelector("#fps")!;
fpsElem.textContent = `-`;
setInterval(()=>{
    fpsElem.textContent = `${app.fpsCounter.getFps()} fps`;
},1000);
