export { launchSectorConfigurator, reconfigureSectorsFromPropertyPath }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { launchSectorEditor } from './sectorEditing.js'
import { capitalize, getPropertyValuesAndCounts, getPropertyFromPropertyPath, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement, toggleShowHideElement } from './utils.js'




const launchSectorConfigurator = (viewpoint, drawRadarBlips) => {
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]
    //const valueOccurrenceMap = getPropertyValuesAndCounts(sectorVisualMap["property"], getData().ratings) // TODO only ratings of proper rating type!!
    const valueOccurrenceMap = (sectorVisualMap == null || sectorVisualMap["property"] == null) ? null : getValueOccurrenceMap(sectorVisualMap["property"], viewpoint, true);
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Sectors")
    document.getElementById("sectorsConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")

    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model)

    // populate list with all discrete properties plus properties of type tag
    const candidateMappedProperties = ratingTypeProperties
        .filter((property) => property.property?.discrete || property.property?.allowableValues?.length > 0 || property.property.type == "tags")
        .map((property) => { return { label: property.propertyPath, value: property.propertyPath } })

    let html = ``

    html += `<label for="mappedPropertySelector">Rating property to map to sector</label> 
    <select id="mappedPropertySelector" ></select><span id="refreshSectors" style="padding:20px">Refresh Sector Mapping</span>  <br/>`

    html += `<input type="button" id="addSectorButton"  value="Add Sector"  style="padding:6px;margin:10px"/>`

    html += `<table id="sectors">`
    html += `<tr><th>Sector Label</th><th>%</th><th>Mapped Values</th><th>Current Count</th><th><span id="showAll" >Visible</span></th>
    <th><input id="supportOthers" type="checkbox" checked} title="Support an 'others' sector, to catch all orphaned blips"></input>Others?</th><th>Delete?</th><th>v ^</th></tr>`
    for (let i = 0; i < viewpoint.template.sectorsConfiguration.sectors.length; i++) {
        const sector = viewpoint.template.sectorsConfiguration.sectors[i]
        // find all values mapped to the sectorToEdit
        const mappedSectorPropertyValues = getAllKeysMappedToValue(sectorVisualMap.valueMap, i)
        // find out how many occurrences of this value exist? 



        html += `<tr>
        <td><span id="editSector${i}" class="clickableProperty">${sector.label}</a> </td>
        <td>${Math.round(100 * sector.angle)} </td>
        <td>`
        let valueCount = 0
        for (let j = 0; j < mappedSectorPropertyValues.length; j++) {
            html += `
        <span id="tag0" class="extra tagfilter dropbtn">${mappedSectorPropertyValues[j]} (${undefinedToDefined(valueOccurrenceMap[mappedSectorPropertyValues[j]], 0)})</span>`
            valueCount += undefinedToDefined(valueOccurrenceMap[mappedSectorPropertyValues[j]], 0)
        }
        html += `</td>
        <td>${valueCount} </td>
        <td><input id="showSector${i}" type="checkbox" ${sector?.visible == false ? "" : "checked"}></input></td> 
        <td><input id="othersSector${i}" type="radio" name="others" value="${i}" ${sector?.others == true ? "checked" : ""}></input></td> 
        <td><span id="deleteSector${i}" class="clickableProperty">Delete</span></td> 
        <td><span id="downSector${i}" class="clickableProperty">${i < viewpoint.template.sectorsConfiguration.sectors.length - 1 ? "v" : ""}</span>&nbsp;
        <span id="upSector${i}" class="clickableProperty">${i > 0 ? "^" : ""}</span></td> 
        </tr> `

    }
    html += `</table>`
    html += `<input type="button" id="distributeEvenly"  value="Distribute Evenly"  style="padding:10px;margin:10px"/>`
    html += `<input type="button" id="distributeValueOccurrenceBased"  value="Distribute According to Value Occurrences"  style="padding:10px;margin:10px"/>`

    html += `<br/>
    <a href="#" id="advancedSectorPropsToggle" >Show Advanced Properties?</a>
    <br />
    <div id="sectorAdvancedProps">
    <label for="totalAngle">Total % of full circle available for all sectors combined</label>
    <input id="totalAngle" type="text" value="${undefinedToDefined(viewpoint.template.sectorsConfiguration.totalAngle, 1)}"></input>
    <label for="initialAngle">Initial or Tilt angle</label>
    <input id="initialAngle" type="text" value="${undefinedToDefined(viewpoint.template.sectorsConfiguration.initialAngle, 0)}"></input> 
    <h3>Default Font & Background Color & Edge Settings</h3>
    <label for="defaultSectorLabelFont">Font (Family)</label>
    <input id="defaultSectorLabelFont" list="fontsList"   value="${undefinedToDefined(viewpoint.template.sectorsConfiguration?.labelSettings?.fontFamily)}"></input>
    <label for="defaultSectorLabelSize">Font Size</label>
    <input id="defaultSectorLabelSize" type="text" value="${undefinedToDefined(viewpoint.template.sectorsConfiguration?.labelSettings?.fontSize)}"></input
    <label for="defaultSectorShowCurved" >Curved Label?</label><input id="defaultSectorShowCurved" type="checkbox" ${viewpoint.template.sectorsConfiguration?.labelSettings?.showCurved ? "checked" : ""}/>
    <label for="defaultSectorShowStraight" >Straight Label?</label><input id="defaultSectorShowStraight" type="checkbox"  ${viewpoint.template.sectorsConfiguration?.labelSettings?.showStraight ? "checked" : ""}/>

    <br />
    <label for="defaultSectorLabelColor">Color</label>
    <input id="defaultSectorLabelColor" type="color"  value="${viewpoint.template.sectorsConfiguration?.labelSettings?.color}" >
    <br/>
    <label for="defaultSectorColorInside">Color (inside rings)</label>
    <input id="defaultSectorColorInside" type="color" value="${viewpoint.template.sectorsConfiguration?.backgroundColor ?? '#FFFFFF'}"></input>
    <label for="defaultSectorColorOutside">Color (outside rings)</label></td><td>
    <input id="defaultSectorColorOutside" type="color" value="${viewpoint.template.sectorsConfiguration?.outerringBackgroundColor ?? "#FFFFFF"}"></input>
    <br />
    <label for="defaultSectorOpacity">Opacity</label></td>
    <td><label for="defaultSectorOpacityInside">Opacity (inside rings)</label>
    <input id="defaultSectorOpacityInside" type="range" min="0" max="1" step="0.05" value="${viewpoint.template.sectorsConfiguration?.opacity}" style="width:300px">    </input>
    <br />
    <label for="sectorOpacityOutside">Opacity (outside rings)</label>
    <input id="defaultSectorOpacityOutside" type="range" min="0" max="1" step="0.05" value="${viewpoint.template.sectorsConfiguration?.opacityOutsideRings}" style="width:300px">    </input>
    <label for="edge">Edge Settings</label></td>
    <label for="defaultSectorEdgeWidth">Width (<span id="defaultSectorEdgeHeading">${undefinedToDefined(viewpoint.template.sectorsConfiguration?.edge?.width)}</span>)</label>
    <input id="defaultSectorEdgeWidth" type="range" min="0" max="15" step="1" value="${viewpoint.template.sectorsConfiguration?.edge?.width}" style="width:300px"></input>
    <label for="defaultSectorEdgeColor">Color</label><input id="defaultSectorEdgeColor" type="color"  value="${viewpoint.template.sectorsConfiguration?.edge?.color ?? "#FFFFFF"}" >
    <label for="defaultSectorEdgeStrokeArray">Stroke Array</label><input id="defaultSectorEdgeStrokeArray" type="text" title="Stroke Array, A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. For example:  3 1 (3 strokes, one gap) or 10, 1 (10 strokes, one gap)" value="${undefinedToDefined( viewpoint.template.sectorsConfiguration?.edge?.strokeArray,'')}"></input>

    </div>
    <br/><br/> `

    contentContainer.innerHTML = `${html}`
    showOrHideElement("sectorAdvancedProps", false)
    document.getElementById('advancedSectorPropsToggle').addEventListener('click', () => { toggleShowHideElement('sectorAdvancedProps') })

    // add event listeners
    document.getElementById(`supportOthers`).addEventListener("change", (e) => {
        const supportOthers = e.target.checked
        if (!supportOthers) {
            viewpoint.template.sectorsConfiguration.sectors.forEach((sector) => sector.others = false)
            for (let i = 0; i < viewpoint.template.sectorsConfiguration.sectors.length; i++) {
                document.getElementById(`othersSector${i}`).checked = false
            }
        } // 

    })
    for (let i = 0; i < viewpoint.template.sectorsConfiguration.sectors.length; i++) {
        document.getElementById(`othersSector${i}`).addEventListener("change", (e) => {
            viewpoint.template.sectorsConfiguration.sectors.forEach((sector) => sector.others = false)

            viewpoint.template.sectorsConfiguration.sectors[i].others = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })
        document.getElementById(`showSector${i}`).addEventListener("change", (e) => {
            viewpoint.template.sectorsConfiguration.sectors[i].visible = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })
        document.getElementById(`editSector${i}`).addEventListener("click", () => {
            launchSectorEditor(i, viewpoint, drawRadarBlips)
            // hideMe() // show the main editor?
        })
        document.getElementById(`downSector${i}`).addEventListener("click", () => {
            backSector(i, viewpoint)
        })
        document.getElementById(`upSector${i}`).addEventListener("click", () => {
            upSector(i, viewpoint)
        })
        document.getElementById(`deleteSector${i}`).addEventListener("click", () => {
            viewpoint.template.sectorsConfiguration.sectors.splice(i, 1)
            // remove from propertyVisualMap all value mappings to this sector and decrease the sector reference for any entry  higher than i
            const valueMap = sectorVisualMap.valueMap
            for (let j = 0; j < Object.keys(valueMap).length; j++) {
                console.log(`evaluate mapping for ${Object.keys(valueMap)[j]}; sector = ${valueMap[Object.keys(valueMap)[j]]}`)
                if (valueMap[Object.keys(valueMap)[j]] == i) {
                    console.log(`delete mapping for ${Object.keys(valueMap)[j]}`)
                    delete valueMap[Object.keys(valueMap)[j]];
                }

                if (valueMap[Object.keys(valueMap)[j]] > i) {
                    valueMap[Object.keys(valueMap)[j]] = valueMap[Object.keys(valueMap)[j]] - 1;
                    console.log(`reassign mapping for ${Object.keys(valueMap)[j]}`)
                }
            }
            launchSectorConfigurator(viewpoint)
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()

        })
    }
    populateSelect("mappedPropertySelector", candidateMappedProperties, sectorVisualMap["property"])   // data is array objects with two properties : label and value
    populateFontsList('fontsList')
    document.getElementById(`mappedPropertySelector`).addEventListener("change", (e) => {
        reconfigureSectors(e.target.value, viewpoint)
    })
    document.getElementById(`refreshSectors`).addEventListener("click", () => { refreshSectorConfiguration(viewpoint) })

    document.getElementById(`showAll`).addEventListener("click", (e) => {
        viewpoint.template.sectorsConfiguration.sectors.forEach((sector, i) => {
            sector.visible = true;
            document.getElementById(`showSector${i}`).checked = true
        })

        publishRadarEvent({ type: "shuffleBlips" })
        publishRefreshRadar()

    })
    document.getElementById(`distributeEvenly`).addEventListener("click", (e) => { distributeEvenly(viewpoint) })
    document.getElementById(`distributeValueOccurrenceBased`).addEventListener("click", (e) => { distributeValueOccurrenceBased(viewpoint) })
    document.getElementById(`addSectorButton`).addEventListener("click", (e) => {
        const newSector = {
            label: "NEW SECTOR",
            angle: 0.05,
            labelSettings: { },
            backgroundImage: {},
        }
        viewpoint.template.sectorsConfiguration.sectors.push(newSector)
        launchSectorConfigurator(viewpoint)

        launchSectorEditor(viewpoint.template.sectorsConfiguration.sectors.length - 1, viewpoint, drawRadarBlips)

    })

    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `<input id="saveSectorSettings" type="button" value="Save Changes"></input>`
    document.getElementById("saveSectorSettings").addEventListener("click",
        (event) => {
            console.log(`save sector edits  `)
            saveSettings(viewpoint)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })
}

const saveSettings = (viewpoint) => {
    viewpoint.template.sectorsConfiguration.totalAngle = getElementValue("totalAngle")
    viewpoint.template.sectorsConfiguration.initialAngle = getElementValue("initialAngle")
    if (viewpoint.template.sectorsConfiguration.labelSettings == null) { viewpoint.template.sectorsConfiguration.labelSettings = {} }
    viewpoint.template.sectorsConfiguration.labelSettings.fontFamily = getElementValue("defaultSectorLabelFont")
    viewpoint.template.sectorsConfiguration.labelSettings.fontSize = getElementValue("defaultSectorLabelSize")
    viewpoint.template.sectorsConfiguration.labelSettings.color = getElementValue("defaultSectorLabelColor")
    viewpoint.template.sectorsConfiguration.labelSettings.showStraight = document.getElementById("defaultSectorShowStraight").checked
    viewpoint.template.sectorsConfiguration.labelSettings.showCurved = document.getElementById("defaultSectorShowCurved").checked

    viewpoint.template.sectorsConfiguration.backgroundColor = getElementValue("defaultSectorColorInside")
    viewpoint.template.sectorsConfiguration.outerringBackgroundColor = getElementValue("defaultSectorColorOutside")
    viewpoint.template.sectorsConfiguration.opacity = getElementValue("defaultSectorOpacityInside")
    viewpoint.template.sectorsConfiguration.opacityOutsideRings = getElementValue("defaultSectorOpacityOutside")

    if (viewpoint.template.sectorsConfiguration.edge == null) { viewpoint.template.sectorsConfiguration.edge = {} }
    viewpoint.template.sectorsConfiguration.edge.width = getElementValue("defaultSectorEdgeWidth")
    viewpoint.template.sectorsConfiguration.edge.color = getElementValue("defaultSectorEdgeColor")
    viewpoint.template.sectorsConfiguration.edge.strokeArray = getElementValue("defaultSectorEdgeStrokeArray")


}

const backSector = (sectorToMoveBack, viewpoint) => {
    const sectorToMove = viewpoint.template.sectorsConfiguration.sectors[sectorToMoveBack]
    viewpoint.template.sectorsConfiguration.sectors[sectorToMoveBack] = viewpoint.template.sectorsConfiguration.sectors[sectorToMoveBack + 1]
    viewpoint.template.sectorsConfiguration.sectors[sectorToMoveBack + 1] = sectorToMove
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]
    // update in propertyVisualMap all value mappings to either of these sectors
    const valueMap = sectorVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == sectorToMoveBack) {
            valueMap[Object.keys(valueMap)[j]] = sectorToMoveBack + 1
        } else if (valueMap[Object.keys(valueMap)[j]] == sectorToMoveBack + 1) {
            valueMap[Object.keys(valueMap)[j]] = sectorToMoveBack
        }
    }
    launchSectorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const upSector = (sectorToMoveUp, viewpoint) => {
    const sectorToMove = viewpoint.template.sectorsConfiguration.sectors[sectorToMoveUp]
    viewpoint.template.sectorsConfiguration.sectors[sectorToMoveUp] = viewpoint.template.sectorsConfiguration.sectors[sectorToMoveUp - 1]
    viewpoint.template.sectorsConfiguration.sectors[sectorToMoveUp + -1] = sectorToMove
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]
    // update in propertyVisualMap all value mappings to either of these sectors
    const valueMap = sectorVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == sectorToMoveUp) {
            valueMap[Object.keys(valueMap)[j]] = sectorToMoveUp - 1
        } else if (valueMap[Object.keys(valueMap)[j]] == sectorToMoveUp - 1) {
            valueMap[Object.keys(valueMap)[j]] = sectorToMoveUp
        }
    }
    launchSectorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const distributeEvenly = (viewpoint) => {
    for (let i = 0; i < viewpoint.template.sectorsConfiguration.sectors.length; i++) {
        viewpoint.template.sectorsConfiguration.sectors[i].angle = 1 / viewpoint.template.sectorsConfiguration.sectors.length
    }
    launchSectorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const distributeValueOccurrenceBased = (viewpoint) => {
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]
    const propertyPath = viewpoint.propertyVisualMaps["sector"].property
    sectorVisualMap["property"] = propertyPath
    const valueOccurrenceMap = getValueOccurrenceMap(propertyPath, viewpoint, true);

    const valueCountPerSector = []
    let total = 0

    for (let i = 0; i < viewpoint.template.sectorsConfiguration.sectors.length; i++) {
        const sector = viewpoint.template.sectorsConfiguration.sectors[i]
        const mappedSectorPropertyValues = getAllKeysMappedToValue(sectorVisualMap.valueMap, i)
        // find out how many occurrences of this value exist? 
        let valueCount = 0
        for (let j = 0; j < mappedSectorPropertyValues.length; j++) {
            valueCount += undefinedToDefined(valueOccurrenceMap[mappedSectorPropertyValues[j]], 0)
        }
        valueCount = Math.max(valueCount, 3) // 3 is arbitrary minimum to prevent too small sectors
        valueCountPerSector.push(valueCount)
        total += valueCount
    }
    console.log(`value count per sector ${JSON.stringify(valueCountPerSector)}; total ${total}; minimum number ${0.03 * total}`)
    for (let i = 0; i < viewpoint.template.sectorsConfiguration.sectors.length; i++) {
        viewpoint.template.sectorsConfiguration.sectors[i].angle = valueCountPerSector[i] / total
    }

    launchSectorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const refreshSectorConfiguration = (viewpoint) => {
    reconfigureSectors(viewpoint.propertyVisualMaps["sector"]["property"], viewpoint)
}

const reconfigureSectors = (propertyPath, viewpoint) => {
    reconfigureSectorsFromPropertyPath(propertyPath, viewpoint);


    launchSectorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()

}

const getLabelForAllowableValue = (value, propertyPath, viewpoint) => {
    let ratingType = viewpoint.ratingType;
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType];
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model);
    let sectorProperty = ratingTypeProperties.filter((property) => property.propertyPath == propertyPath)[0];

    for (let i = 0; i < sectorProperty.property?.allowableValues?.length; i++) {
        if (sectorProperty.property?.allowableValues[i].value == value) return sectorProperty.property?.allowableValues[i].label
    }
    return null
}

const hideMe = () => {
    showOrHideElement("modalMain", false); publishRefreshRadar()
}
function reconfigureSectorsFromPropertyPath(propertyPath, viewpoint) {
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"];
    sectorVisualMap["property"] = propertyPath;

    const valueOccurrenceMap = getValueOccurrenceMap(viewpoint.propertyVisualMaps["sector"].property, viewpoint, true);
    // TODO cater for tags in getPropertyValuesAndCounts
    // remove entries from valueMap
    sectorVisualMap.valueMap = {};
    viewpoint.template.sectorsConfiguration.sectors = [];
    // create new entries for values in valueOccurrenceMap
    for (let i = 0; i < Object.keys(valueOccurrenceMap).length; i++) {
        const allowableLabel = getLabelForAllowableValue(Object.keys(valueOccurrenceMap)[i], viewpoint.propertyVisualMaps["sector"].property, viewpoint);
        const newSector = {
            label: allowableLabel ?? capitalize(Object.keys(valueOccurrenceMap)[i]),
            angle: 1 / Object.keys(valueOccurrenceMap).length,
            labelSettings: {},
            edge: { },
            backgroundImage: {},

        };

        viewpoint.template.sectorsConfiguration.sectors.push(newSector);

        sectorVisualMap.valueMap[Object.keys(valueOccurrenceMap)[i]] = i;
    }
}

function getValueOccurrenceMap(propertyPath, viewpoint, includeAllowableValues = false) {
    const model = getData().model
    const focusRatingTypeName = typeof (viewpoint.ratingType) == "object" ? viewpoint.ratingType.name : viewpoint.ratingType
    let sectorProperty = getPropertyFromPropertyPath(propertyPath, viewpoint.ratingType, model)
    let valueOccurrenceMap
    if (sectorProperty.type == "tags") {
        valueOccurrenceMap = {}
        for (let i = 0; i < Object.keys(getData().ratings).length; i++) {
            const rating = getData().ratings[Object.keys(getData().ratings)[i]]
            if (rating.ratingType == focusRatingTypeName) {
                const tags = getNestedPropertyValueFromObject(getData().ratings[Object.keys(getData().ratings)[i]], propertyPath)
                tags.forEach((tag) => {
                    const currentCount = valueOccurrenceMap[tag] ?? 0
                    valueOccurrenceMap[tag] = currentCount + 1
                })
            }
        }
    }
    else {
        valueOccurrenceMap = getPropertyValuesAndCounts(propertyPath, getData().ratings, focusRatingTypeName)
        if (includeAllowableValues) {
            for (let i = 0; i < sectorProperty.allowableValues?.length; i++) {
                valueOccurrenceMap[sectorProperty.allowableValues[i].value] = valueOccurrenceMap[sectorProperty.allowableValues[i].value] ?? 0;
            }
        }
    }
    return valueOccurrenceMap;
}

