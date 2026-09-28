import {Camera} from "../Camera";
import {Container} from "../../gameObject/base/Container";

export interface CameraFollowStrategy {
    update(
        camera: Camera,
        target: Container,
        dt: number
    ): void;
}
