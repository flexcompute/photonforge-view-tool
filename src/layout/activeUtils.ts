import { Container } from "pixi.js";
import { IOutComponent } from "../index";
import Component from "./Component";
import LayoutViewTool from "./LayoutViewTool";

// raw component (be used as reference in other component)
export function generateActiveComponent(
    layoutViewTool: LayoutViewTool,
    data: IOutComponent,
    generateComponent: Function,
) {
    const { activeComponentContainer, layerCacheMap, idCacheMap } = layoutViewTool;
    // collect active component
    const existComponent = activeComponentContainer.children.find((c) => c.name === data.name);
    if (!existComponent) {
        // active component do not want the transform and repetition just as reference
        const ac = new Container();
        ac.name = data.name;
        activeComponentContainer.addChild(ac);
        data.polyData.forEach((p) => {
            const comp = new Component(p);
            ac.addChild(comp.viewObject);
            if (p.layerInfo?.layer) {
                if (layerCacheMap.get(p.layerInfo.layer)) {
                    layerCacheMap.get(p.layerInfo.layer)!.push(comp.viewObject);
                } else {
                    layerCacheMap.set(p.layerInfo.layer, [comp.viewObject]);
                }
            }
        });

        // here need not handle repetition on top data.
        data.children.forEach((data1) => {
            const childrenContainer = generateComponent(data1);
            ac.addChild(childrenContainer);
        });
        return ac;
    } else {
        function buildConnectivity(existComponent: Container, data: IOutComponent) {
            if (!existComponent) return;

            const targetMapObjArray = idCacheMap.get(data.id) || [];
            targetMapObjArray.push(existComponent);
            idCacheMap.set(data.id, targetMapObjArray);
            data.children.forEach((c, i) => {
                let childrenTarget = existComponent.children;
                if (childrenTarget.length === 1 && childrenTarget[0].name === "repetition-container") {
                    childrenTarget = (childrenTarget[0] as Container).children;
                }
                const targetIndex = data.children.filter((cc) => cc.name === c.name).indexOf(c);
                buildConnectivity(childrenTarget.filter((cc) => cc.name === c.name)[targetIndex] as Container, c);
            });
        }
        buildConnectivity(existComponent as Container, data);
    }
}
