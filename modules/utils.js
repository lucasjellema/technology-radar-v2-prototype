export {
    isOperationBlackedOut, uuidv4, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject
    , getRatingTypeProperties, getElementValue, showOrHideElement,toggleShowHideElement, getDateTimeString
    , populateSelect, getAllKeysMappedToValue, createAndPopulateDataListFromBlipProperties
    , populateFontsList, populateDataTypesList, populateShapesList,populateColorsList,populateSizesList, setTextOnElement, initializeImagePaster, undefinedToDefined, capitalize
    , getPropertyValuesAndCounts, populateDatalistFromValueSet, getPropertyFromPropertyPath
    , findDisplayProperty, getListOfSupportedShapes, getListOfSupportedColors, getListOfSupportedSizes, getLabelForAllowableValue, getUniqueFieldValues
    ,filterBlip, assignBlipsToSegments,findSectorForRating, supportedShapes, populateDerivationFunctionList
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



const getLabelForAllowableValue = (value, allowableValues) => {
    let label = ""
    for (let i = 0; i < allowableValues.length; i++) {
        if (allowableValues[i].value == value) { label = allowableValues[i].label; break }
    }
    return label
}

const getPropertyValuesAndCounts = (propertyPath, ratings, ratingTypeName = null) => { // filter on rating type!
    const valueOccurenceMap = {}
    for (let i = 0; i < Object.keys(ratings).length; i++) {
        const rating = ratings[Object.keys(ratings)[i]]
        if (ratingTypeName == null || rating.ratingType == ratingTypeName || rating.ratingType?.name == ratingTypeName ) {
            const value = getNestedPropertyValueFromObject(rating, propertyPath)
            const currentCount = valueOccurenceMap[value] ?? 0
            valueOccurenceMap[value] = currentCount + 1
        }
    }
    return valueOccurenceMap
}


const uuidv4 = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// also see: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path
const getNestedPropertyValueFromObject = (object, propertyPath) => {
    let value = null
    try {
    const propertyPathSegments = propertyPath.split('.')
    value = object
    for (let i = 0; i < propertyPathSegments.length; i++) {
        if (value == null) break
        value = value[propertyPathSegments[i]]
    }
    if (typeof value == 'undefined') value = null
} catch (e) {console.error(`handled exception in getNestedPropertyValueFromObject ${e} for ${propertyPath}`)}
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

function getUniqueFieldValues(objects, property) {
    return objects.reduce((values, object) => {
        const value = object[property];
        if (value != null && value.length > 0) { values.add(value); }
        return values;
    }, new Set());
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
                    propertyName: propertyName,
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

                    propertyName: propertyName,
                    property: theRatingType.properties[propertyName]
                };
            })
    )
    return properties
}


const findDisplayProperty = (properties) => {
    let displayProperty
    for (let i = 0; i < Object.keys(properties).length; i++) {
        const property = properties[Object.keys(properties)[i]]
        if (i == 0 || (property.displayLabel != null && property.displayLabel)) { // i==0 is to provide a default value in case no property is designated as displayLabel
            displayProperty = property
            displayProperty.key = Object.keys(properties)[i]
            displayProperty.name = Object.keys(properties)[i]
            break
        }
    }
    return displayProperty
}

const getAllKeysMappedToValue = (object, value) => {
    let result = []
    try {
    result = Object.keys(object).filter(key => object[key] === value);
    } catch (e) {console.log(`getAllKeysMappedToValue - handled exception ${e} `)}
    return result
}

const showOrHideElement = (elementId, show) => {
    var x = document.getElementById(elementId);
    x.style.display = show ? "block" : "none"
}
const toggleShowHideElement = (elementId) => {
    var x = document.getElementById(elementId);
    x.style.display = (x.style.display=="none") ? "block" : "none"
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

const populateDataTypesList = (datatypesListElementId, value = "string") => {
    const datatypesList = []
    datatypesList.push({ label: `String`, value: `string` })
    datatypesList.push({ label: `Text`, value: `text` })
    datatypesList.push({ label: `URL`, value: `url` })
    datatypesList.push({ label: `Number`, value: `number` })
    datatypesList.push({ label: `Image`, value: `image` })
    datatypesList.push({ label: `Time`, value: `time` })
    datatypesList.push({ label: `Tags`, value: `tags` })

    populateSelect(datatypesListElementId, datatypesList, value)
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


const populateDerivationFunctionList = (derivationFunctionListElementId) => {
    const functionsList = []
    functionsList.push(`Years Ago from Time`)
    functionsList.push(`Months Ago from Time`)
    functionsList.push(`Days Ago from Time`)
    functionsList.push(`Year from Time`)
    functionsList.push(`Quarter + Year from Time`)
    functionsList.push(`Month + Year from Time`)
    functionsList.push(`Name of Month from Time`)
    functionsList.push(`Week Number + Year from Time`)
    functionsList.push(`Name of Weekday from Time`)
    functionsList.push(`Day of Month from Time`)
    functionsList.push(`Part of Day from Time`)
    functionsList.push(`Hour from Time`)
    functionsList.push(`Value Map (convert base property value)`)
    functionsList.push(`Range Map (map property value to predefined range)`)
    functionsList.push(`JavaScript Expression`)
    
    
    populateDatalistFromValueSet(derivationFunctionListElementId, functionsList)
    
}

const populateColorsList = (colorsListElementId) => {

    populateDatalistFromValueSet(colorsListElementId, getListOfSupportedColors())
}

const getListOfSupportedColors = () => {
    const colorsList = []
    colorsList.push(`#ff0000`) // red
    colorsList.push(`#ffff00`) // yellow
    colorsList.push(`#00ff00`) // green
    colorsList.push(`#00ccff`) // medium blue
    colorsList.push(`#ff00ff`) // pink
    colorsList.push(`#00b300`) // darker green
    colorsList.push(`#0059b3`) // darker blue
    colorsList.push(`#ff9900`) // orange
    colorsList.push(`#ffcccc`) // salmon
    colorsList.push(`#990099`) // fairly deep purple
    colorsList.push(`#d9d9d9`) // light grey
    colorsList.push(`#666666`) // dark grey
    colorsList.push(`#992600`) // dark red
    
    
    return colorsList
}


const populateSizesList = (sizesListElementId) => {

    populateDatalistFromValueSet(sizesListElementId, getListOfSupportedSizes())
}

const getListOfSupportedSizes = () => {
    const sizesList = []
    sizesList.push(1) 
    sizesList.push(0.8) 
    sizesList.push(1.2) 
    sizesList.push(0.5) 
    sizesList.push(1.8) 
    sizesList.push(2) 
    sizesList.push(2.5) 
    sizesList.push(0.2) 

    return sizesList
}


const populateShapesList = (shapesListElementId) => {

    populateDatalistFromValueSet(shapesListElementId, getListOfSupportedShapes())
}

const getListOfSupportedShapes = () => {
    const shapesList = Object.keys(supportedShapes)
    return shapesList
}

const supportedShapes = {
    circle: {},
    diamond: {},
    square: {},
    triangle: {},
    plus: {},
    rectangleHorizontal: {},
    rectangleVertical: {},
    star: {},
    leftArrow: {externalShape:true, symbolId:"icon-arrow-thick-left", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}   , 
    downArrow: {externalShape:true, symbolId:"icon-arrow-thick-down", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}    ,
    upArrow: {externalShape:true, symbolId:"icon-arrow-thick-up", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}    ,
    rightArrow: {externalShape:true, symbolId:"icon-arrow-thick-right", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}, 
    rightCheveron: {externalShape:true, symbolId:"icon-cheveron-right", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}, 
    leftCheveron: {externalShape:true, symbolId:"icon-cheveron-left", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}, 
    upCheveron: {externalShape:true, symbolId:"icon-cheveron-up", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}, 
    downCheveron: {externalShape:true, symbolId:"icon-cheveron-down", externalFile:"shape-definitions.svg", scaleFactor:1, viewBoxSize:20}, 
    happySmiley: {externalShape:true, symbolId:"icon-mood-happy-outline", externalFile:"shape-definitions.svg", scaleFactor:0.7, viewBoxSize:20}, 
    neutralSmiley: {externalShape:true, symbolId:"icon-mood-neutral-outline", externalFile:"shape-definitions.svg", scaleFactor:0.7, viewBoxSize:20}, 
    sadSmiley: {externalShape:true, symbolId:"icon-mood-sad-outline", externalFile:"shape-definitions.svg", scaleFactor:0.7, viewBoxSize:20}, 
    location: {externalShape:true, symbolId:"icon-location", externalFile:"shape-definitions.svg", scaleFactor:0.8, viewBoxSize:20}, 
    cloud: {externalShape:true, symbolId:"icon-cloud", externalFile:"shape-definitions.svg", scaleFactor:0.7, viewBoxSize:20}, 
    ring: {externalShape:true, symbolId:"icon-radio-unchecked", externalFile:"shape-definitions.svg", scaleFactor:0.55, viewBoxSize:20}, 
    
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


const filterBlip = (blip, viewpoint, data) => {
    // console.log(`filter blip ${blip.rating.object.label} with tagfilter ${viewpoint.blipDisplaySettings.tagFilter}`)
    // determine all tags in the tag filter  - for now as individual strings, no + or - support TODO
    let blipOK = viewpoint.blipDisplaySettings.tagFilter?.length == 0 // no filter - then blip is ok 
    if (viewpoint.blipDisplaySettings.tagFilter?.length ?? 0 > 0) {

        let ratingTypeProperties = getRatingTypeProperties(viewpoint.ratingType, data.model)

        // populate list with all discrete properties plus properties of type tag
        const discretePropertyPaths = ratingTypeProperties
            .filter((property) => (property.property?.discrete || property.property?.allowableValues?.length > 0))
            .map((property) => { return property.propertyPath })

        //if all tags are minus filter, then are starting assumption is that the blip is ok
        const minusFiltercount = viewpoint.blipDisplaySettings.tagFilter.reduce(
            (sum, tagFilter) => sum + (tagFilter.type == 'minus' ? 1 : 0)
            , 0)
        blipOK = viewpoint.blipDisplaySettings.tagFilter?.length == minusFiltercount
        try {
            for (let i = 0; i < viewpoint.blipDisplaySettings.tagFilter.length; i++) {
                const filter = viewpoint.blipDisplaySettings.tagFilter[i]
                try {
                    let blipHasFilter
                    if (filter.tag.startsWith('"')) {
                        const labelProperty = viewpoint.propertyVisualMaps.blip?.label
                        const blipLabel = getNestedPropertyValueFromObject(blip.rating, labelProperty).toLowerCase()
                        const filterTag = filter.tag.replace(/^"+|"+$/g, '').toLowerCase()

                        blipHasFilter = blipLabel.includes(filterTag)
                    } else {
                        blipHasFilter = JSON.stringify(blip.rating.object.tags)?.toLowerCase()?.trim()?.indexOf(filter.tag) > -1

                        // TODO derive discrete properties dynamically from data.model instead of hard coded

                        //  const discretePropertyPaths = ["object.category", "object.offering", "object.vendor", "scope", "ambition", "author"]
                        for (let j = 0; !blipHasFilter && j < discretePropertyPaths.length; j++) {
                            blipHasFilter = getNestedPropertyValueFromObject(blip.rating, discretePropertyPaths[j])?.toLowerCase().trim() == filter.tag
                        }
                    }


                    // minus filter: if tag is in rating.object.tags then blip is not ok  
                    if (blipHasFilter && filter.type == "minus") {
                        blipOK = false; break;
                    }

                    // must filter: if the tag is not in rating.object.tags then the blip cannot be ok
                    if (!blipHasFilter && filter.type == "must") {
                        blipOK = false; break;
                    }
                    if (blipHasFilter && filter.type == "plus") {
                        blipOK = true
                    }

                } catch (e) { console.log(`${e} exception filter for ${JSON.stringify(blip)}`) }
            }
        } catch (e) { console.log(`exception in filter blip ${JSON.stringify(e)} ${e}`) }
    }

    return blipOK
}

const findSegmentForRating = (rating, viewpoint, blipDrawingContext,data) => {
    let blipSector = findSectorForRating(rating, viewpoint,data)
    if (blipSector == null) {
        if (blipDrawingContext.othersDimensionValue["sector"] != null) {
            blipSector = blipDrawingContext.othersDimensionValue["sector"]
        }
        else {
            //
        }
    }
    const propertyMappedToRing = viewpoint.propertyVisualMaps.ring.property
    let blipRing = viewpoint.propertyVisualMaps.ring.valueMap[getNestedPropertyValueFromObject(rating, propertyMappedToRing)]
    if (blipRing == null) {
        if (blipDrawingContext.othersDimensionValue["ring"] != null) {
            blipRing = blipDrawingContext.othersDimensionValue["ring"]
        }
        else {
            blipRing = -1
            // in case of rings we accept blips not associated with any "real ring" - directly or indirect through Others
        }
    }
    return { sector: blipSector, ring: blipRing }
}

function assignBlipsToSegments(filteredBlips, viewpoint, blipDrawingContext,data) {
    filteredBlips.forEach((blip) => {
        const segment = findSegmentForRating(blip.rating, viewpoint, blipDrawingContext,data)
        if (segment.sector != null
            &&
            (segment.ring >= 0 || (segment.ring == -1 && viewpoint.blipDisplaySettings.showRingMinusOne != false))) {
            blipDrawingContext.segmentMatrix[segment.sector][segment.ring].blips.push(blip)
        }
    })
}


const findSectorForRating = (rating, viewpoint, data) => {
    const propertyMappedToSector = viewpoint.propertyVisualMaps.sector.property
    let sectorProperty = getPropertyFromPropertyPath(propertyMappedToSector, viewpoint.ratingType, data.model)
    let sector
    const propertyValue = getNestedPropertyValueFromObject(rating, propertyMappedToSector)
    if (sectorProperty.type == "tags") {
        for (let i = 0; i < propertyValue.length; i++) {
            sector = viewpoint.propertyVisualMaps.sector.valueMap[propertyValue[i]]
            if (sector != null) break // stop looking as soon as one of the tags has produced a sector. The order of tags can be important
        }
    } else {
        sector = viewpoint.propertyVisualMaps.sector.valueMap[propertyValue]
    }
    return sector
}


