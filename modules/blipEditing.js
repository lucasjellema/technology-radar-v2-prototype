
import { cartesianFromPolar, polarFromCartesian, segmentFromCartesian } from './drawingUtilities.js'
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
        option.value = data[i].data;
        dropdown.add(option);
        if (defaultValue != null && defaultValue == data[i].data) {
            dropdown.selectedIndex = i + 1 //option.inxdex 
        }

    }
}
const populateBlipEditor = (blip, viewpoint, drawRadarBlips) => {
    var modal = document.getElementById("modalBlipEditor");
    modal.style.display = "block";

    const blipEditorTitle = document.getElementById("blipEditorTitle")
    blipEditorTitle.innerText = `Editing ${blip.rating.object.label} `

    console.log(`pop blip editor for ${JSON.stringify(blip)}`)

    populateSelect("blipAmbitionSelect", [{ data: "assess", label: "Assess" }, { data: "hold", label: "Hold" }, { data: "trial", label: "Trial" }, { data: "adopt", label: "Adopt" }, { data: "spotted", label: "Spotted" }], blip.rating.ambition)
    populateSelect("blipCategorySelect", [{ data: "database", label: "Database & Data Platform" }, { data: "language", label: "Languages & Frameworks" }, { data: "infrastructure", label: "Infrastructure" }, { data: "concepts", label: "Concepts & Methodology" }], blip.rating.object.category)

    document.getElementById("blipLabel").value = blip.rating.object.label
    document.getElementById("blipHomepage").value = blip.rating.object.homepage
    document.getElementById("blipImageURL").value = blip.rating.object.image
    document.getElementById("blipImageURL").addEventListener("change", (e) => { document.getElementById("blipImage").src = e.target.value })
    document.getElementById("blipImage").src = blip.rating.object.image
    
    document.getElementById("blipRemark").value = blip.rating.comment
    document.getElementById("blipAuthor").value = blip.rating.author
    document.getElementById("blipScope").value = blip.rating.scope

    populateSelect("blipMagnitudeSelect", [{ data: "tiny", label: "Tiny" }, { data: "medium", label: "Medium" }, { data: "large", label: "Large" }], blip.rating.magnitude)
    populateSelect("blipMaturitySelect", [{ data: "short", label: "Fresh" }, { data: "medium", label: "Intermediate" }, { data: "long", label: "Very Mature" }], blip.rating.experience)

    initializeImagePaster((imageURL) => {
        document.getElementById("blipImageURL").value = imageURL
        document.getElementById("blipImage").src = imageURL
    })



    document.getElementById("saveBlipEdits").addEventListener("click", () => {

        blip.rating.object.label = document.getElementById("blipLabel").value
        blip.rating.object.homepage = document.getElementById("blipHomepage").value
        blip.rating.object.image = document.getElementById("blipImageURL").value
        blip.rating.comment = document.getElementById("blipRemark").value
        blip.rating.scope = document.getElementById("blipScope").value
        blip.rating.author = document.getElementById("blipAuthor").value

        blip.rating.experience = document.getElementById("blipMaturitySelect").value
        blip.rating.magnitude = document.getElementById("blipMagnitudeSelect").value
        let resetXY = false
        if (blip.rating.ambition != document.getElementById("blipAmbitionSelect").value) {
            blip.rating.ambition = document.getElementById("blipAmbitionSelect").value
            resetXY = true
        }
        if (blip.rating.object.category != document.getElementById("blipCategorySelect").value) {
            blip.rating.object.category = document.getElementById("blipCategorySelect").value
            resetXY = true
        }

        if (resetXY) {
            blip.x = null
            blip.y = null
        }

        // close modal editor
        var modal = document.getElementById("modalBlipEditor");
        modal.style.display = "none";
        drawRadarBlips(viewpoint)
    })

}



const initializeImagePaster = (handleImagePaste) => {
    document.getElementById('pasteArea').onpaste = function (event) {
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
    // console.log(`dragged element ${blipDragEvent.blipId}`)

    const dropSegment = segmentFromCartesian({ x: blipDragEvent.newX, y: blipDragEvent.newY }, viewpoint)

    const blip = viewpoint.blips[parseInt(blipDragEvent.blipId.substring(5))]
    console.log(`blip ${JSON.stringify(blip)}`)
    blip.x = blipDragEvent.newX
    blip.y = blipDragEvent.newY

    // TODO: determine from meta data which blip property has to be updated from the new sector
    // update the category - mapped to sector - to the value mapped to the newly selected sector 
    blip.rating.object.category = getKeyForValue(viewpoint.propertyVisualMaps.sectorMap, dropSegment.sector) // "find category value mapped to the sector value of dropSector" 

    // TODO: determine from meta data which blip property has to be updated from the new ring

    // update the ambition - mapped to ring  - to the value mapped to the newly selected ring 
    //  = "find ambition value mapped to the ring value of dropRing" 
    blip["rating"]["ambition"] = getKeyForValue(viewpoint.propertyVisualMaps.ringMap, dropSegment.ring)
}

const getKeyForValue = function (object, value) {
    return Object.keys(object).find(key => object[key] === value);
}


