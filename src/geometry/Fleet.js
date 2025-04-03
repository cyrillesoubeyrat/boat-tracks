import Boat from "./Boat";
import * as olExtent from 'ol/extent';

export default class Fleet {
    #disabledBoats;
    #enabledBoats;
    #isPaused;
    #isSailing;
    constructor() {
        this.#isPaused = false;
        this.#isSailing = false;
        this.#enabledBoats = new Map();
        this.#disabledBoats = new Map();
    }

    reset() {
        this.#isPaused = false;
        this.#isSailing = false;
        this.#enabledBoats.forEach(boatItem => {
            boatItem.drag.reset();
            boatItem.reset();
        });
        this.#disabledBoats.forEach(boatItem => {
            boatItem.drag.reset();
            boatItem.reset();
        });
    }

    delete() {
        this.#enabledBoats.clear()
        this.#disabledBoats.clear()
        // console.log("delete - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    disable() {
        this.#enabledBoats.forEach(boatItem => {
            this.#disabledBoats.set(boatItem.name, boatItem);
            this.#enabledBoats.delete(boatItem.name);
        });
        // console.log("disable - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    enable() {
        this.#disabledBoats.forEach(boatItem => {
            if (boatItem) {
                this.#enabledBoats.set(boatItem.name);
                this.#disabledBoats.delete(boatItem.name, boatItem);
            }
        });
        // console.log("enable - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    addBoat(boat) {
        this.#enabledBoats.set(boat.name, boat);
        this.#disabledBoats.delete(boat.name);
        // console.log("addBoat: ", boat.name," - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    removeBoat(boat) {
        this.#enabledBoats.delete(boat.name);
        this.#disabledBoats.delete(boat.name);
        // console.log("deleteBoat - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    removeBoats(teamName) {
        this.#disabledBoats.forEach(boatItem => {
            if (boatItem && boatItem.teamName === teamName) {
                this.#disabledBoats.delete(boatItem.name, boatItem);
            }
        });
        this.#enabledBoats.forEach(boatItem => {
            if (boatItem && boatItem.teamName === teamName) {
                this.#enabledBoats.delete(boatItem.name, boatItem);
            }
        });
        // console.log("removeBoats - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    disableBoatByname(name) {
        let boatItem = this.#enabledBoats.get(name);
        if (boatItem) {
            this.#disabledBoats.set(boatItem.name, boatItem);
            this.#enabledBoats.delete(boatItem.name);
        }
        // console.log("disableBoatByname - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    enableBoatByname(name) {
        let boatItem = this.#disabledBoats.get(name);
        if (boatItem) {
            this.#enabledBoats.set(boatItem.name, boatItem);
            this.#disabledBoats.delete(boatItem.name);
        }
        // console.log("enableBoatByname - en: ", this.#enabledBoats.size, " dis: ", this.#disabledBoats.size);
    }

    get map() {
        return this.#enabledBoats;
    }

    get size() {
        return this.#enabledBoats.size;
    }

    get enabledBoatsMap() {
        return this.#enabledBoats;
    }

    get disabledBoatsMap() {
        return this.#disabledBoats;
    }

    get centerCoordinates() {
        const boundingBox = this.#boundingExtent(this.#enabledBoats);
        const center = olExtent.getCenter(boundingBox);

        return center;
    }

    set isPaused(status) {
        this.#isPaused = status;
    }

    get isPaused() {
        return this.#isPaused;
    }

    set isSailing(status) {
        this.#isSailing = status;
    }

    get isSailing() {
        return this.#isSailing;
    }

    #boundingExtent(boatMap) {
        let absoluteFleetCordinates = [];
        boatMap.forEach(boat => {
            const boatGeometry = boat.geometry;
            if (boatGeometry) {
                let coordinates = boatGeometry.getCoordinates();
                coordinates[0] = coordinates[0] + boat.worldIdx * 360;
                absoluteFleetCordinates.push(coordinates);
            }
        });

        return olExtent.boundingExtent(absoluteFleetCordinates);
    }
}
