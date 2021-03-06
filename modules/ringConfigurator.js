export { launchRingConfigurator, reconfigureRingsFromPropertyPath }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { launchRingEditor } from './ringEditing.js'
import { unselectAllTabs,capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement, toggleShowHideElement } from './utils.js'





const launchRingConfigurator = (viewpoint, drawRadarBlips) => {
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"]
    //const valueOccurrenceMap = getPropertyValuesAndCounts(ringVisualMap["property"], getData().ratings) // TODO only ratings of proper rating type!!
    const valueOccurrenceMap = (ringVisualMap == null || ringVisualMap["property"] == null) ? null : getValueOccurrenceMap(ringVisualMap["property"], viewpoint, true);
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Rings")
    unselectAllTabs()
    document.getElementById("ringsConfigurationTab").classList.add("selectedTab")
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
    html += `<tr><th>Ring Label</th><th>%</th><th>Mapped Values</th><th>Current Count</th><th><span id="showAll" >Visible</span></th>
    <th><input id="supportOthers" type="checkbox" checked} title="Support an 'others' ring, to catch all orphaned blips"></input> Others?</th><th>Delete?</th><th>v ^</th></tr>`
    for (let i = 0; i < viewpoint.template.ringsConfiguration.rings.length; i++) {
        const ring = viewpoint.template.ringsConfiguration.rings[i]
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
        <td><input id="othersRing${i}" type="radio" name="others" value="${i}" ${ring?.others == true ? "checked" : ""}></input></td> 

        <td><span id="deleteRing${i}" class="clickableProperty">Delete</span></td> 
        <td><span id="downRing${i}" class="clickableProperty">${i < viewpoint.template.ringsConfiguration.rings.length - 1 ? "v" : ""}</span>&nbsp;
        <span id="upRing${i}" class="clickableProperty">${i > 0 ? "^" : ""}</span></td> 
        </tr> `

    }
    html += `</table>`
    html += `<input type="button" id="distributeEvenly"  value="Distribute Evenly"  style="padding:10px;margin:10px"/>`
    html += `<input type="button" id="distributeValueOccurrenceBased"  value="Distribute According to Value Occurrences"  style="padding:10px;margin:10px"/>`



    html += `<br/>
    <a href="#" id="advancedRingPropsToggle" >Show Advanced Properties?</a>
    <br />
    <div id="ringAdvancedProps">
    <h3>Default Font & Background Color & Edge Settings</h3>
    <label for="defaultRingLabelFont">Font (Family)</label>
    <input id="defaultRingLabelFont" list="fontsList"   value="${undefinedToDefined(viewpoint.template.ringsConfiguration?.labelSettings?.fontFamily)}"></input>
    <label for="defaultRingLabelSize">Font Size</label>
    <input id="defaultRingLabelSize" type="text" value="${undefinedToDefined(viewpoint.template.ringsConfiguration?.labelSettings?.fontSize)}"></input
    <label for="defaultRingShowLabel" >Show Label?</label><input id="defaultRingShowLabel" type="checkbox"  ${viewpoint.template.ringsConfiguration?.labelSettings?.showLabel ? "checked" : ""}/>

    <label for="defaultRingLabelColor">Label Color</label>
    <input id="defaultRingLabelColor" type="color"  value="${viewpoint.template.ringsConfiguration?.labelSettings?.color}" >
    <br/>
    <label for="defaultRingColor">Ring Background Color</label>
    <input id="defaultRingColor" type="color" value="${viewpoint.template.ringsConfiguration?.backgroundColor ?? '#FFFFFF'}"></input>
    <br />
    <label for="defaultRingOpacity">Opacity</label></td>
    <input id="defaultRingOpacity" type="range" min="0" max="1" step="0.05" value="${viewpoint.template.ringsConfiguration?.opacity}" style="width:300px">    </input>
    <label for="edge">Edge Settings</label></td>
    <label for="defaultRingEdgeWidth">Width (<span id="defaultRingEdgeHeading">${undefinedToDefined(viewpoint.template.ringsConfiguration?.edge?.width)}</span>)</label>
    <input id="defaultRingEdgeWidth" type="range" min="0" max="15" step="1" value="${viewpoint.template.ringsConfiguration?.edge?.width}" style="width:300px"></input>
    <label for="defaultRingEdgeColor">Color</label><input id="defaultRingEdgeColor" type="color"  value="${viewpoint.template.ringsConfiguration?.edge?.color ?? "#FFFFFF"}" >
    <label for="defaultRingEdgeStrokeArray">Stroke Array</label><input id="defaultRingEdgeStrokeArray" type="text" title="Stroke Array, A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. For example:  3 1 (3 strokes, one gap) or 10, 1 (10 strokes, one gap)" value="${undefinedToDefined( viewpoint.template.ringsConfiguration?.edge?.strokeArray,'')}"></input>
    <br />
    <br />
    <input id="removeLayoutSettingsFromRings" type="button" value="Remove UI settings from individual rings" 
    title="Make all rings inherit UI and layout settings defined here - remove all specific settings at individual ring level"></input>
    
    </div>
    <br/><br/> `

    contentContainer.innerHTML = `${html}`

    populateFontsList('fontsList')
    showOrHideElement("ringAdvancedProps", false)
    document.getElementById('advancedRingPropsToggle').addEventListener('click', () => { toggleShowHideElement('ringAdvancedProps') })

    // add event listeners
    document.getElementById(`supportOthers`).addEventListener("change", (e) => {
        const supportOthers = e.target.checked
        if (!supportOthers) {
            viewpoint.template.ringsConfiguration.rings.forEach((ring) => ring.others = false)
            for (let i = 0; i < viewpoint.template.ringsConfiguration.rings.length; i++) {
                document.getElementById(`othersRing${i}`).checked = false
            }
        } // 

    })

    for (let i = 0; i < viewpoint.template.ringsConfiguration.rings.length; i++) {
        document.getElementById(`othersRing${i}`).addEventListener("change", (e) => {
            viewpoint.template.ringsConfiguration.rings.forEach((ring) => ring.others = false)

            viewpoint.template.ringsConfiguration.rings[i].others = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })
        document.getElementById(`showRing${i}`).addEventListener("change", (e) => {
            viewpoint.template.ringsConfiguration.rings[i].visible = e.target.checked
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
            viewpoint.template.ringsConfiguration.rings.splice(i, 1)
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
        viewpoint.template.ringsConfiguration.rings.forEach((ring, i) => {
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
            labelSettings: {  showStraight: true },
            backgroundImage: {},
        }
        viewpoint.template.ringsConfiguration.rings.push(newRing)
        launchRingConfigurator(viewpoint)
    })
    document.getElementById("removeLayoutSettingsFromRings").addEventListener("click", () => {
        removeLayoutSettingsFromAllRings(viewpoint)
    })
    
    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = `<input id="saveRingSettings" type="button" value="Save Changes"></input>`
    document.getElementById("saveRingSettings").addEventListener("click",
        (event) => {
            console.log(`save ring edits  `)
            saveSettings(viewpoint)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })




}

const saveSettings = (viewpoint) => {
    if (viewpoint.template.ringsConfiguration.labelSettings == null) { viewpoint.template.ringsConfiguration.labelSettings = {} }
    viewpoint.template.ringsConfiguration.labelSettings.fontFamily = getElementValue("defaultRingLabelFont")
    viewpoint.template.ringsConfiguration.labelSettings.fontSize = getElementValue("defaultRingLabelSize")
    viewpoint.template.ringsConfiguration.labelSettings.color = getElementValue("defaultRingLabelColor")
    viewpoint.template.ringsConfiguration.labelSettings.showLabel = document.getElementById("defaultRingShowLabel").checked

    viewpoint.template.ringsConfiguration.backgroundColor = getElementValue("defaultRingColor")
    viewpoint.template.ringsConfiguration.opacity = getElementValue("defaultRingOpacity")

    if (viewpoint.template.ringsConfiguration.edge == null) { viewpoint.template.ringsConfiguration.edge = {} }
    viewpoint.template.ringsConfiguration.edge.width = getElementValue("defaultRingEdgeWidth")
    viewpoint.template.ringsConfiguration.edge.color = getElementValue("defaultRingEdgeColor")
    viewpoint.template.ringsConfiguration.edge.strokeArray = getElementValue("defaultRingEdgeStrokeArray")

}

const removeLayoutSettingsFromAllRings = (viewpoint) => {
    console.log(`remve settingsfrom all rings`)
    viewpoint.template.ringsConfiguration.rings.forEach((ring) => {
        // reset layout settings for sectors
        delete ring.backgroundColor
        delete ring.opacity
        ring.edge =  {}
        ring.labelSettings = {}
    })
}


const backRing = (ringToMoveBack, viewpoint) => {
    const ringToMove = viewpoint.template.ringsConfiguration.rings[ringToMoveBack]
    viewpoint.template.ringsConfiguration.rings[ringToMoveBack] = viewpoint.template.ringsConfiguration.rings[ringToMoveBack + 1]
    viewpoint.template.ringsConfiguration.rings[ringToMoveBack + 1] = ringToMove
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
    const ringToMove = viewpoint.template.ringsConfiguration.rings[ringToMoveUp]
    viewpoint.template.ringsConfiguration.rings[ringToMoveUp] = viewpoint.template.ringsConfiguration.rings[ringToMoveUp - 1]
    viewpoint.template.ringsConfiguration.rings[ringToMoveUp + -1] = ringToMove
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
    for (let i = 0; i < viewpoint.template.ringsConfiguration.rings.length; i++) {
        viewpoint.template.ringsConfiguration.rings[i].width = 1 / viewpoint.template.ringsConfiguration.rings.length
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

    for (let i = 0; i < viewpoint.template.ringsConfiguration.rings.length; i++) {
        const ring = viewpoint.template.ringsConfiguration.rings[i]
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
    for (let i = 0; i < viewpoint.template.ringsConfiguration.rings.length; i++) {
        viewpoint.template.ringsConfiguration.rings[i].width = valueCountPerRing[i] / total
    }

    launchRingConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const refreshRingConfiguration = (viewpoint) => {
    reconfigureRings(viewpoint.propertyVisualMaps["ring"]["property"], viewpoint)
}

const reconfigureRings = (propertyPath, viewpoint) => {
    reconfigureRingsFromPropertyPath(propertyPath, viewpoint);


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
function reconfigureRingsFromPropertyPath(propertyPath, viewpoint) {
    const ringVisualMap = viewpoint.propertyVisualMaps["ring"];
    ringVisualMap["property"] = propertyPath;

    const valueOccurrenceMap = getValueOccurrenceMap(viewpoint.propertyVisualMaps["ring"].property, viewpoint, true);
    // TODO cater for tags in getPropertyValuesAndCounts
    // remove entries from valueMap
    ringVisualMap.valueMap = {};
    viewpoint.template.ringsConfiguration.rings = [];
    // create new entries for values in valueOccurrenceMap
    for (let i = 0; i < Object.keys(valueOccurrenceMap).length; i++) {
        const allowableLabel = getLabelForAllowableValue(Object.keys(valueOccurrenceMap)[i], viewpoint.propertyVisualMaps["ring"].property, viewpoint);
        const newRing = {
            label: allowableLabel ?? capitalize(Object.keys(valueOccurrenceMap)[i]),
            width: (1 / Object.keys(valueOccurrenceMap).length),
            backgroundImage: {},
           
        };

        viewpoint.template.ringsConfiguration.rings.push(newRing);

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

