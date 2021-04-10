
export { launchBlipConfigurator }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { capitalize, getPropertyFromPropertyPath, populateFontsList, populateShapesList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'

const launchBlipConfigurator = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Blip Configuration")
    document.getElementById("blipConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    contentContainer.innerHTML = ''
    let html = `
    <label for="blipLabelPropertySelector">Property used as Blip Label</label>
    <select id="blipLabelPropertySelector"></select>  <br/>
    <label for="blipImagePropertySelector">Property used as Blip Image</label>
    <select id="blipImagePropertySelector"></select>  <br/>
    <label for="blipDefaultShape">Default Shape</label>
    <input id="blipDefaultShape" list="shapesList" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.defaultShape)}"></input>
    <label for="blipDefaultSize">Default Size</label>
    <input id="blipDefaultSize" type="text" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.defaultSize)}"></input>
    <label for="blipDefaultColor">Default Color</label>
    <input id="blipDefaultColor" type="color" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.defaultColor)}"></input>


    <br/><br/><br/><br/>
Font settings for Blip Label    
Blip Edge (decoration)?
<br/><datalist id="shapesList"></datalist>
    `
    contentContainer.innerHTML = html



    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model)

    // populate list with all string properties 
    const candidateLabelProperties = ratingTypeProperties
        .filter((property) => property.property.type == "string")
        .map((property) => { return { label: property.propertyPath, value: property.propertyPath } })
    const candidateImageProperties = ratingTypeProperties
        .filter((property) => property.property.type == "image")
        .map((property) => { return { label: property.propertyPath, value: property.propertyPath } })
    populateSelect("blipLabelPropertySelector", candidateLabelProperties, viewpoint.propertyVisualMaps.blip?.label)   // data is array objects with two properties : label and value
    populateSelect("blipImagePropertySelector", candidateImageProperties, viewpoint.propertyVisualMaps.blip?.image)   // data is array objects with two properties : label and value
    populateShapesList("shapesList")


    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `<input id="saveBlipEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveBlipEdits").addEventListener("click",
        (event) => {
            console.log(`save blip edits  `)
            saveBlipSettings(viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })


}

const saveBlipSettings = (viewpoint) => {
    if (viewpoint.template.blip == null) viewpoint.template.blip = {}
    viewpoint.propertyVisualMaps.blip.label = getElementValue("blipLabelPropertySelector")
    viewpoint.propertyVisualMaps.blip.image = getElementValue("blipImagePropertySelector")
    viewpoint.propertyVisualMaps.blip.defaultShape = getElementValue("blipDefaultShape")
    viewpoint.propertyVisualMaps.blip.defaultColor = getElementValue("blipDefaultColor")
    viewpoint.propertyVisualMaps.blip.defaultSize = getElementValue("blipDefaultSize")
}
