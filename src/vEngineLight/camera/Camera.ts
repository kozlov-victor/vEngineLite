import {Transform} from "../components/Transform";

export class Camera {
    // Камера - це просто GameObject.
    // В майбутньому тут можуть бути налаштування проекції, кольору фону і т.д.
    public readonly transform = new Transform();
}
