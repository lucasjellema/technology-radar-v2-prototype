export { createRadarFromCSV }
import { getViewpoint, getData, getState, download, publishRefreshRadar, populateTemplateSelector, createObject, createRating } from './data.js';
import { getUniqueFieldValues, getListOfSupportedShapes, capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, toggleShowHideElement, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement, uuidv4, populateDatalistFromValueSet } from './utils.js'
import { starterTemplate } from './radarsManagement.js'
import { reconfigureSectorsFromPropertyPath } from './sectorConfigurator.js'
import { reconfigureRingsFromPropertyPath } from './ringConfigurator.js'
import { reconfigureShapesFromPropertyPath } from './shapeConfigurator.js'
import { reconfigureColorsFromPropertyPath } from './colorConfigurator.js'
import { reconfigureSizesFromPropertyPath } from './sizeConfigurator.js'


const createRadarFromCSV = (contents) => {
    const objects = d3.csvParse(contents)
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "CSV to Radar Wizard")
    document.getElementById("fileConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `<h3>Create New Radar</h3>`
    html += `  
        <label for="newRadarTitle" >Title</label>
        <input type="text" id="newRadarTitle" title="Title of new Radar [Viewpoint]" size="90"></input>
        <br />
        <label for="newObjectTypeName" >Name for new Object Type</label>
        <input type="text" id="newObjectTypeName" title="Name of new Object Type" size="30"></input>
        <br/><br/>
        <label for="newRatingTypeName" >Name for Rating Type</label>
        <input type="text" id="newRatingTypeName" title="Name of new Rating Type" size="30"></input>
        <br /><br />
    `


    html += `<h4>Quick File Summary</h4>
    <p># of records in CSV document: ${objects.length}</p>
    <h3>Select CSV Fields to Build the Radar On</h3>
    `

    html += `<table><tr><th>CSV Field</th><th>Values from CSV</th><th>Name for Radar Property</th>
    <th>Include?</th>
    <th>Object or Rating?</th>
    <th>Display?</th>
    <th>Discrete?</th>
    <th>Sector?</th>
    <th>Ring?</th>
    <th>Shape?</th>
    <th>Color?</th>
    <th>Size?</th>
    <th></th>
    </tr>`

    for (let i = 0; i < objects.columns.length; i++) {
        let uniqueValues = getUniqueFieldValues(objects, objects.columns[i])

        let values = Array.from(uniqueValues)
            .reduce((valueSample, value, index) => {
                return valueSample + (index > 0 ? ", " : "") + value
            }
                , "")
        html += `<tr><td><span id="field${i}">${objects.columns[i]}</span></td>
    <td><span id="values${i}" title="${values}">${uniqueValues.size} different values from CSV</span></td>
    <td><input id="radarProperty${i}" value="${objects.columns[i]}" ></input></td>
    <td><input type="checkbox" id="include${i}" checked></input></td>
    <td><input type="radio" id="object${i}" name="objectOrRating${i}" value="object" checked>  Object?</input>
    <input type="radio" id="rating${i}" name="objectOrRating${i}" value="rating">  Rating?</input>
     </td>
     <td><input type="checkbox" id="display${i}" ></input></td>
     <td><input type="checkbox" id="discrete${i}" ></input></td>
     <td><input type="checkbox" id="sector${i}" ></input></td>
    <td><input type="checkbox" id="ring${i}" ></input></td>
    <td><input type="checkbox" id="shape${i}" ></input></td>
    <td><input type="checkbox" id="color${i}" ></input></td>
    <td><input type="checkbox" id="size${i}" ></input></td>
    </tr>`

    }

    html += `</table><br />`
    html += `    <input type="button" id="addProperty" name="process" value="Add Property (not from CSV file)"></input>
    `
    contentContainer.innerHTML = `${html}<br /> <br /><br /><br /><br />`


    // identify the discrete properties
    // - < 10 different values; < 5% null values
    let visualDimensionCounter = 0
    const visualDimensions = ["sector", "ring", "shape", "color", "size"]
    for (let i = 0; i < objects.columns.length; i++) {
        let uniqueValues = getUniqueFieldValues(objects, objects.columns[i])
        if (uniqueValues.size < 10) {
            document.getElementById(`discrete${i}`).checked = true
            if (visualDimensionCounter < visualDimensions.length) {
                document.getElementById(`${visualDimensions[visualDimensionCounter++]}${i}`).checked = true
            }
        }
    }



    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `
    <input type="button" id="createRadarFromCSV" name="process" value="Create Radar from CSV as Configured"></input>
    `
    document.getElementById("createRadarFromCSV").addEventListener("click", () => {
        // gather all data to create the new radar
        const newRadar = {}
        newRadar.title = getElementValue("newRadarTitle")
        newRadar.newObjectTypeName = getElementValue("newObjectTypeName")
        newRadar.newRatingTypeName = getElementValue("newRatingTypeName")
        newRadar.objectTypeProperties = []
        newRadar.ratingTypeProperties = []

        for (let i = 0; i < objects.columns.length; i++) {
            let uniqueValues = getUniqueFieldValues(objects, objects.columns[i])
            if (document.getElementById(`include${i}`).checked) {
                const newProperty = {
                    csvField: objects.columns[i]
                    , name: getElementValue(`radarProperty${i}`)
                }
                if (document.getElementById(`discrete${i}`).checked) {
                    newProperty.uniqueValues = uniqueValues
                    newProperty.discrete = true
                }
                newProperty.display = document.getElementById(`display${i}`).checked
                newProperty.sector = document.getElementById(`sector${i}`).checked
                newProperty.ring = document.getElementById(`ring${i}`).checked
                newProperty.shape = document.getElementById(`shape${i}`).checked
                newProperty.color = document.getElementById(`color${i}`).checked
                newProperty.size = document.getElementById(`size${i}`).checked

                if (document.getElementById(`object${i}`).checked) {
                    //
                    newRadar.objectTypeProperties.push(newProperty)
                } else if (document.getElementById(`rating${i}`).checked) {
                    newRadar.ratingTypeProperties.push(newProperty)
                    //
                }

            }

        }

        generateRadarFromCSV(objects, newRadar)
    })

}

const generateRadarFromCSV = (objects, newRadar) => {
    console.log(`create radar from CSV with ${objects.length} records with ${JSON.stringify(newRadar)}`)

    // create objectType
    const objectType = createObjectType(newRadar);

    // create ratingType
    const ratingType = createRatingType(newRadar, objectType)
    // create objects and ratings - each CSV row results in one object and one rating
    const newlyCreatedRatings = generateObjectsAndRatings(objects, objectType, newRadar, ratingType);
    // create viewpoint with rating type
    const viewpoint = {
        id: uuidv4(), name: newRadar.title, template: starterTemplate, ratingType: ratingType
        , propertyVisualMaps: { blip: {}, size: {}, sector: {}, ring: {}, shape: {}, color: {} }
        , blipDisplaySettings: {
            showImages: false,
            showShapes: true,
            showLabels: true, applyShapes: false,
            applySizes: true, applyColors: true, tagFilter: [],
            blipScaleFactor: 1
        }
        , blips: [], timestamp: Date.now()
    }
    viewpoint.template.title.text =newRadar.title
    let propertyPath
    propertyPath = getPropertyPathForVisualDimension(newRadar, "display");
    viewpoint.propertyVisualMaps.blip.label = propertyPath
    // generate blips for newly created ratings
    for (let i = 0; i < newlyCreatedRatings.length; i++) {
        viewpoint.blips.push({ id: `${uuidv4()}`, rating: newlyCreatedRatings[i] })
    }

    getData().viewpoints.push(viewpoint)
    getState().currentViewpoint = getData().viewpoints.length - 1

    // create template: sectors, rings, ...
    // find property path for (first) property marked with property.sector == true
    
    propertyPath = getPropertyPathForVisualDimension(newRadar, "sector");
    if (propertyPath != null && propertyPath.length > 1) {
        reconfigureSectorsFromPropertyPath(propertyPath, viewpoint)
    }
    propertyPath = getPropertyPathForVisualDimension(newRadar, "ring");
    if (propertyPath != null && propertyPath.length > 1) {
        reconfigureRingsFromPropertyPath(propertyPath, viewpoint)
    }
    propertyPath = getPropertyPathForVisualDimension(newRadar, "shape");
    if (propertyPath != null && propertyPath.length > 1) {
        reconfigureShapesFromPropertyPath(propertyPath, viewpoint)
        viewpoint.template.shapesConfiguration.label=`${propertyPath}`
    }
    propertyPath = getPropertyPathForVisualDimension(newRadar, "color");
    if (propertyPath != null && propertyPath.length > 1) {
        reconfigureColorsFromPropertyPath(propertyPath, viewpoint)
        viewpoint.template.colorsConfiguration.label=`${propertyPath}`
    }

    propertyPath = getPropertyPathForVisualDimension(newRadar, "size");
    if (propertyPath != null && propertyPath.length > 1) {
        reconfigureSizesFromPropertyPath(propertyPath, viewpoint)
        viewpoint.template.sizesConfiguration.label=`${propertyPath}`
    }
    // create propertyVisualMap

    // show newly generated radar
    // NOTE similar to createNewRadar in radarsManagement

    // NOT NECESSARY?  publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()

}

function getPropertyPathForVisualDimension(newRadar, visualDimension) {
    let propertyPath
    let visualProperty = newRadar.objectTypeProperties.filter((property) => property[visualDimension] == true);
    if (visualProperty.length > 0) { propertyPath = `object.${visualProperty[0].name}`; }
    else {
        visualProperty = newRadar.ratingTypeProperties.filter((property) => property[visualDimension] == true);
        if (visualProperty.length > 0) { propertyPath = `${visualProperty[0].name}`; }
        else { console.log(`NO SECTOR PROPERTY`); }
    }
    return propertyPath;
}

function generateObjectsAndRatings(objects, objectType, newRadar, ratingType) {
    const newlyCreatedRatings = [];
    objects.forEach((row) => {
        const object = {
            objectType: objectType, id: uuidv4(),
            timestamp: Date.now()
        };
        for (let i = 0; i < newRadar.objectTypeProperties.length; i++) {
            object[newRadar.objectTypeProperties[i]["name"]] = row[newRadar.objectTypeProperties[i].csvField];
        }

        getData().objects[object.id] = object;


        const rating = {
            ratingType: ratingType,
            id: uuidv4(),
            timestamp: Date.now(),
            object: object
        };
        for (let i = 0; i < newRadar.ratingTypeProperties.length; i++) {
            rating[newRadar.ratingTypeProperties[i]["name"]] = row[newRadar.ratingTypeProperties[i].csvField];
        }

        getData().ratings[rating.id] = rating;
        newlyCreatedRatings.push(rating);

    });
    return newlyCreatedRatings
}

function createObjectType(newRadar) {
    const objectType = {
        id: uuidv4(), name: newRadar.newObjectTypeName, label: newRadar.newObjectTypeName,
        properties: {},
        timestamp: Date.now()
    };
    // create objectType properties 
    for (let i = 0; i < newRadar.objectTypeProperties.length; i++) {
        const newPropertyType = newRadar.objectTypeProperties[i]
        const newProperty = { name: newPropertyType.name, label: newPropertyType.name, "type": "string" }
        if (newPropertyType.discrete) {
            newProperty.discrete = true
        }
        if (newPropertyType.display) {
            newProperty.displayLabel = true
        }
        objectType.properties[newProperty.name] = newProperty
    }
    getData().model.objectTypes[objectType.name] = objectType;
    return objectType
}


function createRatingType(newRadar, objectType) {
    const ratingType = {
        id: uuidv4(), name: newRadar.newRatingTypeName, label: newRadar.newRatingTypeName, objectType: objectType,
        properties: {
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

        },
        timestamp: Date.now()
    };
    // create objectType properties 
    for (let i = 0; i < newRadar.ratingTypeProperties.length; i++) {
        const newPropertyType = newRadar.ratingTypeProperties[i]
        const newProperty = { name: newPropertyType.name, label: newPropertyType.name, "type": "string" }
        if (newPropertyType.discrete) {
            newProperty.discrete = true
        }
        if (newPropertyType.display) {
            newProperty.displayLabel = true
        }

        ratingType.properties[newProperty.name] = newProperty
    }
    getData().model.ratingTypes[ratingType.name] = ratingType;
    return ratingType
}