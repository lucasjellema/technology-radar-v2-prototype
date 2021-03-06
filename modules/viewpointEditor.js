import { cartesianFromPolar, polarFromCartesian } from './drawingUtilities.js'
import { makeDraggable } from './drag.js'
import { subscribeToRadarEvents, drawRadar } from './radar.js'
import { getConfiguration, subscribeToRadarRefresh, getState, publishRefreshRadar, getViewpoint, getData } from './data.js'
import { getEditableDecorator } from './textEditing.js'
import { uuidv4 } from './utils.js'
import { initializeTree } from './tree.js';

export { viewpointEditor, switchboard }


const knobBuffer = 0.04


const switchboard = {
    handleLayersChange: (e) => {
        config.topLayer = e.currentTarget.id
        publishRefreshRadar()
        synchronizeControlsWithCurrentRingOrSector()
    },
    handleSectorSelection: (sector) => {
        //  config.selectedSector = sector
        getState().selectedSector = sector
        publishRefreshRadar()
        synchronizeControlsWithCurrentRingOrSector()
    },
    handleRingSelection: (ring) => {
        // config.selectedRing = ring
        getState().selectedRing = ring
        publishRefreshRadar()
        synchronizeControlsWithCurrentRingOrSector()
    },
    handleSectorBoundariesChange: (e) => {

        config.sectorBoundariesExtended = "extendedSectorBoundaries" == e.currentTarget.id
        publishRefreshRadar()
    },
    handleInsideRingBackgroundColorSelection: (event) => {
        const color = event.target.value;
        if ("sectors" == config.topLayer)
            config.sectorsConfiguration.sectors[getState().selectedSector].backgroundColor = color
        if ("rings" == config.topLayer)
            config.ringsConfiguration.rings[getState().selectedRing].backgroundColor = color

        publishRefreshRadar()
    },
    handleOuterRingBackgroundColorSelection: (event) => {
        const color = event.target.value;
        console.log(`color ${color} selected sector ${getState().selectedSector}`)

        if ("sectors" == config.topLayer)
            config.sectorsConfiguration.sectors[getState().selectedSector].outerringBackgroundColor = color
        publishRefreshRadar()
        console.log(`outerring bg color ${config.sectorsConfiguration.sectors[getState().selectedSector].outerringBackgroundColor}`)
    },
    handleOpacitySlider: (sliderValue) => {
        getSelectedObject().opacity = sliderValue
        //  console.log(`new slidervalue ${sliderValue} for ${JSON.stringify(getSelectedObject())}`)
        // if ("sectors" == config.topLayer)
        //     config.sectorsConfiguration.sectors[getState().selectedSector].opacity = sliderValue
        // if ("rings" == config.topLayer)
        //     config.ringsConfiguration.rings[getState().selectedRing].opacity = sliderValue
        publishRefreshRadar()
    },
    handleImageScaleFactor: (event) => {
        //   console.log(`scale factor = ${event.target.value} for ${JSON.stringify(getSelectedObject())}`)
        if (getSelectedObject().backgroundImage != null) {
            getSelectedObject().backgroundImage.scaleFactor = event.target.value
            publishRefreshRadar()
        }
    },
    handleDragEvent: (eventType, element, dragCoordinates) => {
        if (element == null || element.id == null) return
        let newCoordinates = dragCoordinates
        //  console.log(`dragged element:${element.id} ${element.id}`)
        if (element.id.startsWith("sectorLabel")) {
            handleDragSectorLabel(element.id.substring(11), newCoordinates)
        }
        if (element.id.startsWith("sectorBackgroundImage")) {
            handleDragSectorBackgroundImage(element.id.substring(21), newCoordinates)
        }
        if (element.id.startsWith("title")) {
            handleDragTitle(element.id, newCoordinates)
        }
        if (element.id.startsWith("ringLabel")) {
            handleDragRingLabel(element.id.substring(9), newCoordinates)
        }

        const isRingDrag = (element.id != null && element.id.startsWith("ringKnob"))
        if (isRingDrag) {
            newCoordinates.deltaY = 0
            const ringId = element.id.substring(8) // 8 = length "ringKnob"

            let deltaWidth = newCoordinates.deltaX / config.maxRingRadius
            if (ringId > 0) {
                deltaWidth = Math.min(deltaWidth, config.ringsConfiguration.rings[ringId - 1].width - knobBuffer)
                if (deltaWidth < 0) { // current ring is decreased in width
                    deltaWidth = Math.max(deltaWidth, - config.ringsConfiguration.rings[ringId].width + knobBuffer)
                }
                config.ringsConfiguration.rings[ringId - 1].width = config.ringsConfiguration.rings[ringId - 1].width - deltaWidth
            }
            // TODO make sure that ring 0 is not decreased beyond its width
            if (ringId == 0 && deltaWidth < 0) { // outer ring is decreased in width
                deltaWidth = Math.max(deltaWidth, -config.ringsConfiguration.rings[0].width + knobBuffer)
            }

            // TODO make sure that sum of ring width <=1
            if (deltaWidth > 0.8) deltaWidth = 0.8 // bit lazy, capping individual delta width instead of capping the sum 
            config.ringsConfiguration.rings[ringId].width = config.ringsConfiguration.rings[ringId].width + deltaWidth
            publishRefreshRadar()

        }
        const isSectorDrag = (element.id != null && element.id.startsWith("sectorKnob"))
        if (isSectorDrag) {
            const sectorId = element.id.substring(10) // 10 = length "sectorKnob"
            const newPolarCoordinates = polarFromCartesian({ x: newCoordinates.x - config.width / 2, y: newCoordinates.y - config.height / 2 })
            // phi is -PI  (angle% 0.5) to PI (also 50%)
            const dragAnglePercentage = newPolarCoordinates.phi < 0 ? - newPolarCoordinates.phi / (2 * Math.PI) : 1 - newPolarCoordinates.phi / (2 * Math.PI)

            // aggregate total angle for current and earlier sectors  
            const currentAnglePercentage = config.sectorsConfiguration.sectors.filter((sector, index) => index <= sectorId)
                .reduce((sum, sector) => sum + sector.angle, 0)
            const deltaAngle = dragAnglePercentage - currentAnglePercentage // the change in angle as a result of the drag action
            config.sectorsConfiguration.sectors[sectorId].angle = config.sectorsConfiguration.sectors[sectorId].angle + deltaAngle;
            // TODO cater for sum of angle percentages > 1 ?  
            publishRefreshRadar()
            // derive new x and y from polar phi and maximumradiun
            newCoordinates = cartesianFromPolar({ phi: newPolarCoordinates.phi, r: config.maxRingRadius })

            return { deltaX: newCoordinates.x + config.width / 2 - dragCoordinates.x, deltaY: newCoordinates.y + config.height / 2 - dragCoordinates.y }

        }
        return newCoordinates
    },
    handleDecreaseRingOrSector: (event) => {
        if (config.topLayer == "rings" && getState().selectedRing < config.ringsConfiguration.rings.length - 1) {
            //swap selectedRing and selectedRing+1 and set selectedRing++; redraw
            const tmp = config.ringsConfiguration.rings[getState().selectedRing]
            config.ringsConfiguration.rings[getState().selectedRing] = config.ringsConfiguration.rings[getState().selectedRing + 1]
            config.ringsConfiguration.rings[getState().selectedRing + 1] = tmp
            getState().selectedRing++
            publishRefreshRadar()
        }

        if (config.topLayer == "sectors" && getState().selectedSector < config.sectorsConfiguration.sectors.length - 1) {
            const tmp = config.sectorsConfiguration.sectors[getState().selectedSector]
            config.sectorsConfiguration.sectors[getState().selectedSector] = config.sectorsConfiguration.sectors[getState().selectedSector + 1]
            config.sectorsConfiguration.sectors[getState().selectedSector + 1] = tmp
            getState().selectedSector++
            publishRefreshRadar()
        }

    },
    handleIncreaseRingOrSector: (event) => {
        if (config.topLayer == "rings" && getState().selectedRing > 0) {
            //swap selectedRing and selectedRing-1 and set selectedRing--; redraw
            const tmp = config.ringsConfiguration.rings[getState().selectedRing]
            config.ringsConfiguration.rings[getState().selectedRing] = config.ringsConfiguration.rings[getState().selectedRing - 1]
            config.ringsConfiguration.rings[getState().selectedRing - 1] = tmp
            getState().selectedRing--
            publishRefreshRadar()
        }
        if (config.topLayer == "sectors" && getState().selectedSector > 0) {
            const tmp = config.sectorsConfiguration.sectors[getState().selectedSector]
            config.sectorsConfiguration.sectors[getState().selectedSector] = config.sectorsConfiguration.sectors[getState().selectedSector - 1]
            config.sectorsConfiguration.sectors[getState().selectedSector - 1] = tmp
            getState().selectedSector--
            publishRefreshRadar()
        }
    },
    handleRemoveRingOrSector: (event) => {
        if (config.topLayer == "rings") {
            if (config.ringsConfiguration.rings.length > 1) { // do not remove last ring
                const freedUpWidth = config.ringsConfiguration.rings[getState().selectedRing].width
                config.ringsConfiguration.rings.splice(getState().selectedRing, 1)
                const ringToGain = Math.min(getState().selectedRing, config.ringsConfiguration.rings.length - 1)
                getState().selectedRing = ringToGain
                config.ringsConfiguration.rings[getState().selectedRing].width = config.ringsConfiguration.rings[getState().selectedRing].width + freedUpWidth
            }
        }
        if (config.topLayer == "sectors") {
            if (config.sectorsConfiguration.sectors.length > 1) { // do not remove last sector
                const freedUpAngle = config.sectorsConfiguration.sectors[getState().selectedSector].angle
                config.sectorsConfiguration.sectors.splice(getState().selectedSector, 1)
                const sectorToGain = Math.min(getState().selectedSector, config.sectorsConfiguration.sectors.length - 1)
                getState().selectedSector = sectorToGain
                config.sectorsConfiguration.sectors[sectorToGain].angle = config.sectorsConfiguration.sectors[sectorToGain].angle + freedUpAngle
            }
        }
        publishRefreshRadar()

    },
    handleAddRingOrSector: (event) => {
        if (config.topLayer == "rings") {
            const halfWidth = config.ringsConfiguration.rings[getState().selectedRing].width != null ? config.ringsConfiguration.rings[getState().selectedRing].width / 2 : 0.1
            config.ringsConfiguration.rings[getState().selectedRing].width = halfWidth
            config.ringsConfiguration.rings.splice(getState().selectedRing, 0, { label: "NEW!!", width: halfWidth })

        }
        if (config.topLayer == "sectors") {
            if (config.sectorsConfiguration.sectors.length == 0) {
                config.sectorsConfiguration.sectors.push({ label: "NEW!!", angle: 1 })
                getState().selectedSector() = 0
            } else {
                getState().selectedSector = getState().selectedSector ?? 0
                const halfAngle = config.sectorsConfiguration.sectors[getState().selectedSector].angle != null ? config.sectorsConfiguration.sectors[getState().selectedSector].angle / 2 : 0.3
                if (config.sectorsConfiguration.sectors[getState().selectedSector] != null) config.sectorsConfiguration.sectors[getState().selectedSector].angle = halfAngle
                config.sectorsConfiguration.sectors.splice(getState().selectedSector, 0, { label: "NEW!!", angle: halfAngle })
            }
        }
        publishRefreshRadar()
    },
    handleBackgroundImageURL: () => {
        const backgroundImageURLElement = document.getElementById('backgroundImageURL')
        //  console.log(`background image url ${backgroundImageURLElement.value}`)
        if (getSelectedObject().backgroundImage == null) getSelectedObject().backgroundImage = {}
        getSelectedObject().backgroundImage.image = backgroundImageURLElement.value
        publishRefreshRadar()
    }


}

const handleRegularSectorLabelsChange = (e) => {
    config.sectorsConfiguration.showRegularSectorLabels = e.currentTarget.checked
    publishRefreshRadar()
}

const handleSectorLabelsOnSectorEdgeChange = (e) => {
    config.sectorsConfiguration.showEdgeSectorLabels = e.currentTarget.checked
    publishRefreshRadar()
}


const initializeSectorConfiguration = () => {
    document.getElementById('sectorLabelsOnSectorEdge').checked = config.sectorsConfiguration.showEdgeSectorLabels
    document.getElementById('regularSectorLabels').checked = config.sectorsConfiguration.showRegularSectorLabels
    document.getElementById('extendedSectorBoundaries').checked = config.sectorBoundariesExtended
    document.getElementById('noExtendedSectorBoundaries').checked = !config.sectorBoundariesExtended
}

let config


const viewpointEditor = function (configuration) {
    config = getConfiguration() // get configuration from module data
    config.editMode = true
    getState().editMode = true
    config.selectedRing = getState().selectedRing
    config.selectedSector = getState().selectedSector
    drawRadar(getConfiguration(), getEditableDecorator(handleInputChange))
    const svg = d3.select(`svg#${config.svg_id}`)

    makeDraggable(svg.node(), switchboard.handleDragEvent)

    initializeColorPicker('backgroundColorSelector', switchboard.handleInsideRingBackgroundColorSelection)
    initializeColorPicker('backgroundColorOutsideRings', switchboard.handleOuterRingBackgroundColorSelection)

    initializeRotationSlider()
    initializeOpacitySlider()
    initializeEditListeners()
    initializeImagePaster(handleImagePaste)

    initializeColorsConfigurator()
    initializeSizesConfigurator()
    initializeShapesConfigurator()
    initializeSectorConfiguration()
    initializeConfigurationJSONContainers()
    subscribeToRadarRefresh(refreshRadar)
    subscribeToRadarEvents(handleRadarEvent)
    synchronizeControlsWithCurrentRingOrSector()

    initializeTree("datamodelTree", getData(), "download")
}

const getSelectedObject = () => {
    return getConfiguration().topLayer == "rings" ? getConfiguration().ringsConfiguration.rings[getState().selectedRing] : getConfiguration().sectorsConfiguration.sectors[getState().selectedSector]
}


const handleImagePaste = (imageURL) => {
    const selectedObject = getSelectedObject()

    if (selectedObject.backgroundImage == null) selectedObject.backgroundImage = {}
    selectedObject.backgroundImage.image = imageURL
    synchronizeControlsWithCurrentRingOrSector()
    document.getElementById("pastedImage").src = selectedObject.backgroundImage.image;
    // TODO assign default X, Y position to image - based on sector or ring

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

const handleRadarEvent = (radarEvent) => {
    if ("ringClick" == radarEvent.type) switchboard.handleRingSelection(radarEvent.ring)
    if ("sectorClick" == radarEvent.type) switchboard.handleSectorSelection(radarEvent.sector)
}

const refreshRadar = () => {
    config = getConfiguration()
    config.selectedRing = getState().selectedRing
    config.selectedSector = getState().selectedSector

    drawRadar(getViewpoint(), getEditableDecorator(handleInputChange))
    initializeColorsConfigurator()
    initializeSizesConfigurator()
    initializeShapesConfigurator()
    initializeSectorConfiguration()
    initializeConfigurationJSONContainers()
    initializeTree("datamodelTree", getData(), "download")

    synchronizeControlsWithCurrentRingOrSector()

}

const initializeEditListeners = () => {
    document.getElementById('sectors').addEventListener("change", switchboard.handleLayersChange);
    document.getElementById('rings').addEventListener("change", switchboard.handleLayersChange);
    document.getElementById('sectorLabelsOnSectorEdge').addEventListener("change", handleSectorLabelsOnSectorEdgeChange);
    document.getElementById('regularSectorLabels').addEventListener("change", handleRegularSectorLabelsChange);

    document.getElementById('extendedSectorBoundaries').addEventListener("change", switchboard.handleSectorBoundariesChange);
    document.getElementById('noExtendedSectorBoundaries').addEventListener("change", switchboard.handleSectorBoundariesChange);
    document.getElementById('increaseRingOrSector').addEventListener("click", switchboard.handleIncreaseRingOrSector);
    document.getElementById('decreaseRingOrSector').addEventListener("click", switchboard.handleDecreaseRingOrSector);
    document.getElementById('removeRingOrSector').addEventListener("click", switchboard.handleRemoveRingOrSector);
    document.getElementById('newRingOrSector').addEventListener("click", switchboard.handleAddRingOrSector);
    document.getElementById('imageScaleFactor').addEventListener("change", switchboard.handleImageScaleFactor);
    document.getElementById('backgroundImageURL').addEventListener("change", switchboard.handleBackgroundImageURL);
    document.getElementById('saveJSONToConfig').addEventListener("click", handleSaveJSON);
    document.getElementById('generateBlips').addEventListener("click", processObjectsIntoBlips);


}

const processObjectsIntoBlips = () => {
    console.log(`process objects`)
    if (getState().editType == "viewpoint") {
        try {
            const objects = d3.csvParse(document.getElementById('vpObjects').value)
            const vp = getViewpoint()
            let ratingType = getViewpoint().ratingType
            if (typeof (ratingType) == "string") {
                ratingType = getData().model?.ratingTypes[ratingType]
            }
            const objectType = ratingType.objectType
            // process objects
            const originalBlipCount = getViewpoint().blips.length
            for (let i = 0; i < objects.length; i++) {
                // TODO: check on allowable values; if a propertyvalue does not occur in allowable values, then do not process AND report 

                // for each: check if label already occurs for one of the existing blips.rating.object.label; if so - ignore
                // set default values on object properties that do not already have a value
                // create a rating set default values on properties ; reference the object
                objects[i].id = uuidv4()
                objects[i].tags = []
                const propertyNames = ["category", "vendor", "homepage", "offering", "description", "image"]
                for (let j = 0; j < propertyNames.length; j++) {
                    const propertyName = propertyNames[j]
                    const stateDefault = getState()?.defaultSettings?.rating?.object[propertyName]

                    objects[i][propertyName] = objects[i][propertyName] != null && objects[i][propertyName].length > 0
                        ? objects[i][propertyName]
                        : ((stateDefault != null && stateDefault.length > 0) ? stateDefault : objectType.properties[propertyName]?.defaultValue)
                }
                const rating = {
                    id: uuidv4()
                    // ambition: ratingType.properties.ambition?.defaultValue
                    // , experience: ratingType.properties.experience?.defaultValue
                    // , magnitude: ratingType.properties.magnitude?.defaultValue
                    , timestamp: Date.now()
                    , object: objects[i]
                    // , scope: ratingType.properties.scope?.defaultValue
                    // , author: ratingType.properties.author?.defaultValue
                }
                let ratingPropertyNames = ["ambition", "experience", "magnitude", "scope", "author", "comment"]
                for (let j = 0; j < ratingPropertyNames.length; j++) {
                    const propertyName = ratingPropertyNames[j]
                    const stateDefault = getState()?.defaultSettings?.rating[propertyName]

                    rating[propertyName] = rating[propertyName] != null && rating[propertyName].length > 0
                        ? rating[propertyName]
                        : ((stateDefault != null && stateDefault.length > 0) ? stateDefault : ratingType.properties[propertyName]?.defaultValue)
                }

                const blip = { id: `${i + originalBlipCount}`, rating: rating, }
                getViewpoint().blips.push(blip)

            }
            console.log(`objects received ${JSON.stringify(objects, null, 2)}`)
        } catch (e) { console.log(`parsing of csv content failed ${JSON.stringify(e)}`) }
    }
}


const initializeConfigurationJSONContainers = () => {
    if (getState().editType == "viewpoint") {
        document.getElementById('propertyVisualMaps').value = JSON.stringify(getViewpoint().propertyVisualMaps, null, 2)
        document.getElementById('vpModel').value = JSON.stringify(getViewpoint().ratingType, null, 2)
        // TODO extract objects from blips document.getElementById('vpData').value = JSON.stringify(getViewpoint().ratingType, null, 2)
    }
    document.getElementById('ringsConfiguration').value = JSON.stringify(getConfiguration().ringsConfiguration, null, 2)
    document.getElementById('sectorsConfiguration').value = JSON.stringify(getConfiguration().sectorsConfiguration, null, 2)

    const mainProperties = { defaultFont: getConfiguration().defaultFont, title: getConfiguration().title, colors: getConfiguration().colors }
    document.getElementById('mainConfig').value = JSON.stringify(mainProperties, null, 2)
    // TODO dynamically derive the object properties to list from objectType
    document.getElementById('vpObjects').value = "label,category,homepage,offering,vendor,description\n"


}

const handleSaveJSON = () => {
    if (getState().editType == "viewpoint") {
        try {
            getViewpoint().propertyVisualMaps = JSON.parse(document.getElementById('propertyVisualMaps').value)
            getViewpoint().ratingType = JSON.parse(document.getElementById('vpModel').value)
        } catch (e) {
            console.log(`propertyVisualMaps or vpModel does not contain valid JSON`)
        }
    } try {
        getConfiguration().ringsConfiguration = JSON.parse(document.getElementById('ringsConfiguration').value)
    } catch (e) {
        console.log(`ringsConfiguration does not contain valid JSON`)
    }
    try {
        getConfiguration().sectorsConfiguration = JSON.parse(document.getElementById('sectorsConfiguration').value)
    } catch (e) {
        console.log(`sectorsConfiguration does not contain valid JSON`)
    }
    try {
        const mainConfig = JSON.parse(document.getElementById('mainConfig').value)
        getConfiguration().title = mainConfig.title
        getConfiguration().defaultFont = mainConfig.defaultFont
        getConfiguration().colors = mainConfig.colors
    }
    catch (e) {
        console.log(`mainConfig does not contain valid JSON`)
    }

    publishRefreshRadar()
}

const synchronizeControlsWithCurrentRingOrSector = () => {
    const selectedObject = getSelectedObject()

    // throw away and recreate opacity slider
    initializeOpacitySlider(selectedObject?.opacity)
    // set section title
    document.getElementById('selectedRingSector').innerText = `Selected ${config.topLayer.substr(0, config.topLayer.length - 1)} ${selectedObject?.label}`
    const pastedImageElement = document.getElementById("pastedImage")
    if (selectedObject?.backgroundImage?.image == null) {
        // pastedImageElement.width ="1px"
        pastedImageElement.src = null
    } else {
        pastedImageElement.src = selectedObject.backgroundImage.image
        // pastedImageElement.width ="300px"
    }
    const imageScaleFactorElement = document.getElementById("imageScaleFactor")
    imageScaleFactorElement.value = selectedObject?.backgroundImage?.scaleFactor ?? 1

    const backgroundColorSelectorElement = document.getElementById("backgroundColorSelector")
    backgroundColorSelectorElement.value = selectedObject?.backgroundColor ?? "#ffffff"
    const outerringBackgroundColorElement = document.getElementById("backgroundColorOutsideRings")
    outerringBackgroundColorElement.value = selectedObject?.outerringBackgroundColor ?? "#ffffff"

}


const initializeColorPicker = (elementId, handleColorSelect) => {
    console.log(`initializeColorPicker`)
    const colorPicker = document.getElementById(elementId)
    colorPicker.addEventListener("change", handleColorSelect)
}

const handleRotationSlider = function (value) {
    config.rotation = value
    publishRefreshRadar()
}


const initializeRotationSlider = () => {
    var slider = d3
        .sliderHorizontal()
        .min(0)
        .max(1)
        .step(0.05)
        .width(300)
        .displayValue(false)
        .on('onchange', (sliderValue) => {
            handleRotationSlider(sliderValue)
        });

    d3.select('#rotationSlider')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);
}

let opacitySlider
const initializeOpacitySlider = (initialValue = 0) => {
    const svgOpacitySliderId = "svgOpacitySlider"
    const svgOpacitySliderElement = document.getElementById(svgOpacitySliderId);
    // if we already have a slider set at the right value, there is no need to recreate
    if ((svgOpacitySliderElement != null) && (initialValue - (opacitySlider?.value() ?? 10) < 0.02)) return

    if (svgOpacitySliderElement != null) svgOpacitySliderElement.remove()
    opacitySlider = d3
        .sliderHorizontal()
        .min(0)
        .max(1)
        .step(0.05)
        .width(300)
        .value(initialValue)
        .displayValue(false)
        .on('onchange', (sliderValue) => {
            switchboard.handleOpacitySlider(sliderValue)
        });

    d3.select('#opacitySlider')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .attr('id', svgOpacitySliderId)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(opacitySlider);
}




const handleInputChange = function (fieldIdentifier, newValue) {
    const sectorLabelStringLength = 11
    const ringLabelStringLength = 9
    if (fieldIdentifier.startsWith("sectorLabel")) {
        const sectorIndex = fieldIdentifier.substring(sectorLabelStringLength)
        config.sectorsConfiguration.sectors[sectorIndex].label = newValue
        publishRefreshRadar()
    }
    if (fieldIdentifier.startsWith("ringLabel")) {
        const ringIndex = fieldIdentifier.substring(ringLabelStringLength)
        config.ringsConfiguration.rings[ringIndex].label = newValue
        publishRefreshRadar()
    }
    if (fieldIdentifier.startsWith("title")) {
        config.title.text = newValue
        publishRefreshRadar()
    }
    if (fieldIdentifier.startsWith("colorLabel")) {
        const colorLabelStringLength = 10
        const colorIndex = fieldIdentifier.substring(colorLabelStringLength)
        config.colorsConfiguration.colors[colorIndex].label = newValue
        initializeColorsConfigurator()
    }
    if (fieldIdentifier.startsWith("sizeLabel")) {
        const sizeLabelStringLength = 9
        const sizeIndex = fieldIdentifier.substring(sizeLabelStringLength)
        config.sizesConfiguration.sizes[sizeIndex].label = newValue
        initializeSizesConfigurator()
    }
    if (fieldIdentifier.startsWith("shapeLabel")) {
        const shapeLabelStringLength = 10
        const shapeIndex = fieldIdentifier.substring(shapeLabelStringLength)
        config.shapesConfiguration.shapes[shapeIndex].label = newValue
        initializeShapesConfigurator()
    }


}

const handleDragSectorBackgroundImage = function (sectorId, newCoordinates) {
    //    console.log(`handle drag background image for sector ${sectorId} coordinates: ${JSON.stringify({ x: newCoordinates.x - config.width / 2, y: newCoordinates.y - config.height / 2 })} `)
    const selectedObject = config.sectorsConfiguration.sectors[sectorId]

    if (selectedObject.backgroundImage == null) selectedObject.backgroundImage = {} //very unlikely
    selectedObject.backgroundImage.x = newCoordinates.x - config.width / 2
    selectedObject.backgroundImage.y = newCoordinates.y - config.height / 2
    //  console.log(`image for ${JSON.stringify(selectedObject)}`)
}

const handleDragSectorLabel = function (sectorId, newCoordinates) {
    const selectedObject = config.sectorsConfiguration.sectors[sectorId]
    selectedObject.x = newCoordinates.x - config.width / 2
    selectedObject.y = newCoordinates.y - config.height / 2
}


const handleDragTitle = function (titleId, newCoordinates) {
    config.title.x = newCoordinates.x - config.width / 2
    config.title.y = newCoordinates.y - config.height / 2
}

const handleDragRingLabel = function (ringId, newCoordinates) {
    config.ringsConfiguration.rings[ringId].x = newCoordinates.x - config.width / 2
    config.ringsConfiguration.rings[ringId].y = newCoordinates.y - config.height / 2
}


let currentColorsBoxColor
let colorsBoxColorPicker
const initializeColorsConfigurator = () => {
    const maxNumberOfColors = 5
    const colorsBox = d3.select("svg#colorsBox")
        .style("background-color", "silver")
        .attr("width", "90%")
        .attr("height", maxNumberOfColors * 55 + 70)
    colorsBox.selectAll("*").remove(); // clean content (if there is any)

    colorsBox.append('g').attr('class', 'colorsBox')
    let configuredColor
    const checkboxIndent = 15
    const circleIndent = 60
    const labelIndent = 130
    for (let i = 0; i < maxNumberOfColors; i++) {
        if (config.colorsConfiguration.colors.length > i)
            configuredColor = config.colorsConfiguration.colors[i]
        else
            configuredColor = null

        let checkbox = colorsBox.append('rect')
            .attr('x', checkboxIndent)
            .attr('y', 40 + i * 55)
            .attr("fill", "white")
            .attr('width', 26)
            .attr('height', 26)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .on("click", () => {
                config.colorsConfiguration.colors[i].enabled = !config.colorsConfiguration.colors[i].enabled
                initializeColorsConfigurator()
            })
            ;
        if (config.colorsConfiguration.colors[i].enabled) {
            let checked = colorsBox.append('rect')
                .attr('x', checkboxIndent + 5)
                .attr('y', 45 + i * 55)
                .attr("fill", "black")
                .attr('width', 16)
                .attr('height', 16)
                .on("click", () => {
                    config.colorsConfiguration.colors[i].enabled = !config.colorsConfiguration.colors[i].enabled
                    initializeColorsConfigurator()
                })
        }
        colorsBox.append('circle')
            .attr("id", `templateColors${i}`)
            .attr("r", 20)
            .attr("fill",configuredColor ? configuredColor.color : "#ffffff")
            .attr("cx", circleIndent + 20)
            .attr("cy", 50 + i * 55)
            .attr("class", "clickableProperty")
            .on("click", () => {
                currentColorsBoxColor = i; // to be able to link the color picker to the right circle
            })


        // const foreignObject = colorsBox.append("foreignObject");

        // foreignObject
        //     .attr("x", circleIndent -5) // use x and y coordinates from mouse event // TODO for use in size/color/shape - the location needs to be derived differently 
        //     .attr("y", 35 + i * 55)

        //     .attr("width", 55)
        //     .attr("height", 35)

        // const body = foreignObject.append("xhtml:body")
        //     .attr("style", "background-color:#c0c0c0; padding:6px")
        //     .append("xhtml:input")
        //     .attr("type", "color")
        //     .attr("value", configuredColor ? configuredColor.color : "#ffffff")
        //     .on("change", (e) => {
        //         console.log(`selected color ${e.target.value}`)
        //         config.colorsConfiguration.colors[i] = e.target.value
        //         // console.log(`selected color ${e.target.value} color set ${config.colorsConfiguration.colors[i]}`)
        //         // initializeColorsConfigurator()
        //     })



        colorsBox.append("text")
            .attr("id", `colorLabel${i}`)
            .text(configuredColor ? configuredColor.label : `COLOR LABEL ${i + 1}`)
            
            .attr("x", labelIndent )
            .attr("y", 65 + i * 55)
            .style("fill", "#e5e5e5")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "32px")
            .style("font-weight", "bold")
            .call(getEditableDecorator(handleInputChange), ["svg#colorsBox",  `COLOR LABEL ${i + 1}`, `colorLabel${i}`])







    }
    if (colorsBoxColorPicker == null) {
        colorsBoxColorPicker = document.getElementById("colorsBoxColorSelector")

        colorsBoxColorPicker.addEventListener('change', (event) => {
            const color = event.target.value
            if (currentColorsBoxColor != null && d3.select(`circle#templateColors${currentColorsBoxColor}`) != null) {
                d3.select(`circle#templateColors${currentColorsBoxColor}`).attr('fill', color)

                config.colorsConfiguration.colors[currentColorsBoxColor].color = color
            }
        });
    }
}

const sizeRadiuses = [4, 8, 12, 16, 19, 22, 26, 32]

const initializeSizesConfigurator = () => {
    const maxNumberOfSizes = 7
    const sizesBox = d3.select("svg#sizesBox")
        .style("background-color", "silver")
        .attr("width", "90%")
        .attr("height", maxNumberOfSizes * 55 + 150)
    sizesBox.selectAll("*").remove(); // clean content (if there is any)

    sizesBox.append('g').attr('class', 'sizesBox')
    let configuredColor
    const checkboxIndent = 15
    const circleIndent = 60
    const labelIndent = 130
    for (let i = 0; i < maxNumberOfSizes; i++) {

        let checkbox = sizesBox.append('rect')
            .attr('x', checkboxIndent)
            .attr('y', 40 + i * 55)
            .attr("fill", "white")
            .attr('width', 26)
            .attr('height', 26)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .on("click", () => {
                config.sizesConfiguration.sizes[i].enabled = !config.sizesConfiguration.sizes[i].enabled
                initializeSizesConfigurator()
            })
            ;
        if (config.sizesConfiguration.sizes[i] && config.sizesConfiguration.sizes[i].enabled) {
            let checked = sizesBox.append('rect')
                .attr('x', checkboxIndent + 5)
                .attr('y', 45 + i * 55)
                .attr("fill", "black")
                .attr('width', 16)
                .attr('height', 16)
                .on("click", () => {
                    config.sizesConfiguration.sizes[i].enabled = !config.sizesConfiguration.sizes[i].enabled
                    initializeSizesConfigurator()
                })
        }
        sizesBox.append('circle')
            .attr("id", `templateSizes${i}`)
            .attr("r", sizeRadiuses[i])
            .attr("fill", "black")
            .attr("cx", circleIndent + 20)
            .attr("cy", 50 + i * 55)
            .attr("class", "clickableProperty")
        // .attr("transform", `scale(${i+1} ${i+1})`)

        sizesBox.append("text")
            .attr("id", `sizeLabel${i}`)
            .text(config.sizesConfiguration.sizes[i] != null && config.sizesConfiguration.sizes[i].label != null ? config.sizesConfiguration.sizes[i].label : `SIZE LABEL ${i + 1}`)
            .attr("x", labelIndent)
            .attr("y", 65 + i * 55)
            .style("fill", "#e5e5e5")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "32px")
            .style("font-weight", "bold")
            .call(getEditableDecorator(handleInputChange), ["svg#sizesBox", config.sizesConfiguration.sizes[i] != null && config.sizesConfiguration.sizes[i].label != null ? config.sizesConfiguration.sizes[i].label : `SIZE LABEL ${i + 1}`
                , `sizeLabel${i}`]);

    }
}

const initializeShapesConfigurator = () => {
    const maxNumberOfshapes = 9
    const shapesBox = d3.select("svg#shapesBox")
        .style("background-color", "silver")
        .attr("width", "90%")
        .attr("height", maxNumberOfshapes * 55 + 150)
    shapesBox.selectAll("*").remove(); // clean content (if there is any)

    shapesBox.append('g').attr('class', 'shapesBox')

    const checkboxIndent = 15
    const circleIndent = 60
    const labelIndent = 130
    for (let i = 0; i < maxNumberOfshapes; i++) {

        let checkbox = shapesBox.append('rect')
            .attr('x', checkboxIndent)
            .attr('y', 40 + i * 55)
            .attr("fill", "white")
            .attr('width', 26)
            .attr('height', 26)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .on("click", () => {
                config.shapesConfiguration.shapes[i].enabled = !config.shapesConfiguration.shapes[i].enabled
                initializeShapesConfigurator()
            })
            ;
        if (config.shapesConfiguration.shapes[i] && config.shapesConfiguration.shapes[i].enabled) {
            let checked = shapesBox.append('rect')
                .attr('x', checkboxIndent + 5)
                .attr('y', 45 + i * 55)
                .attr("fill", "black")
                .attr('width', 16)
                .attr('height', 16)
                .on("click", () => {
                    config.shapesConfiguration.shapes[i].enabled = !config.shapesConfiguration.shapes[i].enabled
                    initializeShapesConfigurator()
                })
        }

        let shape, fillColor = "green"
        //     square, diamond, circle, triangle, star, plus, ring, rectangleVertical, rectangleHorizontal
        // arrows, triangle left/right/down, <, > , ?, 
        if (config.shapesConfiguration.shapes[i] != null) {
            if (config.shapesConfiguration.shapes[i].shape == "square") {
                const square = d3.symbol().type(d3.symbolSquare).size(800);
                shape = shapesBox.append('path').attr("d", square)
            }
            if (config.shapesConfiguration.shapes[i].shape == "diamond") {
                const diamond = d3.symbol().type(d3.symbolDiamond).size(800);
                shape = shapesBox.append('path').attr("d", diamond)
            }
            if (config.shapesConfiguration.shapes[i].shape == "star") {
                const star = d3.symbol().type(d3.symbolStar).size(650);
                shape = shapesBox.append('path').attr("d", star)
            }
            if (config.shapesConfiguration.shapes[i].shape == "triangle") {
                const triangle = d3.symbol().type(d3.symbolTriangle).size(800);
                shape = shapesBox.append('path').attr("d", triangle)
            }
            if (config.shapesConfiguration.shapes[i].shape == "plus") {
                const plus = d3.symbol().type(d3.symbolCross).size(800);
                shape = shapesBox.append('path').attr("d", plus)
            }
            if (config.shapesConfiguration.shapes[i].shape == "circle") {
                shape = shapesBox.append('circle').attr("r", 20)
            }
            if (config.shapesConfiguration.shapes[i].shape == "ring") {
                shape = shapesBox.append('circle').attr("r", 20).style("stroke-width", 11).style("stroke", "green")
                fillColor = "gray"
            }
            if (config.shapesConfiguration.shapes[i].shape == "rectangleHorizontal") {
                shape = shapesBox.append('rect')
                    .attr('width', 38)
                    .attr('height', 10)
                    .attr('x', -20)
                    .attr('y', -4)
            }
            if (config.shapesConfiguration.shapes[i].shape == "rectangleVertical") {
                shape = shapesBox.append('rect')
                    .attr('width', 10)
                    .attr('height', 38)
                    .attr('x', -5)
                    .attr('y', -15)
            }
            if (shape) shape
                .attr("id", `templateShapes${i}`)
                .attr("fill", fillColor)
                .attr("transform", `translate( ${circleIndent + 20},  ${50 + i * 55})`)
        }


        shapesBox.append("text")
            .attr("id", `sizeLabel${i}`)
            .text(config.shapesConfiguration.shapes[i] != null && config.shapesConfiguration.shapes[i].label != null ? config.shapesConfiguration.shapes[i].label : `SHAPE LABEL ${i + 1}`)
            .attr("x", labelIndent)
            .attr("y", 65 + i * 55)
            .style("fill", "#e5e5e5")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "32px")
            .style("font-weight", "bold")
            .call(getEditableDecorator(handleInputChange), ["svg#shapesBox", config.shapesConfiguration.shapes[i] != null && config.shapesConfiguration.shapes[i].label != null ? config.shapesConfiguration.shapes[i].label : ` SHAPE LABEL ${i + 1}`
                , `shapeLabel${i}`]);

    }
}