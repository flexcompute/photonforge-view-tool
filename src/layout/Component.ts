import { BaseTexture, Graphics, Matrix, Sprite, Texture, filters, utils, SVGResource } from "pixi.js";
import { IPolygon, ILayer } from "..";
import { drawTestLayoutGraphic } from "../utils";

// https://y2x1d18d8u.larksuite.com/docx/SShzdhIKJoN5Xdx7gEsuRwM8sSp
export default class Component {
    viewObject = new Graphics();
    textureLoadPromise: Promise<void>;
    constructor(data: { polygonInfo: number[][][]; layerInfo: ILayer }) {
        this.viewObject.lineStyle(0.5, utils.string2hex(data.layerInfo.color));
        this.textureLoadPromise = new Promise((resolve) => {
            const drawComp = () => {
                this.viewObject.beginTextureFill({
                    texture: svgR,
                    matrix: new Matrix().scale(0.05 / SCALE, 0.05 / SCALE),
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
                this.viewObject.filters = [colorMatrixFilter];
            };
            const SCALE = 2;
            const svgR = Texture.from<SVGResource>(data.layerInfo.patternImage!, { resourceOptions: { scale: SCALE } });
            if (!svgR.baseTexture.valid) {
                svgR.baseTexture.on("loaded", () => {
                    drawComp();
                    resolve();
                });
            } else {
                drawComp();
                resolve();
            }
        });

        // const tt = Sprite.from(data.layerInfo.patternImage!);
        // this.viewObject.addChild(tt);
        // this.viewObject = drawTestLayoutGraphic(window.innerWidth, window.innerHeight);
    }
}
