import { Graphics, utils } from "pixi.js";
import { IPolygon, ILayer } from "..";
import { drawTestLayoutGraphic } from "../utils";

// https://y2x1d18d8u.larksuite.com/docx/SShzdhIKJoN5Xdx7gEsuRwM8sSp
export default class Component {
    viewObject;
    constructor(data: { polygonInfo: number[][][]; layerInfo: ILayer }) {
        const testG = new Graphics();
        testG.beginFill(utils.string2hex(data.layerInfo.color), 1);
        data.polygonInfo.forEach((ps) => {
            testG.moveTo(ps[0][0], ps[0][1]);
            for (let i = 1; i < ps.length; i++) {
                testG.lineTo(ps[i][0], ps[i][1]);
            }
            testG.closePath();
            testG.endFill();
        });
        this.viewObject = testG;
        // this.viewObject = drawTestLayoutGraphic(window.innerWidth, window.innerHeight);
    }
}
