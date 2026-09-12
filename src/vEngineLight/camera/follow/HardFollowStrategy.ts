import {Camera} from "../Camera";
import {CameraFollowStrategy} from "./CameraFollowStrategy";
import {Container} from "../../gameObject/base/Container";


export class HardFollowStrategy implements CameraFollowStrategy {

    public update(
        camera: Camera,
        target: Container,
        dt: number
    ) {
        camera.transform.position.x =
            target.position.x;

        camera.transform.position.y =
            target.position.y;
    }
}
