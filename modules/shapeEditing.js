export { launchShapeEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar, getDistinctTagValues } from './data.js';
import { populateShapesList, populateDatalistFromValueSet, getPropertyFromPropertyPath, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'




const renderMappedPropertiesEditor = (containerElement, mappedPropertyValues) => {
    containerElement.innerHTML = ""
    for (let i = 0; i < mappedPropertyValues.length; i++) {
        const innerHTML = `<div class="dropup">
     <span id="tag0" class="extra tagfilter dropbtn">${mappedPropertyValues[i]}</span>
     <div class="dropup-content">
         <a href="#" id="removeBlipTag${i}">Remove</a>
     </div>`

        const div = document.createElement('div');
        div.className = "dropup"
        div.innerHTML = innerHTML
        containerElement.appendChild(div)
        document.getElementById(`removeBlipTag${i}`).addEventListener("click"
            , () => {
                mappedPropertyValues.splice(i, 1);
                renderMappedPropertiesEditor(containerElement, mappedPropertyValues)
            })
    }
}

let mappedShapePropertyValues
const launchShapeEditor = (shapeToEdit, viewpoint, drawRadarBlips) => {
    const shapeVisualMap = viewpoint.propertyVisualMaps["shape"]

    // find all values mapped to the shapeToEdit
    mappedShapePropertyValues = getAllKeysMappedToValue(shapeVisualMap.valueMap, shapeToEdit)

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingProperties = getRatingTypeProperties(ratingType, getData().model)
    let shapeProperty = ratingProperties.filter((property) => property.propertyPath == shapeVisualMap["property"])[0]



    showOrHideElement("modalEditor", true)
    const shape = viewpoint.template.shapesConfiguration.shapes[shapeToEdit]
    setTextOnElement('modalEditorTitle', `Edit Shape ${shape.label}`)
    console.log(`editing shape ${JSON.stringify(shape)}`)
    const contentContainer = document.getElementById("modalContentContainer")
    let html = `<table id="basicShapeProperties">`
    html += `<tr><td><label for="properties">Values for ${shapeProperty.property.label} mapped to this shape</label></td>
    <td><input id="shapePropertyValue" list="shapePropertyValueList" value=""></input>
    <input type="button" id="addMappedPropertyValue" name="addTag" value="Add Value" />
    </td><td id="mappedPropertiesContainer"></td>
    </td></tr>`


    html += `<tr><td rowspan="1"><label for="shapeLabel">Label</label></td><td><input id="shapeLabel" type="text" value="${shape.label}"></input></td>

    </tr>`
    html += `<tr><td><label for="actualShape">Shape</label></td><td>
    <input id="actualShape" list="shapesList" value="${shape.shape}"></input>
    </td></tr>
`
    html += `<tr><td><label for="showShape">Visible?</label></td><td><input id="showShape" type="checkbox" ${shape?.visible == false ? "" : "checked"}></input></td></tr>`
    html += `</table><br/>`


    contentContainer.innerHTML = `${html}
    `
    populateShapesList("shapesList")
    if (getPropertyFromPropertyPath(shapeVisualMap["property"], viewpoint.ratingType, getData().model).type == "tags") {
        populateDatalistFromValueSet(`shapePropertyValueList`, getDistinctTagValues(viewpoint))

    } else {
        const allowablesValues = shapeProperty.property?.allowableValues?.map((allowableValue) => allowableValue.value)
        createAndPopulateDataListFromBlipProperties(`shapePropertyValueList`, shapeVisualMap["property"], viewpoint.blips, allowablesValues)
    }

    renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedShapePropertyValues)
    document.getElementById("addMappedPropertyValue").addEventListener("click",
        (event) => {
            const propertyValue = document.getElementById("shapePropertyValue").value
            document.getElementById("shapePropertyValue").value = ""
            mappedShapePropertyValues.push(propertyValue)
            renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedShapePropertyValues)
        })


    const buttonBar = document.getElementById("modalButtonBar")
    buttonBar.innerHTML = `<input id="launchMainEditor" type="button" value="Main Editor"></input> <input id="saveShapeEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveShapeEdits").addEventListener("click",
        (event) => {
            console.log(`save shape edits for ${shape} `)
            saveShape(shapeToEdit, shape, viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })

    document.getElementById("launchMainEditor").addEventListener("click", () => {
        hideMe()

        publishRadarEvent({ type: "mainRadarConfigurator", tab: "shape" })
    })

}
const saveShape = (shapeToEdit, shape, viewpoint) => {
    console.log(`save changes to shape`)
    const shapeVisualMap = viewpoint.propertyVisualMaps["shape"]

    shape.visible = document.getElementById("showShape").checked
    shape.shape = getElementValue('actualShape')

    const valueMap = viewpoint.propertyVisualMaps["shape"].valueMap
    // remove all entries from valueMap with value shape (sequence)
    getAllKeysMappedToValue(shapeVisualMap.valueMap, shapeToEdit).forEach((key) => delete shapeVisualMap.valueMap[key])
    mappedShapePropertyValues.forEach((value) => { valueMap[value] = shapeToEdit })
    publishRefreshRadar()
}


const hideMe = () => {
    showOrHideElement("modalEditor", false)
}
