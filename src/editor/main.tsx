import {Router} from "@engine/renderable/router";
import {VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {DomRootComponent} from "@engine/renderable/tsx/dom/domRootComponent";
import {DI} from "@engine/core/ioc";
import {PsdPage} from "./pages/psd/PsdPage";
import {TtfPage} from "./pages/ttf/TtfPage";
import {IndexPage} from "./pages/index/IndexPage";


const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

@DI.Injectable()
@DI.CSS('./main.css', {global: true})
class RootComponent extends DomRootComponent {

    @DI.Inject(Router) private readonly router: Router;

    constructor() {
        super();
        this.router.setUp({
            '/':()=>({component: <IndexPage/>}),
            '/psd':()=>({component: <PsdPage/>}),
            '/ttf':()=>({component: <TtfPage/>}),
        });
    }

    render(): JSX.Element {
        return (
            <>
                {this.router.getOutlet()}
            </>
        );
    }

}

new RootComponent().mountTo(root);
