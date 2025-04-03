import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from 'ol/style/Circle.js';

class CircleMarker {
    #circleStyle;
    #nullStyle;
    #feature;

    constructor() {
        this.#feature = new Feature({
            geometry: new Point([-179.99, 0.0]), // Why not?
        });

        this.#circleStyle = new Style({
            image: new CircleStyle({
                radius: 10,
                fill: new Fill({
                    color: 'rgba(255,0,0,.2)'
                }),
                stroke: new Stroke({
                    color: 'rgb(128, 128, 128)',
                    width: 1.0
                })
            })
        });

        this.#nullStyle = new Style({
            image: new CircleStyle({})
        });
    }
    show() {
        this.#feature.setStyle(this.#circleStyle);
    }

    hide() {
        this.#feature.setStyle(this.#nullStyle);
    }

    setCoordinates(coordinates) {
        this.#feature.getGeometry().setCoordinates(coordinates);
    }



    get feature() {
        return this.#feature;
    }
    
    get geometry() {
        return this.#feature.getGeometry();
    }
}

export default CircleMarker;