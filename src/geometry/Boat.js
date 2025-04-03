import {Fill, Style, Text} from "ol/style";
import CircleStyle from "ol/style/Circle";
import { LineString, MultiLineString, Point } from "ol/geom";
import Feature from 'ol/Feature.js';
import BoatDrag from "./BoatDrag";

export default class Boat {
    constructor(name, color, trace, teamName = "") {
        this.name = name;
        this.color = color;
        this.trace = trace;
        this.maxTimeStamp = trace[Object.keys(trace).length - 1].ts;
        this.started = false;
        this.teamName = teamName;
        this.feature = new Feature({
            type: 'geoMarker',
        });

        this.geometry = new Point([]);
        this.style = new Style({
            image: new CircleStyle({
                radius: 4,
                fill: new Fill({color: this.color}),
            }),
            text: new Text({
                font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
                textAlign: 'left',
                offsetX: 10,
                placement: 'point',
                fill: new Fill({color: '#fff'}),
                text: this.name,
            }),
        });

        this.reset();

        this.drag = new BoatDrag(this.color)
    }

    reset() {
        this.previousCoordinates = null;
        this.worldIdx = 0;
    }

    getPosition(timestamp) {
        // fetch previous coordinates
        const previousStep = this.trace.findLast(point => point.ts <= timestamp);
        if(!previousStep)
            return false;

        const previousTimestamp = previousStep.ts;
        const previousPosition = [previousStep.lon, previousStep.lat];

        // fetch next coordinates
        const nextStep = this.trace.find(point => point.ts > timestamp);
        if(!nextStep) {
            return false;
        }
        const nextTimestamp = nextStep.ts;
        const nextPosition = [nextStep.lon, nextStep.lat];

        // My boat is between previous and next coordinates, create a virtual line and project the boat position
        // Create a projection line between previous and next points
        let projectionLine;
        const projectionLineDuration = nextTimestamp - previousTimestamp;
        const elapsedTimeOnProjection = timestamp - previousTimestamp;
        if (Math.abs(previousStep.lon - nextStep.lon) > 180) {
            const w1 = 180 - Math.abs(previousStep.lon);
            const w2 = 180 - Math.abs(nextStep.lon);
            const y = (w1 / (w1 + w2)) * (nextStep.lat - previousStep.lat) + previousStep.lat;

            projectionLine = new MultiLineString([
                [
                    previousPosition,
                    [previousPosition > 0 ? 180 : -180, y]
                ],
                [
                    [nextPosition[0] > 0 ? 180 : -180, y],
                    nextPosition,
                ],
            ]);
            return projectionLine.getCoordinateAtM(elapsedTimeOnProjection / projectionLineDuration);
        }
        else {
            projectionLine = new LineString([previousPosition, nextPosition]);
            return projectionLine.getCoordinateAt(elapsedTimeOnProjection / projectionLineDuration);
        }
    }

    getEndPosition() {
        let point = this.trace[Object.keys(this.trace).length - 1];
        return [point.lon, point.lat];
    }

    setCoordinates(coordinates) {
        if (this.previousCoordinates) {
            let previousLongitude = this.previousCoordinates[0];
            let currentLongitude = coordinates[0];
            let trippedLongitude = currentLongitude - previousLongitude;
            if (Math.abs(trippedLongitude) > 180) {
                // Boat has passed the word wrapping limit
                this.worldIdx = this.worldIdx + (trippedLongitude < 0) ? 1 : -1;
            }
        }
        this.geometry.setCoordinates(coordinates);
        this.previousCoordinates = this.geometry.getCoordinates();
    }

    getCoordinates() {
        return this.geometry.getCoordinates();
    }

    display() {
        if (this.feature && this.geometry) {
            this.feature.setStyle(this.style);
            this.feature.setGeometry(this.geometry);
        }
    }

    erase() {
        if (this.feature) {
            this.feature.setStyle(new Style(null));
        }
    }

}