export { launchMainEditor }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { launchSectorEditor } from './sectorEditing.js'
import {capitalize, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'


const getPropertyValuesAndCounts = (propertyPath, ratings) => { // filter on rating type!
    const valueOccurenceMap = {}
    for (let i = 0; i < Object.keys(ratings).length; i++) {
        const value = getNestedPropertyValueFromObject(ratings[Object.keys(ratings)[i]], propertyPath)
        const currentCount = valueOccurenceMap[value] ?? 0
        valueOccurenceMap[value] = currentCount + 1
    }
    return valueOccurenceMap
}


const launchMainEditor = (viewpoint, drawRadarBlips) => {
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]
    const valueOccurrenceMap = getPropertyValuesAndCounts(sectorVisualMap["property"], getData().ratings) // TODO only ratings of proper rating type!!
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator")
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

    html += `<label for="mappedPropertySelector">Rating property to map to sector</label> <select id="mappedPropertySelector" ></select><br/>`
    html += `<input type="button" id="addSectorButton"  value="Add Sector"  style="padding:6px;margin:10px"/>`

    html += `<table id="sectors">`
    html += `<tr><th>Sector Label</th><th>%</th><th>Mapped Values</th><th>Current Count</th><th>Visible</th><th>Delete?</th><th>v ^</th></tr>`
    for (let i = 0; i < viewpoint.template.sectorConfiguration.sectors.length; i++) {
        const sector = viewpoint.template.sectorConfiguration.sectors[i]
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
        <td><input id="showSector${i}" type="checkbox" ${sector?.visible == false?"":"checked"}></input></td> 
        <td><span id="deleteSector${i}" class="clickableProperty">Delete</span></td> 
        <td><span id="downSector${i}" class="clickableProperty">${i < viewpoint.template.sectorConfiguration.sectors.length - 1 ? "v" : ""}</span>&nbsp;
        <span id="upSector${i}" class="clickableProperty">${i > 0 ? "^" : ""}</span></td> 
        </tr> `

    }
    html += `</table>`
    html += `<input type="button" id="distributeEvenly"  value="Distribute Evenly"  style="padding:10px;margin:10px"/>`
    html += `<input type="button" id="distributeValueOccurrenceBased"  value="Distribute According to Value Occurrences"  style="padding:10px;margin:10px"/>`

    contentContainer.innerHTML = `${html}</table>`

    // add event listeners
    for (let i = 0; i < viewpoint.template.sectorConfiguration.sectors.length; i++) {
        document.getElementById(`showSector${i}`).addEventListener("change", (e) => {
            viewpoint.template.sectorConfiguration.sectors[i].visible = e.target.checked
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
            viewpoint.template.sectorConfiguration.sectors.splice(i, 1)
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
            launchMainEditor(viewpoint)
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()

        })
    }
    populateSelect("mappedPropertySelector", candidateMappedProperties, sectorVisualMap["property"])   // data is array objects with two properties : label and value
    document.getElementById(`mappedPropertySelector`).addEventListener("change", (e) => {
        reconfigureSectors(e.target.value, viewpoint)
    })

    document.getElementById(`distributeEvenly`).addEventListener("click", (e) => { distributeEvenly(viewpoint) })
    document.getElementById(`distributeValueOccurrenceBased`).addEventListener("click", (e) => { distributeValueOccurrenceBased(viewpoint) })
    document.getElementById(`addSectorButton`).addEventListener("click", (e) => {
        const newSector = {
            label: "NEW SECTOR",
            angle: 0.05,
            labelSettings: { showCurved: true, showStraight: false, color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
            backgroundImage: {},
            backgroundColor: "#FFFFFF",
            outerringBackgroundColor: "#FFFFFF"
        }
        viewpoint.template.sectorConfiguration.sectors.push(newSector)
        launchMainEditor(viewpoint)

        launchSectorEditor(viewpoint.template.sectorConfiguration.sectors.length - 1, viewpoint, drawRadarBlips)

    })




}

const backSector = (sectorToMoveBack, viewpoint) => {
    const sectorToMove = viewpoint.template.sectorConfiguration.sectors[sectorToMoveBack]
    viewpoint.template.sectorConfiguration.sectors[sectorToMoveBack] = viewpoint.template.sectorConfiguration.sectors[sectorToMoveBack + 1]
    viewpoint.template.sectorConfiguration.sectors[sectorToMoveBack + 1] = sectorToMove
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
    launchMainEditor(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const upSector = (sectorToMoveUp, viewpoint) => {
    const sectorToMove = viewpoint.template.sectorConfiguration.sectors[sectorToMoveUp]
    viewpoint.template.sectorConfiguration.sectors[sectorToMoveUp] = viewpoint.template.sectorConfiguration.sectors[sectorToMoveUp - 1]
    viewpoint.template.sectorConfiguration.sectors[sectorToMoveUp + -1] = sectorToMove
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
    launchMainEditor(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const distributeEvenly = (viewpoint) => {
    for (let i = 0; i < viewpoint.template.sectorConfiguration.sectors.length; i++) {
        viewpoint.template.sectorConfiguration.sectors[i].angle = 1 / viewpoint.template.sectorConfiguration.sectors.length
    }
    launchMainEditor(viewpoint)
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

    for (let i = 0; i < viewpoint.template.sectorConfiguration.sectors.length; i++) {
        const sector = viewpoint.template.sectorConfiguration.sectors[i]
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
    for (let i = 0; i < viewpoint.template.sectorConfiguration.sectors.length; i++) {
        viewpoint.template.sectorConfiguration.sectors[i].angle = valueCountPerSector[i] / total
    }

    launchMainEditor(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}


const reconfigureSectors = (propertyPath, viewpoint) => {
    const sectorVisualMap = viewpoint.propertyVisualMaps["sector"]
    sectorVisualMap["property"] = propertyPath

    const valueOccurrenceMap = getValueOccurrenceMap(viewpoint.propertyVisualMaps["sector"].property, viewpoint, true);
    // TODO cater for tags in getPropertyValuesAndCounts

    // remove entries from valueMap
    sectorVisualMap.valueMap = {}
    viewpoint.template.sectorConfiguration.sectors = []
    // create new entries for values in valueOccurrenceMap
    for (let i = 0; i < Object.keys(valueOccurrenceMap).length; i++) {
        const allowableLabel = getLabelForAllowableValue(Object.keys(valueOccurrenceMap)[i], viewpoint.propertyVisualMaps["sector"].property, viewpoint)
        const newSector = {
            label: allowableLabel ?? capitalize( Object.keys(valueOccurrenceMap)[i]),
            angle: 1 / Object.keys(valueOccurrenceMap).length,
            labelSettings: { showCurved: true, showStraight: false, color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
            edge: {color:"#000000", width: 1},
            backgroundImage: {},
            backgroundColor: "#FFFFFF",
            outerringBackgroundColor: "#FFFFFF"
        }

        viewpoint.template.sectorConfiguration.sectors.push(newSector)

        sectorVisualMap.valueMap[Object.keys(valueOccurrenceMap)[i]] = i // map value to numerically corresponding sector
    }


    launchMainEditor(viewpoint)
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
function getValueOccurrenceMap(propertyPath, viewpoint, includeAllowableValues = false) {
    let ratingType = viewpoint.ratingType;
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType];
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model);
    let sectorProperty = ratingTypeProperties.filter((property) => property.propertyPath == propertyPath)[0];

    const valueOccurrenceMap = getPropertyValuesAndCounts(propertyPath, getData().ratings); // TODO only ratings of proper rating type!!
    if (includeAllowableValues) {
        for (let i = 0; i < sectorProperty.property?.allowableValues?.length; i++) {
            valueOccurrenceMap[sectorProperty.property?.allowableValues[i].value] = valueOccurrenceMap[sectorProperty.property?.allowableValues[i].value] ?? 0;
        }
    }
    return valueOccurrenceMap;
}

