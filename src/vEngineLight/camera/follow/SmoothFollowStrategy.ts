import {CameraFollowStrategy} from "./CameraFollowStrategy";
import {Camera} from "../Camera";
import {Container} from "../../gameObject/base/Container";

export class SmoothFollowStrategy implements CameraFollowStrategy {

    constructor(
        private smoothing = 5
    ) {}

    public update(
        camera: Camera,
        target: Container,
        dt: number
    ) {
        const seconds = dt / 1000;

        const alpha =
            1 - Math.exp(
                -this.smoothing * seconds
            );

        camera.transform.position.x +=
            (
                target.position.x -
                camera.transform.position.x
            ) * alpha;

        camera.transform.position.y +=
            (
                target.position.y -
                camera.transform.position.y
            ) * alpha;
    }
}
