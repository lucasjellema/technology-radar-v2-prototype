export { launchColorEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar, getDistinctTagValues } from './data.js';
import { populateColorsList, populateDatalistFromValueSet, getPropertyFromPropertyPath, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'




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

let mappedColorPropertyValues
const launchColorEditor = (colorToEdit, viewpoint, drawRadarBlips) => {
    const colorVisualMap = viewpoint.propertyVisualMaps["color"]

    // find all values mapped to the colorToEdit
    mappedColorPropertyValues = getAllKeysMappedToValue(colorVisualMap.valueMap, colorToEdit)

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingProperties = getRatingTypeProperties(ratingType, getData().model)
    let colorProperty = ratingProperties.filter((property) => property.propertyPath == colorVisualMap["property"])[0]



    showOrHideElement("modalEditor", true)
    const color = viewpoint.template.colorsConfiguration.colors[colorToEdit]
    setTextOnElement('modalEditorTitle', `Edit Color ${color.label}`)
    console.log(`editing color ${JSON.stringify(color)}`)
    const contentContainer = document.getElementById("modalContentContainer")
    let html = `<table id="basicColorProperties">`
    html += `<tr><td><label for="properties">Values for ${colorProperty.property.label} mapped to this color</label></td>
    <td><input id="colorPropertyValue" list="colorPropertyValueList" value=""></input>
    <input type="button" id="addMappedPropertyValue" name="addTag" value="Add Value" />
    </td><td id="mappedPropertiesContainer"></td>
    </td></tr>`


    html += `<tr><td rowspan="1"><label for="colorLabel">Label</label></td><td><input id="colorLabel" type="text" value="${color.label}"></input></td>

    </tr>`
    html += `<tr><td><label for="actualColor">Color</label></td><td>
    <input id="actualColor" type="color" value="${color.color}"></input>
    </td></tr>
`
    html += `<tr><td><label for="showColor">Visible?</label></td><td><input id="showColor" type="checkbox" ${color?.visible == false ? "" : "checked"}></input></td></tr>`
    html += `</table><br/>`


    contentContainer.innerHTML = `${html}
    `
    populateColorsList("colorsList")
    if (getPropertyFromPropertyPath(colorVisualMap["property"], viewpoint.ratingType, getData().model).type == "tags") {
        populateDatalistFromValueSet(`colorPropertyValueList`, getDistinctTagValues(viewpoint))

    } else {
        const allowablesValues = colorProperty.property?.allowableValues?.map((allowableValue) => allowableValue.value)
        createAndPopulateDataListFromBlipProperties(`colorPropertyValueList`, colorVisualMap["property"], viewpoint.blips, allowablesValues)
    }

    renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedColorPropertyValues)
    document.getElementById("addMappedPropertyValue").addEventListener("click",
        (event) => {
            const propertyValue = document.getElementById("colorPropertyValue").value
            document.getElementById("colorPropertyValue").value = ""
            mappedColorPropertyValues.push(propertyValue)
            renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedColorPropertyValues)
        })


    const buttonBar = document.getElementById("modalButtonBar")
    buttonBar.innerHTML = `<input id="launchMainEditor" type="button" value="Main Editor"></input> <input id="saveColorEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveColorEdits").addEventListener("click",
        (event) => {
            console.log(`save color edits for ${color} `)
            saveColor(colorToEdit, color, viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })

    document.getElementById("launchMainEditor").addEventListener("click", () => {
        hideMe()

        publishRadarEvent({ type: "mainRadarConfigurator", tab: "color" })
    })

}
const saveColor = (colorToEdit, color, viewpoint) => {
    console.log(`save changes to color`)
    const colorVisualMap = viewpoint.propertyVisualMaps["color"]

    color.visible = document.getElementById("showColor").checked
    color.color = getElementValue('actualColor')
    color.label = getElementValue("colorLabel")


    const valueMap = viewpoint.propertyVisualMaps["color"].valueMap
    // remove all entries from valueMap with value color (sequence)
    getAllKeysMappedToValue(colorVisualMap.valueMap, colorToEdit).forEach((key) => delete colorVisualMap.valueMap[key])
    mappedColorPropertyValues.forEach((value) => { valueMap[value] = colorToEdit })
    publishRefreshRadar()
}


const hideMe = () => {
    showOrHideElement("modalEditor", false)
}
