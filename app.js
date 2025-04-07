import './style.css';
import { Map, View } from 'ol';
import Group from 'ol/layer/Group';
import { useGeographic } from "ol/proj";
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import { GeoJSON } from "ol/format";
import { StadiaMaps, TileJSON } from 'ol/source';
import OSM from 'ol/source/OSM';
import FullScreen from 'ol/control/FullScreen';
import { defaults as defaultControls } from 'ol/control/defaults';
import Boat from "./src/geometry/Boat";
import Fleet from "./src/geometry/Fleet";
import PlayControls from "./src/gui/html_ctrl/PlayControls";
import DocItemList from "./src/gui/html_doc/DocItemList";
import FleetSpeedFactor from "./src/FleetSpeedFactor";
import ModeMarker from './src/geometry/CrossHairMarker';
import { fromExtent } from 'ol/geom/Polygon.js'

const TrackType = {
  NONE: "None",
  CENTERED: "Centered",
  FOCUSED: "Focused"
}


const docSidebar = document.getElementById('sidebar')
const docToggleButton = document.getElementById('toggle-btn')
const docTeamList = new DocItemList('teams-div')
const docBoatList = new DocItemList("sailors-div");
const docDisplayModeList = new DocItemList("display-mode-div");
const docMapNamesList = new DocItemList('map-names-div')

let g_baseLayerGroup = null;
let g_baseMap = null;
let g_boatsLayer = null;
let g_fleetCenterMarker = null;
let g_teams = []; // Active teams
let g_fleet = new Fleet(); // Active boats
let g_fleetCtrl = new PlayControls();
let g_trackFleetMode = TrackType.FOCUSED;

const raceStartTimestamp = Math.floor(new Date("2024-11-10T12:00:00"));
let g_timeStamp = raceStartTimestamp;
let g_fleetSpeedFactor = new FleetSpeedFactor();


// * Zoom or unzoom with +1 or -1 delta without animation 
function zoomClicked(event) {
  let zoomIn = false;
  if (event.target.classList.contains("ol-zoom-in")) {
    zoomIn = true;
  }
  if (zoomIn || event.target.classList.contains("ol-zoom-out")) {
    let view = g_baseMap.getView();
    let currentZoom = view.getZoom();
    if (currentZoom !== undefined) {
      const newZoom = view.getConstrainedZoom(currentZoom + (zoomIn ? 1 : -1));
      view.setZoom(newZoom);
    }
  }
}

// * Kludge for managing zoom buttons while setting view position
// * The zoom control's buttons zoom in or out using a zoom animation. If
// * the position of the view is set during this animation, the zoom won't work
// * The kludge consists in overriding this behaviour using a simple zoom procedure
// * without animation.
function zoomKludge(on = true) {
  let zoomIn = document.getElementsByClassName("ol-zoom-in")[0];
  let zoomOut = document.getElementsByClassName("ol-zoom-out")[0];
  if (zoomIn && zoomOut) {
    if (on) {
      zoomIn.addEventListener("click", zoomClicked);
      zoomOut.addEventListener("click", zoomClicked);
    }
    else {
      zoomIn.removeEventListener("click", zoomClicked);
      zoomOut.removeEventListener("click", zoomClicked);
    }
  }
}

function disableZoomControls() {
  let zoomIn = document.getElementsByClassName("ol-zoom-in")[0];
  let zoomOut = document.getElementsByClassName("ol-zoom-out")[0];
  if (!zoomIn.classList.contains("disabled")) {
    zoomIn.classList.add("disabled");
  }
  if (!zoomOut.classList.contains("disabled")) {
    zoomOut.classList.add("disabled");
  }
}

function enableZoomControls() {
  let zoomIn = document.getElementsByClassName("ol-zoom-in")[0];
  let zoomOut = document.getElementsByClassName("ol-zoom-out")[0];

  if (zoomIn.classList.contains("disabled")) {
    zoomIn.classList.remove("disabled");
  }
  if (zoomOut.classList.contains("disabled")) {
    zoomOut.classList.remove("disabled");
  }
}

// ************************************
// ************************************
// * Click handlers for fleet controls
// ************************************
// ************************************

function fleetStartedtHandler(event) {
  if (!g_fleet.isPaused) {
    clearBoatsLayer()
  }
  startAnimation();
}

function fleetPausedHandler(event) {
  pauseAnimation();
}

function fleetAcceleratedHandler(event) {
  g_fleetSpeedFactor.increase();
}

function fleetDeceleratedHandler(event) {
  g_fleetSpeedFactor.decrease();
}

function fleetRestartedHandler(event) {
  restartAnimation();
}

function fleetStoppedHandler(event) {
  g_fleetSpeedFactor.reset();
  resetAnimation();
  if (g_fleet.size) {
    // Tell ctrler to keep play button active for allowing restart 
    return false;
  }
  return true;
}


// ************************************
// ************************************
// * Click handlers for teams menu
// ************************************
// ************************************

function teamItemSelectedHandler(teamID, single) {
  // Show sidebar's dropdown items that are valid only after loading a valid team
  Array.from(docSidebar.getElementsByClassName('dropdown-btn')).forEach(btn => {
    if (!btn.classList.contains("show")) {
      btn.classList.toggle('show');
    }
  })

  if (single) {
    // Simple selection ==> Remove all teams and associated boats prior loading new team and correponding boats
    resetAnimation();
    unloadAllBoats();
    loadBoats(teamID)
    g_teams.length = 0;
    g_teams.push(teamID);
    g_fleetCtrl.reset();
  }
  else {
    // Multiple selection:
    if (!g_teams.includes(teamID)) {
      // ==> If selected, preserve already loaded teams and associated boats
      if (!g_fleet.size) {
        g_fleetCtrl.reset();
      }
      loadBoats(teamID)
      g_teams.push(teamID);
    }
  }
}

function teamItemDeselectedHandler(teamID, single) {
  if (!single) {
    // ==> If deselected, remove team and associated boats
    let teamIdx = g_teams.indexOf(teamID);
    if (teamIdx >= 0) {
      unloadBoats(teamID);
      g_teams.splice(teamIdx, 1);
      clearBoatsLayer(true);
    }
  }
}


// *********************************************
// *********************************************
// // * Click handlers for fleet (boats) menu
// *********************************************
// *********************************************

function allBoatsItemDisabledHandler() {
  g_fleet.disable();
}

function boatItemAppendedHandler(boatName) {
  g_fleet.enableBoatByname(boatName);
}

function boatItemRemovedHandler(boatName) {
  g_fleet.disableBoatByname(boatName);
}

function boatItemSelectedHandler(boatName, single) {
  if (single) {
    // A single boat has just been selected
    hideBoatsLayer(true);
  }
  if (boatName) {
    g_fleet.enableBoatByname(boatName);
  }
}

function boatItemDeselectedHandler(boatName) {
  g_fleet.disableBoatByname(boatName);
  hideBoatsLayer(true);
}


// *********************************************
// *********************************************
// // * Click handlers for display mode menu
// *********************************************
// *********************************************

function displayModeSelectedHandler(modeName) {
  g_trackFleetMode = modeName;

  if (modeName == TrackType.CENTERED) {
    g_fleetCenterMarker.setCircleShape();
    g_fleetCenterMarker.show();
    enableZoomControls();
    zoomKludge(true);
  }
  else if (modeName == TrackType.FOCUSED) {
    g_fleetCenterMarker.setSquareShape();
    g_fleetCenterMarker.show();
    disableZoomControls();
    zoomKludge(false);
  }
  else {
    g_trackFleetMode = TrackType.NONE;
    g_fleetCenterMarker.hide();
    enableZoomControls();
    zoomKludge(false);
  }
}




function initializeDocAndControls() {
  // Set handlers for click event in the PlayControl object
  g_fleetCtrl.onPlayClicked = fleetStartedtHandler;
  g_fleetCtrl.onPauseClicked = fleetPausedHandler;
  g_fleetCtrl.onIncreaseSpeedClicked = fleetAcceleratedHandler;
  g_fleetCtrl.onDecreaseSpeedClicked = fleetDeceleratedHandler;
  g_fleetCtrl.onRestartClicked = fleetRestartedHandler;
  g_fleetCtrl.onStopClicked = fleetStoppedHandler;

  // Set handlers for click event in the Team list menu object
  docTeamList.allowMultiSelection = true;
  docTeamList.onItemSelected = teamItemSelectedHandler;
  docTeamList.onItemDeselected = teamItemDeselectedHandler;

  // Set handlers for click event in the Boat list object
  docBoatList.allowMultiSelection = true;
  docBoatList.onDisableAll = allBoatsItemDisabledHandler;
  docBoatList.onItemAppend = boatItemAppendedHandler;
  docBoatList.onItemRemoved = boatItemRemovedHandler;
  docBoatList.onItemSelected = boatItemSelectedHandler;
  docBoatList.onItemDeselected = boatItemDeselectedHandler;

  // Setup the Display Modes menu list object
  docDisplayModeList.allowMultiSelection = false;
  docDisplayModeList.onItemSelected = displayModeSelectedHandler;
  docDisplayModeList.addItem(TrackType.NONE, "Aucun", false);
  docDisplayModeList.addItem(TrackType.CENTERED, "Flotte (centre)", false);
  zoomKludge(true);
  docDisplayModeList.addItem(TrackType.FOCUSED, "Flotte (focus)", true);

  // Setup the Map menu list object
  docMapNamesList.allowMultiSelection = false;
  docMapNamesList.onItemSelected = mapItemSelectedHandler;
  docMapNamesList.onItemDeselected = mapItemDeselectedHandler;
  docMapNamesList.addItem("EsriSatellite", "Esri Satellite", true); // Selected item
  docMapNamesList.addItem("EsriTopo", "Esri World Topo", false);
  docMapNamesList.addItem("GoogleHybrid", "Google Hybrid", false);
  docMapNamesList.addItem("StamenWatercolor", "Stamen Watercolor", false);

}


function initializeMaps() {
  // Create the base map:
  // - Attach it to the proper div in index.html
  // - Only define its view as layers are defined afterwards
  const baseMap = new Map({
    controls: defaultControls().extend([new FullScreen(), g_fleetCtrl]),
    target: 'map-div',
    view: new View({
      center: [0, 0],
      center: [-1.831527, 46.4713], // coords: Les Sables
      zoom: 7,
    })
  });
  g_baseMap = baseMap;

  // Define the candidate base map layers:

  const esriSatellite = new TileLayer({
    source: new OSM({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions:
      'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' + 'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
    }),
    visible: false,
    title: 'EsriSatellite'
  });

  const esriTopo = new TileLayer({
    source: new OSM({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attributions:
      'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' + 'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
    }),
    visible: false,
    title: 'EsriTopo'
  });

  const stamenWatercolor = new TileLayer({
    source: new StadiaMaps({
      layer: 'stamen_watercolor',
      retina: false
    }),
    visible: false,
    title: 'StamenWatercolor'
  });

  const googleHybrid = new TileLayer({
    source: new OSM({
      url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}'
      // crossOrigin: "anonymous"
    }),
    visible: false,
    title: 'GoogleHybrid'
  });

  // Define the layers for the exclusion zone:
  const exclusionZoneFiles = [
    'data/exclusion-zones/pv_zea_v7.json',
    'data/exclusion-zones/pv_zi_vg_2024.json'
  ]

  const exlusionZonesLayer = new VectorLayer({
    source: new VectorSource({
      features: [],
    }),
    style: new Style({
      stroke: new Stroke({
        color: 'rgb(220, 7, 7)',
        width: 1,
      }),
      fill: new Fill({
        color: 'rgba(220,7,7,0.5)',
      }),
    })
  });

  exclusionZoneFiles.forEach(exclusionZoneFile => {
    fetch(exclusionZoneFile)
      .then(res => res.json())
      .then(geojsonObject => { exlusionZonesLayer.getSource().addFeatures(new GeoJSON().readFeatures(geojsonObject)) })
  });

  // Define the layers for the exclusion zone:
  const whalesZonesFile = 'data/exclusion-zones/pv_zone_whales.json';

  const whalesZonesLayer = new VectorLayer({
    source: new VectorSource({
      features: [],
    }),
    style: new Style({
      stroke: new Stroke({
        color: 'rgb(6, 88, 6)',
        width: 1,
      }),
      fill: new Fill({
        color: 'rgba(6,86,6,0.5)',
      }),
    })
  });

  fetch(whalesZonesFile)
    .then(res => res.json())
    .then(geojsonObject => { whalesZonesLayer.getSource().addFeatures(new GeoJSON().readFeatures(geojsonObject)) })

  // Define the layers for boats:
  const boatsLayer = new VectorLayer({
    source: new VectorSource({
      features: [],
      wrapX: true
    }),
  });
  g_boatsLayer = boatsLayer;

  const infoLayer = new VectorLayer({
    source: new VectorSource({ wrapX: false })
  });
  g_fleetCenterMarker = new ModeMarker();
  g_fleetCenterMarker.setCircleShape();

  infoLayer.getSource().addFeature(g_fleetCenterMarker.feature);

  // Define the layer group
  g_baseLayerGroup = new Group({
    layers: [esriSatellite, esriTopo, googleHybrid, stamenWatercolor, exlusionZonesLayer, whalesZonesLayer, boatsLayer, infoLayer]
  })

  baseMap.addLayer(g_baseLayerGroup)

  // Enable first layer of map
  const layers = g_baseLayerGroup.getLayers().getArray()
  layers[0].setVisible(true);
}

// Params: disabledOnly:
//            - true: remove marker and trace for only disabled boats
//            - false (default): remove marker and trace for all boats
function clearBoatsLayer(disabledOnly = false) {
  if (disabledOnly) {
    g_fleet.disabledBoatsMap.forEach(boat => {
      boat.erase();
      boat.drag.erase();
    })
  }
  else {
    g_fleet.map.forEach(boat => {
      boat.erase();
      boat.drag.erase();
    })
  }

  g_baseMap.render();
}

// Params: disabledOnly:
//            - true: remove marker and trace for only disabled boats
//            - false (default): remove marker and trace for all boats
function hideBoatsLayer(disabledOnly = false) {
  if (disabledOnly) {
    g_fleet.disabledBoatsMap.forEach(boat => {
      boat.erase();
      boat.drag.hide();
    })
  }
  else {
    g_fleet.map.forEach(boat => {
      boat.erase();
      boat.drag.hide();
    })
  }

  g_baseMap.render();
}

// Load teams list and feed them to UI:
function loadTeamList(teamListPath) {
  fetch(teamListPath)
    .then(res => res.json())
    .then(res => res.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    }))
    .then(teams => {
      for (const team of teams) {
        docTeamList.addItem(team.id, team.name, false);
      }
      return teams
    })
}

// Delete all boats
function unloadAllBoats() {
  docBoatList.unload();
  g_fleet.delete();
}

// Delete boats that correspond to a team specified by its name
function unloadBoats(teamName) {
  g_fleet.map.forEach(boat => {
    if (boat.teamName == teamName) {
      // Remove menu item:
      docBoatList.removeItem(boat.name);
    }
  });
  if (g_fleet.size == 0) {
    // If no team is loaded
    // delete the option for deselecting all boats
    let noBoatItem = document.getElementById("--display-no-boat--");
    if (noBoatItem) {
      noBoatItem.remove();
    }
  }
}

function loadBoats(teamName) {
  let teamPath = new URL(`/public/data/teams/${teamName}.json`, import.meta.url).href;

  fetch(teamPath)
    .then(res => res.json())
    .then(res => res.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    }))
    .then(boatInfos => {
      // Create actual boat items (selected by default)
      for (const boatInfo of boatInfos) {
        const boat = new Boat(boatInfo.name, boatInfo.color, boatInfo.trace, teamName);
        // Add this boat to the feature list of the boat layer:
        g_boatsLayer.getSource().addFeature(boat.feature);
        g_boatsLayer.getSource().addFeature(boat.drag.feature);

        // Add boat to GUI
        docBoatList.addItem(boat.name, boat.name, true);

        g_fleet.addBoat(boat);
      }
    })
}


// function toggleSidebar(){
window.toggleSidebar = () => {
  docSidebar.classList.toggle('closed')
  docToggleButton.classList.toggle('rotate')

  closeAllSubMenus()
}

window.closeAllSubMenus = () => {
  Array.from(docSidebar.getElementsByClassName('sub-menu')).forEach(ul => {
    if (ul.classList.contains("show")) {
      ul.classList.remove('show')
      ul.previousElementSibling.classList.remove('rotate')
    }
  })
}

// Assuming that this function may only be associated to a sub menu button
// When clicking a menu button: 
window.toggleSubMenu = (button) => {
  const submenu = button.nextElementSibling
  // Close its sub menu if it hasn't the "show" attribute
  if (!submenu.classList.contains('show')) {
    closeAllSubMenus()
  }
  // Rotate the icon of the menu then toggle the "show" attribute of its sub menu
  submenu.classList.toggle('show')
  button.classList.toggle('rotate')

  // If the sidebar is closed when clicking on a menu button, toggle its "closed" flag
  // and rotate its arrow icon
  if (sidebar.classList.contains('closed')) {
    sidebar.classList.toggle('closed')
    docToggleButton.classList.toggle('rotate')
  }
}

function mapItemSelectedHandler(event) {
  const targetLayerId = event;
  const layers = g_baseLayerGroup.getLayers();
  for (let idx = 0; idx < layers.getArray().length; idx++) {
    if (layers.getArray()[idx].getProperties().title === targetLayerId) {
      layers.getArray()[idx].setVisible(true);
      break;
    }
  }
}

function mapItemDeselectedHandler(event) {
  const targetLayerId = event;
  const layers = g_baseLayerGroup.getLayers();
  for (let idx = 0; idx < layers.getArray().length; idx++) {
    if (layers.getArray()[idx].getProperties().title === targetLayerId) {
      layers.getArray()[idx].setVisible(false);
      break;
    }
  }
}




function moveBoats(event) {
  g_fleet.isSailing = false;

  // loop over enabled boats
  g_fleet.map.forEach(boat => {
    // fetch boat position at new timestamp
    const newCoordinates = boat.getPosition(g_timeStamp);
    if (newCoordinates) {
      g_fleet.isSailing = true;
      boat.started = true;
      boat.setCoordinates(newCoordinates); // update boat position
      boat.drag.addPoint(newCoordinates); // add point to boat line
      if (g_trackFleetMode == TrackType.CENTERED) {
        // Center map on fleet
        const fleetCenter = g_fleet.centerCoordinates;
        g_baseMap.getView().setCenter(fleetCenter);
        g_fleetCenterMarker.setCoordinates(fleetCenter);
      }
      else if (g_trackFleetMode == TrackType.FOCUSED) {
        // Center and zoom map on fleet
        const fleetCenter = g_fleet.centerCoordinates;
        let extentGeometry = fromExtent(g_fleet.extent);
        extentGeometry.scale(1.2);
        g_baseMap.getView().fit(extentGeometry);
        g_fleetCenterMarker.setCoordinates(fleetCenter);
      }
    }
    else {
      // End of race for this boat
      if (boat.started && g_timeStamp >= boat.maxTimeStamp) {
        // Make sure that last point is displayed then stop the boat
        const endCoordinates = boat.getEndPosition();
        if (endCoordinates) {
          boat.setCoordinates(endCoordinates); // update boat position
          boat.drag.addPoint(endCoordinates); // add point to boat line
          boat.display();
          boat.drag.display();
        }
        boat.started = false;
      }
    }
    if (boat.started) {
      boat.display();
      boat.drag.display();
    }

    if (g_timeStamp <= boat.maxTimeStamp) {
      // End of trace reached for this boat
      g_fleet.isSailing = true;
    }
    else {
      boat.started = false;
    }
  })

  // loop over disabled boats for updating their drags
  g_fleet.disabledBoatsMap.forEach(boat => {
    // fetch boat position at new timestamp
    const newCoordinates = boat.getPosition(g_timeStamp);
    if (newCoordinates) {
      boat.setCoordinates(newCoordinates); // update boat position
      boat.drag.addPoint(newCoordinates); // add point to boat line
    }
  })

  if (!g_fleet.isPaused) {
    // increase timestamp for the next call
    g_timeStamp = g_timeStamp + g_fleetSpeedFactor.value * 1000;
  }

  if (g_fleetCtrl && !g_fleet.isSailing && g_fleet.size) {
    // All boats tripped back home ==> Get ready for next start
    g_timeStamp = raceStartTimestamp;
    g_fleet.reset();
    g_fleetCtrl.reset();
    g_boatsLayer.un('postrender', moveBoats);
    // zoomKludge(false);
  }
  // tell OpenLayers to continue the postrender animation
  g_baseMap.render();
}

function startAnimation() {
  g_fleet.isPaused = false;
  // zoomKludge(true);
  if (g_trackFleetMode != TrackType.NONE) g_fleetCenterMarker.show();

  g_boatsLayer.on('postrender', moveBoats);
  g_baseMap.render();
}

function pauseAnimation() {
  g_fleet.isPaused = true;
}

function resetAnimation() {
  g_boatsLayer.un('postrender', moveBoats);
  // zoomKludge(false);
  if (g_trackFleetMode != TrackType.NONE) g_fleetCenterMarker.hide();
  clearBoatsLayer();
  pauseAnimation();
  g_timeStamp = raceStartTimestamp;
  g_fleet.reset();
}

function restartAnimation() {
  resetAnimation();
  startAnimation();
}

// * Read URL's parameters
function parseUrlParameters() {
  const url = window.location.href;
  const urlParameters = (url.indexOf('?')) ? (url.substring(url.indexOf('?') + 1)) : null;
  let teamList = null;

  if (urlParameters) {
    let params = urlParameters.split('&');
    params.forEach(param => {
      let tokenValuePair = param.split('=');
      if (tokenValuePair.length == 2) {
        if (tokenValuePair[0] == "teamlist") {
          teamList = tokenValuePair[1];
        }
      }
    })
  }

  if (teamList == null) {
    teamList = "defaultTeamList";
  }
  let teamListPath = new URL(`/public/data/${teamList}.json`, import.meta.url).href;

  return teamListPath;
}


function appInit() {
  const teamList = parseUrlParameters();
  loadTeamList(teamList);
  initializeMaps();
  initializeDocAndControls();
}


useGeographic();

window.onload = appInit;
