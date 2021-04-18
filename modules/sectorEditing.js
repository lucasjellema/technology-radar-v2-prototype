export { launchSectorEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar , getDistinctTagValues} from './data.js';
import { populateFontsList, populateDatalistFromValueSet, getPropertyFromPropertyPath, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'




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

let mappedSectorPropertyValues
const launchSectorEditor = (sectorToEdit, viewpoint, drawRadarBlips) => {
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]

    // find all values mapped to the sectorToEdit
    mappedSectorPropertyValues = getAllKeysMappedToValue(sectorVisualMap.valueMap, sectorToEdit)

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingProperties = getRatingTypeProperties(ratingType, getData().model)
    let sectorProperty = ratingProperties.filter((property) => property.propertyPath == sectorVisualMap["property"])[0]



    showOrHideElement("modalEditor", true)
    const sector = viewpoint.template.sectorConfiguration.sectors[sectorToEdit]
    setTextOnElement('modalEditorTitle', `Edit Sector ${sector.label}`)
    console.log(`editing sector ${JSON.stringify(sector)}`)
    const contentContainer = document.getElementById("modalContentContainer")
    let html = `<table id="basicSectorProperties">`
    html += `<tr><td><label for="properties">Values for ${sectorProperty.property.label} mapped to this sector</label></td>
    <td><input id="sectorPropertyValue" list="sectorPropertyValueList" value=""></input>
    <input type="button" id="addMappedPropertyValue" name="addTag" value="Add Value" />
    </td><td id="mappedPropertiesContainer"></td>
    </td></tr>`


    html += `<tr><td rowspan="1"><label for="sectorLabel">Label</label></td><td><input id="sectorLabel" type="text" value="${sector.label}"></input></td>
    <td><label for="curvedSectorLabel" >Curved Label?</label><input id="curvedSectorLabel" type="checkbox" ${sector?.labelSettings?.showCurved ? "checked" : ""}/>
    <label for="straightSectorLabel" >Straight Label?</label><input id="straightSectorLabel" type="checkbox"  ${sector?.labelSettings?.showStraight ? "checked" : ""}/></td>
    </tr>`
    html += `<tr><td><label for="showSector">Visible?</label></td><td><input id="showSector" type="checkbox" ${sector?.visible == false ? "" : "checked"}></input></td></tr>`
    html += `</table><br/><a href="#" id="advancedToggle" >Show Advanced Properties?</a>
    <table id="advancedSectorProperties"><tr>`


    html += `<tr>
    <td><label for="sectorLabelFont">Font (Family)</label>
    <input id="sectorLabelFont" list="fontsList"   value="${undefinedToDefined(sector.labelSettings?.fontFamily)}"></input>
    <label for="sectorLabelSize">Font Size</label>
    <input id="sectorLabelSize" type="text" value="${undefinedToDefined(sector.labelSettings?.fontSize)}"></input
    </td>
    <td ><label for="sectorLabelColor">Color</label><input id="sectorLabelColor" type="color"  value="${sector.labelSettings?.color}" >
    </td>
    </td></tr>`

    html += `<tr><td><label for="sectorAngle">%</label></td><td><input id="sectorAnglePercentage" value="${Math.round(sector.angle * 100)}"></input>
    <input id="sectorAngle" type="range" min="5" max="95" value="${Math.round(sector.angle * 100)}"></input></td>
    </tr>`
    html += `<tr><td><label for="sectorColor">Color</label></td>
    <td><label for="sectorColorInside">Color (inside rings)</label><input id="sectorColorInside" type="color" 
    value="${sector?.backgroundColor ?? '#FFFFFF'}"></input>
    
    </td>`
        + `<td><label for="sectorColorOutside">Color (outside rings)</label></td><td><input id="sectorColorOutside" type="color" value="${sector?.outerringBackgroundColor ?? "#FFFFFF"}"></input>
      
        </td></tr>`
    html += `<tr><td>  <label for="sectorOpacity">Opacity</label></td>
        <td><label for="sectorOpacityInside">Opacity (inside rings)</label>
        <input id="sectorOpacityInside" type="range" min="0" max="1" step="0.05" value="${sector.opacity}">    </input>
        </td>`
        + `<td><label for="sectorOpacityOutside">Opacity (outside rings)</label>
        <input id="sectorOpacityOutside" type="range" min="0" max="1" step="0.05" value="${sector.opacityOutsideRings}">    </input>
            </td></tr>`

    html += `<tr><td rowspan="2"><label for="backgroundImageURL">Background Image</label></td>
    <td>URL<input id="backgroundImageURL" type="text" value="${undefinedToDefined(sector.backgroundImage?.image)}" title="URL to image to use as sector illustration"></input>     
     <textarea id="backgroundImagePasteArea" placeholder="Paste Image" title="Paste Image for sector here" rows="1" cols="15" title="Paste image from clip board"></textarea>
     </td><td><img id="backgroundImage" style="padding:6px" src="${sector.backgroundImage?.image}" width="70px"></img></td></tr>`

    html += `<tr><td>Scalefactor
                <input type="text"  id="backgroundImageScaleFactor" title="Scalefactor for background image"  value="${undefinedToDefined(sector.backgroundImage?.scaleFactor)}"></input>
             </td><td></td></tr>`


    html += `<tr><td><label for="edge">Edge Settings</label></td>
     <td><label for="sectorEdgeWidth">Width (<span id="sectorEdgeHeading">${undefinedToDefined(sector.edge?.width)}</span>)</label><input id="sectorEdgeWidth" type="range" min="0" max="15" step="1" value="${sector.edge?.width}"></input>
     </td>
     <td ><label for="sectorEdgeColor">Color</label><input id="sectorEdgeColor" type="color"  value="${sector?.edge?.color ?? "#FFFFFF"}" >
     </td>
     </td></tr>`


    contentContainer.innerHTML = `${html}</table>
    <br/><datalist id="fontsList"></datalist>
    `
    showOrHideElement(`backgroundImage`, !(typeof sector.backgroundImage?.image == 'undefined' || sector?.backgroundImage?.image == null || sector?.backgroundImage?.image.length < 5))
    showOrHideElement('advancedSectorProperties', false)

    document.getElementById('advancedToggle').addEventListener('click', () => { showOrHideElement('advancedSectorProperties', true) })

    if (getPropertyFromPropertyPath(sectorVisualMap["property"], viewpoint.ratingType, getData().model).type == "tags") {
        populateDatalistFromValueSet(`sectorPropertyValueList`, getDistinctTagValues(viewpoint))

    } else {
        const allowablesValues = sectorProperty.property?.allowableValues?.map((allowableValue) => allowableValue.value)
        createAndPopulateDataListFromBlipProperties(`sectorPropertyValueList`, sectorVisualMap["property"], viewpoint.blips, allowablesValues)
    }

    populateFontsList('fontsList')
    initializeImagePaster((imageURL) => {
        document.getElementById("backgroundImageURL").value = imageURL
        document.getElementById(`backgroundImage`).src = imageURL
        showOrHideElement(`backgroundImage`, !(typeof imageURL == 'undefined' || imageURL == null || imageURL.length < 5))

    }, `backgroundImagePasteArea`)

    renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedSectorPropertyValues)
    document.getElementById("addMappedPropertyValue").addEventListener("click",
        (event) => {
            const propertyValue = document.getElementById("sectorPropertyValue").value
            document.getElementById("sectorPropertyValue").value =""
            mappedSectorPropertyValues.push(propertyValue)
            renderMappedPropertiesEditor(document.getElementById("mappedPropertiesContainer"), mappedSectorPropertyValues)
        })

    document.getElementById("sectorAngle").addEventListener("input", (e) => {
        const sectorAnglePercentage = document.getElementById("sectorAnglePercentage")
        sectorAnglePercentage.value = e.target.value
    })
    document.getElementById("sectorEdgeWidth").addEventListener("change", (e) => {
        const sectorEdgeHeading = document.getElementById("sectorEdgeHeading")
        sectorEdgeHeading.innerText = e.target.value
    })
    const buttonBar = document.getElementById("modalButtonBar")
    buttonBar.innerHTML = `<input id="launchMainEditor" type="button" value="Main Editor"></input> <input id="saveSectorEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveSectorEdits").addEventListener("click",
        (event) => {
            console.log(`save sector edits for ${sector} `)
            saveSector(sectorToEdit, sector, viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })

    document.getElementById("launchMainEditor").addEventListener("click", () => {
        hideMe()

        publishRadarEvent({ type: "mainRadarConfigurator", tab:"sector" })
    })

}
const saveSector = (sectorToEdit, sector, viewpoint) => {
    console.log(`save changes to sector`)
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]
    sector.backgroundColor = getElementValue("sectorColorInside")
    sector.outerringBackgroundColor = getElementValue("sectorColorOutside")
    sector.label = getElementValue("sectorLabel")
    sector.angle = getElementValue("sectorAnglePercentage") / 100
    sector.backgroundImage.image = getElementValue("backgroundImageURL")
    sector.backgroundImage.scaleFactor = getElementValue("backgroundImageScaleFactor")
    if (sector.backgroundImage.scaleFactor == null || sector.backgroundImage.scaleFactor.length == 0) {
        delete sector.backgroundImage.scaleFactor
    }


    sector.opacity = getElementValue("sectorOpacityInside")
    sector.opacityOutsideRings = getElementValue("sectorOpacityOutside")



    sector.edge = sector.edge ?? {}
    sector.edge.color = getElementValue("sectorEdgeColor")
    sector.edge.width = getElementValue("sectorEdgeWidth")

    sector.labelSettings = sector.labelSettings ?? {}
    sector.labelSettings.fontFamily = getElementValue("sectorLabelFont")
    sector.labelSettings.color = getElementValue("sectorLabelColor")
    sector.labelSettings.fontSize = getElementValue("sectorLabelSize")
    sector.labelSettings.showCurved = document.getElementById("curvedSectorLabel").checked // checkbox?
    sector.labelSettings.showStraight = document.getElementById("straightSectorLabel").checked // checkbox?
    sector.visible = document.getElementById("showSector").checked


    const valueMap = viewpoint.propertyVisualMaps["sector"].valueMap
    // remove all entries from valueMap with value sector (sequence)
    getAllKeysMappedToValue(sectorVisualMap.valueMap, sectorToEdit).forEach((key) => delete sectorVisualMap.valueMap[key])
    mappedSectorPropertyValues.forEach((value) => { valueMap[value] = sectorToEdit })
    publishRefreshRadar()
}


const hideMe = () => {
    showOrHideElement("modalEditor", false)
}
