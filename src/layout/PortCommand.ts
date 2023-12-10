import { Viewport } from "pixi-viewport";
import { Container, Rectangle } from "pixi.js";
import { IPort } from "..";
import { drawOnePort } from "./portUtils";

export function addDetectedPorts(stage: Viewport, detectedPorts: IPort[]) {
    const commandContainer = new Container();
    commandContainer.name = "detect port command container";
    commandContainer.scale.y = -1;
    stage.addChild(commandContainer);

    detectedPorts.forEach((p) => {
        const port = drawOnePort(p);
        port.alpha = 0.25;
        commandContainer.addChild(port);

        port.interactive = true;
        port.cursor = "pointer";
        port.hitArea = new Rectangle(-0.15, -p.spec.width / 2, 0.3, p.spec.width);
        port.on("pointerover", () => {
            port.alpha = 1;
        });
        port.on("pointerout", () => {
            port.alpha = 0.25;
        });
    });
}
export function removeDetectedPorts(stage: Viewport) {
    const target = stage.getChildByName("detect port command container")!;
    stage.removeChild(target);
}
