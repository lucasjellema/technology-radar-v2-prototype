export { launchSizeEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar, getDistinctTagValues } from './data.js';
import { populateSizesList, populateDatalistFromValueSet, getPropertyFromPropertyPath, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'




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

let mappedSizePropertyValues
const launchSizeEditor = (sizeToEdit, viewpoint, drawRadarBlips) => {
    const sizeVisualMap = viewpoint.propertyVisualMaps["size"]

    // find all values mapped to the sizeToEdit
    mappedSizePropertyValues = getAllKeysMappedToValue(sizeVisualMap.valueMap, sizeToEdit)

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingProperties = getRatingTypeProperties(ratingType, getData().model)
    let sizeProperty = ratingProperties.filter((property) => property.propertyPath == sizeVisualMap["property"])[0]



    showOrHideElement("modalEditor", true)
    const size = viewpoint.template.sizesConfiguration.sizes[sizeToEdit]
    setTextOnElement('modalEditorTitle', `Edit Size ${size.label}`)
    console.log(`editing size ${JSON.stringify(size)}`)
    const contentContainer = document.getElementById("modalContentContainer")
    let html = `<table id="basicSizeProperties">`
    html += `<tr><td><label for="properties">Values for ${sizeProperty.property.label} mapped to this size</label></td>
    <td><input id="sizePropertyValue" list="sizePropertyValueList" value=""></input>
    <input type="button" id="addMappedPropertyValue" name="addTag" value="Add Value" />
    </td><td id="mappedPropertiesContainer"></td>
    </td></tr>`


    html += `<tr><td rowspan="1"><label for="sizeLabel">Label</label></td><td><input id="sizeLabel" type="text" value="${size.label}"></input></td>

    </tr>`
    html += `<tr><td><label for="actualSize">Size</label></td><td>
    <input id="actualSize" type="size" value="${size.size}"></input>
    </td></tr>
`
    html += `<tr><td><label for="showSize">Visible?</label></td><td><input id="showSize" type="checkbox" ${size?.visible == false ? "" : "checked"}></input></td></tr>`
    html += `</table><br/>`


    contentContainer.innerHTML = `${html}
    `
    populateSizesList("sizesList")
    if (getPropertyFromPropertyPath(sizeVisualMap["property"], viewpoint.ratingType, getData().model).type == "tags") {
        populateDatalistFromValueSet(`sizePropertyValueList`, getDistinctTagValues(viewpoint))

    } else {
        const allowablesValues = sizeProperty.property?.allowableValues?.map((allowableValue) => allowableValue.value)
        createAndPopulateDataListFromBlipProperties(`sizePropertyValueList`, sizeVisualMap["property"], viewpoint.blips, allowablesValues)
    }

    renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedSizePropertyValues)
    document.getElementById("addMappedPropertyValue").addEventListener("click",
        (event) => {
            const propertyValue = document.getElementById("sizePropertyValue").value
            document.getElementById("sizePropertyValue").value = ""
            mappedSizePropertyValues.push(propertyValue)
            renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedSizePropertyValues)
        })


    const buttonBar = document.getElementById("modalButtonBar")
    buttonBar.innerHTML = `<input id="launchMainEditor" type="button" value="Main Editor"></input> <input id="saveSizeEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveSizeEdits").addEventListener("click",
        (event) => {
            console.log(`save size edits for ${size} `)
            saveSize(sizeToEdit, size, viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })

    document.getElementById("launchMainEditor").addEventListener("click", () => {
        hideMe()

        publishRadarEvent({ type: "mainRadarConfigurator", tab: "size" })
    })

}
const saveSize = (sizeToEdit, size, viewpoint) => {
    console.log(`save changes to size`)
    const sizeVisualMap = viewpoint.propertyVisualMaps["size"]

    size.visible = document.getElementById("showSize").checked
    size.size = getElementValue('actualSize')
    size.label = getElementValue("sizeLabel")


    const valueMap = viewpoint.propertyVisualMaps["size"].valueMap
    // remove all entries from valueMap with value size (sequence)
    getAllKeysMappedToValue(sizeVisualMap.valueMap, sizeToEdit).forEach((key) => delete sizeVisualMap.valueMap[key])
    mappedSizePropertyValues.forEach((value) => { valueMap[value] = sizeToEdit })
    publishRefreshRadar()
}


const hideMe = () => {
    showOrHideElement("modalEditor", false)
}
