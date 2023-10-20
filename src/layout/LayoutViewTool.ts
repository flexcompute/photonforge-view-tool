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
        axis.lineStyle(2, 0xeeeeee, 1);
        axis.moveTo(this.w / 2, 0);
        axis.lineTo(this.w / 2, this.h);
        axis.moveTo(0, this.h / 2);
        axis.lineTo(this.w, this.h / 2);
        // axis.alpha = 0.5;
        this.app.stage.addChild(axis);

        containerDom.appendChild(this.app.view);
    }

    initComponents(dataArray: { polygonInfo: number[][][]; layerInfo: ILayer | undefined }[]) {
        this.componentGroup.length = 0;
        const promises: Promise<void>[] = [];
        dataArray.forEach((data) => {
            if (data.layerInfo) {
                const comp = new Component(data as { polygonInfo: number[][][]; layerInfo: ILayer });
                this.componentGroup.push(comp);
                promises.push(comp.textureLoadPromise);
            }
        });
        Promise.all(promises).then(() => {
            const rect = this.componentGroup[0]?.viewObject.getBounds() || new Rectangle();
            this.componentGroup.forEach((c, index) => {
                if (index > 0) {
                    rect.enlarge(c.viewObject.getBounds());
                }
            });
            if (!this.stage) {
                this.stage = addViewPort(
                    this.app,
                    this.w,
                    this.h,
                    0.4 * Math.min(this.w / rect.width, this.h / rect.height),
                    {
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2,
                    },
                );
            }
            this.stage.removeChildren();
            this.componentGroup.forEach((c) => {
                this.stage!.addChild(c.viewObject);
            });
        });
    }
}
