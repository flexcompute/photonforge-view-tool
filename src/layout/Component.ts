import { Graphics, Texture, utils, SVGResource, Container, Shader, Program, Geometry, Mesh } from "pixi.js";
import { ILayer } from "..";
// https://y2x1d18d8u.larksuite.com/docx/SShzdhIKJoN5Xdx7gEsuRwM8sSp
export default class Component {
    viewObject = new Container();
    lineGraphics = new Graphics();
    fillGraphics = new Graphics();
    textureLoadPromise: Promise<void>;
    constructor(data: { polygonInfo: number[][][]; layerInfo?: ILayer }) {
        this.viewObject.addChild(this.lineGraphics);
        // this.viewObject.scale.y = -1;
        this.lineGraphics.lineStyle(1, utils.string2hex(data.layerInfo?.color || "#000000"));
        this.lineGraphics.line.native = true;
        this.textureLoadPromise = new Promise((resolve) => {
            if (!data.layerInfo) {
                data.polygonInfo.forEach((ps) => {
                    this.lineGraphics.moveTo(ps[0][0], ps[0][1]);
                    for (let i = 1; i < ps.length; i++) {
                        this.lineGraphics.lineTo(ps[i][0], ps[i][1]);
                    }
                });
                this.lineGraphics.closePath();
                resolve();
            }
            const SCALE = 2;
            const svgR = Texture.from<SVGResource>(data.layerInfo!.patternImage!, {
                resourceOptions: { scale: SCALE },
            });
            const drawComp = () => {
                // this.fillGraphics.beginTextureFill({
                //     texture: svgR,
                //     matrix: new Matrix().scale(0.05 / SCALE, 0.05 / SCALE),
                // });
                data.polygonInfo.forEach((ps) => {
                    this.fillGraphics.beginTextureFill({ texture: svgR });
                    this.fillGraphics.moveTo(ps[0][0], ps[0][1]);
                    this.lineGraphics.moveTo(ps[0][0], ps[0][1]);
                    for (let i = 1; i < ps.length; i++) {
                        this.fillGraphics.lineTo(ps[i][0], ps[i][1]);
                        this.lineGraphics.lineTo(ps[i][0], ps[i][1]);
                    }
                    this.lineGraphics.closePath();
                    this.fillGraphics.closePath();
                    this.fillGraphics.endFill();
                });
                // const colorMatrixFilter = new filters.ColorMatrixFilter();
                const rgb = utils.hex2rgb(utils.string2hex(data.layerInfo!.color));
                const vertexSrc = `
precision mediump float;
attribute vec2 aVertexPosition;
uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;
void main() {
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}`;
                const fragmentSrc = `
precision mediump float;
uniform sampler2D uTT;
void main() {
    float k = texture2D(uTT, fract(vec2(gl_FragCoord.x, -gl_FragCoord.y) / 50.)).a;
    gl_FragColor = vec4(k * ${rgb[0].toFixed(2)},k * ${rgb[1].toFixed(2)},k * ${rgb[2].toFixed(2)},k);
}`;
                const shader = Shader.from(vertexSrc, fragmentSrc, { uTT: svgR });
                this.fillGraphics.geometry.updateBatches();
                const geometry = new Geometry()
                    .addAttribute("aVertexPosition", this.fillGraphics.geometry.points)
                    .addIndex(this.fillGraphics.geometry.indices);
                const mesh = new Mesh(geometry, shader);
                this.viewObject.addChild(mesh);
            };
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
        // this.fillGraphics.addChild(tt);
        // this.fillGraphics = drawTestLayoutGraphic(window.innerWidth, window.innerHeight);
    }
}
