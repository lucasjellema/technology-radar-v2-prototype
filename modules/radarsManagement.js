export { launchRadarsManagementConfigurator , starterTemplate}
import { getViewpoint, getData, getState, publishRefreshRadar } from './data.js';
import { uuidv4, capitalize, getPropertyFromPropertyPath, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'
import { publishRadarEvent } from './radar.js';


const launchRadarsManagementConfigurator = () => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Management of Radars")
    document.getElementById("radarManagementConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    contentContainer.innerHTML = ''
    let html = ``
    html += `<h3>Create New Radar</h3>`
    html += `  
    <label for="newRadarTitle" >Title</label>
    <input type="text" id="newRadarTitle" title="Title of new Radar [Viewpoint]" size="90"></input>
    <br />
    <label for="newRatingTypeName" >Type of Rating - choose existing or define new one</label>
    <select id="ratingTypeSelect" > </select>
    <input type="text" id="newRatingTypeName" title="Name of new Rating Type" size="30"></input>
    <br /><br />

    <label for="newObjectTypeName" >Object Type (only relevant if a new Rating Type is indicated) - Choose existing or Define new one</label>
    <select id="objectTypeSelect" ></select>
    <input type="text" id="newObjectTypeName" title="Name of new Object Type" size="30"></input>
    <br/><br/><br/>
    `

    contentContainer.innerHTML = html
    const ratingTypesSelectArray = Object.keys(getData().model.ratingTypes).map((ratingTypeKey) => { return { label: getData().model.ratingTypes[ratingTypeKey].label, value: getData().model.ratingTypes[ratingTypeKey].name } })
    populateSelect("ratingTypeSelect", ratingTypesSelectArray, getViewpoint().ratingType?.name)   // data is array objects with two properties : label and value

    const objectTypesSelectArray = Object.keys(getData().model.objectTypes).map((objectTypeKey) => { return { label: getData().model.objectTypes[objectTypeKey].label, value: getData().model.objectTypes[objectTypeKey].name } })
    populateSelect("objectTypeSelect", objectTypesSelectArray, getViewpoint().ratingType?.objectType?.name)   // data is array objects with two properties : label and value

    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = ''
    buttonBar.innerHTML = `<input id="createNewRadar" type="button" value="Create Radar"></input>`
    document.getElementById("createNewRadar").addEventListener("click",
        (event) => {
            createNewRadar()
            publishRadarEvent({ type: "mainRadarConfigurator", tab: "datamodel" })


        })
}

const createNewRadar = () => {
    console.log(`create new radar viewpoint `)

    const radarTitle = getElementValue("newRadarTitle")
    const viewpoint = {
        id: uuidv4(), name: radarTitle, template: starterTemplate
        , propertyVisualMaps: { blip: {}, size: {}, sector: {}, ring: {}, shape: {}, color: {} }
        , blipDisplaySettings: {
            showImages: true,
            showShapes: true,
            showLabels: true, applyShapes: false,
            applySizes: true, applyColors: true, tagFilter: [],
            blipScaleFactor: 1
        }
        , blips: [], timestamp: Date.now()
    }
    const selectedRatingType = getElementValue("ratingTypeSelect")
    const ratingTypeName = getElementValue("newRatingTypeName")
    let ratingType
    if (ratingTypeName != null && ratingTypeName.length > 0) {
        // new rating type
        ratingType = {
            id: uuidv4(), name: ratingTypeName, label: ratingTypeName
            , properties: {
                scope: {
                    name: "scope",
                    label: "Scope",
                    type: "string",
                    description: "The scope or context to which the rating applies",
                    discrete: true,
                    context: true
                },
                author: {
                    name: "author",
                    label: "Author/Evaluator",
                    type: "string",
                    description: "The name of the person who made the judgement",
                    discrete: true,
                    context: true
                },
                timestamp: {
                    name: "timestamp",
                    label: "Time of Evaluation",
                    description: "When was this rating defined",
                    type: "time",
                    readOnly: true
                },
                comment: {
                    name: "comment",
                    label: "Comment/Rationale",
                    description: "Additional remark regarding this rating",
                    type: "text"
                }
            }
            , timestamp: Date.now()
        }
        getData().model.ratingTypes[ratingTypeName] = ratingType
        let objectType
        const selectedObjectType = getElementValue("objectTypeSelect")
        const objectTypeName = getElementValue("newObjectTypeName")
        if (objectTypeName != null && objectTypeName.length > 0) {
            //TODO create new objecttype
            objectType = {
                id: uuidv4(), name: objectTypeName, label: objectTypeName
                , properties: {
                    "label": {
                        "label": "Label",
                        "type": "string",
                        "displayLabel": true,
                        "name": "label"
                    },
                    "description": {
                        "label": "Description",
                        "type": "text",
                        "name": description
                    }
                }
                , timestamp: Date.now()
            }
            getData().model.objectTypes[objectTypeName] = objectType
        } else {
            if (selectedObjectType != "-1") {
                objectType = getData().model.objectTypes[selectedObjectType]
            } else { return } // not good - no object type selected or specified
        }
        ratingType.objectType = objectType
    } else {
        if (selectedRatingType != "-1") {
            ratingType = getData().model.ratingTypes[selectedRatingType]
        } else { return }
    }
    viewpoint.ratingType = ratingType
    getData().viewpoints.push(viewpoint)
    getState().currentViewpoint = getData().viewpoints.length - 1
    // getState().editType: "viewpoint"

}

const starterTemplate = {
    svg_id: "radarSVGContainer",
    width: 1450,
    height: 1100,
    topLayer: "rings",
    maxRingRadius: 450,
    sectorBoundariesExtended: true,
    ditMode: false,
    defaultFont: {
        color: "black",
        fontSize: "38px",
        fontFamily: "Arial, Helvetica",
        fontStyle: "italic",
        fontWeight: "bold"
    },
    title: {
        text: "New Radar",
        x: -700,
        y: -520,
        font: {
            fontSize: "34px",
            fontFamily: "Arial, Helvetica"
        }
    },
    backgroundImage: {},
    colors: {},
    ringsConfiguration: { rings: [] },
    sectorsConfiguration: { sectors: [] },
    shapesConfiguration: { shapes: [] },
    sizesConfiguration: { sizes: [] },
    colorsConfiguration: { colors: [] },
    blip: ""
}