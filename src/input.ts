export default interface Input {
    readonly canvas: HTMLCanvasElement;
    readonly x: number;
    readonly y: number;
    readonly zoom: number;
    readonly touching: boolean;
}

export type InputHandler = () => Input;

export function createInputHandler(canvas: HTMLCanvasElement): InputHandler {
    let x = 0;
    let y = 0;
    let zoom = 0;
    let touching = false;

    canvas.style.touchAction = "pinch-zoom";
    canvas.addEventListener("pointerdown", () => {
        touching = true;
    });
    canvas.addEventListener("pointerup", () => {
        touching = false;
    });
    canvas.addEventListener("pointermove", (e) => {
        touching = e.pointerType == "mouse" ? (e.buttons & 1) !== 0 : true;
        if (touching) {
            x += e.movementX;
            y += e.movementY;
        }
    });
    canvas.addEventListener(
        "wheel",
        (e) => {
            zoom += Math.sign(e.deltaY);
            e.preventDefault();
            e.stopPropagation();
        },
        { passive: false }
    );

    return () => {
        const out = {
            canvas: canvas,
            x: x,
            y: y,
            zoom: zoom,
            touching: touching,
        };
        x = 0;
        y = 0;
        zoom = 0;
        return out;
    };
}
