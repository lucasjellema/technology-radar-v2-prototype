export { launchColorConfigurator, reconfigureColorsFromPropertyPath }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { launchColorEditor } from './colorEditing.js'
import { unselectAllTabs, getListOfSupportedColors, capitalize, getPropertyFromPropertyPath, getPropertyValuesAndCounts, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'





const launchColorConfigurator = (viewpoint, drawRadarBlips) => {
    const colorVisualMap = viewpoint.propertyVisualMaps["color"]
    //const valueOccurrenceMap = getPropertyValuesAndCounts(colorVisualMap["property"], getData().ratings) // TODO only ratings of proper rating type!!
    const valueOccurrenceMap = (colorVisualMap == null || colorVisualMap["property"] == null) ? null : getValueOccurrenceMap(colorVisualMap["property"], viewpoint, true);
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Colors")
    unselectAllTabs()
    document.getElementById("colorConfigurationTab").classList.add("selectedTab") 
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
    html += `<label for="colorsTitle">Title (meaning of colors dimension)</label>
             <input type="text" id="colorsTitle" value="${viewpoint.template.colorsConfiguration.label}"></input><br /><br />`

    html += `<label for="mappedPropertySelector">Rating property to map to color</label> 
             <select id="mappedPropertySelector" ></select><span id="refreshColors" style="padding:20px">Refresh Color Mapping</span>  <br/>`

    html += `<input type="button" id="addColorButton"  value="Add Color"  style="padding:6px;margin:10px"/>`

    html += `<table id="colors">`
    html += `<tr><th>Color</th><th>Color Label</th><th>Mapped Values</th><th>Current Count</th><th><span id="showAll" >Visible</span></th>
    <th><input id="supportOthers" type="checkbox" checked} title="Support an 'others' color, to catch all orphaned blips"></input>Others?</th><th>Delete?</th><th>v ^</th></tr>`
    for (let i = 0; i < viewpoint.template.colorsConfiguration.colors.length; i++) {
        const color = viewpoint.template.colorsConfiguration.colors[i]
        const mappedColorPropertyValues = getAllKeysMappedToValue(colorVisualMap.valueMap, i)
        // find out how many occurrences of this value exist? 



        html += `<tr>
        <td><span id="editColor${i}" class="clickableProperty" style="background-color:${color.color}">${color.color}</span> </td>
        <td><span id="editColorLabel${i}" class="clickableProperty">${color.label}</span> </td>
        <td>`
        let valueCount = 0
        for (let j = 0; j < mappedColorPropertyValues.length; j++) {
            html += `
        <span id="tag0" class="extra tagfilter dropbtn">${mappedColorPropertyValues[j]} (${undefinedToDefined(valueOccurrenceMap[mappedColorPropertyValues[j]], 0)})</span>`
            valueCount += undefinedToDefined(valueOccurrenceMap[mappedColorPropertyValues[j]], 0)
        }
        html += `</td>
        <td>${valueCount} </td>
        <td><input id="showColor${i}" type="checkbox" ${color?.visible == false ? "" : "checked"}></input></td> 
        <td><input id="othersColor${i}" type="radio" name="others" value="${i}" ${color?.others == true ? "checked":""}></input></td> 

        <td><span id="deleteColor${i}" class="clickableProperty">Delete</span></td> 
        <td><span id="downColor${i}" class="clickableProperty">${i < viewpoint.template.colorsConfiguration.colors.length - 1 ? "v" : ""}</span>&nbsp;
        <span id="upColor${i}" class="clickableProperty">${i > 0 ? "^" : ""}</span></td> 
        </tr> `

    }
    html += `</table>`


    contentContainer.innerHTML = `${html}<br/> <br/><br/>`

    // add event listeners
    document.getElementById(`supportOthers`).addEventListener("change", (e) => {
        const supportOthers = e.target.checked
        if (!supportOthers) {
            viewpoint.template.colorsConfiguration.colors.forEach((color) => color.others = false)        
            for (let i = 0; i < viewpoint.template.colorsConfiguration.colors.length; i++) {
                document.getElementById(`othersColor${i}`).checked = false
            }    
            } // 
    
    })
    for (let i = 0; i < viewpoint.template.colorsConfiguration.colors.length; i++) {
        document.getElementById(`othersColor${i}`).addEventListener("change", (e) => {
            viewpoint.template.colorsConfiguration.colors.forEach((color) => color.others = false)

            viewpoint.template.colorsConfiguration.colors[i].others = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })

        document.getElementById(`showColor${i}`).addEventListener("change", (e) => {
            viewpoint.template.colorsConfiguration.colors[i].visible = e.target.checked
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()
        })

        document.getElementById(`editColor${i}`).addEventListener("click", () => {
            launchColorEditor(i, viewpoint, drawRadarBlips)

            // hideMe() // show the main editor?
        })
        document.getElementById(`editColorLabel${i}`).addEventListener("click", () => {
            launchColorEditor(i, viewpoint, drawRadarBlips)

        })
        document.getElementById(`downColor${i}`).addEventListener("click", () => {
            backColor(i, viewpoint)
        })
        document.getElementById(`upColor${i}`).addEventListener("click", () => {
            upColor(i, viewpoint)
        })
        document.getElementById(`deleteColor${i}`).addEventListener("click", () => {
            viewpoint.template.colorsConfiguration.colors.splice(i, 1)
            // remove from propertyVisualMap all value mappings to this color and decrease the color reference for any entry  higher than i
            const valueMap = colorVisualMap.valueMap
            for (let j = 0; j < Object.keys(valueMap).length; j++) {
                console.log(`evaluate mapping for ${Object.keys(valueMap)[j]}; color = ${valueMap[Object.keys(valueMap)[j]]}`)
                if (valueMap[Object.keys(valueMap)[j]] == i) {
                    console.log(`delete mapping for ${Object.keys(valueMap)[j]}`)
                    delete valueMap[Object.keys(valueMap)[j]];
                }

                if (valueMap[Object.keys(valueMap)[j]] > i) {
                    valueMap[Object.keys(valueMap)[j]] = valueMap[Object.keys(valueMap)[j]] - 1;
                    console.log(`reassign mapping for ${Object.keys(valueMap)[j]}`)
                }
            }
            launchColorConfigurator(viewpoint)
            publishRadarEvent({ type: "shuffleBlips" })
            publishRefreshRadar()

        })
    }
    populateSelect("mappedPropertySelector", candidateMappedProperties, colorVisualMap["property"])   // data is array objects with two properties : label and value
    document.getElementById(`mappedPropertySelector`).addEventListener("change", (e) => {
        reconfigureColors(e.target.value, viewpoint)
    })
    document.getElementById(`refreshColors`).addEventListener("click", () => { refreshColorConfiguration(viewpoint) })

    document.getElementById(`showAll`).addEventListener("click", (e) => {
        viewpoint.template.colorsConfiguration.colors.forEach((color, i) => {
            color.visible = true;
            document.getElementById(`showColor${i}`).checked = true
        })

        publishRadarEvent({ type: "shuffleBlips" })
        publishRefreshRadar()

    })
    document.getElementById(`addColorButton`).addEventListener("click", (e) => {
        const newColor = {
            label: "NEW COLOR",
            labelSettings: { color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
        }
        viewpoint.template.colorsConfiguration.colors.push(newColor)
        launchColorEditor(viewpoint.template.colorsConfiguration.colors.length - 1, viewpoint, drawRadarBlips)


    })
    const buttonBar = document.getElementById("modalMainButtonBar")
    buttonBar.innerHTML = ` <input id="saveColorEdits" type="button" value="Save Changes"></input>`
    +` <input id="saveSizeEdits" type="button" value="Save Changes" ></input>`
    document.getElementById("saveSizeEdits").addEventListener("click",
        (event) => {
            console.log(`save color 1 `)
            viewpoint.template.colorsConfiguration.label = getElementValue('colorsTitle')
            showOrHideElement('modalMain', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })

    document.getElementById("saveColorEdits").addEventListener("click",
        (event) => {
            console.log(`save color 2 `)
            viewpoint.template.colorsConfiguration.label = getElementValue('colorsTitle')
            showOrHideElement('modalMain', false)
            publishRefreshRadar()
            if (drawRadarBlips != null) drawRadarBlips(viewpoint)

        })





}

const backColor = (colorToMoveBack, viewpoint) => {
    const colorToMove = viewpoint.template.colorsConfiguration.colors[colorToMoveBack]
    viewpoint.template.colorsConfiguration.colors[colorToMoveBack] = viewpoint.template.colorsConfiguration.colors[colorToMoveBack + 1]
    viewpoint.template.colorsConfiguration.colors[colorToMoveBack + 1] = colorToMove
    const colorVisualMap = viewpoint.propertyVisualMaps["color"]
    // update in propertyVisualMap all value mappings to either of these colors
    const valueMap = colorVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == colorToMoveBack) {
            valueMap[Object.keys(valueMap)[j]] = colorToMoveBack + 1
        } else if (valueMap[Object.keys(valueMap)[j]] == colorToMoveBack + 1) {
            valueMap[Object.keys(valueMap)[j]] = colorToMoveBack
        }
    }
    launchColorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}

const upColor = (colorToMoveUp, viewpoint) => {
    const colorToMove = viewpoint.template.colorsConfiguration.colors[colorToMoveUp]
    viewpoint.template.colorsConfiguration.colors[colorToMoveUp] = viewpoint.template.colorsConfiguration.colors[colorToMoveUp - 1]
    viewpoint.template.colorsConfiguration.colors[colorToMoveUp + -1] = colorToMove
    const colorVisualMap = viewpoint.propertyVisualMaps["color"]
    // update in propertyVisualMap all value mappings to either of these colors
    const valueMap = colorVisualMap.valueMap
    for (let j = 0; j < Object.keys(valueMap).length; j++) {
        if (valueMap[Object.keys(valueMap)[j]] == colorToMoveUp) {
            valueMap[Object.keys(valueMap)[j]] = colorToMoveUp - 1
        } else if (valueMap[Object.keys(valueMap)[j]] == colorToMoveUp - 1) {
            valueMap[Object.keys(valueMap)[j]] = colorToMoveUp
        }
    }
    launchColorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()
}


const refreshColorConfiguration = (viewpoint) => {
    reconfigureColors(viewpoint.propertyVisualMaps["color"]["property"], viewpoint)
}

const reconfigureColors = (propertyPath, viewpoint) => {
    reconfigureColorsFromPropertyPath(propertyPath, viewpoint);


    launchColorConfigurator(viewpoint)
    publishRadarEvent({ type: "shuffleBlips" })
    publishRefreshRadar()

}

const getLabelForAllowableValue = (value, propertyPath, viewpoint) => {
    let ratingType = viewpoint.ratingType;
    if (typeof (ratingType) == "stcolor") {
        ratingType = getData().model?.ratingTypes[ratingType];
    }
    let ratingTypeProperties = getRatingTypeProperties(ratingType, getData().model);
    let colorProperty = ratingTypeProperties.filter((property) => property.propertyPath == propertyPath)[0];

    for (let i = 0; i < colorProperty.property?.allowableValues?.length; i++) {
        if (colorProperty.property?.allowableValues[i].value == value) return colorProperty.property?.allowableValues[i].label
    }
    return null
}

const hideMe = () => {
    showOrHideElement("modalMain", false); publishRefreshRadar()
}
function reconfigureColorsFromPropertyPath(propertyPath, viewpoint) {
    const colorVisualMap = viewpoint.propertyVisualMaps["color"];
    colorVisualMap["property"] = propertyPath;

    const valueOccurrenceMap = getValueOccurrenceMap(viewpoint.propertyVisualMaps["color"].property, viewpoint, true);
    // TODO cater for tags in getPropertyValuesAndCounts
    // remove entries from valueMap
    colorVisualMap.valueMap = {};
    viewpoint.template.colorsConfiguration.colors = [];
    const colors = getListOfSupportedColors();

    // create new entries for values in valueOccurrenceMap
    for (let i = 0; i < Object.keys(valueOccurrenceMap).length; i++) {
        const allowableLabel = getLabelForAllowableValue(Object.keys(valueOccurrenceMap)[i], viewpoint.propertyVisualMaps["color"].property, viewpoint);
        const newColor = {
            label: allowableLabel ?? capitalize(Object.keys(valueOccurrenceMap)[i]),
            width: 1 / Object.keys(valueOccurrenceMap).length,
            labelSettings: { color: "#000000", fontSize: 18, fontFamily: "Helvetica" },
            edge: { color: "#000000", width: 1 },
            backgroundImage: {},
            backgroundColor: "#FFFFFF",
            outercolorBackgroundColor: "#FFFFFF",
            color: i < colors.length ? colors[i] : colors[0]
        };

        viewpoint.template.colorsConfiguration.colors.push(newColor);

        colorVisualMap.valueMap[Object.keys(valueOccurrenceMap)[i]] = i;
    }
}

function getValueOccurrenceMap(propertyPath, viewpoint, includeAllowableValues = false) {
    const model = getData().model
    const focusRatingTypeName = typeof (viewpoint.ratingType) == "object" ? viewpoint.ratingType.name : viewpoint.ratingType
    let colorProperty = getPropertyFromPropertyPath(propertyPath, viewpoint.ratingType, model)
    let valueOccurrenceMap
    if (colorProperty.type == "tags") {
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
            for (let i = 0; i < colorProperty.allowableValues?.length; i++) {
                valueOccurrenceMap[colorProperty.allowableValues[i].value] = valueOccurrenceMap[colorProperty.allowableValues[i].value] ?? 0;
            }
        }
    }
    return valueOccurrenceMap;
}

