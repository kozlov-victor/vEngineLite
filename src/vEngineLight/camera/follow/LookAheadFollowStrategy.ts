import {CameraFollowStrategy} from "./CameraFollowStrategy";
import {Camera} from "../Camera";
import {Container} from "../../gameObject/base/Container";

export class LookAheadFollowStrategy implements CameraFollowStrategy {

    private lookAheadX = 0;

    constructor(
        private distance = 100,
        private lookAheadSmoothing = 6,
        private cameraSmoothing = 4
    ) {}

    public update(
        camera: Camera,
        target: Container,
        dt: number
    ) {
        const seconds = dt / 1000;

        let direction = 0;

        if (target.scale.x > 0) {
            direction = 1;
        }
        else if (target.scale.x < 0) {
            direction = -1;
        }

        const desiredLookAhead =
            this.distance * direction;

        const lookAheadAlpha =
            1 - Math.exp(
                -this.lookAheadSmoothing *
                seconds
            );

        this.lookAheadX +=
            (
                desiredLookAhead -
                this.lookAheadX
            ) * lookAheadAlpha;


        const targetX =
            target.transform.position.x +
            this.lookAheadX -
            camera.app.width / 2;

        const targetY =
            target.transform.position.y -
            camera.app.height / 2;

        const cameraAlpha =
            1 - Math.exp(
                -this.cameraSmoothing * seconds
            );

        camera.transform.position.x +=
            (
                targetX -
                camera.transform.position.x
            ) * cameraAlpha;

        camera.transform.position.y +=
            (
                targetY -
                camera.transform.position.y
            ) * cameraAlpha;


    }
}
