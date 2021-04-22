export { launchFileManager }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, download, publishRefreshRadar, populateTemplateSelector, createObject, createRating } from './data.js';
import { launchShapeEditor } from './shapeEditing.js'
import { getUniqueFieldValues, getListOfSupportedShapes, capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, toggleShowHideElement, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement, uuidv4, populateDatalistFromValueSet } from './utils.js'
import { createRadarFromCSV } from './csvWizard.js'

const launchFileManager = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "File Management")
    document.getElementById("fileConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `<input type="button" id="uploadFile" name="upload" value="Upload Radar File"></input>
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

}

const handleUploadedCSVFiles = (contents) => {
    const objects = d3.csvParse(contents)
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Import CSV Document")
    document.getElementById("fileConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `<h3>Quick File Summary</h3>
    <p># of records ${objects.length}</p>
    <h3>Mapping Properties from CSV to Radar</h3>
    `
    html += `<table><tr><th>CSV Field</th><th>Sample values from CSV</th><th>Mapped to Radar Property</th></tr>`

    for (let i = 0; i < objects.columns.length; i++) {
        let uniqueValues = getUniqueFieldValues(objects, objects.columns[i])

        let values = Array.from(uniqueValues)
            .reduce((valueSample, value, index) => {
                return valueSample + (index > 0 ? ", " : "") + value
            }
                , "")
        html += `<tr><td><span id="field${i}">${objects.columns[i]}</span></td>
    <td><span id="values${i}" title="${values}">Sample values from CSV</span></td>
    <td><input id="mappedProperty${i}" list="mappedPropertiesList" title="Select a predefined property (path) or define your own new property"></input></td></tr>`

    }

    html += `</table>`
    html += `<datalist id="mappedPropertiesList">        <option value="X"></option></datalist>`

    contentContainer.innerHTML = `${html}<br/> <br/><br/>`
    const listOfRatingPropertyPaths = []
    const ratingTypeProperties = getRatingTypeProperties(getViewpoint().ratingType, getData().model, true)
    for (let i = 0; i < ratingTypeProperties.length; i++) {
        listOfRatingPropertyPaths.push(ratingTypeProperties[i].propertyPath)
    }

    populateDatalistFromValueSet("mappedPropertiesList", listOfRatingPropertyPaths)
    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `
    <input type="button" id="defineCSVProcessing" name="process" value="Define CSV Processing Configuration"></input>
    `
    document.getElementById("defineCSVProcessing").addEventListener("click", () => {
        // construct object with mapping between CSV field and Radar Property Path
        const csvToRadarMap = {}
        for (let i = 0; i < objects.columns.length; i++) {
            const mappedPropertyPath = getElementValue(`mappedProperty${i}`)
            if (mappedPropertyPath != null && mappedPropertyPath.length > 0) {
                csvToRadarMap[objects.columns[i]] = mappedPropertyPath
            }
        }
        prepareCSVProcessing(objects, csvToRadarMap)
    })

}

// return a Map with the object values as keys and the object properties (keys) as values 
const swapObjectIntoMap = (object) => {
    const map = new Map()
    for (let i = 0; i < Object.keys(object).length; i++) {
        const key = Object.keys(object)[i]
        map.set(object[key], key)
    }
    return map
}

const prepareCSVProcessing = (objects, csvToRadarMap) => {
    const contentContainer = document.getElementById("modalMainContentContainer")
    const radarFromCSVMap = swapObjectIntoMap(csvToRadarMap)
    const csvFieldToRadarPropertyValueMapper = {}

    // check for newly created properties
    identifyAndAddNewProperties(radarFromCSVMap);


    const defaultRating = createRating(getViewpoint().ratingType.name, createObject(getViewpoint().ratingType.objectType.name))
    const listOfRatingPropertyPaths = []
    const ratingTypeProperties = getRatingTypeProperties(getViewpoint().ratingType, getData().model, true)
    for (let i = 0; i < ratingTypeProperties.length; i++) {
        listOfRatingPropertyPaths.push(ratingTypeProperties[i].propertyPath)
    }


    let html = ``
    html += `<h3>Quick File Summary</h3>
    <p># of records ${objects.length}</p>
    <h3>Mapping CSV Fields and assigning Static Values to Radar Properties</h3>

    `
    //TODO map CSV records to existing objects based on propertie(s)
    html += ` 
    <label for="addValuesToPropertyAllowableValues">Extend Allowable Values for mapped Properties with Actual Values?</label>
    <input type="checkbox" id="addValuesToPropertyAllowableValues" ></input>
    <br/>
    <label for="matchRecordsToObjects">Try to match CSV records to existing objects?</label>
    <input type="checkbox" id="matchRecordsToObjects" ></input>
    <label for="matchRecordsToRatings">Also try to match CSV records to existing ratings?</label>
    <input type="checkbox" id="matchRecordsToRatings" ></input>
        <br/><br/>`
    html += `<table><tr><th>Value to assign</th><th>for Radar Property</th><th>Set or Update Field?</th><th>Use field and property for matching?</th></tr>`
    for (let i = 0; i < listOfRatingPropertyPaths.length; i++) {
        html += `<tr><td>`
        if (radarFromCSVMap.has(listOfRatingPropertyPaths[i])) {
            // mapped radar property
            html += `CSV field: <b>${radarFromCSVMap.get(listOfRatingPropertyPaths[i])}</b>
            <span id="showValueMappings${i}" style="margin:15; color:blue;font-size:11">value mapping</span>
            <div id="mappingValuesTo${i}" style="display:none"></div>`
        }
        else {
            let defaultValue = getNestedPropertyValueFromObject(defaultRating, listOfRatingPropertyPaths[i])
            html += `<input id="defaultValueOf${listOfRatingPropertyPaths[i]}" type="text" value="${defaultValue == null ? "" : defaultValue}"></input>            
            `
        }
        html += `</td>
        <td>${listOfRatingPropertyPaths[i]} </td>
        <td><input id="setOrUpdateProperty${i}" type="checkbox"
         ${listOfRatingPropertyPaths[i].startsWith("object.") || radarFromCSVMap.has(listOfRatingPropertyPaths[i]) ? "checked" : ""}></input>
        <td><input id="matchOnProperty${i}" type="checkbox"></input>
        </tr>`
    }

    html += `</table>`

    contentContainer.innerHTML = html

    for (let i = 0; i < listOfRatingPropertyPaths.length; i++) {
        if (radarFromCSVMap.has(listOfRatingPropertyPaths[i])) {
            const valueMappingsLink = document.getElementById(`showValueMappings${i}`)
            valueMappingsLink.addEventListener("click", () => {
                // prepare mappings table for 
                prepareMappingsTable(`mappingValuesTo${i}`, ratingTypeProperties[i], radarFromCSVMap.get(listOfRatingPropertyPaths[i]), objects, csvFieldToRadarPropertyValueMapper)
                toggleShowHideElement(`mappingValuesTo${i}`)
            })
        }
    }

    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `
    <input type="button" id="processCSVrecords" name="process" value="Process CSV records based on this configuration">
    `
    document.getElementById("processCSVrecords").addEventListener("click", () => {
        const extendAllowableValues = document.getElementById("addValuesToPropertyAllowableValues").checked
        const matchCSVRecordsToRadarObjects = document.getElementById("matchRecordsToObjects").checked
        const matchRecordsToRatings = document.getElementById("matchRecordsToRatings").checked


        // collect the values for all properties

        //     <td><input id="setOrUpdateProperty${i}" type="checkbox"
        //     ${listOfRatingPropertyPaths[i].startsWith("object.") || radarFromCSVMap.has(listOfRatingPropertyPaths[i])?"checked":""}></input>
        //    <td><input id="matchOnProperty${i}" type="checkbox"></input>

        const propertyValueMap = {}
        const propertiesToMatchOn = []
        for (let i = 0; i < listOfRatingPropertyPaths.length; i++) {
            const setOrUpdateProperty = document.getElementById(`setOrUpdateProperty${i}`).checked
            if (setOrUpdateProperty) {
                propertyValueMap[listOfRatingPropertyPaths[i]] = getElementValue(`defaultValueOf${listOfRatingPropertyPaths[i]}`)
                const matchOnProperty = document.getElementById(`matchOnProperty${i}`).checked
                if (matchOnProperty) {
                    propertiesToMatchOn.push(listOfRatingPropertyPaths[i])
                }
            }
        }
        processCSVRecords(objects, extendAllowableValues, propertyValueMap, radarFromCSVMap, csvFieldToRadarPropertyValueMapper, matchCSVRecordsToRadarObjects, matchRecordsToRatings, propertiesToMatchOn)
    })

}

const prepareMappingsTable = (divId, radarProperty, csvField, objects, csvFieldToRadarPropertyValueMapper, matchCSVRecordsToRadarObjects) => {
    const container = document.getElementById(divId)
    let html = ``
    // get values in csvField
    let uniqueValues = Array.from(getUniqueFieldValues(objects, csvField))


    html += `<table><tr><th>Value in CSV file</th><th>Corresponding Value in Radar (when empty, then apply CSV value)</th></tr>`
    for (let i = 0; i < uniqueValues.length; i++) {
        html += `<tr><td>${uniqueValues[i]}</td><td><input id="${radarProperty.propertyPath}UniqueValue${i}" list="${radarProperty.propertyPath}List" ></input></td></tr>`
    }
    html += `</table>
    <datalist id="${radarProperty.propertyPath}List"></datalist>`
    container.innerHTML = html
    // get property values for radar property 
    const propertyValueMap = getPropertyValuesAndCounts(radarProperty.propertyPath, getData().ratings, getViewpoint().ratingType.name)
    const radarPropertyValues = Object.keys(propertyValueMap)
    populateDatalistFromValueSet(`${radarProperty.propertyPath}List`, radarPropertyValues)

    for (let i = 0; i < uniqueValues.length; i++) {
        const inputElement = document.getElementById(`${radarProperty.propertyPath}UniqueValue${i}`)
        inputElement.addEventListener("change", (e) => {
            console.log(`unique value ${uniqueValues[i]} for property ${radarProperty.propertyPath}
                         is now mapped to ${e.target.value}`)
            if (!csvFieldToRadarPropertyValueMapper.hasOwnProperty(radarProperty.propertyPath)) { csvFieldToRadarPropertyValueMapper[radarProperty.propertyPath] = {} }
            csvFieldToRadarPropertyValueMapper[radarProperty.propertyPath][uniqueValues[i]] = e.target.value
        })
    }
}


const processCSVRecords = (objects, extendAllowableValues, propertyValueMap, radarFromCSVMap, csvFieldToRadarPropertyValueMapper, matchCSVRecordsToRadarObjects, matchRecordsToRatings, propertiesToMatchOn) => {
    console.log(`processCSV Records ${JSON.stringify(propertyValueMap)}`)
    // do we create ratings as well as objects?
    const objectType = getViewpoint().ratingType.objectType
    const targetRatingTypeName = getViewpoint().ratingType.name
    const ratingTypeProperties = getRatingTypeProperties(getViewpoint().ratingType, getData().model, true)
    const objectPropertiesToMatchOn  = propertiesToMatchOn.filter((property) => property.startsWith("object."))
    const ratingPropertiesToMatchOn  = propertiesToMatchOn.filter((property) => !property.startsWith("object."))


    let shouldCreateRating = false
    radarFromCSVMap.forEach((csvField, radarProperty) => {
        if (!radarProperty.startsWith("object.")) {
            shouldCreateRating = true
        }
    })
    if (!shouldCreateRating) {
        for (let i = 0; i < Object.keys(propertyValueMap).length; i++) {
            if (!Object.keys(propertyValueMap)[i].startsWith("object.")) {
                shouldCreateRating = true
                break
            }

        }
    }

    const distinctValueCollectorForObjects = {}
    const distinctValueCollectorForRatings = {}
    objects.forEach((row) => {
        // create object with defaults for object type
        let radarObjects = []
        // 
        if (matchCSVRecordsToRadarObjects) {
            // try to find an existing matching object for this csv record
            console.log(`try to find matching object(s) using properties ${JSON.stringify(propertiesToMatchOn)}`)
            const propertyValuesToMatchOn = []
            for (let i = 0; i < objectPropertiesToMatchOn.length; i++) {
//                if (propertiesToMatchOn[i].startsWith("object.")) {
                    let incomingPropertyValue
                    if (radarFromCSVMap.has(objectPropertiesToMatchOn[i])) {
                        incomingPropertyValue = row[radarFromCSVMap.get(objectPropertiesToMatchOn[i])];
                        // check if valueFromCSV occurs in csvFieldToRadarPropertyValueMapper = if so, the converted value should be used
                        if (csvFieldToRadarPropertyValueMapper.hasOwnProperty(objectPropertiesToMatchOn[i])) {
                            const convertedValue = csvFieldToRadarPropertyValueMapper[objectPropertiesToMatchOn[i]][incomingPropertyValue];
                            if (convertedValue != null && convertedValue != "") {
                                incomingPropertyValue = convertedValue;
                            }
                        }
                    } else {
                        incomingPropertyValue = propertyValueMap[objectPropertiesToMatchOn[i]]
                    }
                    propertyValuesToMatchOn.push(incomingPropertyValue)
  //              }
            }
            // iterate over all objects of the desired type
            // check each object against the propertiesToMatchOn - verify if they have the values in propertyValuesToMatchOn
            for (let i = 0; i < Object.keys(getData().objects).length; i++) {
                const radarObject = getData().objects[Object.keys(getData().objects)[i]];
                const objectTypeKey = typeof (radarObject.objectType) == "string" ? radarObject.objectType : radarObject.objectType.name;

                if (objectTypeKey == objectType.name) {
                    let match = false
                    for (let p = 0; p < objectPropertiesToMatchOn.length; p++) {
                        let radarObjectProperty = radarObject[objectPropertiesToMatchOn[p].substring(7)]
                        if (radarObjectProperty == propertyValuesToMatchOn[p]) {
                            match = true
                        } else {
                            match = false
                            break
                        }
                    }
                    if (match) {
                        radarObjects.push(radarObject)
                    }
                }

            }

        }
        // if not matched
        if (radarObjects.length == 0) {
            const object = createObject(objectType.name)
            getData().objects[object.id] = object
            radarObjects.push(object)
        }

        radarObjects.forEach((object) => {
            updateObjectWithPropertyValues(ratingTypeProperties, propertyValueMap, radarFromCSVMap, row, csvFieldToRadarPropertyValueMapper, object, distinctValueCollectorForObjects, "object")
        })

        console.log(`Also new rating?: ${shouldCreateRating}`)
        if (shouldCreateRating) {
            radarObjects.forEach((object) => {
                // TODO cater for ratings to be matched and updated
                let radarRatings = []
                // 
                if (matchRecordsToRatings) {
                    // try to find an existing matching rating for this csv record
                    console.log(`try to find matching rating(s) using properties ${JSON.stringify(propertiesToMatchOn)}`)
                    const propertyValuesToMatchOn = []
                    for (let i = 0; i < ratingPropertiesToMatchOn.length; i++) {
//                        if (!propertiesToMatchOn[i].startsWith("object.")) {
                            let incomingPropertyValue
                            if (radarFromCSVMap.has(ratingPropertiesToMatchOn[i])) {
                                incomingPropertyValue = row[radarFromCSVMap.get(ratingPropertiesToMatchOn[i])];
                                // check if valueFromCSV occurs in csvFieldToRadarPropertyValueMapper = if so, the converted value should be used
                                if (csvFieldToRadarPropertyValueMapper.hasOwnProperty(ratingPropertiesToMatchOn[i])) {
                                    const convertedValue = csvFieldToRadarPropertyValueMapper[ratingPropertiesToMatchOn[i]][incomingPropertyValue];
                                    if (convertedValue != null && convertedValue != "") {
                                        incomingPropertyValue = convertedValue;
                                    }
                                }
                            } else {
                                incomingPropertyValue = propertyValueMap[ratingPropertiesToMatchOn[i]]
                            }
                            propertyValuesToMatchOn.push(incomingPropertyValue)
                     //   }
                    }
                    // iterate over all ratings of the desired type and with a reference to the current object 
                    // check each object against the propertiesToMatchOn - verify if they have the values in propertyValuesToMatchOn
                    for (let i = 0; i < Object.keys(getData().ratings).length; i++) {
                        const radarRating = getData().ratings[Object.keys(getData().ratings)[i]];
                        const radarRatingRatingType = typeof (radarRating.ratingType) == "string" ? radarRating.ratingType : radarRating.ratingType.name;

                        if (radarRatingRatingType == targetRatingTypeName) {
                            if
                                (radarRating.object.id == object.id) {
                                let match = false
                                for (let p = 0; p < propertiesToMatchOn.length; p++) {
                                    let radarRatingPropertyValue = radarRating[ratingPropertiesToMatchOn[p]]
                                    if (radarRatingPropertyValue == propertyValuesToMatchOn[p]) {
                                        match = true
                                    } else {
                                        match = false
                                        break
                                    }
                                }
                                if (match) {
                                    radarRatings.push(radarRating)
                                }
                            }
                        }

                    }

                }
                // if not matched
                if (radarRatings.length == 0) {
                    const rating = createRating(getViewpoint().ratingType.name, object) // all session defaults will now have been applied
                    getData().ratings[rating.id] = rating
                    radarRatings.push(rating)
                }


                radarRatings.forEach((rating) => {
                    updateObjectWithPropertyValues(ratingTypeProperties, propertyValueMap, radarFromCSVMap, row, csvFieldToRadarPropertyValueMapper, rating, distinctValueCollectorForObjects, "rating")
                })
                // for (let i = 0; i < ratingTypeProperties.length; i++) {
                //     const prop = ratingTypeProperties[i]
                //     if (prop.propertyScope == "rating") {
                //         const propertyName = prop.propertyName
                //         if (radarFromCSVMap.has(prop.propertyPath)) {
                //             let valueFromCSV = row[radarFromCSVMap.get(prop.propertyPath)]

                //             // check if valueFromCSV occurs in csvFieldToRadarPropertyValueMapper = if so, the converted value should be used
                //             if (csvFieldToRadarPropertyValueMapper.hasOwnProperty(prop.propertyPath)) {
                //                 const convertedValue = csvFieldToRadarPropertyValueMapper[prop.propertyPath][valueFromCSV]
                //                 if (convertedValue != null && convertedValue != "") {
                //                     console.log(`converted ${valueFromCSV} to ${convertedValue}`)
                //                     valueFromCSV = convertedValue
                //                 }
                //             }


                //             rating[propertyName] = valueFromCSV
                //             if (prop.property.allowableValues != null) {
                //                 if (distinctValueCollectorForRatings[propertyName] == null) distinctValueCollectorForRatings[propertyName] = new Set()
                //                 distinctValueCollectorForRatings[propertyName].add(valueFromCSV)
                //             }
                //         } else {
                //             rating[propertyName] = propertyValueMap[prop.propertyPath]
                //         }
                //     }
                // }

                // for (let i = 0; i < Object.keys(csvToRadarMap).length; i++) {
                //     const csvField = Object.keys(csvToRadarMap)[i]
                //     if (!csvToRadarMap[csvField].startsWith("object.")) {
                //         const propertyName = csvToRadarMap[csvField]
                //         rating[csvToRadarMap[csvField]] = row[csvField]
                //         if (getViewpoint().ratingType.properties[propertyName]?.allowableValues != null) {
                //             if (distinctValueCollectorForRatings[propertyName] == null) distinctValueCollectorForRatings[propertyName] = new Set()
                //             distinctValueCollectorForRatings[propertyName].add(row[csvField])
                //         }

                //     }
                // }

            })
        }
    })

    if (extendAllowableValues) {
        for (let i = 0; i < Object.keys(distinctValueCollectorForObjects).length; i++) {
            const propertyName = Object.keys(distinctValueCollectorForObjects)[i]
            const property = objectType.properties[propertyName]
            console.log(`extend allowable values for property ${propertyName} ${JSON.stringify(property)} with values from ${JSON.stringify(distinctValueCollectorForObjects[propertyName])}`)
            const values = Array.from(distinctValueCollectorForObjects[propertyName])
            for (let v = 0; v < values.length; v++) {
                // check if v exists in property.allowableValues; if not, then add
                let found = false
                for (let a = 0; a < property.allowableValues.length; a++) {
                    if (property.allowableValues[a].value == values[v]) {
                        found = true
                    }
                }
                if (!found) {
                    property.allowableValues.push({ value: values[v], label: values[v] })
                }
            }

        }

        for (let i = 0; i < Object.keys(distinctValueCollectorForRatings).length; i++) {
            const propertyName = Object.keys(distinctValueCollectorForRatings)[i]
            const property = getViewpoint().ratingType.properties[propertyName]
            console.log(`extend allowable values for property ${propertyName} ${JSON.stringify(property)} with values from ${JSON.stringify(distinctValueCollectorForRatings[propertyName])}`)
            const values = Array.from(distinctValueCollectorForRatings[propertyName])
            for (let v = 0; v < values.length; v++) {
                let found = false
                for (let a = 0; a < property.allowableValues.length; a++) {
                    if (property.allowableValues[a].value == values[v]) {
                        found = true
                    }
                }
                if (!found) {
                    property.allowableValues.push({ value: values[v], label: values[v] })
                }
            }

        }

    }

}


function updateObjectWithPropertyValues(ratingTypeProperties, propertyValueMap, radarFromCSVMap, row, csvFieldToRadarPropertyValueMapper, object, distinctValueCollectorForObjects, scope = "object") {
    for (let i = 0; i < ratingTypeProperties.length; i++) {
        const prop = ratingTypeProperties[i];
        if (Object.keys(propertyValueMap).includes(prop.propertyPath)) {
            if (prop.propertyScope == scope) {
                const propertyName = prop.propertyName;

                if (radarFromCSVMap.has(prop.propertyPath)) {
                    let valueFromCSV = row[radarFromCSVMap.get(prop.propertyPath)];
                    // check if valueFromCSV occurs in csvFieldToRadarPropertyValueMapper = if so, the converted value should be used
                    if (csvFieldToRadarPropertyValueMapper.hasOwnProperty(prop.propertyPath)) {
                        const convertedValue = csvFieldToRadarPropertyValueMapper[prop.propertyPath][valueFromCSV];
                        if (convertedValue != null && convertedValue != "") {
                            console.log(`converted ${valueFromCSV} to ${convertedValue}`);
                            valueFromCSV = convertedValue;
                        }
                    }

                    object[propertyName] = valueFromCSV;
                    if (prop.property.allowableValues != null) {
                        if (distinctValueCollectorForObjects[propertyName] == null)
                            distinctValueCollectorForObjects[propertyName] = new Set();
                        distinctValueCollectorForObjects[propertyName].add(valueFromCSV);
                    }
                } else {
                    object[propertyName] = propertyValueMap[prop.propertyPath];
                }
            }
        }
    }
}

function identifyAndAddNewProperties(radarFromCSVMap) {
    const objectType = getViewpoint().ratingType.objectType
    radarFromCSVMap.forEach((csvField, radarProperty) => {
        if (radarProperty.startsWith("object.")) {
            const propertyName = radarProperty.substring(7);
            if (!objectType.properties.hasOwnProperty(propertyName)) {
                // create property in objectType
                objectType.properties[propertyName] =
                {
                    "label": capitalize(propertyName),
                    "type": "string",
                    "name": propertyName,
                    "comment": `generated from field ${csvField} when processing uploaded CSV file`
                };
            }
        }
        else {
            const propertyName = radarProperty;
            if (!getViewpoint().ratingType.properties.hasOwnProperty(propertyName)) {
                // create property in objectType
                getViewpoint().ratingType.properties[propertyName] =
                {
                    "label": capitalize(propertyName),
                    "type": "string",
                    "name": propertyName,
                    "comment": `generated from field ${csvField} when processing uploaded CSV file`
                };
            }
        }

    })

}

const exportCSV = () => {
    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `<h3>Export Radar Data in CSV File</h3>
    <br />
    <label for="exportAllRatings">All Ratings for ${getViewpoint().ratingType.name}:
     # ${Object.keys(getData().ratings).filter((key) => getData().ratings[key].ratingType == getViewpoint().ratingType.name || getData().ratings[key].ratingType.name == getViewpoint().ratingType.name).length}?</input>
    <input type="radio" id="exportAllRatings" value="exportAllRatings" name="exportOptions"></input>

    <br />
    <label for="exportAllBlippedRatings">All Blipped Ratings (in current radar): # ${getViewpoint().blips.length}?</input>
    <input type="radio" id="exportAllBlippedRatings" value="exportAllBlippedRatings" name="exportOptions"></input>
    
    <br />
    <label for="exportAllBlippedFilteredRatings">All Blipped and Filtered Ratings (in current radar)?</input>
    <input type="radio" id="exportAllBlippedFilteredRatings" value="exportAllBlippedFilteredRatings" name="exportOptions"></input>
    <br />
    <label for="exportAllVisibleRatings">All Currently Visible Ratings?</input>
    <input type="radio" id="exportAllVisibleRatings" value="exportAllVisibleRatings" name="exportOptions"></input>
    <br />
    `
    html += `<h3>Map Radar Properties to CSV Fields</h3>`
    html += `<table>
    <tr><th>Include?</th><th>Radar Property</th><th>CSV Field</th></tr>`
    const ratingTypeProperties = getRatingTypeProperties(getViewpoint().ratingType, getData().model, true)
    for (let i = 0; i < ratingTypeProperties.length; i++) {
        html += `
        <tr><td><input type="checkbox" id="include${i}" checked></input></td>
        <td>${ratingTypeProperties[i].propertyPath}</td>
        <td><input type="text" id="csvField${i}" value="${ratingTypeProperties[i].property.name}"></input></td></tr>`

    }
    html += `</table><br /><br />`
    contentContainer.innerHTML = html

    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `
    <input type="button" id="exportCSVFileFromRadar" name="process" value="Export CSV File">
    `
    document.getElementById("exportCSVFileFromRadar").addEventListener("click", () => {
        // gather all property to field mappings
        const exportableProperties = []
        for (let i = 0; i < ratingTypeProperties.length; i++) {
            if (document.getElementById(`include${i}`).checked) {
                exportableProperties.push({
                    radarProperty: ratingTypeProperties[i]
                    , csvField: getElementValue(`csvField${i}`)
                })
            }
        }

        // then start processing
        // TODO: which type of processing (all, fuiltered,...)
        console.log(`export ${JSON.stringify(exportableProperties)}`)
        exportRadarDataToCSVFile(exportableProperties)
    })
}

const exportRadarDataToCSVFile = (exportableProperties) => {
    let csv = ``
    for (let i = 0; i < exportableProperties.length; i++) {
        csv += (i > 0 ? ',' : '') + exportableProperties[i].csvField
    }
    csv += `\n`
    for (let i = 0; i < Object.keys(getData().ratings).length; i++) {
        const rating = getData().ratings[Object.keys(getData().ratings)[i]]
        let row = ``
        if (rating.ratingType == getViewpoint().ratingType.name || rating.ratingType.name == getViewpoint().ratingType.name) {
            for (let j = 0; j < exportableProperties.length; j++) {
                row += (j > 0 ? ',' : '') + `"${getNestedPropertyValueFromObject(rating, exportableProperties[j].radarProperty.propertyPath)}"`
            }
            csv += `${row}\n`
        }

    }
    download(`radar-data.csv`, csv)
}
