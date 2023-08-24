import { BaseTexture, Graphics, Matrix, Sprite, Texture, filters, utils } from "pixi.js";
import { IPolygon, ILayer } from "..";
import { drawTestLayoutGraphic } from "../utils";

// https://y2x1d18d8u.larksuite.com/docx/SShzdhIKJoN5Xdx7gEsuRwM8sSp
export default class Component {
    viewObject = new Graphics();
    textureLoadPromise: Promise<void>;
    constructor(data: { polygonInfo: number[][][]; layerInfo: ILayer }) {
        // this.viewObject.beginFill(utils.string2hex(data.layerInfo.color), 1);
        // this.viewObject.drawRect(-100, -100, 200, 200);
        this.viewObject.lineStyle(0.5, utils.string2hex(data.layerInfo.color));
        this.textureLoadPromise = new Promise((resolve) => {
            Texture.fromURL(data.layerInfo.patternImage!).then((texture) => {
                this.viewObject.beginTextureFill({
                    texture,
                    matrix: new Matrix().scale(0.05, 0.05),
                });
                data.polygonInfo.forEach((ps) => {
                    this.viewObject.moveTo(ps[0][0], ps[0][1]);
                    for (let i = 1; i < ps.length; i++) {
                        this.viewObject.lineTo(ps[i][0], ps[i][1]);
                    }
                    this.viewObject.closePath();
                    this.viewObject.endFill();
                });
                const colorMatrixFilter = new filters.ColorMatrixFilter();

                const rgb = utils.hex2rgb(utils.string2hex(data.layerInfo.color));
                colorMatrixFilter.matrix = [0, 0, 0, rgb[0], 0, 0, 0, 0, rgb[1], 0, 0, 0, 0, rgb[2], 0, 0, 0, 0, 1, 0];

                const colorOverLay = new filters.ColorMatrixFilter();
                this.viewObject.filters = [colorMatrixFilter];
                resolve();
            });
        });

        // const tt = Sprite.from(data.layerInfo.patternImage!);
        // this.viewObject.addChild(tt);
        // this.viewObject = drawTestLayoutGraphic(window.innerWidth, window.innerHeight);
    }
}
