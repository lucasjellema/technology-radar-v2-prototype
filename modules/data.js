export {
    initializeViewpointFromURL, initializeFiltersTagsFromURL, getDefaultSettingsBlip
    , setDefaultSettingsBlip, shuffleBlips, getConfiguration, getViewpoint, getData, getObjectById
    , createBlip, getObjectListOfOptions, getRatingListOfOptions,getRatingTypeForRatingTypeName, subscribeToRadarRefresh, getState, publishRefreshRadar
}
import { initializeTree } from './tree.js'

import { uuidv4, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, getRatingTypeProperties, findDisplayProperty, getDateTimeString } from './utils.js'

const datasetMap = {
    emerging: "./modules/emerging-technologies-dataset.json"
    , techradar: "./modules/technology-radar-dataset.json"
    , cab: "./modules/cab-technology-radar-dataset.json"
    , sample: "./modules/sampleData.json"
    , verkenning: "./modules/cab-verkenningen-radar-dataset.json"
    , amisdatamgt :"./modules/amis-data-management-technology-radar-dataset.json"
}

// INVOKED BEFORE DOWNLOAD (TODO: and before save to local storage)
// prepare dataset for deserialization; 
// replace blip.rating.{} with blip.rating.id
// make sure all ratings and objects exist under data.objects and data.ratings
// replace rating.object{} with string rating.object.id
// replace ratingType.objectType{} with string ratingType.ObjectType{name}
// replace viewpoint.ratingType{} with string viewpoint.ratingType{name}
// round blip x and y
const serialize = (originalData) => {
    const serializedData = JSON.parse(JSON.stringify(originalData))

    for (let i=0; i< Object.keys(serializedData.ratings).length;i++) {
        const rating= serializedData.ratings[Object.keys(serializedData.ratings)[i]]
        if  (!serializedData.objects.hasOwnProperty(rating.object.id)){  // save object in objects
            serializedData.objects[rating.object.id]= rating.object
        }
        let ratingTypeName = rating.ratingType
        if (typeof(ratingTypeName) == "object") ratingTypeName = ratingTypeName.name
        rating.ratingType =  ratingTypeName 
        rating.object = rating.object.id
    }

    for (let i=0; i< Object.keys(serializedData.objects).length;i++) {
        const object= serializedData.objects[Object.keys(serializedData.objects)[i]]
        object.objectType = object.objectType ?? serializedData.model.objectTypes[Object.keys(serializedData.model.objectTypes)[0]].name // TEMPORARY! every object should have its object type defined when created

    }

    serializedData.viewpoints.forEach((viewpoint) => {
        addUUIDtoBlips(viewpoint.blips) // probably unnecessary, should not harm
        viewpoint.blips.forEach((blip) => {
            if  (!serializedData.ratings.hasOwnProperty(blip.rating.id)){  // save rating in ratings
                serializedData.ratings[blip.rating.id]= blip.rating
            }
            blip.rating = blip.rating.id
            if (blip.x != null) blip.x= Math.round(blip.x)
            if (blip.y != null) blip.y= Math.round(blip.y)
        })
        if (typeof(viewpoint.ratingType)=="object"){
            serializedData.model.ratingTypes[viewpoint.ratingType.name] = viewpoint.ratingType // save ratingType in model.ratingTypes
            viewpoint.ratingType= viewpoint.ratingType.name
        }
        
    })     
        // go over all rating types and replace their objectType object with objectType name
        for (let i=0; i< Object.keys(serializedData.model.ratingTypes).length;i++) {
            const ratingType= serializedData.model.ratingTypes[Object.keys(serializedData.model.ratingTypes)[i]]
            if (typeof(ratingType.objectType)=="object") {
              ratingType.objectType = ratingType.objectType.name
            }
        }
    
        return serializedData
}

// INVOKED AFTER UPLOAD (TODO: and after load from local storage)
// prepare dataset from serialized format; assume that the set is fully self contained - all objects and ratings are in the data set
// replace blip.rating.id string with blip{rating} object
// replace rating.object (id string value) with object (reference) 
// replace ratingType.objectType (name as string) with ratingType.ObjectType (object reference)
// replace viewpoint.ratingType (name as string) with viewpoint.ratingType{} object reference
const deserialize = (originalData) => {
    const deserializedData = JSON.parse(JSON.stringify(originalData)) // create clone

    deserializedData.viewpoints.forEach((viewpoint) => {
        viewpoint.blips.forEach((blip) => {
            if (typeof (blip.rating) == "string") { // assume the rating is a reference to an UUID
                blip.rating = deserializedData.ratings[blip.rating] // possibly check getData() as well
            }
        })
        if (viewpoint.ratingType != null && typeof(viewpoint.ratingType)=="string"){
            viewpoint.ratingType=  deserializedData.model.ratingTypes[viewpoint.ratingType] 
        }
        
    })     
    for (let i=0; i< Object.keys(deserializedData.ratings).length;i++) {
        const rating= deserializedData.ratings[Object.keys(deserializedData.ratings)[i]]
        if (rating?.object != null && typeof(rating.object)=="string"){
            rating.object = deserializedData.objects[rating.object]
        }
     }

     for (let i=0; i< Object.keys(deserializedData.model.ratingTypes).length;i++) {
        const ratingType= deserializedData.model.ratingTypes[Object.keys(deserializedData.model.ratingTypes)[i]]
        if (typeof(ratingType.objectType)=="string") {
          ratingType.objectType = deserializedData.model.objectTypes[ratingType.objectType]
        }
    }

    
        return deserializedData
}


// some operations to improve data set
// - build data.objects from the nested objects in ratings and blips
// - build data.ratings from the nested ratings in blips
// - assign reference to data.ratings if blip.rating contains object with only ID
// - assign ID values if not already present in Object and Rating
// - define object type and rating type on objects and ratings respectively
// - ??? provide references to objects for name reference to ratingType, objectType etc. 
const normalizeDataSet = (dataset) => {
    dataset.objects = dataset.objects ?? {}
    dataset.ratings = dataset.ratings ?? {}
    for (let i=0; i< Object.keys(dataset.ratings).length;i++) {
        const rating= dataset.ratings[Object.keys(dataset.ratings)[i]]
        rating.object = dataset.objects[rating.object]
    }
    
    
    for (let i=0; i< Object.keys(dataset.model.ratingTypes).length;i++) {
        const ratingType= dataset.model.ratingTypes[Object.keys(dataset.model.ratingTypes)[i]]
        if (typeof(ratingType.objectType)=="string") {
          ratingType.objectType = dataset.model.objectTypes[ratingType.objectType]
        }
    }
    dataset.viewpoints.forEach((viewpoint) => {
        console.log(`${JSON.stringify(viewpoint.ratingType)}`)
        const objectType = viewpoint.ratingType.objectType
        viewpoint.blips.forEach((blip) => {
            if (typeof (blip.rating) == "string") { // assume the rating is a reference to an UUID
                blip.rating = dataset.ratings[blip.rating] // possibly check getData() as well
            } else { // add the rating and object referenced by the blip 
            dataset.objects[blip.rating.object.id] = blip.rating.object
            dataset.ratings[blip.rating.id] = blip.rating
            }
        })
        addUUIDtoBlips(viewpoint.blips)
      
    })
    return dataset
}

// load data from local file - URLS for files in datasetMap - referring to local files, pure JSON content
// as a next step: this data could also be loaded from URLs referring to external - internet resources that must be accessible from the user's browser
const loaddataset = async (datasetKey) => {
    console.log(`load dataset ${datasetKey} from ${datasetMap[datasetKey]}`)
    const data = await fetch(datasetMap[datasetKey])
        .then(response => {
            return response.json();
        })
    return normalizeDataSet(data)
}


const RADAR_INDEX_KEY = "RADAR-INDEX"

let freshTemplate =
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

    ;

let data = {
    model: {}
    , templates: [freshTemplate]
    , objects: {}
    , viewpoints: []

}

data = await loaddataset("sample")

// describes the current state for the radar application - not intrinsic qualities of the template
let state = {
    currentTemplate: 0,
    currentViewpoint: 0,
    selectedRing: null,
    selectedSector: null,
    editMode: true,
    editType: "viewpoint"  // template or viewpoint-configuration

}

const getDefaultSettingsBlip = () => {
    if (state.defaultSettings == null) {
        state.defaultSettings = { rating: { object: { label: "Default" } } }
    }
    return state.defaultSettings
}
const setDefaultSettingsBlip = (defaultBlip) => {
    state.defaultSettings = defaultBlip
}


const getData = () => {
    return data
}

const getConfiguration = () => {
    return state.editType == "template" ? data.templates[state.currentTemplate]
        : data.viewpoints[state.currentViewpoint]?.template
}

const getViewpoint = () => {
    return data.viewpoints[state.currentViewpoint]
}

const initializeViewpointFromURL = () => {
    const params = new URLSearchParams(window.location.search)
    const viewpointId = params.get('viewpoint')
    if (viewpointId != null) {
        // find viewpoint with id and when found - set currentViewpoint and edittype
        for (let i = 0; i < data.viewpoints.length; i++) {
            if (data.viewpoints[i].id == viewpointId) {
                state.currentViewpoint = i
                state.editType = "viewpoint"
            }
        }
    }
}

const initializeFiltersTagsFromURL = () => {
    const params = new URLSearchParams(window.location.search)
    const tagParam = params.get('tags')
    console.log(`tags ${tagParam}`)
    // default type = plus; if last character == ~ then type is minus, if *  then must
    if (tagParam != null && tagParam.length > 0) {
        if (getViewpoint().blipDisplaySettings.tagFilter == null || getViewpoint().blipDisplaySettings.tagFilter.length == 0) { getViewpoint().blipDisplaySettings.tagFilter = [] }
        const tags = tagParam.split(',')
        for (let i = 0; i < tags.length; i++) {
            let tag = tags[i]
            let type = "plus"
            if (tag.endsWith("~")) {
                tag = tag.slice(0, tag.length - 1)
                type = "minus"
            }
            if (tag.endsWith("*")) {
                tag = tag.slice(0, tag.length - 1)
                type = "must"
            }
            getViewpoint().blipDisplaySettings.tagFilter.push({ type: type, tag: tag })
        }
    }
}



const getState = () => {
    return state
}




const getFreshTemplate = () => {
    return freshTemplate
}

const initializeDatasetFromURL = async () => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('source') ?? "sample"
    console.log(`source ${source}`)
    // TODO load data from sourceURL
    const sourceURL = params.get('sourceURL')
    console.log(`sourceURL ${sourceURL}`)

    data = await loaddataset(source)
    // add uuid to objects and ratings - just to be sure
    data.viewpoints.forEach((viewpoint) => addUUIDtoBlips(viewpoint.blips))
    publishRefreshRadar()
}

initializeDatasetFromURL()
//let radarIndex = { templates: [{ title: encodeURI(config.title.text), description: "", lastupdate: "20210310T192400" }], objects: [] }

// TODO use default values for all properties as defined in the meta-model
// create blip from meta-data and from default blip
const createBlip = (objectId, objectNewLabel, ratingId = null) => {

    let rating = (ratingId != null && ratingId.length > 0)
        ? getRatingById(ratingId)
        : {
            id: uuidv4(),
            timestamp: Date.now(),
            pending: true
            , object: objectId != null
                ? getObjectById(objectId)
                : { id: uuidv4(), pending: true }
        }
    // TODO existing object and new rating, then set defaults on rating propertie
    if (ratingId == null || ratingId.length < 1) {
        let properties = getRatingTypeProperties(getViewpoint().ratingType, getData().model, objectId == null)

        for (let i = 0; i < properties.length; i++) {
            const property = properties[i]
            if (property.type == "string" || property.type == "text" || property.type == "url") {
                let value = getNestedPropertyValueFromObject(getState().defaultSettings?.rating, property.propertyPath)
                if (value == null) value = ""
                setNestedPropertyValueOnObject(rating, property.propertyPath, value)
            }
        }
        // set defaults on object and on rating properties
        if (objectId == null) {
            rating.object.label = objectNewLabel ?? "NEW" // TODO hardcoded object display property
            rating.object.tags = [] // TODO hardcoded reference to tags field; check all properties of type tags
        }
    }


    rating.timestamp = Date.now()
    // TODO: blip id set as uuid?
    let blip = { id: `${getViewpoint().blips.length}`, rating: rating, pending: true }
    return blip
}


const shuffleBlips = () => {
    console.log(`shuffleblips`)
    getViewpoint().blips.forEach((blip) => { blip.x = null; blip.y = null })
    publishRefreshRadar()
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

const getObjectById = (id) => {
    return getData()?.objects[id]
}

const getRatingById = (id) => {
    return getData()?.ratings[id]
}

const getRatingTypeForRatingTypeName = (ratingTypeOrName) => {
    let ratingType=ratingTypeOrName;
    if (typeof (ratingTypeOrName) == "string") {
        ratingType = getData().model?.ratingTypes[ratingTypeOrName]
    }
    return ratingType
}


const getObjectListOfOptions = (objectType = null) => {
    // create [{}] for object labels and id values data is array objects with two properties : label and value
    // note: only objects of the type that is used by the rating type 
    const objectsListofOptions = []
    let objectDisplayLabelProperty = "label" // TODO get display property for object type
    objectDisplayLabelProperty = findDisplayProperty(objectType.properties).name
    for (let i = 0; i < Object.keys(getData().objects).length; i++) {

        const object = data.objects[Object.keys(getData().objects)[i]]
        console.log(`object type = ${object.objectType}`)
        if (objectType == null || object.objectType == objectType.name) {
        objectsListofOptions.push({ label: object[objectDisplayLabelProperty], value: object.id }) 
        }
    }
    objectsListofOptions.sort((a, b) => a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1)

    return objectsListofOptions
}

const getRatingListOfOptions = (ratingType = null, objectId = null) => { // get all ratings of the indicated type (or all) that refer to object id (if specified)
    const ratingsListofOptions = []
    for (let i = 0; i < Object.keys(getData().ratings).length; i++) {
        const rating = data.ratings[Object.keys(getData().ratings)[i]]
        // TODO check on ratingType
        if (objectId == null || rating.object.id == objectId) {
            ratingsListofOptions.push({ label: `for scope ${rating["scope"]} by ${rating["author"]} on ${getDateTimeString(rating["timestamp"])}`, value: rating.id }) // TODO hardcoded proprty name for property identifying object
        }
    }

    return ratingsListofOptions


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
    download(`radar-data.json`, JSON.stringify(serialize(data)))
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

let uploadedData
//TODO support multiple files
async function handleUploadedFiles() {
    if (!this.files.length) {
        console.log(`no files selected`)
        //       fileList.innerHTML = "<p>No files selected!</p>";
    } else {

        const contents = await this.files[0].text()
        uploadedData = JSON.parse(contents)
        // initializeTree("filemodelTree", uploadedData, "upload", (uploadedData) => {

        //     console.log(`uploaded data has arrived ${JSON.stringify(uploadedData)}`)
        //     data.model = Object.assign(data.model, uploadedData.model)
        //     data.templates = data.templates.concat(uploadedData.templates)
        //     data.viewpoints = data.viewpoints.concat(uploadedData.viewpoints)
        //     // set id values on all ratings and objects that currently do not have them
        //     // probably temporary function until all data sets have id values
        //     // add uuid to objects and ratings - just to be sure
        //     data.viewpoints.forEach((viewpoint) => addUUIDtoBlips(viewpoint.blips))
        //     if (uploadedData.objects != null && uploadedData.objects.length > 0) {
        //         // merge the arrays of uploaded objects in with the existing objects per object type
        //         for (let i = 0; i < Object.keys(uploadedData.objects).length; i++) {
        //             data.objects[Object.keys(uploadedData.objects)[i]] =
        //                 uploadedData.objects[Object.keys(uploadedData.objects)[i]].
        //                     concat(data.objects[Object.keys(uploadedData.objects)[i]])

        //             data.objects[Object.keys(uploadedData.objects)[i]].forEach((object) => { if (object.id == null) { object.id = uuidv4() } })
        //         }
        //     }

        //     publishRefreshRadar()
        // }, data.model)
        // TODO serialize data
        const deserializedData = deserialize (uploadedData)
        data = deserializedData
        
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
    if (getState().editType == "template") {
        const clone = JSON.parse(JSON.stringify(getConfiguration()))
        clone.title.text = `CLONE of ${clone.title.text}`
        data.templates.push(clone)
        state.currentTemplate = data.templates.length - 1
        publishRefreshRadar()
    }
}

const createViewpointFromTemplate = () => {
    if (getState().editType == "template") {

        const newViewpoint = {}
        newViewpoint.template = JSON.parse(JSON.stringify(getConfiguration()))
        newViewpoint.name = `Created as clone of ${getConfiguration().title.text}`
        newViewpoint.blips = []
        newViewpoint.ratingType = {
            objectType: {
                name: "technology",
                label: "Technology",
                properties:
                {
                    label: {
                        label: "Label",
                        type: "string"
                        , defaultValue: "Some Technology"
                        , displayLabel: true // this property should be used to derive the label for this objectType
                    }, description: {
                        label: "Description",
                        type: "string"
                    }, homepage: {
                        label: "Homepage",
                        type: "url"
                    }, image: {
                        label: "Logo",
                        type: "image"
                    }, vendor: {
                        label: "Vendor",
                        type: "string",
                        discrete: true
                    }, tags: {
                        label: "Tags",
                        type: "tags",
                    }, offering: {
                        label: "Offering",
                        type: "string", allowableValues: [{ value: "oss", label: "Open Source Software" }
                            , { value: "commercial", label: "Commercial Software" }, { value: "other", label: "Other type of offering" }
                        ]
                        , defaultValue: "oss"
                    },
                    "category": {
                        label: "Category",
                        type: "string", allowableValues: [{ value: "database", label: "Data Platform" }
                            , { value: "language", label: "Languages & Frameworks" }, { value: "infrastructure", label: "Infrastructure" }, { value: "concepts", label: "Concepts & Methodology" }
                        ] //
                        , defaultValue: "infrastructure"
                    }
                }
            }, properties:
            {
                ambition: {
                    label: "Ambition",
                    description: "The current outlook or intent regarding this technology", defaultValue: "identified"
                    , allowableValues: [{ value: "identified", label: "Identified" }, { value: "hold", label: "Hold" }, { value: "assess", label: "Assess" }, { value: "trial", label: "Try Out/PoC" }, { value: "adopt", label: "Adopt" }]
                    , defaultValue: "identified"
                },
                magnitude: {
                    label: "Magnitude/Relevance",
                    description: "The relative size of the technology (in terms of investment, people involved, percentage of revenue)", defaultValue: "medium"
                    , allowableValues: [{ value: "tiny", label: "Tiny or Niche" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]
                },
                experience: {
                    label: "Experience/Maturity",
                    description: "The relative time this technology has been around (for us)", defaultValue: "medium"
                    , allowableValues: [{ value: "short", label: "Fresh" }, { value: "medium", label: "Intermediate" }, { value: "long", label: "Very Mature" }]
                }

            }
        }
        // define propertyViewMaps
        newViewpoint.propertyVisualMaps = {
            blip: { label: "object.label", image: "object.image" },
            size: {
                property: "magnitude", valueMap: { "tiny": 0, "medium": 1, "large": 2 } // the rating magnitude property drives the size; the values of magnitude are mapped to values for size
            }
            , sector: {
                property: "object.category", valueMap: { "database": 0, "language": 3, "infrastructure": 2, "concepts": 4, "libraries": 1 } // the object category property drives the sector; the values of category are mapped to values for sector
            }

            , ring: {
                property: "ambition", valueMap: { "hold": 0, "assess": 1, "adopt": 3, "trial": 2 } // the rating ambition property drives the ring; the values of ambition are mapped to values for ring
            }
            , shape: {
                property: "object.offering", valueMap: { "oss": 4, "commercial": 6, "other": 5 }
            }
            , color: { property: "experience", valueMap: { "short": 0, "long": 1, "intermediate": 3, "other": 2 } }
        }

        data.viewpoints.push(newViewpoint)
        state.currentViewpoint = data.viewpoints.length - 1
        publishRefreshRadar()
    }
}

const cloneViewpoint = () => {
    if (getState().editType == "template") {
        const clone = JSON.parse(JSON.stringify(getConfiguration()))
        clone.title.text = `CLONE of ${clone.title.text}`
        data.templates.push(clone)
        state.currentTemplate = data.templates.length - 1
        publishRefreshRadar()
    }
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
        state.editType = "template"

    } else {
        state.currentViewpoint = event.target.value - data.templates.length
        state.editType = "viewpoint"

    }
    publishRefreshRadar()
}

const populateTemplateSelector = () => {
    const selector = document.getElementById('templateSelector')
    // remove current options beyond 0
    for (var i = 0; i < selector.options.length + 3; i++) {
        selector.remove(1)
    }
    //  if (getState().editType == "template") {
    // add options based on data.templates[].title.text
    for (var i = 0; i < data.templates.length; i++) {
        var option = document.createElement("option");

        option.value = i;
        option.text = `Template: ${data.templates[i].title.text}`;
        option.selected = i == state.currentTemplate && state.editType == "template"
        selector.add(option, null);
    }
    //}
    for (var i = 0; i < data.viewpoints.length; i++) {
        var option = document.createElement("option");

        option.value = i + data.templates.length;
        option.text = `Viewpoint: ${data.viewpoints[i].name}`;
        option.selected = i == state.currentViewpoint && state.editType == "viewpoint"
        selector.add(option, null);
    }
}


document.getElementById('save').addEventListener("click", saveDataToLocalStorage);
document.getElementById('load').addEventListener("click", loadDataFromLocalStore);
document.getElementById('download').addEventListener("click", downloadRadarData);
document.getElementById('uploadRadarDatafile').addEventListener("click", uploadRadarData);
document.getElementById('newTemplate').addEventListener("click", createNewTemplate);
document.getElementById('cloneTemplate').addEventListener("click", cloneTemplate);
document.getElementById('resetTemplate').addEventListener("click", resetCurrentTemplate);
document.getElementById('templateSelector').addEventListener("change", handleTemplateSelection);
document.getElementById('cloneViewpoint').addEventListener("click", cloneViewpoint);
document.getElementById('createViewpoint').addEventListener("click", createViewpointFromTemplate);

// mini event bus for the Refresh Radar Event
const subscribers = []
const subscribeToRadarRefresh = (subscriber) => { subscribers.push(subscriber) }
const publishRefreshRadar = () => { subscribers.forEach((subscriber) => { subscriber() }) }

initializeUpload()
subscribeToRadarRefresh(populateTemplateSelector)
populateTemplateSelector()

function addUUIDtoBlips(blips) {
    blips.forEach((blip) => {
        if (blip.rating?.id == null) { blip.rating.id = uuidv4() };
        if (blip.rating?.object.id == null) { blip.rating.object.id = uuidv4() }
    })
}

