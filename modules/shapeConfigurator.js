export { launchShapeConfigurator }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { launchShapeEditor } from './shapeEditing.js'
import { getListOfSupportedShapes, capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'





const launchShapeConfigurator = (viewpoint, drawRadarBlips) => {
    const shapeVisualMap = viewpoint.propertyVisualMaps["shape"]
    //const valueOccurrenceMap = getPropertyValuesAndCounts(shapeVisualMap["property"], getData().ratings) // TODO only ratings of proper rating type!!
    const valueOccurrenceMap = (shapeVisualMap == null || shapeVisualMap["property"] == null) ? null : getValueOccurrenceMap(shapeVisualMap["property"], viewpoint, true);
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Shapes")
    document.getElementById("shapeConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model)

    // populate list with all discrete properties plus properties of type tag
    const candidateMappedProperties = ratingTypeProperties
        .filter((property) => property.property?.discrete || property.property?.allowableValues?.length > 0 || property.property.type == "tags")
        .map((property) => { return { label: property.propertyPath, value: property.propertyPath } })

    let html = ``
    html += `<label for="shapesTitle">Title (meaning of shapes dimension)</label>
             <input type="text" id="shapesTitle" value="${viewpoint.template.shapesConfiguration.label}"></input><br /><br />`

    html += `<label for="mappedPropertySelector">Rating property to map to shape</label> 
             <select id="mappedPropertySelector" ></select><span id="refreshShapes" style="padding:20px">Refresh Shape Mapping</span>  <br/>`

    html += `<input type="button" id="addShapeButton"  value="Add Shape"  style="padding:6px;margin:10px"/>`

    html += `<table id="shapes">`
    html += `<tr><th>Shape</th><th>Shape Label</th><th>Mapped Values</th><th>Current Count</th><th><span id="showAll" >Visible</span></th><th>Delete?</th><th>v ^</th></tr>`
    for (let i = 0; i < viewpoint.template.shapesConfiguration.shapes.length; i++) {
        const shape = viewpoint.template.shapesConfiguration.shapes[i]
        const mappedShapePropertyValues = getAllKeysMappedToValue(shapeVisualMap.valueMap, i)
        // find out how many occurrences of this value exist? 



        html += `<tr>
        <td><span id="editShape${i}" class="clickableProperty">${shape.shape}</span> </td>
        <td><span id="editShape${i}" class="clickableProperty">${shape.label}</span> </td>
        <td>`
        let valueCount = 0
        for (let j = 0; j < mappedShapePropertyValues.length; j++) {
            html += `
        <span id="tag0" class="extra tagfilter dropbtn">${mappedShapePropertyValues[j]} (${undefinedToDefined(valueOccurrenceMap[mappedShapePropertyValues[j]], 0)})</span>`
            valueCount += undefinedToDefined(valueOccurrenceMap[mappedShapePropertyValues[j]], 0)
        }
        html += `</td>
        <td>${valueCount} </td>
        <td><input id="showShape${i}" type="checkbox" ${shape?.visible == false ? "" : "checked"}></input></td> 
        <td><span id="deleteShape${i}" class="clickableProperty">Delete</span></td> 
        <td><span id="downShape${i}" class="clickableProperty">${i < viewpoint.template.shapesConfiguration.shapes.length - 1 ? "v" : ""}</span>&nbsp;
        <span id="upShape${i}" class="clickableProperty">${i > 0 ? "^" : ""}</span></td> 
        </tr> `

    }
    html += `</table>`


    contentContainer.innerHTML = `${html}<br/> <br/><br/>`

    // add event listeners
    for (let i = 0; i < viewpoint.template.shapesConfiguration.shapes.length; i++) {
        document.getElementById(`showShape${i}`).addEventListener("change", (e) => {
            viewpoint.template.shapesConfiguration.shapes[i].visible = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })

        document.getElementById(`editShape${i}`).addEventListener("click", () => {
            launchShapeEditor(i, viewpoint, drawRadarBlips)

            // hideMe() // show the main editor?
        })
        document.getElementById(`downShape${i}`).addEventListener("click", () => {
            backShape(i, viewpoint)
        })
        document.getElementById(`upShape${i}`).addEventListener("click", () => {
            upShape(i, viewpoint)
        })
        document.getElementById(`deleteShape${i}`).addEventListener("click", () => {
            viewpoint.template.shapesConfiguration.shapes.splice(i, 1)
            // remove from propertyVisualMap all value mappings to this shape and decrease the shape reference for any entry  higher than i
            const valueMap = shapeVisualMap.valueMap
            for (let j = 0; j < Object.keys(valueMap).length; j++) {
                console.log(`evaluate mapping for ${Object.keys(valueMap)[j]}; shape = ${valueMap[Object.keys(valueMap)[j]]}`)
                if (valueMap[Object.keys(valueMap)[j]] == i) {
                    console.log(`delete mapping for ${Object.keys(valueMap)[j]}`)
                    delete valueMap[Object.keys(valueMap)[j]];
                }

                if (valueMap[Object.keys(valueMap)[j]] > i) {
                    valueMap[Object.keys(valueMap)[j]] = valueMap[Object.keys(valueMap)[j]] - 1;
                    console.log(`reassign mapping for ${Object.keys(valueMap)[j]}`)
                }
            }
            launchShapeConfigurator(viewpoint)
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()

        })
    }
    populateSelect("mappedPropertySelector", candidateMappedProperties, shapeVisualMap["property"])   // data is array objects with two properties : label and value
    document.getElementById(`mappedPropertySelector`).addEventListener("change", (e) => {
        reconfigureShapes(e.target.value, viewpoint)
    })
    document.getElementById(`refreshShapes`).addEventListener("click", () => { refreshShapeConfiguration(viewpoint) })

    document.getElementById(`showAll`).addEventListener("click", (e) => {
        viewpoint.template.shapesConfiguration.shapes.forEach((shape, i) => {
            shape.visible = true;
            document.getElementById(`showShape${i}`).checked = true
        })

        publishRadarEvent({ type: "shuffleBlips" })
        publishRefreshRadar()

    })
    document.getElementById(`addShapeButton`).addEventListener("click", (e) => {
        const newShape = {
            label: "NEW SHape",
            labelSettings: { color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
        }
        viewpoint.template.shapesConfiguration.shapes.push(newShape)
        launchShapeEditor(viewpoint.template.shapesConfiguration.shapes.length - 1, viewpoint, drawRadarBlips)


    })
    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = ` <input id="saveShapeEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveShapeEdits").addEventListener("click",
        (event) => {
            console.log(`save shape  `)
            viewpoint.template.shapesConfiguration.label = getElementValue('shapesTitle')
            showOrHideElement('modalMain', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })





}

const backShape = (shapeToMoveBack, viewpoint) => {
    const shapeToMove = viewpoint.template.shapesConfiguration.shapes[shapeToMoveBack]
    viewpoint.template.shapesConfiguration.shapes[shapeToMoveBack] = viewpoint.template.shapesConfiguration.shapes[shapeToMoveBack + 1]
    viewpoint.template.shapesConfiguration.shapes[shapeToMoveBack + 1] = shapeToMove
    const shapeVisualMap = viewpoint.propertyVisualMaps["shape"]
    // update in propertyVisualMap all value mappings to either of these shapes
    const valueMap = shapeVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == shapeToMoveBack) {
            valueMap[Object.keys(valueMap)[j]] = shapeToMoveBack + 1
        } else if (valueMap[Object.keys(valueMap)[j]] == shapeToMoveBack + 1) {
            valueMap[Object.keys(valueMap)[j]] = shapeToMoveBack
        }
    }
    launchShapeConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const upShape = (shapeToMoveUp, viewpoint) => {
    const shapeToMove = viewpoint.template.shapesConfiguration.shapes[shapeToMoveUp]
    viewpoint.template.shapesConfiguration.shapes[shapeToMoveUp] = viewpoint.template.shapesConfiguration.shapes[shapeToMoveUp - 1]
    viewpoint.template.shapesConfiguration.shapes[shapeToMoveUp + -1] = shapeToMove
    const shapeVisualMap = viewpoint.propertyVisualMaps["shape"]
    // update in propertyVisualMap all value mappings to either of these shapes
    const valueMap = shapeVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == shapeToMoveUp) {
            valueMap[Object.keys(valueMap)[j]] = shapeToMoveUp - 1
        } else if (valueMap[Object.keys(valueMap)[j]] == shapeToMoveUp - 1) {
            valueMap[Object.keys(valueMap)[j]] = shapeToMoveUp
        }
    }
    launchShapeConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}


const refreshShapeConfiguration = (viewpoint) => {
    reconfigureShapes(viewpoint.propertyVisualMaps["shape"]["property"], viewpoint)
}

const reconfigureShapes = (propertyPath, viewpoint) => {
    const shapeVisualMap = viewpoint.propertyVisualMaps["shape"]
    shapeVisualMap["property"] = propertyPath

    const valueOccurrenceMap = getValueOccurrenceMap(viewpoint.propertyVisualMaps["shape"].property, viewpoint, true);
    // TODO cater for tags in getPropertyValuesAndCounts

    // remove entries from valueMap
    shapeVisualMap.valueMap = {}
    viewpoint.template.shapesConfiguration.shapes = []
    const shapes = getListOfSupportedShapes()

    // create new entries for values in valueOccurrenceMap
    for (let i = 0; i < Object.keys(valueOccurrenceMap).length; i++) {
        const allowableLabel = getLabelForAllowableValue(Object.keys(valueOccurrenceMap)[i], viewpoint.propertyVisualMaps["shape"].property, viewpoint)
        const newShape = {
            label: allowableLabel ?? capitalize(Object.keys(valueOccurrenceMap)[i]),
            width: 1 / Object.keys(valueOccurrenceMap).length,
            labelSettings: { color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
            edge: { color: "#000000", width: 1 },
            backgroundImage: {},
            backgroundColor: "#FFFFFF",
            outershapeBackgroundColor: "#FFFFFF",
            shape: i < shapes.length ? shapes[i] : shapes[0]
        }

        viewpoint.template.shapesConfiguration.shapes.push(newShape)

        shapeVisualMap.valueMap[Object.keys(valueOccurrenceMap)[i]] = i // map value to numerically corresponding shape
    }


    launchShapeConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()

}

const getLabelForAllowableValue = (value, propertyPath, viewpoint) => {
    let ratingType = viewpoint.ratingType;
    if (typeof (ratingType) == "stshape") {
        ratingType = getData().model?.ratingTypes[ratingType];
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model);
    let shapeProperty = ratingTypeProperties.filter((property) => property.propertyPath == propertyPath)[0];

    for (let i = 0; i < shapeProperty.property?.allowableValues?.length; i++) {
        if (shapeProperty.property?.allowableValues[i].value == value) return shapeProperty.property?.allowableValues[i].label
    }
    return null
}

const hideMe = () => {
    showOrHideElement("modalMain", false); publishRefreshRadar()
}
function getValueOccurrenceMap(propertyPath, viewpoint, includeAllowableValues = false) {
    const model = getData().model
    const focusRatingTypeName = typeof (viewpoint.ratingType) == "object" ? viewpoint.ratingType.name : viewpoint.ratingType
    let shapeProperty = getPropertyFromPropertyPath(propertyPath, viewpoint.ratingType, model)
    let valueOccurrenceMap
    if (shapeProperty.type == "tags") {
        valueOccurrenceMap = {}
        for (let i = 0; i < Object.keys(getData().ratings).length; i++) {
            const rating = getData().ratings[Object.keys(getData().ratings)[i]]
            if (rating.ratingType == focusRatingTypeName) {
                const tags = getNestedPropertyValueFromObject(rating, propertyPath)
                tags.forEach((tag) => {
                    const currentCount = valueOccurrenceMap[tag] ?? 0
                    valueOccurrenceMap[tag] = currentCount + 1
                })
            }
        }
    }
    else {
        valueOccurrenceMap = getPropertyValuesAndCounts(propertyPath, getData().ratings, focusRatingTypeName);
        if (includeAllowableValues) {
            for (let i = 0; i < shapeProperty.allowableValues?.length; i++) {
                valueOccurrenceMap[shapeProperty.allowableValues[i].value] = valueOccurrenceMap[shapeProperty.allowableValues[i].value] ?? 0;
            }
        }
    }
    return valueOccurrenceMap;
}

