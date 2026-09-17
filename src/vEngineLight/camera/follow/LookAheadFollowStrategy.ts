import {CameraFollowStrategy} from "./CameraFollowStrategy";
import {Camera} from "../Camera";
import {Container} from "../../gameObject/base/Container";

export class LookAheadFollowStrategy implements CameraFollowStrategy {

    private lookAheadX = 0;
    private lookAheadY = 0;
    public lookDirectionX:'left'|'right'|'none' = 'right';
    public lookDirectionY:'top'|'bottom'|'none' = 'none';

    constructor(
        private readonly distance: number,
        private lookAheadSmoothing = 6,
        private cameraSmoothing = 4
    ) {}

    public update(
        camera: Camera,
        target: Container,
        dt: number
    ) {
        const seconds = dt / 1000;

        let directionX = 0;
        if (this.lookDirectionX==='right') directionX = 1;
        if (this.lookDirectionX==='left') directionX = -1;

        let directionY = 0;
        if (this.lookDirectionY==='top') directionY = -1;
        else if (this.lookDirectionY==='bottom') directionY = 1;

        const desiredLookAheadX = this.distance * directionX;
        const desiredLookAheadY = this.distance * directionY;

        const lookAheadAlpha =
            1 - Math.exp(
                -this.lookAheadSmoothing *
                seconds
            );

        this.lookAheadX +=
            (
                desiredLookAheadX -
                this.lookAheadX
            ) * lookAheadAlpha;

        this.lookAheadY +=
            (
                desiredLookAheadY -
                this.lookAheadY
            ) * lookAheadAlpha;


        const targetX =
            target.position.x +
            this.lookAheadX -
            camera.app.width / 2;

        const targetY =
            target.position.y +
            this.lookAheadY -
            camera.app.height / 2;

        const cameraAlpha =
            1 - Math.exp(
                -this.cameraSmoothing * seconds
            );

        const wordBounds = camera.app.getCurrentScene().size;
        const viewPortWidth = camera.app.width;
        const viewPortHeight = camera.app.height;

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

        if (posX>wordBounds.w - viewPortWidth) posX = wordBounds.w - viewPortWidth;
        if (posY>wordBounds.h - viewPortHeight) posY = wordBounds.h - viewPortHeight;

        camera.position.xy(Math.round(posX), Math.round(posY));

    }
}
