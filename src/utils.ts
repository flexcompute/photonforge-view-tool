import { Viewport } from "pixi-viewport";
import { Application, Graphics, InteractionEvent, Point } from "pixi.js";

export function addDragEvent(target: Graphics, moveCallback?: () => void) {
    target.cursor = "pointer";
    target.interactive = true;

    const dragPoint = new Point();
    const onDragStart = (event: InteractionEvent) => {
        event.stopPropagation();
        event.data.getLocalPosition(target.parent, dragPoint);
        dragPoint.x -= target.x;
        dragPoint.y -= target.y;
        target.alpha = 0.5;
        target.tint = 0x0077ff;
        target.parent.on("pointermove", onDragMove);
    };
    const onDragMove = (event: InteractionEvent) => {
        const newPoint = event.data.getLocalPosition(target.parent);
        target.x = newPoint.x - dragPoint.x;
        target.y = newPoint.y - dragPoint.y;
        moveCallback?.();
    };
    const onDragEnd = (event: InteractionEvent) => {
        event.stopPropagation();
        target.alpha = 1;
        target.tint = 0xffffff;
        target.parent.off("pointermove", onDragMove);
    };

    target.on("pointerdown", onDragStart);
    target.on("pointerup", onDragEnd);
    target.on("pointerupoutside", onDragEnd);
}
export function drawTestLayoutGraphic(w: number, h: number) {
    const testG = new Graphics();
    testG.beginFill(0xf4a810, 1);
    testG.drawCircle(w / 2, h / 2, 100);
    testG.drawRect(w / 2 - 300, h / 2 - 130, 600, 20);
    testG.drawRect(w / 2 - 300, h / 2 + 110, 600, 20);
    testG.endFill();

    testG.lineStyle(2, 0x1965a5, 1);
    testG.moveTo(w / 2 - 300, h / 2 - 140);
    testG.lineTo(w / 2 + 300, h / 2 - 140);
    testG.lineTo(w / 2 + 300, h / 2 - 100);
    testG.lineTo(w / 2 + 150, h / 2 - 100);
    testG.lineTo(w / 2 + 150, h / 2 + 100);
    testG.lineTo(w / 2 + 300, h / 2 + 100);
    testG.lineTo(w / 2 + 300, h / 2 + 140);
    testG.lineTo(w / 2 - 300, h / 2 + 140);
    testG.lineTo(w / 2 - 300, h / 2 + 100);
    testG.lineTo(w / 2 - 150, h / 2 + 100);
    testG.lineTo(w / 2 - 150, h / 2 - 100);
    testG.lineTo(w / 2 - 300, h / 2 - 100);
    testG.closePath();

    const portLine0 = new Graphics();
    portLine0.lineStyle(2, 0xff0000, 1);
    portLine0.moveTo(w / 2 - 300, h / 2 - 140);
    portLine0.lineTo(w / 2 - 300, h / 2 - 100);
    testG.addChild(portLine0);

    const portLine1 = new Graphics();
    portLine0.lineStyle(2, 0xff0000, 1);
    portLine0.moveTo(w / 2 + 300, h / 2 - 140);
    portLine0.lineTo(w / 2 + 300, h / 2 - 100);
    testG.addChild(portLine0);

    const portLine2 = new Graphics();
    portLine0.lineStyle(2, 0xff0000, 1);
    portLine0.moveTo(w / 2 + 300, h / 2 + 100);
    portLine0.lineTo(w / 2 + 300, h / 2 + 140);
    testG.addChild(portLine0);

    const portLine3 = new Graphics();
    portLine0.lineStyle(2, 0xff0000, 1);
    portLine0.moveTo(w / 2 - 300, h / 2 + 140);
    portLine0.lineTo(w / 2 - 300, h / 2 + 100);

    [portLine0, portLine1, portLine2, portLine3].forEach((target) => {
        testG.addChild(target);
        addDragEvent(target);
    });

    testG.drawCircle(w / 2, h / 2, 60);
    return testG;
}

export function addViewPort(app: Application, w: number, h: number) {
    const stage = new Viewport({
        screenWidth: w,
        screenHeight: h,
        worldHeight: w,
        worldWidth: h,
        interaction: app.renderer.plugins.interaction,
    });
    app.stage.addChild(stage);
    stage
        .drag()
        .pinch()
        .wheel()
        // .decelerate()
        .setZoom(1)
        .clampZoom({ maxScale: 2, minScale: 0.3 }).interactiveChildren = true;

    return stage;
}
