
import { cartesianFromPolar, polarFromCartesian, segmentFromCartesian } from './drawingUtilities.js'
import { createAndPopulateDataListFromBlipProperties, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, setTextOnElement, populateSelect, getRatingTypeProperties, showOrHideElement, initializeImagePaster } from './utils.js'
import { getViewpoint, getObjectListOfOptions, getRatingListOfOptions, getData, createBlip } from './data.js'
export { handleBlipDrag, launchNewBlipWizard, launchBlipEditor }



let blipEdited
let drawRadarBlipsToCall
let viewpointToReuse


const initializeTagsField = (blip) => {
    const tagsContainer = document.getElementById('blipTagsContainer')
    tagsContainer.innerHTML = null
    if (blip.rating.object.tags != null && blip.rating.object.tags.length > 0) {
        for (let i = 0; i < blip.rating.object.tags.length; i++) {
            const innerHTML = `<div class="dropup">
     <span id="tag0" class="extra tagfilter dropbtn">${blip.rating.object.tags[i]}</span>
     <div class="dropup-content">
         <a href="#" id="removeBlipTag${i}">Remove</a>
     </div>`
            const div = document.createElement('div');
            div.className = "dropup"
            div.innerHTML = innerHTML
            tagsContainer.appendChild(div)
            document.getElementById(`removeBlipTag${i}`).addEventListener("click", () => { blip.rating.object.tags.splice(i, 1); initializeTagsField(blip) })
        }
    }
}




const launchNewBlipWizard = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalBlipEditor", true)
    showOrHideElement("newBlip", true)
    showOrHideElement("blipForm", false)
    showOrHideElement("blipImage", false)
    showOrHideElement("ratingSelectionSection", false)

    setTextOnElement('blipEditorTitle', "Create New Blip - for new or existing object or rating")

    const objectForNewBlipSelectionContainer = document.getElementById('objectForNewBlipSelectionContainer')

    objectForNewBlipSelectionContainer.innerHTML = `<div>
              <label for="objectSelect">Based on Existing Object</label>
                <br />
                <select id="objectSelect" name="objectSelect">
                   <option value="" disabled selected>Select Object to base Blip on</option>
                </select>
                <br />
             </div>`

    populateSelect("objectSelect", getObjectListOfOptions(), null)
    document.getElementById("objectSelect").addEventListener("change", (e) => {
        console.log(`object selection changed to ${e.target.value}`)
        // find ratings for selected object
        const objectId = e.target.value
        if (objectId != null && objectId != "-1") {
            // TODO: show ratingSelectionSection with the current ratings for this object (if any exist)
            populateSelect("ratingSelect", getRatingListOfOptions(viewpoint.ratingType, objectId), null)

            showOrHideElement('ratingSelectionSection', true)
        } else showOrHideElement('ratingSelectionSection', false)
    })
    const buttonBar = document.getElementById('newblipEditorButtonBar')
    buttonBar.innerHTML = ` <input id="goEditNewBlip" type="button" value="Edit new Blip"></input>`
    document.getElementById('goEditNewBlip').addEventListener("click", (e) => {
        const objectId = document.getElementById("objectSelect").value
        const objectNewLabel = document.getElementById("newObjectLabel").value

        const ratingId = document.getElementById("ratingSelect").value
        const selectedObjectId = (objectId != null && objectId != "-1") ? objectId : null
        const selectedRatingId = (ratingId != null && ratingId != "-1") ? ratingId : null
        const labelForNewObject = (objectNewLabel != null && objectNewLabel.length > 0) ? objectNewLabel : null
        if ((selectedObjectId ?? labelForNewObject) != null) {
            const blip = createBlip(selectedObjectId, labelForNewObject, selectedRatingId)
            launchBlipEditor(blip, getViewpoint(), drawRadarBlips)
        }
    })
}

const launchBlipEditor = (blip, viewpoint, drawRadarBlips) => {
    // var modal = document.getElementById("modalBlipEditor");
    // modal.style.display = "block";
    showOrHideElement("modalBlipEditor", true)
    showOrHideElement("newBlip", false)
    showOrHideElement("blipForm", true)
    showOrHideElement("blipImage", true)
    const tbl = document.getElementById("blipEditorTable")
    // remove current content
    tbl.innerHTML = null
    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }

    setTextOnElement('blipEditorTitle', `Edit Blip for ${blip.rating.object.label}`)


    // TODO cater for tags
    let blipProperties = getRatingTypeProperties(ratingType, getData().model)

    let html = ''
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        let value = getNestedPropertyValueFromObject(blip.rating, blipProperty.propertyPath)
        if (value == null) value = ""

        const inputElementId = `blip${blipProperty.propertyPath}`
        let inputElement
        if (blipProperty.property.allowableValues != null && blipProperty.property.allowableValues.length > 0) // select
            inputElement = `<select id="${inputElementId}" ></select>`
        else if (blipProperty.property.discrete != null && blipProperty.property.discrete) {
            createAndPopulateDataListFromBlipProperties(`${inputElementId}List`, `${blipProperty.propertyPath}`, viewpoint.blips)
            inputElement = `<input id="${inputElementId}" list="${inputElementId}List" value="${value}"></input>`
        }
        else if (blipProperty.property.type == "text") {
            inputElement = `<textarea id="${inputElementId}" rows="2" columns="75" value="${value}"></textarea>`
        }
        else {
            inputElement = `<input id="${inputElementId}" type="text" value="${value}"></input>`
        }
        if (blipProperty.property.type == "image") {
            inputElement = `${inputElement}<img id="${inputElementId}Image" style="padding:6px" src="${value}" width="70px"></img>
            <textarea id="${inputElementId}ImagePasteArea" placeholder="Paste Image" title="Paste Image for ${blipProperty.property.label} here" rows="1" cols="15"></textarea>`

        }
        // distribute fields over two columns in the property table
        html = `${html}${i % 2 == 0 ? "<tr>" : ""}<td class="propertyLabel"><label for="${inputElementId}">${blipProperty.property.label}</label></td>
                     <td>${inputElement}</td>${i % 2 == 1 ? "</tr>" : ""}`

    }
    tbl.innerHTML = `${tbl.innerHTML}${html}`
    //  populate SELECTs after all HTML has been created
    //  add change handlers
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        const inputElementId = `blip${blipProperty.propertyPath}`
        if (blipProperty.property.allowableValues != null && blipProperty.property.allowableValues.length > 0) {
            let value = getNestedPropertyValueFromObject(blip.rating, blipProperty.propertyPath)
            populateSelect(inputElementId, blipProperty.property.allowableValues, value)
        }
        if (blipProperty.property.type == "image") {
            initializeImagePaster((imageURL) => {
                document.getElementById(inputElementId).value = imageURL
                document.getElementById(`${inputElementId}Image`).src = imageURL
                if (blipProperty.propertyPath == viewpoint.propertyVisualMaps.blip.image) {
                    document.getElementById("blipImage").src = imageURL
                }
            }, `${inputElementId}ImagePasteArea`)
        }
    }
    blipEditorTitle.innerText = `Editing Rating of ${getNestedPropertyValueFromObject(blip.rating, viewpoint.propertyVisualMaps.blip.label)}`

    // set main image for blip 
    let imageSource = getNestedPropertyValueFromObject(blip.rating, viewpoint.propertyVisualMaps.blip.image)
    if (imageSource != null) {
        document.getElementById("blipImage").src = imageSource
    }
    initializeTagsField(blip)
    document.getElementById("addTagToBlip").addEventListener("click",
        (event) => {
            const filterTagValue = document.getElementById("blipTagSelector").value
            if (blip.rating.object.tags == null) { blip.rating.object.tags = [] }
            blip.rating.object.tags.push(filterTagValue)
            initializeTagsField(blip)
        })

    blipEdited = blip
    drawRadarBlipsToCall = drawRadarBlips
    viewpointToReuse = viewpoint
}



const saveBlipEdit = () => {
    const blip = blipEdited
    // check if the values have changed for the two properties mapped to sector and ring
    // if they have, the current XY should be reset 
    const sectorPropertyPath = viewpointToReuse.propertyVisualMaps.sector.property
    const ringPropertyPath = viewpointToReuse.propertyVisualMaps.ring.property
    let resetXY = false

    let originalValue = getNestedPropertyValueFromObject(blip.rating, sectorPropertyPath)
    let currentValue = document.getElementById(`blip${sectorPropertyPath}`).value
    if (originalValue != currentValue) { resetXY = true }

    originalValue = getNestedPropertyValueFromObject(blip.rating, ringPropertyPath)
    currentValue = document.getElementById(`blip${ringPropertyPath}`).value
    if (originalValue != currentValue) { resetXY = true }

    if (resetXY) {
        blip.x = null
        blip.y = null
        blip.rating.timestamp = Date.now() // TODO set Date.now() for any change in any rating property? (or any property mapped to visual characteristics)
    }



    let blipProperties = getRatingTypeProperties(viewpointToReuse.ratingType, getData().model)
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        if (blipProperty.property.type == "tags") { } // TODO handle tags (currently tags are saved directly on the blip instead of on the UI element)
        else {
            const inputElementId = `blip${blipProperty.propertyPath}`
            let value = document.getElementById(inputElementId).value
            setNestedPropertyValueOnObject(blip.rating, blipProperty.propertyPath, value)
        }
    }

    //if blip.pending - this means a new blip is added, one with perhaps a new object and or a new rating
    if (blip.pending) {
        delete blip.pending
        let blipCount = getViewpoint().blips.push(blip)
        console.log(`after saving  the pending  blip the count is now ${blipCount} == ${getViewpoint().blips.length}`)

        if (blip.rating?.pending) {
            delete blip.rating.pending
            getData().ratings[blip.rating.id] = blip.rating
        }
        if (blip.rating?.object?.pending) {
            delete blip.rating.object.pending
            getData().objects[blip.rating.object.id] = blip.rating.object
        }

    }

    // close modal editor

    showOrHideElement("modalBlipEditor", false)
    drawRadarBlipsToCall(viewpointToReuse)
}



document.getElementById("saveBlipEdits").addEventListener("click", () => {
    saveBlipEdit()
})



const handleBlipDrag = function (blipDragEvent, viewpoint) {
    // TODO not all elements are supported for dragging (yet) 

    if (blipDragEvent.blipId.startsWith("sectorBackgroundImage")) { handleSectorBackgroundImageDrag(blipDragEvent, viewpoint) }
    else {

        const dropSegment = segmentFromCartesian({ x: blipDragEvent.newX, y: blipDragEvent.newY }, viewpoint)
        //console.log(`dropsegment ${JSON.stringify(dropSegment)}`)
        const blipId = blipDragEvent.blipId.substring(5)
        let blip
        blip = viewpoint.blips.filter((blip) => blip.id == blipId ? blip : null)[0]
        console.log(`dragged element ${blipDragEvent.blipId}${blip.rating.object.label}`)


        blip.x = blipDragEvent.newX
        blip.y = blipDragEvent.newY

        const propertyMappedToSector = viewpoint.propertyVisualMaps.sector.property
        const propertyValueDerivedFromSector = getKeyForValue(viewpoint.propertyVisualMaps.sector.valueMap, dropSegment.sector) // "find category value mapped to the sector value of dropSector" 
        setNestedPropertyValueOnObject(blip.rating, propertyMappedToSector, propertyValueDerivedFromSector)

        const propertyMappedToRing = viewpoint.propertyVisualMaps.ring.property
        const propertyValueDerivedFromRing = getKeyForValue(viewpoint.propertyVisualMaps.ring.valueMap, dropSegment.ring) // "find category value mapped to the sector value of dropSector" 
        setNestedPropertyValueOnObject(blip.rating, propertyMappedToRing, propertyValueDerivedFromRing)
    }
}

// find in an object the (first) key or property name for a given value 
const getKeyForValue = function (object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

const handleSectorBackgroundImageDrag = (blipDragEvent, viewpoint) => {
    console.log(`OK, end sector background image drag`)
    const sectorId = blipDragEvent.blipId.substring(21) 
    const sector = viewpoint.template.sectorConfiguration.sectors[sectorId]
    sector.backgroundImage.x = blipDragEvent.newX // newCoordinates.x - config.width / 2
    sector.backgroundImage.y = blipDragEvent.newY // newCoordinates.y - config.height / 2
}

