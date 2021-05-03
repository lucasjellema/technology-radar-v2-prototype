
export { launchAggregationConfigurator }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getRatingTypeForRatingTypeName, getViewpoint, getData, publishRefreshRadar } from './data.js';
import { unselectAllTabs, capitalize, getPropertyFromPropertyPath, populateFontsList, populateShapesList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'


const launchAggregationConfigurator = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Aggregation Configuration")
    unselectAllTabs()
    document.getElementById("aggregationConfigurationTab").classList.add("selectedTab") 
    const contentContainer = document.getElementById("modalMainContentContainer")
    contentContainer.innerHTML = ''
    let html = `
    <label for="blipGroupByPropertySelector">Property used to Group By</label>
    <select id="blipGroupByPropertySelector"></select>  
    <br /> 
    <label for="blipHoverPropertySelector">Property used in Hover Label</label>
    <select id="blipHoverPropertySelector"></select>  
    <br />
    <label for="collectPropertySelector">Properties to collect values from</label>
    <select id="collectPropertySelector" multiple size="10"></select>  
    <br/>
    <br/>


    <label for="aggregatedBlipShape">Shape for Aggregated Blips</label>
        <input id="aggregatedBlipShape" list="shapesList" value="${undefinedToDefined(viewpoint.propertyVisualMaps.aggregation?.shape)}"></input>
        <br />
        <label for="aggregatedBlipColor">Color for Aggregated Blips</label>
        <input id="aggregatedBlipColor" type="color"  value="${undefinedToDefined(viewpoint.propertyVisualMaps.aggregation?.color, "#800040")}" >
        <br/><datalist id="shapesList"></datalist>
`

    //     <label for="blipDefaultShape">Default Shape</label>
    //     <input id="blipDefaultShape" list="shapesList" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.defaultShape)}"></input>
    //     <label for="blipDefaultSize">Default Size</label>
    //     <input id="blipDefaultSize" type="text" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.defaultSize)}"></input>
    //     <label for="blipDefaultColor">Default Color</label>
    //     <input id="blipDefaultColor" type="color" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.defaultColor)}"></input>
    //     <br />
    //     <label for="blipOpacitySlider">Blip Opacity</label>
    //     <p>
    //     <span>0 - transparent</span><input id="blipOpacitySlider" type="range" min="0" max="1" step="0.05" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.opacity,0.4)}" style="width:30%"></input><span>1 - opaque</span>
    // </p>
    //     <br/><br/><br/><br/>

    // <h3>Default Font Settings for Blip Label</h3>
    // <label for="defaultBlipLabelFont">Font (Family)</label>
    // <input id="defaultBlipLabelFont" list="fontsList"   value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.labelSettings?.fontFamily)}"></input>
    // <label for="defaultBlipLabelSize">Font Size</label>
    // <input id="defaultBlipLabelSize" type="text" value="${undefinedToDefined(viewpoint.propertyVisualMaps.blip?.labelSettings?.fontSize)}"></input
    // <label for="defaultBlipLabelColor">Color</label>
    // <input id="defaultBlipLabelColor" type="color"  value="${viewpoint.propertyVisualMaps.blip?.labelSettings?.color}" >
    // <br />
    // Blip Edge (decoration)?
    // <br/><datalist id="shapesList"></datalist>
    //  `
    contentContainer.innerHTML = html
    populateShapesList("shapesList")
    

    let ratingType = getRatingTypeForRatingTypeName(viewpoint.ratingType)
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model)

    // populate list with all string properties 
    const candidateGroupByProperties = ratingTypeProperties
        .filter((property) => property.property.type == "string")
        .map((property) => { return { label: property.propertyPath, value: property.propertyPath } })
        populateSelect("blipGroupByPropertySelector", candidateGroupByProperties, viewpoint.propertyVisualMaps.aggregation?.groupByProperty)   // data is array objects with two properties : label and value
        populateSelect("blipHoverPropertySelector", candidateGroupByProperties, viewpoint.propertyVisualMaps.aggregation?.hoverProperty)   // data is array objects with two properties : label and value
        populateSelect("collectPropertySelector", candidateGroupByProperties, viewpoint.propertyVisualMaps.aggregation?.collectProperty)   // data is array objects with two properties : label and value


    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `<input id="saveAggregationEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveAggregationEdits").addEventListener("click",
        (event) => {
            console.log(`save aggregation edits  `)
            saveAggregationEdits(viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })


}

const saveAggregationEdits = (viewpoint) => {
    if (viewpoint.propertyVisualMaps.aggregation == null) viewpoint.propertyVisualMaps.aggregation = {}
    viewpoint.propertyVisualMaps.aggregation.groupByProperty = getElementValue("blipGroupByPropertySelector")
    viewpoint.propertyVisualMaps.aggregation.hoverProperty = getElementValue("blipHoverPropertySelector")

    viewpoint.propertyVisualMaps.aggregation.shape = getElementValue("aggregatedBlipShape")
    viewpoint.propertyVisualMaps.aggregation.color = getElementValue("aggregatedBlipColor")
    const collectProperties = getSelectValues(document.getElementById("collectPropertySelector"))
    viewpoint.propertyVisualMaps.aggregation.collectProperties = collectProperties
    // console.log(`selected collect props = ${JSON.stringify(collectProperties)}`)

}


function getSelectValues(select) {
    var result = [];
    var options = select && select.options;
    var opt;

    for (var i = 0, iLen = options.length; i < iLen; i++) {
        opt = options[i];

        if (opt.selected) {
            result.push(opt.value || opt.text);
        }
    }
    return result;
}