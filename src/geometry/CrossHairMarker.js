import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from 'ol/style/Circle.js';
import RegularShape from 'ol/style/RegularShape.js';

class CrossHairMarker {
    #circleStyle;
    #squareStyle;
    #nullStyle;
    #currentStyle;
    #feature;

    constructor() {
        this.#feature = new Feature({
            geometry: new Point([-179.99, 0.0]), // Why not?
        });

        this.#circleStyle = new Style({
            image: new CircleStyle({
                radius: 10,
                fill: new Fill({
                    color: 'rgba(0,0,255,.2)'
                }),
                stroke: new Stroke({
                    color: 'rgb(128, 128, 128)',
                    lineDash: [10.3, 5.5],
                    lineDashOffset: 13.5,
                    width: 2.5
                })
            })
        });

        this.#squareStyle = new Style({
            image: new RegularShape({
                radius: 16,
                points: 4,
                angle: Math.PI / 4,
                fill: new Fill({
                    color: 'rgba(0,0,255,.2)'
                }),
                stroke: new Stroke({
                    color: 'rgb(128, 128, 128)',
                    lineDash: [6, 16.5],
                    lineDashOffset: 2.8,
                    width: 2.5
                })
            })
        });

        this.#nullStyle = new Style({
            image: new CircleStyle({})
        });

        this.#currentStyle = this.#nullStyle;
    }
    show() {
        this.#feature.setStyle(this.#currentStyle);
    }

    hide() {
        this.#feature.setStyle(this.#nullStyle);
    }

    setCoordinates(coordinates) {
        this.#feature.getGeometry().setCoordinates(coordinates);
    }

    setCircleShape() {
        this.#currentStyle = this.#circleStyle;
        this.#feature.setStyle(this.#currentStyle);
    }

    setSquareShape() {
        this.#currentStyle = this.#squareStyle;
        this.#feature.setStyle(this.#currentStyle);
    }



    get feature() {
        return this.#feature;
    }
    
    get geometry() {
        return this.#feature.getGeometry();
    }
}

export default CrossHairMarker;