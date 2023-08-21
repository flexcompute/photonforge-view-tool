import { Viewport } from "pixi-viewport";
import { Application, Graphics } from "pixi.js";
import { addDragEvent, addViewPort } from "./utils";
import { IXY } from ".";

export default class SchematicViewTool {
    app: Application;
    stage: Viewport;
    nodeData: { center: IXY }[] = [{ center: { x: 90, y: 230 } }, { center: { x: 300, y: 100 } }];
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

        const { width: w1, height: h1 } = this.app.view;

        this.nodeData.forEach((n) => {
            const node = this.createSchematicNode({ pos: n.center });
            this.viewNodes.push(node);
            this.stage!.addChild(node);
        });

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
        this.connectLine.lineTo(this.viewNodes[1].x - 60, this.viewNodes[1].y);
    };
}
