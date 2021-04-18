export { launchRingConfigurator, reconfigureRingsFromPropertyPath }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { launchRingEditor } from './ringEditing.js'
import { capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'





const launchRingConfigurator = (viewpoint, drawRadarBlips) => {
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"]
    //const valueOccurrenceMap = getPropertyValuesAndCounts(ringVisualMap["property"], getData().ratings) // TODO only ratings of proper rating type!!
    const valueOccurrenceMap = (ringVisualMap == null || ringVisualMap["property"] == null) ? null : getValueOccurrenceMap(ringVisualMap["property"], viewpoint, true);
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Rings")
    document.getElementById("ringConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
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

    html += `<label for="mappedPropertySelector">Rating property to map to ring</label> 
    <select id="mappedPropertySelector" ></select><span id="refreshRings" style="padding:20px">Refresh Ring Mapping</span>  <br/>`
    html += `<input type="button" id="addRingButton"  value="Add Ring"  style="padding:6px;margin:10px"/>`

    html += `<table id="rings">`
    html += `<tr><th>Ring Label</th><th>%</th><th>Mapped Values</th><th>Current Count</th><th><span id="showAll" >Visible</span></th><th>Delete?</th><th>v ^</th></tr>`
    for (let i = 0; i < viewpoint.template.ringConfiguration.rings.length; i++) {
        const ring = viewpoint.template.ringConfiguration.rings[i]
        // find all values mapped to the ringToEdit
        const mappedRingPropertyValues = getAllKeysMappedToValue(ringVisualMap.valueMap, i)
        // find out how many occurrences of this value exist? 



        html += `<tr>
        <td><span id="editRing${i}" class="clickableProperty">${ring.label}</a> </td>
        <td>${Math.round(100 * ring.width)} </td>
        <td>`
        let valueCount = 0
        for (let j = 0; j < mappedRingPropertyValues.length; j++) {
            html += `
        <span id="tag0" class="extra tagfilter dropbtn">${mappedRingPropertyValues[j]} (${undefinedToDefined(valueOccurrenceMap[mappedRingPropertyValues[j]], 0)})</span>`
            valueCount += undefinedToDefined(valueOccurrenceMap[mappedRingPropertyValues[j]], 0)
        }
        html += `</td>
        <td>${valueCount} </td>
        <td><input id="showRing${i}" type="checkbox" ${ring?.visible == false ? "" : "checked"}></input></td> 
        <td><span id="deleteRing${i}" class="clickableProperty">Delete</span></td> 
        <td><span id="downRing${i}" class="clickableProperty">${i < viewpoint.template.ringConfiguration.rings.length - 1 ? "v" : ""}</span>&nbsp;
        <span id="upRing${i}" class="clickableProperty">${i > 0 ? "^" : ""}</span></td> 
        </tr> `

    }
    html += `</table>`
    html += `<input type="button" id="distributeEvenly"  value="Distribute Evenly"  style="padding:10px;margin:10px"/>`
    html += `<input type="button" id="distributeValueOccurrenceBased"  value="Distribute According to Value Occurrences"  style="padding:10px;margin:10px"/>`

    contentContainer.innerHTML = `${html}</table>`

    // add event listeners
    for (let i = 0; i < viewpoint.template.ringConfiguration.rings.length; i++) {
        document.getElementById(`showRing${i}`).addEventListener("change", (e) => {
            viewpoint.template.ringConfiguration.rings[i].visible = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })

        document.getElementById(`editRing${i}`).addEventListener("click", () => {
            launchRingEditor(i, viewpoint, drawRadarBlips)
            // hideMe() // show the main editor?
        })
        document.getElementById(`downRing${i}`).addEventListener("click", () => {
            backRing(i, viewpoint)
        })
        document.getElementById(`upRing${i}`).addEventListener("click", () => {
            upRing(i, viewpoint)
        })
        document.getElementById(`deleteRing${i}`).addEventListener("click", () => {
            viewpoint.template.ringConfiguration.rings.splice(i, 1)
            // remove from propertyVisualMap all value mappings to this ring and decrease the ring reference for any entry  higher than i
            const valueMap = ringVisualMap.valueMap
            for (let j = 0; j < Object.keys(valueMap).length; j++) {
                console.log(`evaluate mapping for ${Object.keys(valueMap)[j]}; ring = ${valueMap[Object.keys(valueMap)[j]]}`)
                if (valueMap[Object.keys(valueMap)[j]] == i) {
                    console.log(`delete mapping for ${Object.keys(valueMap)[j]}`)
                    delete valueMap[Object.keys(valueMap)[j]];
                }

                if (valueMap[Object.keys(valueMap)[j]] > i) {
                    valueMap[Object.keys(valueMap)[j]] = valueMap[Object.keys(valueMap)[j]] - 1;
                    console.log(`reassign mapping for ${Object.keys(valueMap)[j]}`)
                }
            }
            launchRingConfigurator(viewpoint)
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()

        })
    }
    populateSelect("mappedPropertySelector", candidateMappedProperties, ringVisualMap["property"])   // data is array objects with two properties : label and value
    document.getElementById(`mappedPropertySelector`).addEventListener("change", (e) => {
        reconfigureRings(e.target.value, viewpoint)
    })
    document.getElementById(`refreshRings`).addEventListener("click", () => { refreshRingConfiguration(viewpoint) })

    document.getElementById(`showAll`).addEventListener("click", (e) => {
        viewpoint.template.ringConfiguration.rings.forEach((ring, i) => {
            ring.visible = true;
            document.getElementById(`showRing${i}`).checked = true
        })

        publishRadarEvent({ type: "shuffleBlips" })
        publishRefreshRadar()

    })
    document.getElementById(`distributeEvenly`).addEventListener("click", (e) => { distributeEvenly(viewpoint) })
    document.getElementById(`distributeValueOccurrenceBased`).addEventListener("click", (e) => { distributeValueOccurrenceBased(viewpoint) })
    document.getElementById(`addRingButton`).addEventListener("click", (e) => {
        const newRing = {
            label: "NEW RING",
            width: 0.05,
            labelSettings: { showCurved: true, showStraight: false, color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
            backgroundImage: {},
            backgroundColor: "#FFFFFF",
            outerringBackgroundColor: "#FFFFFF"
        }
        viewpoint.template.ringConfiguration.rings.push(newRing)
        launchRingConfigurator(viewpoint)

        launchRingEditor(viewpoint.template.ringConfiguration.rings.length - 1, viewpoint, drawRadarBlips)

    })




}

const backRing = (ringToMoveBack, viewpoint) => {
    const ringToMove = viewpoint.template.ringConfiguration.rings[ringToMoveBack]
    viewpoint.template.ringConfiguration.rings[ringToMoveBack] = viewpoint.template.ringConfiguration.rings[ringToMoveBack + 1]
    viewpoint.template.ringConfiguration.rings[ringToMoveBack + 1] = ringToMove
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"]
    // update in propertyVisualMap all value mappings to either of these rings
    const valueMap = ringVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == ringToMoveBack) {
            valueMap[Object.keys(valueMap)[j]] = ringToMoveBack + 1
        } else if (valueMap[Object.keys(valueMap)[j]] == ringToMoveBack + 1) {
            valueMap[Object.keys(valueMap)[j]] = ringToMoveBack
        }
    }
    launchRingConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const upRing = (ringToMoveUp, viewpoint) => {
    const ringToMove = viewpoint.template.ringConfiguration.rings[ringToMoveUp]
    viewpoint.template.ringConfiguration.rings[ringToMoveUp] = viewpoint.template.ringConfiguration.rings[ringToMoveUp - 1]
    viewpoint.template.ringConfiguration.rings[ringToMoveUp + -1] = ringToMove
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"]
    // update in propertyVisualMap all value mappings to either of these rings
    const valueMap = ringVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == ringToMoveUp) {
            valueMap[Object.keys(valueMap)[j]] = ringToMoveUp - 1
        } else if (valueMap[Object.keys(valueMap)[j]] == ringToMoveUp - 1) {
            valueMap[Object.keys(valueMap)[j]] = ringToMoveUp
        }
    }
    launchRingConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const distributeEvenly = (viewpoint) => {
    for (let i = 0; i < viewpoint.template.ringConfiguration.rings.length; i++) {
        viewpoint.template.ringConfiguration.rings[i].width = 1 / viewpoint.template.ringConfiguration.rings.length
    }
    launchRingConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const distributeValueOccurrenceBased = (viewpoint) => {
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"]
    const propertyPath = viewpoint.propertyVisualMaps["ring"].property
    ringVisualMap["property"] = propertyPath
    const valueOccurrenceMap = getValueOccurrenceMap(propertyPath, viewpoint, true);

    const valueCountPerRing = []
    let total = 0

    for (let i = 0; i < viewpoint.template.ringConfiguration.rings.length; i++) {
        const ring = viewpoint.template.ringConfiguration.rings[i]
        const mappedRingPropertyValues = getAllKeysMappedToValue(ringVisualMap.valueMap, i)
        // find out how many occurrences of this value exist? 
        let valueCount = 0
        for (let j = 0; j < mappedRingPropertyValues.length; j++) {
            valueCount += undefinedToDefined(valueOccurrenceMap[mappedRingPropertyValues[j]], 0)
        }
        valueCount = Math.max(valueCount, 3) // 3 is arbitrary minimum to prevent too small rings
        valueCountPerRing.push(valueCount)
        total += valueCount
    }
    console.log(`value count per ring ${JSON.stringify(valueCountPerRing)}; total ${total}; minimum number ${0.03 * total}`)
    for (let i = 0; i < viewpoint.template.ringConfiguration.rings.length; i++) {
        viewpoint.template.ringConfiguration.rings[i].width = valueCountPerRing[i] / total
    }

    launchRingConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const refreshRingConfiguration = (viewpoint) => {
    reconfigureRings(viewpoint.propertyVisualMaps["ring"]["property"], viewpoint)
}

const reconfigureRings = (propertyPath, viewpoint) => {
    reconfigureRingsFromPropertyPath(propertyPath,viewpoint);


    launchRingConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()

}

const getLabelForAllowableValue = (value, propertyPath, viewpoint) => {
    let ratingType = viewpoint.ratingType;
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType];
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model);
    let ringProperty = ratingTypeProperties.filter((property) => property.propertyPath == propertyPath)[0];

    for (let i = 0; i < ringProperty.property?.allowableValues?.length; i++) {
        if (ringProperty.property?.allowableValues[i].value == value) return ringProperty.property?.allowableValues[i].label
    }
    return null
}

const hideMe = () => {
    showOrHideElement("modalMain", false); publishRefreshRadar()
}
function reconfigureRingsFromPropertyPath( propertyPath,viewpoint) {
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"];
    ringVisualMap["property"] = propertyPath;

    const valueOccurrenceMap = getValueOccurrenceMap(viewpoint.propertyVisualMaps["ring"].property, viewpoint, true);
    // TODO cater for tags in getPropertyValuesAndCounts
    // remove entries from valueMap
    ringVisualMap.valueMap = {};
    viewpoint.template.ringConfiguration.rings = [];
    // create new entries for values in valueOccurrenceMap
    for (let i = 0; i < Object.keys(valueOccurrenceMap).length; i++) {
        const allowableLabel = getLabelForAllowableValue(Object.keys(valueOccurrenceMap)[i], viewpoint.propertyVisualMaps["ring"].property, viewpoint);
        const newRing = {
            label: allowableLabel ?? capitalize(Object.keys(valueOccurrenceMap)[i]),
            width: 1 / Object.keys(valueOccurrenceMap).length,
            labelSettings: { showCurved: true, showStraight: false, color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
            edge: { color: "#000000", width: 1 },
            backgroundImage: {},
            backgroundColor: "#FFFFFF",
            outerringBackgroundColor: "#FFFFFF"
        };

        viewpoint.template.ringConfiguration.rings.push(newRing);

        ringVisualMap.valueMap[Object.keys(valueOccurrenceMap)[i]] = i;
    }
}

function getValueOccurrenceMap(propertyPath, viewpoint, includeAllowableValues = false) {
    const model = getData().model
    const focusRatingTypeName = typeof (viewpoint.ratingType) == "object" ? viewpoint.ratingType.name : viewpoint.ratingType

    let ringProperty = getPropertyFromPropertyPath(propertyPath, viewpoint.ratingType, model)
    let valueOccurrenceMap
    if (ringProperty.type == "tags") {
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
        valueOccurrenceMap = getPropertyValuesAndCounts(propertyPath, getData().ratings, focusRatingTypeName); 
        if (includeAllowableValues) {
            for (let i = 0; i < ringProperty.allowableValues?.length; i++) {
                valueOccurrenceMap[ringProperty.allowableValues[i].value] = valueOccurrenceMap[ringProperty.allowableValues[i].value] ?? 0;
            }
        }
    }
    return valueOccurrenceMap;
}

