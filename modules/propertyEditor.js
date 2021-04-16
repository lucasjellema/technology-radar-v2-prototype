export { launchPropertyEditor }
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { capitalize, getPropertyFromPropertyPath, populateDataTypesList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'
import { publishRadarEvent } from './radar.js';


const launchPropertyEditor = (propertyToEdit, viewpoint, drawRadarBlips = null, parentForNewProperty = null) => {

    showOrHideElement("modalEditor", true)
    setTextOnElement('modalEditorTitle', `Edit Property ${propertyToEdit.label}`)
    const contentContainer = document.getElementById("modalContentContainer")
    contentContainer.innerHTML = ''
    let html = ``

    html += `<label for="propertyName">Name</label>
    <input id="propertyName" value="${propertyToEdit.name}"></input><br/>
    <label for="propertyLabel">Label</label>
       <input id="propertyLabel" value="${propertyToEdit.label}"></input><br/>`
    html += `<label for="propertyType">Type</label>
       <select id="propertyType" value="${propertyToEdit.type}"></select><br/>`
    html += `<label for="propertyDescription">Description</label>
       <textarea id="propertyDescription" value="${undefinedToDefined(propertyToEdit.description, "")}" rows="3" cols="80"></textarea><br/>`
    html += `<label for="propertyDefaultValue">Default Value</label>
       <input id="propertyDefaultValue" value="${undefinedToDefined(propertyToEdit.defaultValue, "")}"></input><br/>`
       html += `<label for="propertyDiscrete">Discrete</label>
       <input id="propertyDiscrete" type="checkbox" ${propertyToEdit?.discrete == true ? "checked" : ""}>`
       html += `<label for="propertyDisplayLabel">Display Label?</label>
       <input id="propertyDisplayLabel" type="checkbox" ${propertyToEdit?.displayLabel == true ? "checked" : ""}>
    </input><br/>`
    html+= `<label for="propertyContext">Context?</label>
    <input id="propertyContext" type="checkbox" title="Does this property provide context for a rating (such as timestamp, scope, author) - instead of being part of the rating itself?"
    ${propertyToEdit?.context == true ? "checked" : ""}><br/>`

    html += `<h3>Allowable Values</h3>`
    // button to add Allowable Value
    html += `<input type="button" id="addAllowableValueButton"  value="Add Allowable Value"  style="padding:6px;margin:10px"/>`
    // allowable values
    if (propertyToEdit.allowableValues?.length > 0) {
        html += `     <table><tr><th>Label</th><th>Value</th><th>Delete</th></tr>`
        for (let i = 0; i < propertyToEdit.allowableValues.length; i++) {
            html += ` 
        <tr><td><input id="labelAllowableValue${i}"  type="text" value="${propertyToEdit.allowableValues[i].label}"></input></td>
        <td><input id="valueAllowableValue${i}"  type="text" value="${propertyToEdit.allowableValues[i].value}"></td>
        <td><span id="deleteAllowableValue${i}" class="clickableProperty">Delete</span></td></tr>`

        }
        html += `</table>`
    }
    html += `<br /><br />`

    contentContainer.innerHTML = html
    populateDataTypesList(`propertyType`, propertyToEdit.type)
    document.getElementById(`addAllowableValueButton`).addEventListener('click', (e) => {
        const allowableValue = { value: "", label: "New" }
        if (propertyToEdit.allowableValues == null) propertyToEdit.allowableValues = []
        propertyToEdit.allowableValues.push(allowableValue)
        launchPropertyEditor(propertyToEdit, viewpoint, drawRadarBlips, parentForNewProperty)

    })
    if (propertyToEdit.allowableValues?.length > 0) {
        for (let i = 0; i < propertyToEdit.allowableValues.length; i++) {
          document.getElementById(`deleteAllowableValue${i}`).addEventListener('click', (e) => {
            propertyToEdit.allowableValues.splice(i, 1)
            launchPropertyEditor(propertyToEdit, viewpoint, drawRadarBlips, parentForNewProperty)
          })
        }
    }


    const buttonBar = document.getElementById("modalButtonBar")
    buttonBar.innerHTML = `<input id="launchMainEditor" type="button" value="Main Editor"></input> <input id="savePropertyEdits" type="button" value="Save Changes"></input>`
    document.getElementById("savePropertyEdits").addEventListener("click",
        (event) => {
            console.log(`save property edits for ${propertyToEdit.label} `)
            saveProperty(propertyToEdit, viewpoint, parentForNewProperty)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })

    document.getElementById("launchMainEditor").addEventListener("click", () => {
        hideMe()
        publishRadarEvent({ type: "mainRadarConfigurator", tab: "datamodel" })
    })

}

const saveProperty = (propertyToEdit, viewpoint, parentForNewProperty = null) => {
    console.log(`save property `)
    propertyToEdit.name = getElementValue('propertyName')
    propertyToEdit.label = getElementValue('propertyLabel')
    propertyToEdit.description = getElementValue('propertyDescription')
    propertyToEdit.type = getElementValue('propertyType')
    propertyToEdit.defaultValue = getElementValue('propertyDefaultValue')
    propertyToEdit.discrete = document.getElementById(`propertyDiscrete`).checked
    propertyToEdit.context = document.getElementById(`propertyContext`).checked
    propertyToEdit.displayLabel = document.getElementById(`propertyDisplayLabel`).checked

    
    if (propertyToEdit.allowableValues?.length > 0) {
        for (let i = 0; i < propertyToEdit.allowableValues.length; i++) {
            propertyToEdit.allowableValues[i].label = getElementValue(`labelAllowableValue${i}`)
            propertyToEdit.allowableValues[i].value = getElementValue(`valueAllowableValue${i}`)
        }
    }

    if (parentForNewProperty != null) {
        parentForNewProperty.properties[propertyToEdit.name] = propertyToEdit
    }
}
