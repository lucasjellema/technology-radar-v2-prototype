export { launchMainEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { capitalize, getPropertyFromPropertyPath, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'
import { launchSectorConfigurator } from './sectorConfigurator.js'




const launchMainEditor = (viewpoint, drawRadarBlips, tab) => {
    renderTabs(tab, viewpoint, drawRadarBlips)
    if (tab == "sector") {
        launchSectorConfigurator(viewpoint, drawRadarBlips)
    }
    // renders tabs
    else {
        showOrHideElement("modalMain", true)
        setTextOnElement("modalMainTitle", "Radar Configurator - Main")
        
        const contentContainer = document.getElementById("modalMainContentContainer")
        let html =`
        <label for="radarTitle">Radar Title</label>
        <input id="radarTitle" type="text" value="${viewpoint.template.title.text}" size="60"></input>
        <br/><br/><br/><br/>
        `
        //html += `</table><br/>`
        html += `<a href="#" id="advancedToggle" >Show Advanced Properties?</a>
        <table id="advancedradarProperties"><tr>`
    
    
        html += `<tr>
        <td><label for="radarLabelFont">Font (Family)</label>
        <input id="radarLabelFont" list="fontsList"   value="${undefinedToDefined(viewpoint.template?.title?.fontFamily)}"></input>
        <label for="radarLabelSize">Font Size</label>
        <input id="radarLabelSize" type="text" value="${undefinedToDefined(viewpoint.template.title?.fontSize)}"></input
        </td>
        <td ><label for="radarLabelColor">Color</label><input id="radarLabelColor" type="color"  value="${viewpoint.template.title?.color}" ></input>
        </td>
        </td></tr>`
    
        // html += `<tr><td><label for="radarAngle">%</label></td><td><input id="radarAnglePercentage" value="${Math.round(radar.angle * 100)}"></input>
        // <input id="radarAngle" type="range" min="5" max="95" value="${Math.round(radar.angle * 100)}"></input></td>
        // </tr>`
        // html += `<tr><td><label for="radarColor">Color</label></td>
        // <td><label for="radarColorInside">Color (inside rings)</label><input id="radarColorInside" type="color" 
        // value="${radar?.backgroundColor ?? '#FFFFFF'}"></input>
        
        // </td>`
        //     + `<td><label for="radarColorOutside">Color (outside rings)</label></td><td><input id="radarColorOutside" type="color" value="${radar?.outerringBackgroundColor ?? "#FFFFFF"}"></input>
          
        //     </td></tr>`
        // html += `<tr><td>  <label for="radarOpacity">Opacity</label></td>
        //     <td><label for="radarOpacityInside">Opacity (inside rings)</label>
        //     <input id="radarOpacityInside" type="range" min="0" max="1" step="0.05" value="${radar.opacity}">    </input>
        //     </td>`
        //     + `<td><label for="radarOpacityOutside">Opacity (outside rings)</label>
        //     <input id="radarOpacityOutside" type="range" min="0" max="1" step="0.05" value="${radar.opacityOutsideRings}">    </input>
        //         </td></tr>`
    
        // html += `<tr><td rowspan="2"><label for="backgroundImageURL">Background Image</label></td>
        // <td>URL<input id="backgroundImageURL" type="text" value="${undefinedToDefined(radar.backgroundImage.image)}" title="URL to image to use as radar illustration"></input>     
        //  <textarea id="backgroundImagePasteArea" placeholder="Paste Image" title="Paste Image for radar here" rows="1" cols="15" title="Paste image from clip board"></textarea>
        //  </td><td><img id="backgroundImage" style="padding:6px" src="${radar.backgroundImage.image}" width="70px"></img></td></tr>`
    
        // html += `<tr><td>Scalefactor
        //             <input type="text"  id="backgroundImageScaleFactor" title="Scalefactor for background image"  value="${undefinedToDefined(radar.backgroundImage?.scaleFactor)}"></input>
        //          </td><td></td></tr>`
    
    
        // html += `<tr><td><label for="edge">Edge Settings</label></td>
        //  <td><label for="radarEdgeWidth">Width (<span id="radarEdgeHeading">${undefinedToDefined(radar.edge?.width)}</span>)</label><input id="radarEdgeWidth" type="range" min="0" max="15" step="1" value="${radar.edge?.width}"></input>
        //  </td>
        //  <td ><label for="radarEdgeColor">Color</label><input id="radarEdgeColor" type="color"  value="${radar?.edge?.color ?? "#FFFFFF"}" >
        //  </td>
        //  </td></tr>`
    
    
        html = `${html}</table>
        <br/><datalist id="fontsList"></datalist>
        `
        contentContainer.innerHTML=html

      //  showOrHideElement(`backgroundImage`, !(typeof radar.backgroundImage?.image == 'undefined' || radar?.backgroundImage?.image == null || radar?.backgroundImage?.image.length < 5))
        showOrHideElement('advancedradarProperties', false)
    
        document.getElementById('advancedToggle').addEventListener('click', () => { showOrHideElement('advancedradarProperties', true) })
        populateFontsList('fontsList')    


        const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `<input id="saveRadarEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveRadarEdits").addEventListener("click",
        (event) => {
            console.log(`save radar edits  `)
            saveRadarSettings(viewpoint)
            showOrHideElement('modalEditor', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })
    }
}

const renderTabs = (tab, viewpoint, drawRadarBlips) => {
    const tabContainer = document.getElementById('modalMainTabs')
    const html = `            
            <span id="radarConfigurationTab" class="extra tagfilter ">Radar</span>
            <span id="datamodelConfigurationTab" class="extra tagfilter">Data Model</span>
            <span id="sectorConfigurationTab" class="extra  tagfilter">Sector</span>
            <span id="ringConfigurationTab" class="extra tagfilter">Rings</span>
            <span id="shapeConfigurationTab" class="extra tagfilter">Shapes</span>
            <span id="colorConfigurationTab" class="extra tagfilter">Colors</span>
            <span id="sizeConfigurationTab" class="extra tagfilter">Sizes</span>
`
    tabContainer.innerHTML = html
    const selectedTab = document.getElementById(`${tab ?? "radar"}ConfigurationTab`)
    if (selectedTab != null) selectedTab.classList.add("warning")

    // add event listeners
    document.getElementById(`sectorConfigurationTab`).addEventListener("click"
        , () => { launchSectorConfigurator(viewpoint, drawRadarBlips) })
    document.getElementById(`radarConfigurationTab`).addEventListener("click"
        , () => { launchMainEditor(viewpoint, drawRadarBlips, "radar") })

}

const saveRadarSettings = (viewpoint) => {
    viewpoint.template.title.text = getElementValue("radarTitle")
    viewpoint.template.title.fontFamily = getElementValue("radarLabelFont")
    viewpoint.template.title.fontSize = getElementValue("radarLabelSize")
    viewpoint.template.title.color = getElementValue("radarLabelColor")
}
