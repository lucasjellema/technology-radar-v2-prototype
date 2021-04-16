export { launchMainEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { capitalize, getPropertyFromPropertyPath, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'
import { launchSectorConfigurator } from './sectorConfigurator.js'
import { launchRingConfigurator } from './ringConfigurator.js'
import { launchDatamodelConfigurator } from './datamodelConfigurator.js'
import { launchBlipConfigurator } from './blipConfigurator.js'
import { launchShapeConfigurator } from './shapeConfigurator.js'
import { launchFileManager } from './fileManager.js'
import {launchRadarsManagementConfigurator} from './radarsManagement.js'



const launchMainEditor = (viewpoint, drawRadarBlips, tab) => {
    renderTabs(tab, viewpoint, drawRadarBlips)
    if (tab == "sector") {
        launchSectorConfigurator(viewpoint, drawRadarBlips)
    } else if (tab == "ring") {
        launchRingConfigurator(viewpoint, drawRadarBlips)
    } else if (tab == "datamodel") {
        launchDatamodelConfigurator(viewpoint, drawRadarBlips)
    } else if (tab == "blip") {
        launchBlipConfigurator(viewpoint, drawRadarBlips)
    }else if (tab == "shape") {
        launchShapeConfigurator(viewpoint, drawRadarBlips)
    }

    else {
        showOrHideElement("modalMain", true)
        setTextOnElement("modalMainTitle", "Radar Configurator - Main")

        const contentContainer = document.getElementById("modalMainContentContainer")
        let html = `
        <label for="radarTitle">Radar Title</label>
        <input id="radarTitle" type="text" value="${viewpoint.template.title.text}" size="60"></input>
        <br/><br/><br/><br/>
        `

        html += `<a href="#" id="advancedToggleRadar" >Show Advanced Properties?</a>
        <table id="advancedradarPropertiesRadar"><tr>`


        html += `<tr>
        <td><label for="radarLabelFont">Font (Family)</label>
        <input id="radarLabelFont" list="fontsList"   value="${undefinedToDefined(viewpoint.template?.title?.fontFamily)}"></input>
        <label for="radarLabelSize">Font Size</label>
        <input id="radarLabelSize" type="text" value="${undefinedToDefined(viewpoint.template.title?.fontSize)}"></input
        </td>
        <td ><label for="radarLabelColor">Color</label><input id="radarLabelColor" type="color"  value="${viewpoint.template.title?.color}" ></input>
        </td>
        </td></tr>`

        html += `<tr><td rowspan="2"><label for="backgroundImageURL">Background Image</label></td>
        <td>URL<input id="backgroundImageURLRadar" type="text" value="${undefinedToDefined(viewpoint.template.backgroundImage?.image)}" title="URL to image to use as radar illustration"></input>     
         <textarea id="backgroundImagePasteAreaRadar" placeholder="Paste Image" title="Paste Image for radar here" rows="1" cols="15" title="Paste image from clip board"></textarea>
         </td>
         <td><img id="backgroundImageRadar" style="padding:6px" src="${viewpoint.template.backgroundImage?.image}" width="70px"></img></td>
         </tr>`

        html += `<tr><td>Scalefactor
                    <input type="text"  id="backgroundImageScaleFactorRadar" title="Scalefactor for background image"  value="${undefinedToDefined(viewpoint.template.backgroundImage?.scaleFactor)}"></input>
                 </td><td></td></tr>`



        html = `${html}</table>
        <br/><datalist id="fontsList"></datalist>
        `
        contentContainer.innerHTML = html

        showOrHideElement(`backgroundImageRadar`, !(typeof viewpoint.template.backgroundImage?.image == 'undefined' || viewpoint.template?.backgroundImage?.image == null || viewpoint.template?.backgroundImage?.image.length < 5))
        showOrHideElement('advancedradarPropertiesRadar', false)

        const toggle = document.getElementById("advancedToggleRadar")
        toggle.addEventListener("click", () => {
            console.log(`sjow advanced`)
            showOrHideElement('advancedradarPropertiesRadar', true)
        })
        populateFontsList('fontsList')

        initializeImagePaster((imageURL) => {
            document.getElementById("backgroundImageURLRadar").value = imageURL
            document.getElementById(`backgroundImageRadar`).src = imageURL
            showOrHideElement(`backgroundImageRadar`, !(typeof imageURL == 'undefined' || imageURL == null || imageURL.length < 5))

        }, `backgroundImagePasteAreaRadar`)


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
            <span id="blipConfigurationTab" class="extra tagfilter">Blips</span>
            <span id="radarManagementConfigurationTab" class="extra tagfilter" style="margin:40">Radars Management</span>
            <span id="fileConfigurationTab" class="extra tagfilter">File Manager</span>
`
    tabContainer.innerHTML = html
    const selectedTab = document.getElementById(`${tab ?? "radar"}ConfigurationTab`)
    if (selectedTab != null) selectedTab.classList.add("warning")

    // add tab event listeners
    document.getElementById(`sectorConfigurationTab`).addEventListener("click"
        , () => { launchSectorConfigurator(viewpoint, drawRadarBlips) })
        document.getElementById(`ringConfigurationTab`).addEventListener("click"
        , () => { launchRingConfigurator(viewpoint, drawRadarBlips) })
        document.getElementById(`shapeConfigurationTab`).addEventListener("click"
        , () => { launchShapeConfigurator(viewpoint, drawRadarBlips) })
    document.getElementById(`radarConfigurationTab`).addEventListener("click"
        , () => { launchMainEditor(viewpoint, drawRadarBlips, "radar") })
    document.getElementById(`datamodelConfigurationTab`).addEventListener("click"
        , () => { launchDatamodelConfigurator(viewpoint, drawRadarBlips) })
        document.getElementById(`blipConfigurationTab`).addEventListener("click"
        , () => { launchBlipConfigurator(viewpoint, drawRadarBlips) })

        document.getElementById(`radarManagementConfigurationTab`).addEventListener("click"
        , () => { launchRadarsManagementConfigurator() })
        document.getElementById(`fileConfigurationTab`).addEventListener("click"
        , () => { launchFileManager() })
    }

const saveRadarSettings = (viewpoint) => {
    viewpoint.template.title.text = getElementValue("radarTitle")
    viewpoint.template.title.fontFamily = getElementValue("radarLabelFont")
    viewpoint.template.title.fontSize = getElementValue("radarLabelSize")
    viewpoint.template.title.color = getElementValue("radarLabelColor")
    if (viewpoint.template.backgroundImage == null) viewpoint.template.backgroundImage = {}
    viewpoint.template.backgroundImage.image = getElementValue("backgroundImageURLRadar")
    viewpoint.template.backgroundImage.scaleFactor = getElementValue("backgroundImageScaleFactorRadar")
    if (viewpoint.template.backgroundImage.scaleFactor == null || viewpoint.template.backgroundImage.scaleFactor.length == 0) {
        delete viewpoint.template.backgroundImage.scaleFactor
    }
}
