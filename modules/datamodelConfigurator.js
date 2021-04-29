export { launchDatamodelConfigurator }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { initializeTree } from './tree.js'
import { launchPropertyEditor } from './propertyEditor.js'
import { capitalize, getPropertyFromPropertyPath, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'

const launchDatamodelConfigurator = (viewpoint, drawRadarBlips) => {

    
    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let objectType = ratingType.objectType
    if (typeof (objectType) == "string") {
        objectType = getData().model?.objectTypes[objectType]
    }

    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Data Model")
    document.getElementById("datamodelConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    contentContainer.innerHTML = ''

    let blipProperties = getRatingTypeProperties(viewpoint.ratingType, getData().model)

    let html = ''
    html += `<h3>Object Properties for ${objectType.label}</h3>`
    html += `<input type="button" id="addObjectPropertyButton"  value="Add Object Property"  style="padding:6px;margin:10px"/>`
    html += `<table><tr><th>Property</th><th>Label</th><th>Type</th><th>Discrete?</th><th>Allowable Values?</th><th>Delete?</th></tr>`
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        if (blipProperty.propertyScope == "object") {
            html += `<tr>
            <td><span id="editProperty${i}" class="clickableProperty">${blipProperty.propertyName}</span></td>
            <td><span id="editProperty${i}b" class="clickableProperty">${blipProperty.property.label}</span></td>
                    <td>${blipProperty.property.type}</td>
                    <td>${(blipProperty.property?.discrete == true) ? "Y" : ""}</td>
                    <td>${(blipProperty.property?.allowableValues != null) ? "Y" : ""}</td>
                    <td><span id="deleteProperty${i}" class="clickableProperty">Delete</span></td>     
                    </tr>`
        }
    }
    html += `</table><br />`

    html += `<h3>Rating Properties for ${ratingType.label}</h3>`
    html += `<input type="button" id="addRatingPropertyButton"  value="Add Rating Property"  style="padding:6px;margin:10px"/>`
    html += `<table><tr><th>Property</th><th>Label</th><th>Type</th><th>Context?</th><th>Discrete?</th><th>Allowable Values?</th><th>Delete?</th></tr>`
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        if (blipProperty.propertyScope == "rating") {
            html += `<tr>
                    <td><span id="editProperty${i}" class="clickableProperty">${blipProperty.propertyName}</span></td>
                    <td><span id="editProperty${i}b" class="clickableProperty">${blipProperty.property.label}</span></td>
                    <td>${blipProperty.property.type}</td>
                    <td>${(blipProperty.property?.context == true) ? "Y" : ""}</td>
                    <td>${(blipProperty.property?.discrete == true) ? "Y" : ""}</td>
                    <td>${(blipProperty.property?.allowableValues != null) ? "Y" : ""}</td>
                    <td><span id="deleteProperty${i}" class="clickableProperty">Delete</span></td>     
                    </tr>`
        }
    }
    html += `</table><br /><br /><br />`


    const htmlX = ` <div><div id="datamodelTreeContainer">
    <div>
        <h1>Radar Datamodel Viewer</h1>



        <section>
        <table>
        <tr>
        <td>
            <div id="datamodelTree" >

            </div>
            </td>
            <td class="">
            <div id="display" ></div>
            </td>
            </tr>
            </table>
        </section>
    </div>
    </div
    <br />
</div>`
    contentContainer.innerHTML = html
    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML =''

    // add event listeners
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        document.getElementById(`editProperty${i}`).addEventListener('click', (e) => {
            launchPropertyEditor(blipProperty.property, viewpoint)
        })
        document.getElementById(`editProperty${i}b`).addEventListener('click', (e) => {
            launchPropertyEditor(blipProperty.property, viewpoint)
        })
        document.getElementById(`deleteProperty${i}`).addEventListener('click', (e) => {          
            if (blipProperty.propertyScope == "object") {
                delete getData().model.objectTypes[objectType.name].properties[blipProperty.propertyName] 
            } else if (blipProperty.propertyScope == "rating") {
                delete getData().model.ratingTypes[ratingType.name].properties[blipProperty.propertyName] 
            }

            launchDatamodelConfigurator(viewpoint, drawRadarBlips)
        })
    }



    document.getElementById(`addObjectPropertyButton`).addEventListener('click', (e) => {
        const newProperty = { name: "NEW_PROPERTY", label: "New Property" }
        launchPropertyEditor(newProperty, viewpoint, drawRadarBlips, objectType)

    })
    document.getElementById(`addRatingPropertyButton`).addEventListener('click', (e) => {
        const newProperty = { name: "NEW_PROPERTY", label: "New Property" }
        launchPropertyEditor(newProperty, viewpoint, drawRadarBlips, ratingType)

    })

}