import {Camera} from "../Camera";
import {CameraFollowStrategy} from "./CameraFollowStrategy";
import {Container} from "../../gameObject/base/Container";


export class HardFollowStrategy implements CameraFollowStrategy {

    public update(
        camera: Camera,
        target: Container,
        dt: number
    ) {
        camera.position.x =
            target.position.x;

        camera.position.y =
            target.position.y;
    }
}
