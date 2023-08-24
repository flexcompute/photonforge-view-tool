import { Viewport } from "pixi-viewport";
import { Application, Graphics, Rectangle } from "pixi.js";
import { addViewPort, drawTestLayoutGraphic } from "../utils";
import Component from "./Component";
import { IPolygon, ILayer } from "..";

export default class LayoutViewTool {
    app: Application;
    stage?: Viewport;
    w;
    h;
    componentGroup: Component[] = [];
    constructor(containerId: string) {
        const containerDom = document.getElementById(containerId)!;
        const { clientWidth: w, clientHeight: h } = containerDom;
        this.w = w;
        this.h = h;
        this.app = new Application({
            backgroundColor: 0xf2f3f4,
            width: w,
            height: h,
            antialias: true,
        });

        const axis = new Graphics();
        axis.lineStyle(2, 0x1965a5, 1);
        axis.moveTo(this.w / 2, 0);
        axis.lineTo(this.w / 2, this.h);
        axis.moveTo(0, this.h / 2);
        axis.lineTo(this.w, this.h / 2);
        this.app.stage.addChild(axis);

        containerDom.appendChild(this.app.view);
    }

    initComponents(dataArray: { polygonInfo: number[][][]; layerInfo: ILayer | undefined }[]) {
        debugger;
        dataArray.forEach((data) => {
            if (data.layerInfo) {
                this.componentGroup.push(new Component(data as { polygonInfo: number[][][]; layerInfo: ILayer }));
            }
        });
        const rect = new Rectangle();
        this.componentGroup.forEach((c) => {
            rect.enlarge(c.viewObject.getBounds());
        });
        this.stage = addViewPort(this.app, this.w, this.h, 0.4 * Math.min(this.w / rect.width, this.h / rect.height), {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        });
        this.componentGroup.forEach((c) => {
            this.stage!.addChild(c.viewObject);
        });
    }
}
