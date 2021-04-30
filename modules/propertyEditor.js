export { launchPropertyEditor }
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { capitalize, getPropertyFromPropertyPath, populateDerivationFunctionList, populateDataTypesList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement, toggleShowHideElement } from './utils.js'
import { publishRadarEvent } from './radar.js';
import { resetCache } from './derivedProperties.js';



const launchPropertyEditor = (propertyToEdit, propertyScope, viewpoint, drawRadarBlips = null, parentForNewProperty = null) => {

    showOrHideElement("modalEditor", true)
    setTextOnElement('modalEditorTitle', `Edit ${propertyScope} Property ${propertyToEdit.label}`)
    const contentContainer = document.getElementById("modalContentContainer")
    contentContainer.innerHTML = ''
    let html = ``

    html += `<label for="propertyName">Name</label>
    <input id="propertyName" value="${propertyToEdit.name}"></input><br/>
    <label for="propertyLabel">Label</label>
       <input id="propertyLabel" value="${propertyToEdit.label}"></input><br/>`
    html += `<label for="propertyType">Type</label>
       <select id="propertyType" value="${propertyToEdit.type}"></select><br/>`

    html += `<label for="propertyDiscrete">Discrete</label>
       <input id="propertyDiscrete" type="checkbox" ${propertyToEdit?.discrete == true ? "checked" : ""}><br />`
    html += `<label for="propertyDisplayLabel">Display Label?</label>
       <input id="propertyDisplayLabel" type="checkbox" ${propertyToEdit?.displayLabel == true ? "checked" : ""}>
    </input><br/>`
    html += `<label for="propertyContext">Context?</label>
    <input id="propertyContext" type="checkbox" title="Does this property provide context for a rating (such as timestamp, scope, author) - instead of being part of the rating itself?"
    ${propertyToEdit?.context == true ? "checked" : ""}><br/>`

    html += `<label for="propertyDescription">Description</label>
       <textarea id="propertyDescription" value="" rows="3" cols="80">${undefinedToDefined(propertyToEdit.description, "")}</textarea><br/>`

    html += `<label for="propertyDefaultValue">Default Value</label>
       <input id="propertyDefaultValue" value="${undefinedToDefined(propertyToEdit.defaultValue, "")}"></input><br/>`
    html += `<br /><label for="propertyDerived">Derived</label>
       <input id="propertyDerived" type="checkbox" ${propertyToEdit?.derived == true ? "checked" : ""}>
       <br />`

    html += `<div id="derivedPropertyAttributes">
        <h3>Derived Property Definition</h3>
        <label for="baseProperty">From which property is the value derived</label>
        <select id="baseProperty" ></select>
        <br />
        <label for="derivationFunction">Which function is applied to the base property</label>
        <input id="derivationFunction" list="derivationFunctionList" value="${undefinedToDefined(propertyToEdit.derivationFunction)}"></input>
        &nbsp;&nbsp;&nbsp;
        <label for="derivationFunctionConfiguration">Configuration of Derivation Function</label>
        <textarea id="derivationFunctionConfiguration" cols="60" rows="3" value="${undefinedToDefined(propertyToEdit?.derivationFunctionConfiguration)}">${undefinedToDefined(propertyToEdit?.derivationFunctionConfiguration)}</textarea>
        <br />
    </div>`

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
    populateDerivationFunctionList(`derivationFunctionList`)

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model)
    const candidateBaseProperties = ratingTypeProperties
        .filter((property) => propertyScope=="rating" || property.propertyScope =="object" )
        .map((property) => { return { label: property.propertyPath, value: property.propertyPath } })
    populateSelect("baseProperty", candidateBaseProperties, propertyToEdit.baseProperty)   // data is array objects with two properties : label and value

    document.getElementById(`addAllowableValueButton`).addEventListener('click', (e) => {
        const allowableValue = { value: "", label: "New" }
        if (propertyToEdit.allowableValues == null) propertyToEdit.allowableValues = []
        propertyToEdit.allowableValues.push(allowableValue)
        launchPropertyEditor(propertyToEdit,propertyScope, viewpoint, drawRadarBlips, parentForNewProperty)

    })
    if (propertyToEdit.allowableValues?.length > 0) {
        for (let i = 0; i < propertyToEdit.allowableValues.length; i++) {
            document.getElementById(`deleteAllowableValue${i}`).addEventListener('click', (e) => {
                propertyToEdit.allowableValues.splice(i, 1)
                launchPropertyEditor(propertyToEdit, propertyScope, viewpoint, drawRadarBlips, parentForNewProperty)
            })
        }
    }

    showOrHideElement("derivedPropertyAttributes", propertyToEdit?.derived == true)
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
    document.getElementById("propertyDerived").addEventListener("change", () => {
        toggleShowHideElement("derivedPropertyAttributes")
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
    propertyToEdit.derived = document.getElementById(`propertyDerived`).checked
    propertyToEdit.baseProperty = getElementValue('baseProperty')
    propertyToEdit.derivationFunction = getElementValue('derivationFunction')
    propertyToEdit.derivationFunctionConfiguration = getElementValue('derivationFunctionConfiguration')
    propertyToEdit.context = document.getElementById(`propertyContext`).checked
    propertyToEdit.displayLabel = document.getElementById(`propertyDisplayLabel`).checked
    resetCache()


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
