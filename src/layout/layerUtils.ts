import { Container } from "pixi.js";
import { IComponent } from "..";

export function handleLayerVisibility(components: IComponent[], layerCacheMap: Map<string, Container[]>) {
    components.forEach((c) => {
        c.layers?.forEach((l) => {
            const target = layerCacheMap.get(l.layer);
            if (target) {
                target.forEach((c1) => {
                    c1.visible = !l.hidden;
                });
            }
        });
    });
}
