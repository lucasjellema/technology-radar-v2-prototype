
import { cartesianFromPolar, polarFromCartesian, segmentFromCartesian } from './drawingUtilities.js'
import { getNestedPropertyValueFromObject, setNestedPropertyValueFromObject } from './utils.js'
import { getViewpoint, getData } from './data.js'
export { handleBlipDrag, populateBlipEditor }

const populateSelect = (selectElementId, data, defaultValue = null) => { // data is array objects with two properties : label and value
    let dropdown = document.getElementById(selectElementId);

    dropdown.length = 0;

    let defaultOption = document.createElement('option');
    defaultOption.text = 'Choose ...';

    dropdown.add(defaultOption);
    dropdown.selectedIndex = 0;

    let option;
    for (let i = 0; i < data.length; i++) {
        option = document.createElement('option');
        option.text = data[i].label;
        option.value = data[i].value;
        dropdown.add(option);
        if (defaultValue != null && defaultValue == data[i].value) {
            dropdown.selectedIndex = i + 1 //option.inxdex 
        }

    }
}

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

const createAndPopulateDataList = (listId, propertyPath, blips) => {

    const listOfDistinctValues = new Set()
    for (let i = 0; i < blips.length; i++) {
        const blip = blips[i]
        listOfDistinctValues.add(getNestedPropertyValueFromObject(blip.rating, propertyPath))
    }
    let listElement = document.getElementById(listId)
    if (listElement == null) {
        listElement = document.createElement("datalist")
        listElement.setAttribute("id", listId)
        document.body.appendChild(listElement);
    }
    //remove current contents
    listElement.length = 0
    listElement.innerHTML = null
    let option
    for (let value of listOfDistinctValues) {
        option = document.createElement('option')
        option.value = value
        listElement.appendChild(option)
    }
}


const populateBlipEditor = (blip, viewpoint, drawRadarBlips) => {
    var modal = document.getElementById("modalBlipEditor");
    modal.style.display = "block";
    const tbl = document.getElementById("blipEditorTable")
    // remove current content
    tbl.innerHTML = null
    let ratingType = viewpoint.ratingType
    if (typeof (ratingType) == "string") {
        ratingType = getData().model?.ratingTypes[ratingType]
    }


    // TODO cater for IMAGE
    // TODO cater for tags
    let blipProperties = getBlipProperties(ratingType)

    let html = ''
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        let value = getNestedPropertyValueFromObject(blip.rating, blipProperty.propertyPath)
        if (value == "undefined") value = ""
        const inputElementId = `blip${blipProperty.propertyPath}`
        let inputElement
        if (blipProperty.property.allowableValues != null && blipProperty.property.allowableValues.length > 0) // select
            inputElement = `<select id="${inputElementId}" ></select>`
        else if (blipProperty.property.discrete != null && blipProperty.property.discrete) {
            createAndPopulateDataList(`${inputElementId}List`, `${blipProperty.propertyPath}`, viewpoint.blips)
            inputElement = `<input id="${inputElementId}" list="${inputElementId}List" value="${value}"></input>`
        }
        else {
            inputElement = `<input id="${inputElementId}" type="text" value="${value}"></input>`
        }
        if (blipProperty.property.type == "image") {
            inputElement = `${inputElement}<img id="${inputElementId}Image" style="padding:6px" src="${value}" width="70px"></img>
            <textarea id="${inputElementId}ImagePasteArea" placeholder="Paste Image" title="Paste Image for ${blipProperty.property.label} here" rows="1" cols="15"></textarea>`

        }

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
    blipEditorTitle.innerText = `Editing ${getNestedPropertyValueFromObject(blip.rating, viewpoint.propertyVisualMaps.blip.label)}`

    // set main image for blip 
    document.getElementById("blipImage").src = getNestedPropertyValueFromObject(blip.rating, viewpoint.propertyVisualMaps.blip.image)
    initializeTagsField(blip)
    document.getElementById("addTagToBlip").addEventListener("click",
        (event) => {
            const filterTagValue = document.getElementById("blipTagSelector").value
            if (blip.rating.object.tags==null) {blip.rating.object.tags=[]}
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
    }



    let blipProperties = getBlipProperties(viewpointToReuse.ratingType)
    for (let i = 0; i < blipProperties.length; i++) {
        const blipProperty = blipProperties[i]
        if (blipProperty.property.type == "tags") { } // TODO handle tags
        else {
            const inputElementId = `blip${blipProperty.propertyPath}`
            let value = document.getElementById(inputElementId).value
            setNestedPropertyValueFromObject(blip.rating, blipProperty.propertyPath, value)
        }
    }


    // close modal editor
    var modal = document.getElementById("modalBlipEditor");
    modal.style.display = "none";
    drawRadarBlipsToCall(viewpointToReuse)
}



document.getElementById("saveBlipEdits").addEventListener("click", () => {
    saveBlipEdit()
})





const initializeImagePaster = (handleImagePaste, pasteAreaElementId) => {
    document.getElementById(pasteAreaElementId).onpaste = function (event) {
        // use event.originalEvent.clipboard for newer chrome versions
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        //  console.log(JSON.stringify(items)); // will give you the mime types
        // find pasted image among pasted items
        let blob = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
            }
        }
        // load image content and assign to background image for currently selected object (sector or ring)
        if (blob !== null) {
            const reader = new FileReader();
            reader.onload = function (event) {
                if (handleImagePaste) handleImagePaste(event.target.result)
            };
            reader.readAsDataURL(blob);
        }
    }

}



const handleBlipDrag = function (blipDragEvent, viewpoint) {
    // TODO not all elements are supported for dragging (yet) 
    console.log(`dragged element ${blipDragEvent.blipId}`)

    const dropSegment = segmentFromCartesian({ x: blipDragEvent.newX, y: blipDragEvent.newY }, viewpoint)
    console.log(`dropsegment ${JSON.stringify(dropSegment)}`)

    const blip = viewpoint.blips[parseInt(blipDragEvent.blipId.substring(5))]
    //    console.log(`blip ${JSON.stringify(blip)}`)
    blip.x = blipDragEvent.newX
    blip.y = blipDragEvent.newY

    const propertyMappedToSector = viewpoint.propertyVisualMaps.sector.property
    const propertyValueDerivedFromSector = getKeyForValue(viewpoint.propertyVisualMaps.sector.valueMap, dropSegment.sector) // "find category value mapped to the sector value of dropSector" 
    setNestedPropertyValueFromObject(blip.rating, propertyMappedToSector, propertyValueDerivedFromSector)

    const propertyMappedToRing = viewpoint.propertyVisualMaps.ring.property
    const propertyValueDerivedFromRing = getKeyForValue(viewpoint.propertyVisualMaps.ring.valueMap, dropSegment.ring) // "find category value mapped to the sector value of dropSector" 
    setNestedPropertyValueFromObject(blip.rating, propertyMappedToRing, propertyValueDerivedFromRing)

}

// find in an object the (first) key or property name for a given value 
const getKeyForValue = function (object, value) {
    return Object.keys(object).find(key => object[key] === value);
}


function getBlipProperties(ratingType) {
    return Object.keys(ratingType.objectType.properties).map(
        (propertyName) => {
            return {
                propertyPath: `object.${propertyName}`,
                propertyScope: "object",
                property: ratingType.objectType.properties[propertyName]
            };
        }).concat(
            Object.keys(ratingType.properties).map(
                (propertyName) => {
                    return {
                        propertyPath: `${propertyName}`,
                        propertyScope: "rating",
                        property: ratingType.properties[propertyName]
                    };
                })
        );
}

