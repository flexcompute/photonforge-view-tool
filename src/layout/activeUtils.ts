import { Container } from "pixi.js";
import { IOutComponent } from "../index";
import Component from "./Component";

export function generateActiveComponent(
    activeComponentContainer: Container,
    data: IOutComponent,
    generateComponent: Function,
) {
    // collect active component
    if (!activeComponentContainer.children.find((c) => c.name === data.name)) {
        const ac = new Container();
        ac.name = data.name;
        activeComponentContainer.addChild(ac);
        data.polyData.forEach((p) => {
            const comp = new Component(p);
            ac.addChild(comp.viewObject);
        });
        data.children.forEach((data1) => {
            const childrenContainer = generateComponent(data1);
            ac.addChild(childrenContainer);
        });
    }
}
