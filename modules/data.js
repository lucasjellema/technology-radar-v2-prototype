export { getConfiguration, getViewpoint, createBlip, subscribeToRadarRefresh, getState, publishRefreshRadar }
import { getSampleData } from './sampleData.js'

const RADAR_INDEX_KEY = "RADAR-INDEX"

let data = {
    templates: []
    , objects: []
    , viewpoints: []

}

// describes the current state for the radar application - not intrinsic qualities of the template
let state = {
    currentTemplate: 0, 
    currentViewpoint : 0,
    selectedRing: 1,
    selectedSector: 2,
    editMode: true,
    editType: "viewpoint"  // template or viewpoint-configuration

}

const getConfiguration = () => {
    return state.editType=="template"? data.templates[state.currentTemplate]:data.viewpoints[state.currentViewpoint].template
}

const getViewpoint = () => {
    return data.viewpoints[state.currentViewpoint] 
}



const getState = () => {
    return state
}

// load index RADAR-INDEX from LocalStorage
// in RADAR_INDEX are references to other documents
// { viewpoints : [{title, description, lastupdate}, {title}] 
// , objects : [ "technologies", "AMIS Staff"]
// }
// if it does not exist, create a new radar index
const freshTemplate =
{
    svg_id: "radarSVGContainer",
    width: 1450,
    height: 1000,
    topLayer: "sectors", // rings or sectors
    selectedRing: 0,
    selectedSector: 0,
    rotation: 0,
    maxRingRadius: 450,
    sectorBoundariesExtended: false,
    editMode: true,
    defaultFont: { color: "black", fontSize: "38px", fontFamily: "Arial, Helvetica", fontStyle: "normal", fontWeight: "normal" }, // fontStyle: oblique, normal, italic; fontWeight: normal, bold, bolder, lighter; 100 .. 900
    title: { text: "Technology Radar", x: -700, y: -470, font: { fontSize: "34px" } },

    colors: {
        background: "#fef",
        grid: "#bbb",
        inactive: "#ddd"
    },
    ringConfiguration: {
        outsideRingsAllowed: true,
        font: { color: "purple" },
        rings: [ // rings are defined from outside going in; the first one is the widest
            { label: "Ring One", width: 0.3 },
            { label: "Ring Two", width: 0.5 },
        ]
    },
    sectorConfiguration: {
        outsideSectorsAllowed: true,
        font: { fontSize: "32px", fontFamily: "Arial, Helvetica" }
        , sectors: [ // starting from positive X-axis, listed anti-clockwise
            { label: "Sector 1", angle: 0.7 },
            { label: "Sector 2", angle: 0.3 },
        ]
    },
    colorsConfiguration: {
        colors: [
            { label: "Unassigned", color: "blue", enabled: true },
            { label: "Unassigned", color: "green", enabled: false },
            { label: "Unassigned", color: "gray", enabled: false },
            { label: "Unassigned", color: "red", enabled: false },
            { label: "Unassigned", color: "white" }
        ]
    },
    sizesConfiguration: {
        sizes: [
            { label: "Regular", size: 1, enabled: true },
            { label: "Regular", size: 2, enabled: false },
            { label: "Regular", size: 3, enabled: true },
        ]
    },
    shapesConfiguration: {
        shapes: [
            { label: "Unassigned", shape: "square" }
            , { label: "Unassigend", shape: "diamond" }
            , { label: "Unassigend", shape: "rectangleHorizontal", enabled: false }
            , { label: "Unassigned", shape: "circle", enabled: false }
        ]
    }
}



const getFreshTemplate = () => {
    return freshTemplate
}

data = getSampleData()
let config = data.templates[0]
let radarIndex = { templates: [{ title: encodeURI(config.title.text), description: "", lastupdate: "20210310T192400" }], objects: [] }

// TODO use default values for all properties as defined in the meta-model
const createBlip = () => {
    let newRating = {
        timestamp: Date.now()
        , scope: "Conclusion"
        , comment: "no comment yet"
        , author: `system generated at ${Date.now()}`
        , object: {label: `NEW${getViewpoint().blips.length} ${Date.now()}`, category: "infrastructure", homepage:null, image:null}
        , magnitude :"medium"
        , ambition :"trial"
    }
    let blip = { id: `${getViewpoint().blips.length}`, rating: newRating }
    let blipCount = getViewpoint().blips.push(blip)
    console.log(`after creating the blip the count is now ${blipCount} == ${getViewpoint().blips.length}`)
    return blip

}

const saveDataToLocalStorage = () => {
    localStorage.setItem(RADAR_INDEX_KEY, JSON.stringify(data));
    // console.log(`${JSON.stringify(getConfiguration().colorsConfiguration)}`)
    // // for every viewpoint, save viewpoint document
    // // TODO save project? save individual templates and object sets?
    // localStorage.removeItem(encodeURI(getConfiguration().title.text))
    // localStorage.setItem(encodeURI(getConfiguration().title.text), JSON.stringify(data));
}

const loadDataFromLocalStore = () => {
    //    radarIndex = JSON.parse(localStorage[RADAR_INDEX_KEY])
    // for every viewpoint in the index, load document
    //    data = JSON.parse(localStorage[radarIndex.templates[0].title])
    data = JSON.parse(localStorage[RADAR_INDEX_KEY])

    publishRefreshRadar()
}

// source: https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

const downloadRadarData = function () {
    download(`radar-data.json`, JSON.stringify(data))
}

const uploadRadarData = () => {
    if (fileElem) {
        fileElem.click();
    }
}
let fileElem
function initializeUpload() {
    if (fileElem == null) {
        fileElem = document.getElementById("fileElem");
        fileElem.addEventListener("change", handleUploadedFiles, false);
    }
}


//TODO support multiple filers, support add/merge instead of replace of files
async function handleUploadedFiles() {
    if (!this.files.length) {
        console.log(`no files selected`)
        //       fileList.innerHTML = "<p>No files selected!</p>";
    } else {

        const contents = await this.files[0].text()
        data = JSON.parse(contents)
        publishRefreshRadar()

    }
}

const createNewTemplate = () => {
    console.log(`create new template`)
    const newTemplate = JSON.parse(JSON.stringify(getFreshTemplate()))
    newTemplate.title.text = `NEW template`
    data.templates.push(newTemplate)
    state.currentTemplate = data.templates.length - 1
    publishRefreshRadar()
}

const cloneTemplate = () => {
    const clone = JSON.parse(JSON.stringify(getConfiguration()))
    clone.title.text = `CLONE of ${clone.title.text}`
    data.templates.push(clone)
    state.currentTemplate = data.templates.length - 1
    publishRefreshRadar()
}

const resetTemplate = (template) => {
    template.colors.background = "#FFF"
    // all sectors same angle, all rings same width = adding to 1
    for (let i = 0; i < template.ringConfiguration.rings.length; i++) {
        const ring = template.ringConfiguration.rings[i]
        ring.width = 1 / template.ringConfiguration.rings.length
        ring.backgroundImage = {}
        ring.backgroundColor = "white"
    }

    for (let i = 0; i < template.sectorConfiguration.sectors.length; i++) {
        const sector = template.sectorConfiguration.sectors[i]
        sector.angle = 1 / template.sectorConfiguration.sectors.length
        sector.backgroundImage = {}
        sector.backgroundColor = "white"
        sector.outerringBackgroundColor = "#FFF"
    }
}

const resetCurrentTemplate = () => {
    resetTemplate(getConfiguration())
    publishRefreshRadar()
}

const handleTemplateSelection = (event) => {
    console.log(`template selection ${event.target.value} `)
    // ${data.templates[event.target.value].title.text}`)
    //const selectedOption = document.getElementById('templateSelector').options[event.target.value]
    if (event.target.value < data.templates.length) {
        state.currentTemplate = event.target.value
        state.editType="template"
    
    } else {
        state.currentViewpoint = event.target.value - data.templates.length
        state.editType="viewpoint"
    
    }
    publishRefreshRadar()
}

const populateTemplateSelector = () => {
    const selector = document.getElementById('templateSelector')
    // remove current options beyond 0
    for (var i = 0; i < selector.options.length + 3; i++) {
        selector.remove(1)
    }

    // add options based on data.templates[].title.text
    for (var i = 0; i < data.templates.length; i++) {
        var option = document.createElement("option");

        option.value = i;
        option.text = `Template: ${data.templates[i].title.text}`;
        option.selected = i == state.currentTemplate && state.editType=="template"
        selector.add(option, null);
    }
    // also add the viewpoints
    for (var i = 0; i < data.viewpoints.length; i++) {
        var option = document.createElement("option");

        option.value = i + data.templates.length;
        option.text = `Viewpoint: ${data.viewpoints[i].name}`;
        option.selected = i == state.currentViewpoint && state.editType=="viewpoint"
        selector.add(option, null);
    }
}



document.getElementById('save').addEventListener("click", saveDataToLocalStorage);
document.getElementById('load').addEventListener("click", loadDataFromLocalStore);
document.getElementById('download').addEventListener("click", downloadRadarData);
document.getElementById('upload').addEventListener("click", uploadRadarData);
document.getElementById('newTemplate').addEventListener("click", createNewTemplate);
document.getElementById('cloneTemplate').addEventListener("click", cloneTemplate);
document.getElementById('resetTemplate').addEventListener("click", resetCurrentTemplate);
document.getElementById('templateSelector').addEventListener("change", handleTemplateSelection);

// mini event bus for the Refresh Radar Event
const subscribers = []
const subscribeToRadarRefresh = (subscriber) => { subscribers.push(subscriber) }
const publishRefreshRadar = () => { subscribers.forEach((subscriber) => { subscriber() }) }

initializeUpload()
subscribeToRadarRefresh(populateTemplateSelector)
populateTemplateSelector()

