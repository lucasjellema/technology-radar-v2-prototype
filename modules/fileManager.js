export { launchFileManager }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, getState, download, downloadRadarData, publishRefreshRadar, populateTemplateSelector, createObject, createRating } from './data.js';
import { launchShapeEditor } from './shapeEditing.js'
import { unselectAllTabs, assignBlipsToSegments, findSectorForRating, getUniqueFieldValues, filterBlip, getListOfSupportedShapes, capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, toggleShowHideElement, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement, uuidv4, populateDatalistFromValueSet } from './utils.js'
import { handleUploadedCSVFiles, exportCSV } from './csvFileManager.js'
import { createRadarFromCSV } from './csvWizard.js'
import { calculateDerivedProperties } from './derivedProperties.js';


const launchFileManager = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "File Management")

    unselectAllTabs()
    document.getElementById("fileConfigurationTab").classList.add("selectedTab")

    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `<input type="button" id="uploadFile" name="upload" value="Upload Radar File"></input>
    <br />
    <br />
    <input type="button" id="exportRadarFile" name="exportRadar" value="Export Radar File"></input>
    <br />
    <br />
    <input type="button" id="uploadCSVFile" name="upload" value="Upload CSV File to Merge into Radar">
    <br />
    <br />
    <input type="button" id="exportCSVFile" name="export" value="Export CSV File from Radar">
    <br />
    <br />
    <input type="button" id="CSVtoRadarWizard" name="csvWizard" value="Create New Radar from CSV file">
    <input type="file" id="uploadfileElem" multiple accept="application/json,text/*" style="display:none">
     `


    contentContainer.innerHTML = html

    let fileType = "radar"

    let fileElem = document.getElementById("uploadfileElem");
    fileElem.addEventListener("change", async (e) => {
        if (!e.target.files.length) {
            console.log(`no files selected`)
        } else {
            const contents = await e.target.files[0].text()
            if (fileType == "radar") {
                handleUploadedFiles(contents)
            }
            else if (fileType == "csv") {
                handleUploadedCSVFiles(contents)
            }
            else if (fileType == "csvwizard") {
                createRadarFromCSV(contents)
            }
        }
    }
        , false);

    document.getElementById('uploadFile').addEventListener("click", () => {
        fileType = "radar"
        if (fileElem) { fileElem.click() }
    });

    document.getElementById('uploadCSVFile').addEventListener("click", () => {
        fileType = "csv"
        if (fileElem) { fileElem.click() }
    });
    document.getElementById('CSVtoRadarWizard').addEventListener("click", () => {
        fileType = "csvwizard"
        if (fileElem) { fileElem.click() }
    });



    document.getElementById('exportRadarFile').addEventListener("click", () => {
        fileType = "radar"
        exportRadarFile()
    });

    document.getElementById('exportCSVFile').addEventListener("click", () => {
        fileType = "csv"
        exportCSV()
    });

    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = ``
}


const handleUploadedFiles = (contents) => {
    const uploadedData = JSON.parse(contents)
    const target = getData()

    console.log(`Processing uploaded files`)
    // add new object types
    for (let i = 0; i < Object.keys(uploadedData.model.objectTypes).length; i++) {
        console.log(`loaded: ${uploadedData.model.objectTypes[Object.keys(uploadedData.model.objectTypes)[i]].name}`)
        const objectType = uploadedData.model.objectTypes[Object.keys(uploadedData.model.objectTypes)[i]]
        console.log(`loaded: ${objectType.name}`)
        if (target.model.objectTypes.hasOwnProperty(objectType.name)) {
            console.log(`object type already exists`)
        } else {
            target.model.objectTypes[objectType.name] = objectType
        }
    }
    // add new rating types
    for (let i = 0; i < Object.keys(uploadedData.model.ratingTypes).length; i++) {
        const ratingType = uploadedData.model.ratingTypes[Object.keys(uploadedData.model.ratingTypes)[i]]
        console.log(`loaded: ${ratingType.name}`)
        // replace objecttype reference with reference to objectType in target
        if (target.model.ratingTypes.hasOwnProperty(ratingType.name)) {
            console.log(`rating type already exists`)
        } else {
            target.model.ratingTypes[ratingType.name] = ratingType
            let objectTypeName
            if (typeof (ratingType.objectType) == "string") objectTypeName = ratingType.objectType
            if (typeof (ratingType.objectType) == "object") objectTypeName = ratingType.objectType.name
            ratingType.objectType = target.model.objectTypes[objectTypeName]
        }
    }

    // add new objects
    for (let i = 0; i < Object.keys(uploadedData.objects).length; i++) {
        const object = uploadedData.objects[Object.keys(uploadedData.objects)[i]]
        if (target.objects.hasOwnProperty(object.id)) {
            // object already exists; for now assume no update or merge is desired
        } else {
            let objectTypeName
            if (typeof (object.objectType) == "string") objectTypeName = object.objectType
            if (typeof (object.objectType) == "object") objectTypeName = object.objectType.name
            object.objectType = target.model.objectTypes[objectTypeName]
            target.objects[object.id] = object
            console.log(`added new object  ${JSON.stringify(object)}`)
        }
    }



    const ratingConversionMap = {}
    // specify values for scope and author for all ratings imported from file ??
    // add new ratings (with scope and author settings)
    // add new objects
    for (let i = 0; i < Object.keys(uploadedData.ratings).length; i++) {
        const rating = uploadedData.ratings[Object.keys(uploadedData.ratings)[i]]
        rating.object = target.objects[rating.object]

        let ratingTypeName
        if (typeof (rating.ratingType) == "string") ratingTypeName = rating.ratingType
        if (typeof (rating.ratingType) == "object") ratingTypeName = rating.ratingType.name
        const ratingType = target.model.ratingTypes[ratingTypeName]

        if (target.ratings.hasOwnProperty(rating.id)) {
            // rating already exists; 
            // if we find differences in context properties (such as author, scope, timestamp) , we will create a new rating object 
            // find rating properties marked as context
            const contextProperties = []
            for (let p = 0; p < Object.keys(ratingType.properties).length; p++) {
                const property = ratingType.properties[Object.keys(ratingType.properties)[p]]
                if (property.context) {
                    contextProperties.push(property)
                }
            }

            // compare context properties such as scope and author and timestamp; if those differ - then create new rating
            let differ = false
            for (let j = 0; j < contextProperties.length; j++) {
                const propertyName = contextProperties[j].name
                const targetRating = target.ratings[rating.id]
                if ((rating[propertyName] != targetRating[propertyName])
                ) {
                    differ = true
                    break
                }
            }
            if (differ) {
                // create new rating object based on the current one - because it is a new reflection
                const newRating = {}
                // copy  all property values
                for (let p = 0; p < Object.keys(rating).length; p++) {
                    newRating[Object.keys(rating)[p]] = rating[Object.keys(rating)[p]]
                }
                // assign fresh id
                newRating.id = uuidv4()  // assign new id
                ratingConversionMap[rating.id] = newRating.id
                newRating.ratingType = ratingType
                target.ratings[newRating.id] = newRating
                console.log(`created new rating because of differences in context properties ${JSON.stringify(newRating)}`)
            } else {
                console.log(`not imported (or cloned) rating because collision ${JSON.stringify(rating)}`)

            }

        } else {
            target.ratings[rating.id] = rating
            rating.ratingType = ratingType
            console.log(`added new rating  ${JSON.stringify(rating)}`)
        }
    }


    // generate new ratings for colliding ratings with different values for scope, author, timestamp
    // update blip.rating = set UUID for newly generated ratings UUID
    // add new viewpoints
    for (let i = 0; i < uploadedData.viewpoints.length; i++) {
        const viewpoint = uploadedData.viewpoints[i]
        let ratingTypeName
        if (typeof (viewpoint.ratingType) == "string") ratingTypeName = viewpoint.ratingType
        if (typeof (viewpoint.ratingType) == "object") ratingTypeName = viewpoint.ratingType.name
        viewpoint.ratingType = target.model.ratingTypes[ratingTypeName]
        // the blip refers to the rating object in the target set - which may have a new ID because a new rating was created
        viewpoint.blips.forEach((blip) => blip.rating =
            target.ratings[ratingConversionMap.hasOwnProperty(blip.rating) ? ratingConversionMap[blip.rating] : blip.rating]
        )
        target.viewpoints.push(viewpoint) // just add all viewpoints - as adjacent radars / no merging at all

    }

    populateTemplateSelector()
    calculateDerivedProperties()

}


const exportRadarFile = () => {
    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `<h3>Export Current Radar in Radar File</h3>
    <br />
    <label for="exportAllRatings">All Ratings of this radar's type ${getViewpoint().ratingType.name}:
     # ${Object.keys(getData().ratings).filter((key) => getData().ratings[key].ratingType == getViewpoint().ratingType.name || getData().ratings[key].ratingType.name == getViewpoint().ratingType.name).length}?</input>
    <input type="radio" id="exportAllRatings" value="exportAllRatings" name="exportOptions"></input>

    <br /><br />
    <label for="exportAllBlippedRatings">Blipped Ratings (in current radar): # ${getViewpoint().blips.length}?</input>
    <input type="radio" id="exportAllBlippedRatings" value="exportAllBlippedRatings" name="exportOptions"></input>
    
    <br /><br />
    <label for="exportAllBlippedFilteredRatings">Blipped and Filtered Ratings (in current radar)?</input>
    <input type="radio" id="exportAllBlippedFilteredRatings" value="exportAllBlippedFilteredRatings" name="exportOptions"></input>
    <br /><br />
    <label for="exportAllVisibleRatings">Only Currently Visible Ratings (based on visible visual dimensions)?</input>
    <input type="radio" id="exportAllVisibleRatings" value="exportAllVisibleRatings" name="exportOptions" checked></input>
    <br /><br /><br /><br />
    <label for="exportAllObjects">All Objects of type ${getViewpoint().ratingType.objectType.name} (when unchecked: only objects for exported ratings) ?</input>
    <input type="checkbox" id="exportAllObjects" value="exportAllObjects" name="exportOptions"></input>
    <br />
    `

    contentContainer.innerHTML = html

    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `
    <input type="button" id="exportRadarFileFromCurrentRadar" name="process" value="Export Radar File">
    `
    // gather all property to field mappings
    document.getElementById("exportRadarFileFromCurrentRadar").addEventListener("click", () => {
        const exportAllRatings = document.getElementById('exportAllRatings').checked
        const exportAllBlippedRatings = document.getElementById('exportAllBlippedRatings').checked
        const exportAllBlippedFilteredRatings = document.getElementById('exportAllBlippedFilteredRatings').checked
        const exportAllVisibleRatings = document.getElementById('exportAllVisibleRatings').checked
        const exportAllObjects = document.getElementById('exportAllObjects').checked


        exportRadarDataToRadarFile(exportAllRatings, exportAllBlippedRatings, exportAllBlippedFilteredRatings, exportAllVisibleRatings, exportAllObjects)
    })
}

const jsonClone = (object) => {
    return JSON.parse(JSON.stringify(object))
}

const exportRadarDataToRadarFile = (exportAllRatings, exportAllBlippedRatings, exportAllBlippedFilteredRatings, exportAllVisibleRatings, exportAllObjects) => {
    // prepare a new radar data object - constructed from getData() - with the data indicated by the boolean parameters    
    const radarDataToExport = {
        model: {
            objectTypes: {}
            , ratingTypes: {}
        }
        , templates: []
        , objects: {}
        , ratings: {}
        , viewpoints: []
    }

    // clone ratingType and objectType
    radarDataToExport.model.objectTypes[getViewpoint().ratingType.objectType.name] = jsonClone(getViewpoint().ratingType.objectType)
    radarDataToExport.model.ratingTypes[getViewpoint().ratingType.name] = jsonClone(getViewpoint().ratingType)
    radarDataToExport.model.ratingTypes[getViewpoint().ratingType.name].objectType = radarDataToExport.model.objectTypes[getViewpoint().ratingType.objectType.name]
    // clone viewpoint
    radarDataToExport.viewpoints.push(getViewpoint())
    const viewpointToExport = radarDataToExport.viewpoints[0]
    viewpointToExport.ratingType = radarDataToExport.model.ratingTypes[getViewpoint().ratingType.name]
    radarDataToExport.dateCreated = Date.now()

    // clone ratings and objects - with proper references to object type and rating
    // either clone all and remove unwanted or only clone wanted

    let ratingsToExport = []
    let blipsToExport = []

    // note: code based on function exportRadarDataToCSVFile in csvFileManager
    if (exportAllRatings) {
        for (let i = 0; i < Object.keys(getData().ratings).length; i++) {
            const rating = getData().ratings[Object.keys(getData().ratings)[i]]
            if (rating.ratingType == getViewpoint().ratingType.name || rating.ratingType.name == getViewpoint().ratingType.name) {
                ratingsToExport.push(rating)
            }
        }
        // TODO what about blips in this case? generate blips for all ratings without blip? then add all blips to blips to export?

    } else {
        let eligibleRatings
        if (exportAllBlippedRatings) {

            eligibleRatings = getViewpoint().blips.map((blip) => blip.rating.id)
            blipsToExport = getViewpoint().blips
        }
        if (exportAllBlippedFilteredRatings) {
            const filteredBlips = getViewpoint().blips.filter((blip) => filterBlip(blip, getViewpoint(), getData()))
            blipsToExport = filteredBlips
            eligibleRatings = filteredBlips.map((blip) => blip.rating.id)
        }
        if (exportAllVisibleRatings) {
            blipsToExport = getState().visibleBlips
            eligibleRatings = getState().visibleBlips.map((blip) => blip.rating.id)
        }
        const ratingsSet = new Set(eligibleRatings)
        ratingsToExport = Array.from(ratingsSet).map((ratingId) => getData().ratings[ratingId])

    }
    // compose object ratings to export from array ratingsToExport
    radarDataToExport.ratings = Object.fromEntries(
        ratingsToExport.map(rating => [rating.id, rating])
    )
    // either objects from ratings - or simply all objects
    if (exportAllObjects) {
        const objects = Object.fromEntries(
            Object.keys(getData().objects)
                .filter((key) => getData().objects[key].objectType == getViewpoint().ratingType.objectType.name  || getData().objects[key].objectType.name == getViewpoint().ratingType.objectType.name)
                .map(key  => [key, getData().objects[key]]
                )
        )
        radarDataToExport.objects = objects
    } else {
        const objects = Object.fromEntries(
            ratingsToExport.map(rating => [rating.object.id, rating.object])
        )
        radarDataToExport.objects = objects
    }

    viewpointToExport.blips = blipsToExport

    downloadRadarData(`${getViewpoint().name}-radar-data.json`, radarDataToExport)
}
