export {
    isOperationBlackedOut, uuidv4, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject
    , getRatingTypeProperties, getElementValue, showOrHideElement, getDateTimeString
    , populateSelect, getAllKeysMappedToValue, createAndPopulateDataListFromBlipProperties
    , populateFontsList, populateShapesList, setTextOnElement, initializeImagePaster, undefinedToDefined, capitalize
    , getDistinctTagValues, getPropertyValuesAndCounts, populateDatalistFromValueSet, getPropertyFromPropertyPath
}


// to prevent an operation from being executed too often, we record a timestamp in the near future until when 
// the operation cannot be executed; the function isOperationBlackedOut checks if the operation is currently blacked out and sets a new blackout end in the map
const blackoutMap = {} // records end of blackout timestamps under specific keys
const blackoutPeriodDefault = 100 // milliseconds
const isOperationBlackedOut = (blackoutKey, blackoutPeriod = blackoutPeriodDefault) => {
    let isBlackedout = false
    const blackoutDeadline = blackoutMap[blackoutKey]
    const now = new Date().getTime()
    if (blackoutDeadline != null)
        isBlackedout = now < blackoutDeadline
    if (!isBlackedout)
        blackoutMap[blackoutKey] = now + blackoutPeriod // set fresh blackout if currently not blacked out 
    return isBlackedout
}



function addValuesForProperty(propertyPath, blips, distinctValues) {
    const listOfDistinctPropertyValues = new Set()
    for (let i = 0; i < blips.length; i++) {
        const blip = blips[i]
        listOfDistinctPropertyValues.add(getNestedPropertyValueFromObject(blip.rating, propertyPath)?.toLowerCase().trim())
    }
    distinctValues = new Set([...distinctValues, ...listOfDistinctPropertyValues])
    return distinctValues
}

const getPropertyValuesAndCounts = (propertyPath, ratings) => { // filter on rating type!
    const valueOccurenceMap = {}
    for (let i = 0; i < Object.keys(ratings).length; i++) {
        const value = getNestedPropertyValueFromObject(ratings[Object.keys(ratings)[i]], propertyPath)
        const currentCount = valueOccurenceMap[value] ?? 0
        valueOccurenceMap[value] = currentCount + 1
    }
    return valueOccurenceMap
}

const getDistinctTagValues = (viewpoint, includeDiscreteProperties = false) => {
    const listOfDistinctTagValues = new Set()
    for (let i = 0; i < viewpoint.blips.length; i++) {
        const blip = viewpoint.blips[i]
        if (blip.rating.object?.tags != null && blip.rating.object?.tags.length > 0) {
            for (let j = 0; j < blip.rating.object?.tags.length; j++) {
                listOfDistinctTagValues.add(blip.rating.object.tags[j].toLowerCase().trim())
            }
        }
    }
    let distinctValues = listOfDistinctTagValues
    // TODO replace hardcoded property paths with meta model driven derivation
    const discretePropertyPaths = ["object.category", "object.offering", "object.vendor", "scope", "ambition", "author"]
    if (includeDiscreteProperties) {
        for (let i = 0; i < discretePropertyPaths.length; i++) {
            distinctValues = addValuesForProperty(discretePropertyPaths[i], viewpoint.blips, distinctValues)
        }
    }
    return distinctValues
}


const uuidv4 = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// also see: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path
const getNestedPropertyValueFromObject = (object, propertyPath) => {
    const propertyPathSegments = propertyPath.split('.')
    let value = object
    for (let i = 0; i < propertyPathSegments.length; i++) {
        if (value == null) break
        value = value[propertyPathSegments[i]]
    }
    if (typeof value == 'undefined') value = null
    return value
}

const setNestedPropertyValueOnObject = (object, propertyPath, value) => {
    const propertyPathSegments = propertyPath.split('.')
    let elementToSet = object
    for (let i = 0; i < propertyPathSegments.length - 1; i++) {
        elementToSet = elementToSet[propertyPathSegments[i]]
    }
    if (Array.isArray(elementToSet[propertyPathSegments[propertyPathSegments.length - 1]])) {
        // if property of type  [] then add value to top of array - 
        // but only if the array does not already contain the value
        // note: if property is intended as [] but not initialized as such, this function will not treat it as array
        if (!elementToSet[propertyPathSegments[propertyPathSegments.length - 1]].includes(value)) {
            elementToSet[propertyPathSegments[propertyPathSegments.length - 1]].unshift(value)
        }

    } else {
        elementToSet[propertyPathSegments[propertyPathSegments.length - 1]] = value
    }
    return object
}

const getPropertyFromPropertyPath = (propertyPath, ratingType, model) => {
    const ratingTypeProperties = getRatingTypeProperties(ratingType, model, true)
    let property
    for (let i = 0; i < ratingTypeProperties.length; i++) {
        if (ratingTypeProperties[i].propertyPath == propertyPath) {
            property = ratingTypeProperties[i].property
            break
        }
    }
    return property
}

function getRatingTypeProperties(ratingType, model, includeObjectType = true) { // model = getData().model
    let theRatingType = ratingType
    if (typeof (theRatingType) == "string") {
        theRatingType = model?.ratingTypes[ratingType]
    }
    let properties = []
    if (includeObjectType) {
        properties = properties.concat(Object.keys(theRatingType.objectType.properties).map(
            (propertyName) => {
                return {
                    propertyPath: `object.${propertyName}`,
                    propertyScope: "object",
                    property: theRatingType.objectType.properties[propertyName]
                };
            }))
    }
    properties = properties.concat(
        Object.keys(theRatingType.properties).map(
            (propertyName) => {
                return {
                    propertyPath: `${propertyName}`,
                    propertyScope: "rating",
                    property: theRatingType.properties[propertyName]
                };
            })
    )
    return properties
}

const getAllKeysMappedToValue = (object, value) => {
    return Object.keys(object).filter(key => object[key] === value);
}

const showOrHideElement = (elementId, show) => {
    var x = document.getElementById(elementId);
    x.style.display = show ? "block" : "none"
}

const getDateTimeString = (timestampInMS) => {
    const time = new Date(timestampInMS)
    return `${time.getUTCHours()}:${(time.getMinutes() + "").padStart(2, '0')} ${time.getUTCDay()}-${time.getUTCMonth()}-${time.getUTCFullYear()}`
}

const setTextOnElement = (elementId, text) => {
    const element = document.getElementById(elementId)
    if (element != null) {
        element.innerText = text
    }
}

const getElementValue = (elementId) => {
    const element = document.getElementById(elementId)
    return element?.value
}

const populateSelect = (selectElementId, data, defaultValue = null) => { // data is array objects with two properties : label and value
    let dropdown = document.getElementById(selectElementId);

    dropdown.length = 0;

    let defaultOption = document.createElement('option');
    defaultOption.text = 'Choose ...';
    defaultOption.value = -1;

    dropdown.add(defaultOption);
    dropdown.selectedIndex = 0;

    let option;
    for (let i = 0; i < data.length; i++) {
        option = document.createElement('option');
        option.text = data[i].label;
        option.value = data[i].value;
        dropdown.add(option);
        if (defaultValue != null && defaultValue == data[i].value) {
            dropdown.selectedIndex = i + 1 //option.inxdex 
        }

    }
}

const populateFontsList = (fontsListElementId) => {
    const fontsList = []
    fontsList.push(`Georgia, serif`)
    fontsList.push(`Gill Sans, sans-serif;`)
    fontsList.push(`sans-serif`)
    fontsList.push(`serif`)
    fontsList.push(`cursive`)
    fontsList.push(`system-ui`)
    fontsList.push(`Helvetica`)
    fontsList.push(`Arial`)
    fontsList.push(`Verdana`)
    fontsList.push(`Calibri`)
    fontsList.push(`Lucida Sans`)
    fontsList.push(`"Century Gothic"`)
    fontsList.push(`Candara`)
    fontsList.push(`Futara`)
    fontsList.push(`Geneva`)
    fontsList.push(`"Times New Rowman"`)
    fontsList.push(`Cambria`)
    fontsList.push(`"Courier New"`)

    populateDatalistFromValueSet(fontsListElementId, fontsList)
}

const populateShapesList = (shapesListElementId) => {
    const shapesList = []
    shapesList.push(`circle`)
    shapesList.push(`diamond`)
    shapesList.push(`square`)
    shapesList.push(`triangle`)
    shapesList.push(`ring`)
    shapesList.push(`star`)

    populateDatalistFromValueSet(shapesListElementId, shapesList)
}


const undefinedToDefined = (value, definedValue = "") => {
    let derivedValue = (typeof value == 'undefined') ? definedValue : value
    return derivedValue
}

function populateDatalistFromValueSet(listId, listOfDistinctValues) {
    let listElement = document.getElementById(listId)
    if (listElement == null) {
        listElement = document.createElement("datalist")
        listElement.setAttribute("id", listId)
        document.body.appendChild(listElement)
    }
    //remove current contents
    listElement.length = 0
    listElement.innerHTML = null
    let option
    for (let value of listOfDistinctValues) {
        option = document.createElement('option')
        option.value = value
        listElement.appendChild(option)
    }
}


const createAndPopulateDataListFromBlipProperties = (listId, propertyPath, blips, additionalValues = []) => {

    const listOfDistinctValues = new Set()
    for (let i = 0; i < blips.length; i++) {
        const blip = blips[i]
        listOfDistinctValues.add(getNestedPropertyValueFromObject(blip.rating, propertyPath))
    }
    for (let i = 0; i < additionalValues?.length; i++) {
        listOfDistinctValues.add(additionalValues[i])
    }
    populateDatalistFromValueSet(listId, listOfDistinctValues)
}


const initializeImagePaster = (handleImagePaste, pasteAreaElementId) => {
    document.getElementById(pasteAreaElementId).onpaste = function (event) {
        // use event.originalEvent.clipboard for newer chrome versions
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        //  console.log(JSON.stringify(items)); // will give you the mime types
        // find pasted image among pasted items
        let blob = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
            }
        }
        // load image content and assign to background image for currently selected object (sector or ring)
        if (blob !== null) {
            const reader = new FileReader();
            reader.onload = function (event) {
                if (handleImagePaste) handleImagePaste(event.target.result)
            };
            reader.readAsDataURL(blob);
        }
    }

}

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}