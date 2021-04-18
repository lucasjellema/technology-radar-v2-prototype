export { launchSizeConfigurator, reconfigureSizesFromPropertyPath }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { launchSizeEditor } from './sizeEditing.js'
import { getListOfSupportedSizes, capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'





const launchSizeConfigurator = (viewpoint, drawRadarBlips) => {
    const sizeVisualMap = viewpoint.propertyVisualMaps["size"]
    //const valueOccurrenceMap = getPropertyValuesAndCounts(sizeVisualMap["property"], getData().ratings) // TODO only ratings of proper rating type!!
    const valueOccurrenceMap = (sizeVisualMap == null || sizeVisualMap["property"] == null) ? null : getValueOccurrenceMap(sizeVisualMap["property"], viewpoint, true);
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Sizes")
    document.getElementById("sizeConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
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
    html += `<label for="sizesTitle">Title (meaning of sizes dimension)</label>
             <input type="text" id="sizesTitle" value="${viewpoint.template.sizesConfiguration.label}"></input><br /><br />`

    html += `<label for="mappedPropertySelector">Rating property to map to size</label> 
             <select id="mappedPropertySelector" ></select><span id="refreshSizes" style="padding:20px">Refresh Size Mapping</span>  <br/>`

    html += `<input type="button" id="addSizeButton"  value="Add Size"  style="padding:6px;margin:10px"/>`

    html += `<table id="sizes">`
    html += `<tr><th>Size</th><th>Size Label</th><th>Mapped Values</th><th>Current Count</th><th><span id="showAll" >Visible</span></th><th>Delete?</th><th>v ^</th></tr>`
    for (let i = 0; i < viewpoint.template.sizesConfiguration.sizes.length; i++) {
        const size = viewpoint.template.sizesConfiguration.sizes[i]
        const mappedSizePropertyValues = getAllKeysMappedToValue(sizeVisualMap.valueMap, i)
        // find out how many occurrences of this value exist? 



        html += `<tr>
        <td><span id="editSize${i}" class="clickableProperty" style="background-size:${size.size}">${size.size}</span> </td>
        <td><span id="editSizeLabel${i}" class="clickableProperty">${size.label}</span> </td>
        <td>`
        let valueCount = 0
        for (let j = 0; j < mappedSizePropertyValues.length; j++) {
            html += `
        <span id="tag0" class="extra tagfilter dropbtn">${mappedSizePropertyValues[j]} (${undefinedToDefined(valueOccurrenceMap[mappedSizePropertyValues[j]], 0)})</span>`
            valueCount += undefinedToDefined(valueOccurrenceMap[mappedSizePropertyValues[j]], 0)
        }
        html += `</td>
        <td>${valueCount} </td>
        <td><input id="showSize${i}" type="checkbox" ${size?.visible == false ? "" : "checked"}></input></td> 
        <td><span id="deleteSize${i}" class="clickableProperty">Delete</span></td> 
        <td><span id="downSize${i}" class="clickableProperty">${i < viewpoint.template.sizesConfiguration.sizes.length - 1 ? "v" : ""}</span>&nbsp;
        <span id="upSize${i}" class="clickableProperty">${i > 0 ? "^" : ""}</span></td> 
        </tr> `

    }
    html += `</table>`


    contentContainer.innerHTML = `${html}<br/> <br/><br/>`

    // add event listeners
    for (let i = 0; i < viewpoint.template.sizesConfiguration.sizes.length; i++) {
        document.getElementById(`showSize${i}`).addEventListener("change", (e) => {
            viewpoint.template.sizesConfiguration.sizes[i].visible = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })

        document.getElementById(`editSize${i}`).addEventListener("click", () => {
            launchSizeEditor(i, viewpoint, drawRadarBlips)

            // hideMe() // show the main editor?
        })
        document.getElementById(`editSizeLabel${i}`).addEventListener("click", () => {
            launchSizeEditor(i, viewpoint, drawRadarBlips)

        })
        document.getElementById(`downSize${i}`).addEventListener("click", () => {
            backSize(i, viewpoint)
        })
        document.getElementById(`upSize${i}`).addEventListener("click", () => {
            upSize(i, viewpoint)
        })
        document.getElementById(`deleteSize${i}`).addEventListener("click", () => {
            viewpoint.template.sizesConfiguration.sizes.splice(i, 1)
            // remove from propertyVisualMap all value mappings to this size and decrease the size reference for any entry  higher than i
            const valueMap = sizeVisualMap.valueMap
            for (let j = 0; j < Object.keys(valueMap).length; j++) {
                console.log(`evaluate mapping for ${Object.keys(valueMap)[j]}; size = ${valueMap[Object.keys(valueMap)[j]]}`)
                if (valueMap[Object.keys(valueMap)[j]] == i) {
                    console.log(`delete mapping for ${Object.keys(valueMap)[j]}`)
                    delete valueMap[Object.keys(valueMap)[j]];
                }

                if (valueMap[Object.keys(valueMap)[j]] > i) {
                    valueMap[Object.keys(valueMap)[j]] = valueMap[Object.keys(valueMap)[j]] - 1;
                    console.log(`reassign mapping for ${Object.keys(valueMap)[j]}`)
                }
            }
            launchSizeConfigurator(viewpoint)
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()

        })
    }
    populateSelect("mappedPropertySelector", candidateMappedProperties, sizeVisualMap["property"])   // data is array objects with two properties : label and value
    document.getElementById(`mappedPropertySelector`).addEventListener("change", (e) => {
        reconfigureSizes(e.target.value, viewpoint)
    })
    document.getElementById(`refreshSizes`).addEventListener("click", () => { refreshSizeConfiguration(viewpoint) })

    document.getElementById(`showAll`).addEventListener("click", (e) => {
        viewpoint.template.sizesConfiguration.sizes.forEach((size, i) => {
            size.visible = true;
            document.getElementById(`showSize${i}`).checked = true
        })

        publishRadarEvent({ type: "shuffleBlips" })
        publishRefreshRadar()

    })
    document.getElementById(`addSizeButton`).addEventListener("click", (e) => {
        const newSize = {
            label: "NEW SHape",
            labelSettings: { size: "#000000", fontSize: 18, fontFamily: "Helvetica" },
        }
        viewpoint.template.sizesConfiguration.sizes.push(newSize)
        launchSizeEditor(viewpoint.template.sizesConfiguration.sizes.length - 1, viewpoint, drawRadarBlips)


    })
    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = ` <input id="saveSizeEdits" type="button" value="Save Changes"></input>`
    document.getElementById("saveSizeEdits").addEventListener("click",
        (event) => {
            console.log(`save size  `)
            viewpoint.template.sizesConfiguration.label = getElementValue('sizesTitle')
            showOrHideElement('modalMain', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })





}

const backSize = (sizeToMoveBack, viewpoint) => {
    const sizeToMove = viewpoint.template.sizesConfiguration.sizes[sizeToMoveBack]
    viewpoint.template.sizesConfiguration.sizes[sizeToMoveBack] = viewpoint.template.sizesConfiguration.sizes[sizeToMoveBack + 1]
    viewpoint.template.sizesConfiguration.sizes[sizeToMoveBack + 1] = sizeToMove
    const sizeVisualMap = viewpoint.propertyVisualMaps["size"]
    // update in propertyVisualMap all value mappings to either of these sizes
    const valueMap = sizeVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == sizeToMoveBack) {
            valueMap[Object.keys(valueMap)[j]] = sizeToMoveBack + 1
        } else if (valueMap[Object.keys(valueMap)[j]] == sizeToMoveBack + 1) {
            valueMap[Object.keys(valueMap)[j]] = sizeToMoveBack
        }
    }
    launchSizeConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const upSize = (sizeToMoveUp, viewpoint) => {
    const sizeToMove = viewpoint.template.sizesConfiguration.sizes[sizeToMoveUp]
    viewpoint.template.sizesConfiguration.sizes[sizeToMoveUp] = viewpoint.template.sizesConfiguration.sizes[sizeToMoveUp - 1]
    viewpoint.template.sizesConfiguration.sizes[sizeToMoveUp + -1] = sizeToMove
    const sizeVisualMap = viewpoint.propertyVisualMaps["size"]
    // update in propertyVisualMap all value mappings to either of these sizes
    const valueMap = sizeVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == sizeToMoveUp) {
            valueMap[Object.keys(valueMap)[j]] = sizeToMoveUp - 1
        } else if (valueMap[Object.keys(valueMap)[j]] == sizeToMoveUp - 1) {
            valueMap[Object.keys(valueMap)[j]] = sizeToMoveUp
        }
    }
    launchSizeConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}


const refreshSizeConfiguration = (viewpoint) => {
    reconfigureSizes(viewpoint.propertyVisualMaps["size"]["property"], viewpoint)
}

const reconfigureSizes = (propertyPath, viewpoint) => {
    reconfigureSizesFromPropertyPath(propertyPath, viewpoint);


    launchSizeConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()

}

const getLabelForAllowableValue = (value, propertyPath, viewpoint) => {
    let ratingType = viewpoint.ratingType;
    if (typeof (ratingType) == "stsize") {
        ratingType = getData().model?.ratingTypes[ratingType];
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model);
    let sizeProperty = ratingTypeProperties.filter((property) => property.propertyPath == propertyPath)[0];

    for (let i = 0; i < sizeProperty.property?.allowableValues?.length; i++) {
        if (sizeProperty.property?.allowableValues[i].value == value) return sizeProperty.property?.allowableValues[i].label
    }
    return null
}

const hideMe = () => {
    showOrHideElement("modalMain", false); publishRefreshRadar()
}
function reconfigureSizesFromPropertyPath(propertyPath, viewpoint) {
    const sizeVisualMap = viewpoint.propertyVisualMaps["size"];
    sizeVisualMap["property"] = propertyPath;

    const valueOccurrenceMap = getValueOccurrenceMap(viewpoint.propertyVisualMaps["size"].property, viewpoint, true);
    // TODO cater for tags in getPropertyValuesAndCounts
    // remove entries from valueMap
    sizeVisualMap.valueMap = {};
    viewpoint.template.sizesConfiguration.sizes = [];
    const sizes = getListOfSupportedSizes();

    // create new entries for values in valueOccurrenceMap
    for (let i = 0; i < Object.keys(valueOccurrenceMap).length; i++) {
        const allowableLabel = getLabelForAllowableValue(Object.keys(valueOccurrenceMap)[i], viewpoint.propertyVisualMaps["size"].property, viewpoint);
        const newSize = {
            label: allowableLabel ?? capitalize(Object.keys(valueOccurrenceMap)[i]),
            width: 1 / Object.keys(valueOccurrenceMap).length,
            labelSettings: { size: "#000000", fontSize: 18, fontFamily: "Helvetica" },
            edge: { size: "#000000", width: 1 },
            backgroundImage: {},
            backgroundSize: "#FFFFFF",
            outersizeBackgroundSize: "#FFFFFF",
            size: i < sizes.length ? sizes[i] : sizes[0]
        };

        viewpoint.template.sizesConfiguration.sizes.push(newSize);

        sizeVisualMap.valueMap[Object.keys(valueOccurrenceMap)[i]] = i;
    }
}

function getValueOccurrenceMap(propertyPath, viewpoint, includeAllowableValues = false) {
    const model = getData().model
    const focusRatingTypeName = typeof (viewpoint.ratingType) == "object" ? viewpoint.ratingType.name : viewpoint.ratingType
    let sizeProperty = getPropertyFromPropertyPath(propertyPath, viewpoint.ratingType, model)
    let valueOccurrenceMap
    if (sizeProperty.type == "tags") {
        valueOccurrenceMap = {}
        for (let i = 0; i < Object.keys(getData().ratings).length; i++) {
            const rating = getData().ratings[Object.keys(getData().ratings)[i]]
            if (rating.ratingType == focusRatingTypeName) {
                const tags = getNestedPropertyValueFromObject(rating, propertyPath)
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
            for (let i = 0; i < sizeProperty.allowableValues?.length; i++) {
                valueOccurrenceMap[sizeProperty.allowableValues[i].value] = valueOccurrenceMap[sizeProperty.allowableValues[i].value] ?? 0;
            }
        }
    }
    return valueOccurrenceMap;
}

