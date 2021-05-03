
export { launchBlipConfigurator }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getRatingTypeForRatingTypeName,getViewpoint, getData, publishRefreshRadar } from './data.js';
import {  unselectAllTabs, capitalize, getPropertyFromPropertyPath, populateFontsList, populateShapesList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'

const launchBlipConfigurator = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Blip Configuration")
    unselectAllTabs()
    document.getElementById("blipConfigurationTab").classList.add("selectedTab") 
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
    <br />
    <label for="blipOpacitySlider">Blip Opacity</label>
    <p>
    <span>0 - transparent</span><input id="blipOpacitySlider" type="range" min="0" max="1" step="0.05" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.opacity,0.4)}" style="width:30%"></input><span>1 - opaque</span>
</p>
    <br/><br/><br/><br/>

<h3>Default Font Settings for Blip Label</h3>
<label for="defaultBlipLabelFont">Font (Family)</label>
<input id="defaultBlipLabelFont" list="fontsList"   value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.labelSettings?.fontFamily)}"></input>
<label for="defaultBlipLabelSize">Font Size</label>
<input id="defaultBlipLabelSize" type="text" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.labelSettings?.fontSize)}"></input
<label for="defaultBlipLabelColor">Color</label>
<input id="defaultBlipLabelColor" type="color"  value="${viewpoint.propertyVisualMaps.blip?.labelSettings?.color}" >
<br />
Blip Edge (decoration)?
<br/><datalist id="shapesList"></datalist>
    `
    contentContainer.innerHTML = html

    populateFontsList('fontsList')

    let ratingType = getRatingTypeForRatingTypeName(viewpoint.ratingType)
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
    if (viewpoint.propertyVisualMaps.blip == null) viewpoint.propertyVisualMaps.blip = {}
    viewpoint.propertyVisualMaps.blip.label = getElementValue("blipLabelPropertySelector")
    viewpoint.propertyVisualMaps.blip.image = getElementValue("blipImagePropertySelector")
    viewpoint.propertyVisualMaps.blip.defaultShape = getElementValue("blipDefaultShape")
    viewpoint.propertyVisualMaps.blip.defaultColor = getElementValue("blipDefaultColor")
    viewpoint.propertyVisualMaps.blip.defaultSize = getElementValue("blipDefaultSize")
    viewpoint.propertyVisualMaps.blip.opacity = getElementValue("blipOpacitySlider")
    if (viewpoint.propertyVisualMaps.blip.labelSettings == null) { viewpoint.propertyVisualMaps.blip.labelSettings = {} }

    viewpoint.propertyVisualMaps.blip.labelSettings.fontFamily = getElementValue("defaultBlipLabelFont")
viewpoint.propertyVisualMaps.blip.labelSettings.fontSize = getElementValue("defaultBlipLabelSize")
viewpoint.propertyVisualMaps.blip.labelSettings.color = getElementValue("defaultBlipLabelColor")
}
