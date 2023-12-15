import { Container } from "pixi.js";
import { IOutComponent } from "../index";
import Component from "./Component";

export function generateActiveComponent(
    activeComponentContainer: Container,
    data: IOutComponent,
    generateComponent: Function,
    layerCacheMap: Map<string, Container[]>,
) {
    // collect active component
    if (!activeComponentContainer.children.find((c) => c.name === data.name)) {
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
        data.children.forEach((data1) => {
            const childrenContainer = generateComponent(data1);
            ac.addChild(childrenContainer);
        });
        return ac;
    }
}
