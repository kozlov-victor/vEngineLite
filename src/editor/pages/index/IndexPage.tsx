import {BaseTsxComponent} from "@engine/renderable/tsx/base/baseTsxComponent";
import {DI} from "@engine/core/ioc";
import {Router} from "@engine/renderable/router";
import {VEngineTsxFactory} from "@engine/renderable/tsx/_genetic/vEngineTsxFactory.h";
import {Reactive} from "@engine/renderable/tsx/decorator/reactive";

@DI.Injectable()
export class IndexPage extends BaseTsxComponent {

    @DI.Inject(Router) private readonly router: Router;

    render(): JSX.Element {
        return (
            <>
                <div>VEngine utility</div>
                <div>
                    <button onclick={_=>this.navigateTo('/psd')}>PSD tools</button>
                </div>
                <div>
                    <button onclick={_=>this.navigateTo('/ttf')}>TTF tools</button>
                </div>
            </>
        );
    }

    @Reactive.Method()
    private navigateTo(path: string) {
        this.router.navigate(path);
    }


}
