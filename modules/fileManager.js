export { launchFileManager }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar, populateTemplateSelector } from './data.js';
import { launchShapeEditor } from './shapeEditing.js'
import { getListOfSupportedShapes, capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement, uuidv4 } from './utils.js'

const launchFileManager = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "File Management")
    document.getElementById("fileConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `                    <input type="button" id="uploadFile" name="upload" value="Upload">
    <input type="file" id="uploadfileElem" multiple accept="application/json,text/*" style="display:none">
`
    contentContainer.innerHTML = `${html}<br/> <br/><br/>`


    let fileElem = document.getElementById("uploadfileElem");
    fileElem.addEventListener("change", async (e) => {
        if (!e.target.files.length) {
            console.log(`no files selected`)
        } else {
            const contents = await e.target.files[0].text()
            handleUploadedFiles(contents)
        }
    }
        , false);

    document.getElementById('uploadFile').addEventListener("click", () => {
        if (fileElem) { fileElem.click() }
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
        if (rating.object.label=="DB2") {
            console.log(`DB2!!`)
        }
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

}