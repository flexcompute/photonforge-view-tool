import { Viewport } from "pixi-viewport";
import { Application, Graphics, Text } from "pixi.js";
import { addDragEvent, addViewPort } from "./utils";
import { IXY } from ".";

export default class SchematicViewTool {
    app: Application;
    stage: Viewport;
    nodeData: { center: IXY }[] = [{ center: { x: -210, y: -30 } }, { center: { x: 200, y: 30 } }];
    viewNodes: Graphics[] = [];
    connectLine = new Graphics();
    constructor(containerId: string) {
        const containerDom = document.getElementById(containerId)!;
        const { clientWidth: w, clientHeight: h } = containerDom;

        this.app = new Application({
            backgroundColor: 0xf2f3f4,
            width: w,
            height: h,
            antialias: true,
        });
        containerDom.appendChild(this.app.view);

        this.stage = addViewPort(this.app, w, h);
        this.stage.position.set(w / 2, h / 2);

        const { width: w1, height: h1 } = this.app.view;

        this.nodeData.forEach((n) => {
            const node = this.createSchematicNode({ pos: n.center });
            this.viewNodes.push(node);
            this.stage!.addChild(node);
        });
        const fontStyle = { fontSize: 128 };
        const text0 = new Text("Port 1", fontStyle);
        const text1 = new Text("Port 0", fontStyle);
        text0.anchor.set(1, 0.5);
        text0.scale.set(0.1);
        text1.anchor.set(0, 0.5);
        text1.scale.set(0.1);
        text0.position.set(50, 0);
        text1.position.set(-50, 0);

        this.viewNodes[0].addChild(text0);
        this.viewNodes[1].addChild(text1);

        this.updateConnectLine();
        this.stage!.addChild(this.connectLine);
    }

    private createSchematicNode(param: { pos: IXY }) {
        const { pos } = param;
        const node = new Graphics();
        node.beginFill(0xffffff, 1);
        node.lineStyle(2, 0x000000, 1);
        node.drawRoundedRect(-60, -30, 120, 60, 10);
        node.endFill();
        node.position.set(pos.x, pos.y);

        this.stage!.addChild(node);
        addDragEvent(node, this.updateConnectLine);
        return node;
    }

    private updateConnectLine = () => {
        this.connectLine.clear();
        this.connectLine.lineStyle(2, 0x000000, 1);
        this.connectLine.moveTo(this.viewNodes[0].x + 60, this.viewNodes[0].y);
        this.connectLine.bezierCurveTo(
            this.viewNodes[0].x + 200,
            this.viewNodes[0].y,
            this.viewNodes[1].x - 200,
            this.viewNodes[1].y,
            this.viewNodes[1].x - 60,
            this.viewNodes[1].y,
        );
    };
}
