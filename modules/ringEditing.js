export { launchRingEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar, getDistinctTagValues } from './data.js';
import { ifElementHasValueThenSetProperty, populateFontsList, populateDatalistFromValueSet, getPropertyFromPropertyPath, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'




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

let mappedRingPropertyValues
const launchRingEditor = (ringToEdit, viewpoint, drawRadarBlips) => {
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"]

    // find all values mapped to the ringToEdit
    mappedRingPropertyValues = getAllKeysMappedToValue(ringVisualMap.valueMap, ringToEdit)

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingProperties = getRatingTypeProperties(ratingType, getData().model)
    let ringProperty = ratingProperties.filter((property) => property.propertyPath == ringVisualMap["property"])[0]



    showOrHideElement("modalEditor", true)
    const ring = viewpoint.template.ringsConfiguration.rings[ringToEdit]
    setTextOnElement('modalEditorTitle', `Edit Ring ${ring.label}`)
    console.log(`editing ring ${JSON.stringify(ring)}`)
    const contentContainer = document.getElementById("modalContentContainer")
    let html = `<table id="basicRingProperties">`
    html += `<tr><td><label for="properties">Values for ${ringProperty.property.label} mapped to this ring</label></td>
    <td><input id="ringPropertyValue" list="ringPropertyValueList" value=""></input>
    <input type="button" id="addMappedPropertyValue" name="addTag" value="Add Value" />
    </td><td id="mappedPropertiesContainer"></td>
    </td></tr>`


    html += `<tr><td rowspan="1"><label for="ringLabel">Label</label></td><td><input id="ringLabel" type="text" value="${ring.label}"></input></td>
    <td>
    <label for="straightRingLabel" >Show Label?</label><input id="straightRingLabel" type="checkbox"  ${ring?.labelSettings?.showStraight ? "checked" : ""}/></td>
    </tr>`
    html += `<tr><td rowspan="1"><label for="ringDescription">Description</label></td><td><textarea id="ringDescription" value="${undefinedToDefined(ring.description, '')}" rows="3" cols="50"></textarea></td></tr>`

    html += `<tr><td><label for="showRing">Visible?</label></td><td><input id="showRing" type="checkbox" ${ring?.visible == false ? "" : "checked"}></input></td></tr>`
    html += `</table><br/><a href="#" id="advancedToggle" >Show Advanced Properties?</a>
    <table id="advancedRingProperties"><tr>`


    html += `<tr>
    <td><label for="ringLabelFont">Font (Family)</label>
    <input id="ringLabelFont" list="fontsList"   value="${undefinedToDefined(ring.labelSettings?.fontFamily)}"></input>
    <label for="ringLabelSize">Font Size</label>
    <input id="ringLabelSize" type="text" value="${undefinedToDefined(ring.labelSettings?.fontSize)}"></input
    </td>
    <td ><label for="ringLabelColor">Color</label><input id="ringLabelColor" type="color"  value="${ring.labelSettings?.color}" >
    </td>
    </td></tr>`

    html += `<tr><td><label for="ringWidth">%</label></td><td><input id="ringWidthPercentage" value="${Math.round(ring.width * 100)}"></input>
    <input id="ringWidth" type="range" min="5" max="95" value="${Math.round(ring.width * 100)}"></input></td>
    </tr>`
    html += `<tr><td><label for="ringColor">Color</label></td>
    <td><label for="ringColorInside">Color</label><input id="ringColorInside" type="color" 
    value="${ring?.backgroundColor ?? '#FFFFFF'}"></input>
    
    </td></tr>`
    html += `<tr><td>  <label for="ringOpacity">Opacity</label></td>
        <td><label for="ringOpacityInside">Opacity</label>
        <input id="ringOpacityInside" type="range" min="0" max="1" step="0.05" value="${ring.opacity}">    </input>
        </td></tr>`

    html += `<tr><td rowspan="2"><label for="backgroundImageURL">Background Image</label></td>
    <td>URL<input id="backgroundImageURL" type="text" value="${undefinedToDefined(ring.backgroundImage?.image)}" title="URL to image to use as ring illustration"></input>     
     <textarea id="backgroundImagePasteArea" placeholder="Paste Image" title="Paste Image for ring here" rows="1" cols="15" title="Paste image from clip board"></textarea>
     </td><td><img id="backgroundImage" style="padding:6px" src="${ring.backgroundImage?.image}" width="70px"></img></td></tr>`

    html += `<tr><td>Scalefactor
                <input type="text"  id="backgroundImageScaleFactor" title="Scalefactor for background image"  value="${undefinedToDefined(ring.backgroundImage?.scaleFactor)}"></input>
             </td><td></td></tr>`


    html += `<tr><td><label for="edge">Edge Settings</label></td>
     <td><label for="ringEdgeWidth">Width (<span id="ringEdgeHeading">${undefinedToDefined(ring.edge?.width)}</span>)</label><input id="ringEdgeWidth" type="range" min="0" max="15" step="1" value="${ring.edge?.width}"></input>
     <label for="ringEdgeStrokeArray">Stroke Array</label><input id="ringEdgeStrokeArray" type="text" title="Stroke Array, A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. For example:  3 1 (3 strokes, one gap) or 10, 1 (10 strokes, one gap)" value="${undefinedToDefined(ring.edge?.strokeArray, '')}"></input>
     
     </td>
     <td ><label for="ringEdgeColor">Color</label><input id="ringEdgeColor" type="color"  value="${ring?.edge?.color ?? "#FFFFFF"}" >
     </td>
     </td></tr>`


    contentContainer.innerHTML = `${html}</table>
    <br/><datalist id="fontsList"></datalist>
    `
    showOrHideElement(`backgroundImage`, !(typeof ring.backgroundImage?.image == 'undefined' || ring?.backgroundImage?.image == null || ring?.backgroundImage?.image.length < 5))
    showOrHideElement('advancedRingProperties', false)

    document.getElementById('advancedToggle').addEventListener('click', () => { showOrHideElement('advancedRingProperties', true) })

    if (getPropertyFromPropertyPath(ringVisualMap["property"], viewpoint.ratingType, getData().model).type == "tags") {
        populateDatalistFromValueSet(`ringPropertyValueList`, getDistinctTagValues(viewpoint))

    } else {
        const allowablesValues = ringProperty.property?.allowableValues?.map((allowableValue) => allowableValue.value)
        createAndPopulateDataListFromBlipProperties(`ringPropertyValueList`, ringVisualMap["property"], viewpoint.blips, allowablesValues)
    }

    populateFontsList('fontsList')
    initializeImagePaster((imageURL) => {
        document.getElementById("backgroundImageURL").value = imageURL
        document.getElementById(`backgroundImage`).src = imageURL
        showOrHideElement(`backgroundImage`, !(typeof imageURL == 'undefined' || imageURL == null || imageURL.length < 5))

    }, `backgroundImagePasteArea`)

    renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedRingPropertyValues)
    document.getElementById("addMappedPropertyValue").addEventListener("click",
        (event) => {
            const propertyValue = document.getElementById("ringPropertyValue").value
            document.getElementById("ringPropertyValue").value = ""
            mappedRingPropertyValues.push(propertyValue)
            renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedRingPropertyValues)
        })

    document.getElementById("ringWidth").addEventListener("input", (e) => {
        const ringWidthPercentage = document.getElementById("ringWidthPercentage")
        ringWidthPercentage.value = e.target.value
    })
    document.getElementById("ringEdgeWidth").addEventListener("change", (e) => {
        const ringEdgeHeading = document.getElementById("ringEdgeHeading")
        ringEdgeHeading.innerText = e.target.value
    })
    const buttonBar = document.getElementById("modalButtonBar")
    buttonBar.innerHTML = `<input id="launchMainEditor" type="button" value="Main Editor"></input> <input id="saveRingEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveRingEdits").addEventListener("click",
        (event) => {
            console.log(`save ring edits for ${ring} `)
            saveRing(ringToEdit, ring, viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })

    document.getElementById("launchMainEditor").addEventListener("click", () => {
        hideMe()

        publishRadarEvent({ type: "mainRadarConfigurator", tab: "ring" })
    })

}



const saveRing = (ringToEdit, ring, viewpoint) => {
    console.log(`save changes to ring`)
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"]
    ifElementHasValueThenSetProperty("ringColorInside", ring, "backgroundColor")
    
    ring.label = getElementValue("ringLabel")
    ring.description = getElementValue("ringDescription")

    ring.width = getElementValue("ringWidthPercentage") / 100
    if (!ring.hasOwnProperty("backgroundImage")) ring.backgroundImage = {}
    ring.backgroundImage.image = getElementValue("backgroundImageURL")
    ring.backgroundImage.scaleFactor = getElementValue("backgroundImageScaleFactor")
    if (ring.backgroundImage.scaleFactor == null || ring.backgroundImage.scaleFactor.length == 0) {
        delete ring.backgroundImage.scaleFactor
    }


    
    ifElementHasValueThenSetProperty("ringOpacityInside", ring, "opacity")
    ring.edge = ring.edge ?? {}
    ifElementHasValueThenSetProperty("ringEdgeColor", ring.edge, "color")
    ifElementHasValueThenSetProperty("ringEdgeWidth", ring.edge, "width")
    ifElementHasValueThenSetProperty("ringEdgeStrokeArray", ring.edge, "strokeArray")

    ring.labelSettings = ring.labelSettings ?? {}
    ifElementHasValueThenSetProperty("ringLabelFont", ring.labelSettings, "fontFamily")
    ifElementHasValueThenSetProperty("ringLabelColor", ring.labelSettings, "color")
    ifElementHasValueThenSetProperty("ringLabelSize", ring.labelSettings, "fontSize")
    
    ring.labelSettings.showStraight = document.getElementById("straightRingLabel").checked
    ring.visible = document.getElementById("showRing").checked


    const valueMap = viewpoint.propertyVisualMaps["ring"].valueMap
    // remove all entries from valueMap with value ring (sequence)
    getAllKeysMappedToValue(ringVisualMap.valueMap, ringToEdit).forEach((key) => delete ringVisualMap.valueMap[key])
    mappedRingPropertyValues.forEach((value) => { valueMap[value] = ringToEdit })
    publishRefreshRadar()
}


const hideMe = () => {
    showOrHideElement("modalEditor", false)
}
