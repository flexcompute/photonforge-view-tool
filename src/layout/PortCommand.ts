import { Viewport } from "pixi-viewport";
import { Container, DisplayObject, Graphics, Rectangle } from "pixi.js";
import { IPort } from "..";
import { drawOnePort, drawPortLine } from "./portUtils";

export function addDetectedPorts(stage: Viewport, detectedPorts: IPort[], detectPortsCallback: (port: any) => {}) {
    const commandContainer = new Container();
    commandContainer.name = "detect port command container";
    commandContainer.scale.y = -1;

    const existPortContainerIndex = stage.children.indexOf(stage.getChildByName("port-container"));
    stage.addChildAt(commandContainer, existPortContainerIndex);

    function drawPortDetectRect(p: IPort, portRect: Graphics, color: number) {
        portRect.beginFill(color, 0.3);
        portRect.drawRect(0, -p.spec.width / 2, 0.4, p.spec.width);
    }

    detectedPorts.forEach((p) => {
        const port = drawOnePort(p, 0xf28610);
        // add half-transparent rect in detect
        const portRect = new Graphics();
        portRect.name = "fill";
        drawPortDetectRect(p, portRect, 0xf28610);
        port.addChild(portRect);

        commandContainer.addChild(port);

        port.interactive = true;
        port.cursor = "pointer";
        port.hitArea = new Rectangle(-0.15, -p.spec.width / 2, 0.5, p.spec.width);
        port.on("pointerover", () => {
            port.children.forEach((g) => {
                const portGraphic = g as Graphics;
                portGraphic.geometry.clear();
                if (portGraphic.name === "fill") {
                    drawPortDetectRect(p, portGraphic, 0x820080);
                } else {
                    portGraphic.line.color = 0x820080;
                    drawPortLine(portGraphic, p);
                }
            });
        });
        port.on("pointerout", () => {
            port.children.forEach((g) => {
                const portGraphic = g as Graphics;
                portGraphic.geometry.clear();
                if (portGraphic.name === "fill") {
                    drawPortDetectRect(p, portGraphic, 0xf28610);
                } else {
                    portGraphic.line.color = 0xf28610;
                    drawPortLine(portGraphic, p);
                }
            });
        });
        port.on("pointerdown", () => {
            detectPortsCallback(p);
        });
    });
}
export function removeDetectedPorts(stage: Viewport) {
    const target = stage.getChildByName("detect port command container")!;
    stage.removeChild(target);
}
