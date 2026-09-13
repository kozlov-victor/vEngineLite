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
            target.position.x +
            this.lookAheadX -
            camera.app.width / 2;

        const targetY =
            target.position.y -
            camera.app.height / 2;

        const cameraAlpha =
            1 - Math.exp(
                -this.cameraSmoothing * seconds
            );

        const bounds = camera.app.getCurrentScene().size;
        const screenWidth = camera.app.width;
        const screenHeight = camera.app.height;

        let posX = camera.position.x +
            (
                targetX -
                camera.position.x
            ) * cameraAlpha;

        let posY = camera.position.y +
            (
                targetY -
                camera.position.y
            ) * cameraAlpha;

        if (posX<0) posX = 0;
        if (posY<0) posY = 0;

        if (posX>bounds.w - screenWidth) posX = bounds.w - screenWidth;
        if (posY>bounds.h - screenHeight) posY = bounds.h - screenHeight;

        camera.position.xy(Math.round(posX), Math.round(posY));

    }
}
