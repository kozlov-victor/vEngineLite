import {Router} from "./router";
import {VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {DomRootComponent} from "@engine/renderable/tsx/dom/domRootComponent";
import {DI} from "@engine/core/ioc";
import {PsdPage} from "./pages/PsdPage";

const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

@DI.Injectable()
@DI.CSS('./main.css')
class RootComponent extends DomRootComponent {

    @DI.Inject(Router) private readonly router: Router;

    constructor() {
        super();
        this.router.setUp({
            '/':()=>({component: <PsdPage/>}),
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
