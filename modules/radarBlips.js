import { cartesianFromPolar, polarFromCartesian, segmentFromCartesian } from './drawingUtilities.js'
import { launchBlipEditor } from './blipEditing.js'
import { getViewpoint, getData, publishRefreshRadar, getDistinctTagValues } from './data.js'
import { getLabelForAllowableValue, toggleShowHideElement, getRatingTypeProperties, getPropertyFromPropertyPath, getNestedPropertyValueFromObject, uuidv4, setNestedPropertyValueOnObject } from './utils.js'
export { drawRadarBlips, prepareBlipDrawingContext }


const radarCanvasElementId = "radarCanvas"
const blipsLayerElementId = "blipsLayer"
let currentViewpoint

const filterBlip = (blip, viewpoint) => {
    // console.log(`filter blip ${blip.rating.object.label} with tagfilter ${viewpoint.blipDisplaySettings.tagFilter}`)
    // determine all tags in the tag filter  - for now as individual strings, no + or - support TODO
    let blipOK = viewpoint.blipDisplaySettings.tagFilter?.length == 0 // no filter - then blip is ok 
    if (viewpoint.blipDisplaySettings.tagFilter?.length ?? 0 > 0) {

        let ratingTypeProperties = getRatingTypeProperties(viewpoint.ratingType, getData().model)

        // populate list with all discrete properties plus properties of type tag
        const discretePropertyPaths = ratingTypeProperties
            .filter((property) => (property.property?.discrete || property.property?.allowableValues?.length > 0))
            .map((property) => { return property.propertyPath })

        //if all tags are minus filter, then are starting assumption is that the blip is ok
        const minusFiltercount = viewpoint.blipDisplaySettings.tagFilter.reduce(
            (sum, tagFilter) => sum + (tagFilter.type == 'minus' ? 1 : 0)
            , 0)
        blipOK = viewpoint.blipDisplaySettings.tagFilter?.length == minusFiltercount
        try {
            for (let i = 0; i < viewpoint.blipDisplaySettings.tagFilter.length; i++) {
                const filter = viewpoint.blipDisplaySettings.tagFilter[i]
                try {
                    let blipHasFilter
                    if (filter.tag.startsWith('"')) {
                        const labelProperty = viewpoint.propertyVisualMaps.blip?.label
                        const blipLabel = getNestedPropertyValueFromObject(blip.rating, labelProperty).toLowerCase()
                        const filterTag = filter.tag.replace(/^"+|"+$/g, '').toLowerCase()

                        blipHasFilter = blipLabel.includes(filterTag)
                    } else {
                        blipHasFilter = JSON.stringify(blip.rating.object.tags)?.toLowerCase()?.trim()?.indexOf(filter.tag) > -1

                        // TODO derive discrete properties dynamically from data.model instead of hard coded

                        //  const discretePropertyPaths = ["object.category", "object.offering", "object.vendor", "scope", "ambition", "author"]
                        for (let j = 0; !blipHasFilter && j < discretePropertyPaths.length; j++) {
                            blipHasFilter = getNestedPropertyValueFromObject(blip.rating, discretePropertyPaths[j])?.toLowerCase().trim() == filter.tag
                        }
                    }


                    // minus filter: if tag is in rating.object.tags then blip is not ok  
                    if (blipHasFilter && filter.type == "minus") {
                        blipOK = false; break;
                    }

                    // must filter: if the tag is not in rating.object.tags then the blip cannot be ok
                    if (!blipHasFilter && filter.type == "must") {
                        blipOK = false; break;
                    }
                    if (blipHasFilter && filter.type == "plus") {
                        blipOK = true
                    }

                } catch (e) { console.log(`${e} exception filter for ${JSON.stringify(blip)}`) }
            }
        } catch (e) { console.log(`exception in filter blip ${JSON.stringify(e)} ${e}`) }
    }

    return blipOK
}

const initializeTagsFilter = () => {
    const filteringTagsContainer = document.getElementById('filteringTagsContainer')
    filteringTagsContainer.innerHTML = null
    // loop over existing filtering tags and for each add to container 

    for (let i = 0; i < currentViewpoint.blipDisplaySettings.tagFilter.length; i++) {
        const innerHTML = `<div class="dropup">
     <span id="tag0" class="${currentViewpoint.blipDisplaySettings.tagFilter[i].type} tagfilter dropbtn">${currentViewpoint.blipDisplaySettings.tagFilter[i].tag}</span>
     <div class="dropup-content">
     <a href="#" id="mustTag${i}">Must</a>
     <a href="#" id="plusTag${i}">Plus</a>
     <a href="#" id="minusTag${i}">Minus</a>
         <a href="#" id="removeTag${i}">Remove</a>
     </div>`
        const div = document.createElement('div');
        div.className = "dropup"
        div.innerHTML = innerHTML
        filteringTagsContainer.appendChild(div)
        document.getElementById(`mustTag${i}`).addEventListener("click", () => { currentViewpoint.blipDisplaySettings.tagFilter[i].type = "must"; drawRadarBlips(currentViewpoint) })
        document.getElementById(`plusTag${i}`).addEventListener("click", () => { currentViewpoint.blipDisplaySettings.tagFilter[i].type = "plus"; drawRadarBlips(currentViewpoint) })
        document.getElementById(`minusTag${i}`).addEventListener("click", () => { currentViewpoint.blipDisplaySettings.tagFilter[i].type = "minus"; drawRadarBlips(currentViewpoint) })
        document.getElementById(`removeTag${i}`).addEventListener("click", () => { currentViewpoint.blipDisplaySettings.tagFilter.splice(i, 1); drawRadarBlips(currentViewpoint) })
    }

    let resetFilterButton = document.getElementById("resetFilterButton")
    if (resetFilterButton) {
        resetFilterButton.remove()
    }

    if (currentViewpoint.blipDisplaySettings.tagFilter.length > 0) {
        const container = document.getElementById("resetTagsFilterControlContainer")
        container.innerHTML = `<input type="button" id="resetFilterButton" name="resetFilter" style="margin-top:10px" title="Remove All Tags" value="Reset Filter"></input>`
        resetFilterButton = document.getElementById("resetFilterButton")
        resetFilterButton.addEventListener("click", (e) => { currentViewpoint.blipDisplaySettings.tagFilter = []; drawRadarBlips(currentViewpoint) })
    }
    // populate datalist with all unique tag values in all blips
    populateDatalistWithTags(true)

}

const findSegmentForRating = (rating, viewpoint, blipDrawingContext) => {
    let blipSector = findSectorForRating(rating, viewpoint)
    if (blipSector == null) {
        if (blipDrawingContext.othersDimensionValue["sector"] != null) {
            blipSector = blipDrawingContext.othersDimensionValue["sector"]
        }
        else {
            //
        }
    }
    const propertyMappedToRing = viewpoint.propertyVisualMaps.ring.property
    let blipRing = viewpoint.propertyVisualMaps.ring.valueMap[getNestedPropertyValueFromObject(rating, propertyMappedToRing)]
    if (blipRing == null) {
        if (blipDrawingContext.othersDimensionValue["ring"] != null) {
            blipRing = blipDrawingContext.othersDimensionValue["ring"]
        }
        else {
            blipRing = -1
            // in case of rings we accept blips not associated with any "real ring" - directly or indirect through Others
        }
    }
    return { sector: blipSector, ring: blipRing }
}

const drawRadarBlips = function (viewpoint) {
    currentViewpoint = viewpoint
    document.getElementById('showImages').checked = currentViewpoint.blipDisplaySettings.showImages

    document.getElementById('showLabels').checked = currentViewpoint.blipDisplaySettings.showLabels

    document.getElementById('showShapes').checked = currentViewpoint.blipDisplaySettings.showShapes
    document.getElementById('showRingMinusOne').checked = !(currentViewpoint.blipDisplaySettings.showRingMinusOne == false)
    document.getElementById('aggregationMode').checked = currentViewpoint.blipDisplaySettings.aggregationMode
    document.getElementById('sectors').checked = currentViewpoint.template.topLayer == "sectors"
    document.getElementById('rings').checked = currentViewpoint.template.topLayer == "rings"
    document.getElementById('blipScaleFactorSlider').value = currentViewpoint.blipDisplaySettings.blipScaleFactor ?? 1
    document.getElementById('sectors').addEventListener("change", (e) => {
        const changed = currentViewpoint.template.topLayer != e.currentTarget.id
        currentViewpoint.template.topLayer = e.currentTarget.id
        if (changed) publishRefreshRadar()
    });
    document.getElementById('rings').addEventListener("change", (e) => {
        const changed = currentViewpoint.template.topLayer != e.currentTarget.id
        currentViewpoint.template.topLayer = e.currentTarget.id
        if (changed) publishRefreshRadar()
    });

    initializeTagsFilter()
    const blipDrawingContext = prepareBlipDrawingContext()

    // the blip.label property should be set in order to describe the label for the blips
    // this next section helps out when that property has not been set, by picking our own label property
    if (viewpoint.propertyVisualMaps.blip?.label == null || viewpoint.propertyVisualMaps.blip?.label.length == 0) {
        // set blip.label to the first string type property for the object this blip is based on
        let blipProperties = getRatingTypeProperties(viewpoint.ratingType, getData().model, true)
        for (let i = 0; i < blipProperties.length; i++) {
            if (blipProperties[i].property.type == "string" && blipProperties[i].propertyScope == "object") {
                viewpoint.propertyVisualMaps.blip.label = blipProperties[i].propertyPath
                break
            }
        }

    }

    document.getElementById('applyShapes').checked = currentViewpoint.blipDisplaySettings.applyShapes
    document.getElementById('applySizes').checked = currentViewpoint.blipDisplaySettings.applySizes
    document.getElementById('applyColors').checked = currentViewpoint.blipDisplaySettings.applyColors
    let blipsLayer
    blipsLayer = d3.select(`#${blipsLayerElementId}`)
    if (blipsLayer.empty()) {
        const radarCanvasElement = d3.select(`#${radarCanvasElementId}`)
        blipsLayer = radarCanvasElement.append("g")
            .attr("id", blipsLayerElementId)
    }
    else {
        blipsLayer.selectAll("*").remove();
    }
    const filteredBlips = viewpoint.blips.filter((blip) => filterBlip(blip, viewpoint))

    // go through blips and assign blips to segment
    filteredBlips.forEach((blip) => {
        const segment = findSegmentForRating(blip.rating, viewpoint, blipDrawingContext)
        if (segment.sector != null
            &&
            (segment.ring >= 0 || (segment.ring == -1 && currentViewpoint.blipDisplaySettings.showRingMinusOne != false))
        ) {
            blipDrawingContext.segmentMatrix[segment.sector][segment.ring].blips.push(blip)
        }
    })

    // compose new set of blips
    // eliminate [blips in] invisible segments 
    let visibleBlips = []
    for (let s = 0; s < getViewpoint().template.sectorsConfiguration.sectors.length; s++) {
        for (let r = -1; r < getViewpoint().template.ringsConfiguration.rings.length; r++) {
            const segment = blipDrawingContext.segmentMatrix[s][r]
            if (segment.visible) {

                if (currentViewpoint.blipDisplaySettings.aggregationMode == true) {
                    const blipsPerObject = {}
                    segment.blips.forEach((blip) => {
                        if (!blipsPerObject.hasOwnProperty(blip.rating.object.id)) { blipsPerObject[blip.rating.object.id] = [] }
                        blipsPerObject[blip.rating.object.id].push(blip)
                    })
                    // blipsPerObject has zero, one or more properties for each of the objects for which blips are in this segment
                    // if the number of objects > 1 - aggregation time!
                    for (let i = 0; i < Object.keys(blipsPerObject).length; i++) {
                        const objectId = Object.keys(blipsPerObject)[i]
                        if (blipsPerObject[objectId].length > 1) {
                            const blip = {
                                id: `${uuidv4()}`
                                , rating: blipsPerObject[objectId][0].rating
                                , artificial: true
                                // TODO AGGREGATION hardcoded property names
                                , aggregation: {
                                    count: blipsPerObject[objectId].length
                                    , label: blipsPerObject[objectId].reduce((label, b, index) => { return label + ((index == 0) ? "" : ",") + b.rating.scope }, "")
                                    , authors: blipsPerObject[objectId].reduce((authors, b, index) => { return authors + ((index == 0) ? "" : ",") + b.rating.author }, "")
                                }
                            }
                            visibleBlips.push(blip)
                        }
                        else {

                            visibleBlips = visibleBlips.concat(blipsPerObject[objectId])
                        }
                    }
                } else {
                    visibleBlips = visibleBlips.concat(segment.blips)
                }
            }
        }
    }



    const blipElements = blipsLayer.selectAll(".blip")
        .data(visibleBlips)
        .enter()
        .append("g")
        .attr("class", "blip")
        .attr("class", "draggable-group")
        // .on("dblclick", function (d) { showModal(d); })

        .on('contextmenu', (e, d) => {

            createContextMenu(e, d, this, viewpoint);
        })

    // configure each blip
    blipElements.each(function (d) {
        const blip = d3.select(this);
        //        try {
        drawRadarBlip(blip, d, viewpoint, blipDrawingContext);
        //       } catch (e) {
        //         console.log(`failed to draw blip ${d.rating?.object?.label} because of ${e}`)
        //       console.log(`blip:  ${JSON.stringify(d)}`)
        // }

    });
    return viewpoint.blips
}

// prepare data that during blip drawing can be used (for every blip)
// this should improve performance and save on the number of calculations/derivations
// - segment matrix - with details for each sector/ring combination 
// - others sector/ring/shape/color/size
// - ring and sector expansion factor
const prepareBlipDrawingContext = () => {
    currentViewpoint = getViewpoint()
    const blipDrawingContext = {}
    blipDrawingContext['sectorExpansionFactor'] = sectorExpansionFactor()
    blipDrawingContext['ringExpansionFactor'] = ringExpansionFactor()

    const segmentMatrix = []

    let sectorAngleSum = parseFloat(getViewpoint().template.sectorsConfiguration.initialAngle ?? 0)

    for (let s = 0; s < getViewpoint().template.sectorsConfiguration.sectors.length; s++) {
        segmentMatrix.push({})
        const sector = getViewpoint().template.sectorsConfiguration.sectors[s]
        let currentSectorAngle =
            (sector?.visible != false ? sector.angle : 0) * blipDrawingContext['sectorExpansionFactor']


        let ringWidthSum = 0

        for (let r = 0; r < getViewpoint().template.ringsConfiguration.rings.length; r++) {
            const ring = getViewpoint().template.ringsConfiguration.rings[r]
            let currentRingWidth = (ring?.visible != false ? ring.width : 0) * blipDrawingContext['ringExpansionFactor']
            const segment = {
                startPhi: 2 * (1 - sectorAngleSum) * Math.PI
                , endPhi: 2 * (1 - (sectorAngleSum + currentSectorAngle)) * Math.PI
                , startAngle: sectorAngleSum
                , endAngle: sectorAngleSum + currentSectorAngle
                , anglePercentage: currentSectorAngle
                , startWidth: ringWidthSum
                , endWidth: ringWidthSum + currentRingWidth
                , widthPercentage: currentRingWidth
                , startR: Math.round((1 - ringWidthSum) * getViewpoint().template.maxRingRadius)
                , endR: Math.round((1 - ringWidthSum - currentRingWidth) * getViewpoint().template.maxRingRadius)
                , blips: []
            }
            segmentMatrix[s][r] = segment
            segment.visible = !(ring.visible == false || sector.visible == false)

            ringWidthSum += currentRingWidth

        }
        // add ring -1 (the outer zone)
        segmentMatrix[s][-1] = {...segmentMatrix[s][0]}
        segmentMatrix[s][-1].blips = []
        segmentMatrix[s][-1].startR = 3000
        segmentMatrix[s][-1].endR = segmentMatrix[s][0].startR

        sectorAngleSum += currentSectorAngle

    }
    // console.log(`segment matrix = ${JSON.stringify(segmentMatrix)}`)
    blipDrawingContext.segmentMatrix = segmentMatrix
    // others: an object with for each visual dimension the value that is designated as others
    blipDrawingContext.othersDimensionValue = {}
    const visualDimensions = ["sector", "ring", "shape", "color", "size"]
    visualDimensions.forEach((dimension) => {
        if (getViewpoint().template[`${dimension}sConfiguration`] != null) {
            for (let i = 0; i < getViewpoint().template[`${dimension}sConfiguration`][`${dimension}s`].length; i++) {
                const dimensionValue = getViewpoint().template[`${dimension}sConfiguration`][`${dimension}s`][i]
                if (dimensionValue.others == true) {
                    blipDrawingContext.othersDimensionValue[dimension] = i
                }
            }
        }
    })
    return blipDrawingContext
}

const sectorExpansionFactor = () => {
    const totalAvailableAngle = currentViewpoint.template.sectorsConfiguration.totalAngle ?? 1
    const initialAngle = parseFloat(currentViewpoint.template.sectorsConfiguration.initialAngle ?? 0)
    //  console.log(`totalAvailableAngle = ${totalAvailableAngle}`)

    // factor to multiply each angle with - derived from the sum of angles of all visible sectors , calibrated with the total available angle
    const totalVisibleSectorsAngleSum = currentViewpoint.template.sectorsConfiguration.sectors.reduce((sum, sector) =>
        sum + (sector?.visible != false ? sector.angle : 0), 0)
    //    return totalAvailableAngle * (totalVisibleSectorsAngleSum == 0 ? 1 : 1 / totalVisibleSectorsAngleSum)
    const expansionFactor = parseFloat((totalAvailableAngle - initialAngle) * (totalVisibleSectorsAngleSum == 0 ? 1 : (1 / totalVisibleSectorsAngleSum)))
    //   console.log(`expansionFactor ${expansionFactor}`)
    return expansionFactor
}

const priorSectorsAnglePercentageSum = (sectorId, config) => config.sectorsConfiguration.sectors.filter((sector, index) => index < sectorId)
    .reduce((sum, sector) =>
        sum + (sector?.visible != false ? sector.angle : 0), 0) * sectorExpansionFactor() + parseFloat(currentViewpoint.template.sectorsConfiguration.initialAngle ?? 0)

const ringExpansionFactor = () => {
    // factor to multiply each witdh with - derived from the sum of widths of all visible rings , calibrated with the total available ring width
    const totalVisibleRingsWidthSum = currentViewpoint.template.ringsConfiguration.rings.reduce((sum, ring) =>
        sum + (ring?.visible != false ? ring.width : 0), 0)
    const expansionFactor = totalVisibleRingsWidthSum == 0 ? 1 : 1 / totalVisibleRingsWidthSum
    return expansionFactor
}
const priorRingsWidthPercentageSum = (ringId, config) => config.ringsConfiguration.rings.filter((ring, index) => index < ringId)
    .reduce((sum, ring) => sum + (ring?.visible != false ? ring.width : 0), 0) * ringExpansionFactor()

const sectorRingToPosition = (sector, ring, config) => { // return randomized X,Y coordinates in segment corresponding to the sector and ring 
    try {
        const segmentAnglePercentage = (0.1 + Math.random() * 0.8)
        const phi = priorSectorsAnglePercentageSum(sector, config) +
            segmentAnglePercentage * config.sectorsConfiguration.sectors[sector].angle * sectorExpansionFactor()
        // ring can be undefined (== the so called -1 ring, outside the real rings)
        let r
        let segmentWidthPercentage
        if (ring != null && ring > -1) {
            segmentWidthPercentage = (0.1 + Math.random() * 0.8)
            let rFactor = (1 - priorRingsWidthPercentageSum(ring, config) -
                segmentWidthPercentage * config.ringsConfiguration.rings[ring].width * ringExpansionFactor())  // 0.1 to not position the on the outer edge of the segment
            r = config.maxRingRadius * rFactor
        }
        else {
            segmentWidthPercentage = - ( Math.random() * 0.39)
            r = config.maxRingRadius * (1 - segmentWidthPercentage)  // 0.33 range of how far outer ring blips can stray NOTE depends on sector angle - for the sectors between 0.4 and 0.6 and 0.9 and 0.1 there is more leeway  
        }
        const cartesian = cartesianFromPolar({ r: r, phi: 2 * (1 - phi) * Math.PI })
        return { ...{ r: r, phi: phi }, ...cartesian, ...{ segmentAnglePercentage, segmentWidthPercentage } }
    } catch (e) {
        console.log(`radarblips,.sectorRingToPosition ${e} ${sector}${ring}`)
    }

}

const blipInSegment = (cartesian, viewpoint, segment) => {
    const cartesianSegment = segmentFromCartesian(cartesian, viewpoint, sectorExpansionFactor(), ringExpansionFactor())
    //console.log(`REAL sector ${segment.sector} ring ${segment.ring};XY RING  ${cartesianSegment.ring} sector ${cartesianSegment.sector}`)
    const isBlipInSegment =
        ((cartesianSegment.sector ?? -1) == (segment.sector ?? -1))
        &&
        ((cartesianSegment.ring ?? -1) == (segment.ring ?? -1))
    return isBlipInSegment
}

const findSectorForRating = (rating, viewpoint) => {
    const propertyMappedToSector = viewpoint.propertyVisualMaps.sector.property
    let sectorProperty = getPropertyFromPropertyPath(propertyMappedToSector, viewpoint.ratingType, getData().model)
    let sector
    const propertyValue = getNestedPropertyValueFromObject(rating, propertyMappedToSector)
    if (sectorProperty.type == "tags") {
        for (let i = 0; i < propertyValue.length; i++) {
            sector = viewpoint.propertyVisualMaps.sector.valueMap[propertyValue[i]]
            if (sector != null) break // stop looking as soon as one of the tags has produced a sector. The order of tags can be important
        }
    } else {
        sector = viewpoint.propertyVisualMaps.sector.valueMap[propertyValue]
    }
    return sector
}

const drawRadarBlip = (blip, d, viewpoint, blipDrawingContext) => {

    let blipSector = findSectorForRating(d.rating, viewpoint)
    if (blipSector == null) {
        if (blipDrawingContext.othersDimensionValue["sector"] != null) {
            blipSector = blipDrawingContext.othersDimensionValue["sector"]
        }
        else {
            return
        }
    }
    if (viewpoint.template.sectorsConfiguration.sectors[blipSector]?.visible == false) {
        return
    }

    const propertyMappedToRing = viewpoint.propertyVisualMaps.ring.property
    let blipRing = viewpoint.propertyVisualMaps.ring.valueMap[getNestedPropertyValueFromObject(d.rating, propertyMappedToRing)]
    if (blipRing == null) {
        if (blipDrawingContext.othersDimensionValue["ring"] != null) {
            blipRing = blipDrawingContext.othersDimensionValue["ring"]
        }
        else {
            blipRing = -1
            // in case of rings we accept blips not associated with any "real ring" - directly or indirect through Others
        }
    }
    if (viewpoint.template.ringsConfiguration.rings[blipRing]?.visible == false) {
        return
    }

    const segment = blipDrawingContext.segmentMatrix[blipSector][blipRing]
    let blipShape
    try {

        const propertyMappedToShape = viewpoint.propertyVisualMaps.shape?.property
        if (propertyMappedToShape!=null) {
        let blipShapeId = viewpoint.propertyVisualMaps.shape.valueMap[getNestedPropertyValueFromObject(d.rating, propertyMappedToShape)]
        if (blipShapeId == null) {
            if (blipDrawingContext.othersDimensionValue["shape"] != null) {
                blipShapeId = blipDrawingContext.othersDimensionValue["shape"]
            }
            else {
                return
            }
        }
        if (viewpoint.template.shapesConfiguration.shapes[blipShapeId]?.visible == false) {
            return
        }
        blipShape = viewpoint.template.shapesConfiguration.shapes[blipShapeId].shape
    } else {blipShape = "circle"}
    } catch (e) {
        blipShape = "circle"
        console.log(`draw radar blip fall back to circle because of ${e}`)

    }

    let blipColor
    try {
        const propertyMappedToColor = viewpoint.propertyVisualMaps?.color?.property
        if (propertyMappedToColor != null) {
            let blipColorId = viewpoint.propertyVisualMaps.color.valueMap[getNestedPropertyValueFromObject(d.rating, propertyMappedToColor)]
            if (blipColorId == null) {
                if (blipDrawingContext.othersDimensionValue["color"] != null) {
                    blipColorId = blipDrawingContext.othersDimensionValue["color"]
                }
                else {
                    return
                }
            }
            if (viewpoint.template.colorsConfiguration.colors[blipColorId]?.visible == false) {
                return
            }
        

        blipColor = viewpoint.template.colorsConfiguration.colors[blipColorId].color
        } else {
            blipColor = "blue"

        }
        //TODO AGGREGATION hard coded aggregated color
        if (d.artificial == true && viewpoint.blipDisplaySettings.aggregationMode) {
            blipColor = "#800040"  // color to indicate aggregation

        }
    } catch (e) {
        blipColor = "blue"
        console.log(`draw radar blip fall back to no apply color because of ${e}`)
    }

    let blipSize
    try {

        const propertyMappedToSize = viewpoint.propertyVisualMaps.size?.property
        if (propertyMappedToSize!=null) {
        let blipSizeId = viewpoint.propertyVisualMaps.size.valueMap[getNestedPropertyValueFromObject(d.rating, propertyMappedToSize)]
        if (blipSizeId == null) {
            if (blipDrawingContext.othersDimensionValue["size"] != null) {
                blipSizeId = blipDrawingContext.othersDimensionValue["size"]
            }
            else {
                return
            }
        }
        if (viewpoint.template.sizesConfiguration.sizes[blipSizeId]?.visible == false) {
            return
        }

        blipSize = viewpoint.template.sizesConfiguration.sizes[blipSizeId].size
    } else {
        blipSize = 1
    }
    } catch (e) {
        blipSize = 1

        console.log(`draw radar blip fall back to no apply size because of ${e}`)
    }

    if (!viewpoint.blipDisplaySettings.applyShapes) {
        blipShape = viewpoint.propertyVisualMaps.blip?.defaultShape ?? "circle"
        if (blipShape == "") blipShape = "circle"
    }
    if (!viewpoint.blipDisplaySettings.applyColors) {
        blipColor = viewpoint.propertyVisualMaps.blip?.defaultColor ?? "blue"
        if (blipColor == "") blipColor = "blue"
    }
    if (!viewpoint.blipDisplaySettings.applySizes) {
        blipSize = viewpoint.propertyVisualMaps.blip?.defaultSize ?? 1
        if (blipSize == "") blipSize = 1
    }
    let xy

    if (d.segmentWidthPercentage != null && d.segmentAnglePercentage != null) {
        const anglePercentage = segment.startAngle + d.segmentAnglePercentage * segment.anglePercentage
        let widthPercentage = segment.startWidth + d.segmentWidthPercentage * segment.widthPercentage
        if (blipRing == -1 ) { 
            widthPercentage = -1 * Math.abs(d.segmentWidthPercentage )
            widthPercentage = Math.max(-0.5, widthPercentage) // TODO this should not be necessary, but widthPercentage is getting too big
        }
        const phi = 2 * (1 - anglePercentage) * Math.PI
        const r = (1 - widthPercentage) * viewpoint.template.maxRingRadius
        xy = cartesianFromPolar({ r: r, phi: phi })



    } else {
        if (d.x != null && d.y != null
            && blipInSegment(d, viewpoint, { sector: blipSector, ring: blipRing })
        ) {
            xy = { x: d.x, y: d.y }
        } else {
            xy = sectorRingToPosition(blipSector, blipRing, viewpoint.template)
            d.segmentAnglePercentage = xy.segmentAnglePercentage
            d.segmentWidthPercentage = xy.segmentWidthPercentage
        }
    }
    let scaleFactor = blipSize * viewpoint.blipDisplaySettings.blipScaleFactor ?? 1
    if (d.artificial == true) { scaleFactor = scaleFactor * (1 + (d.aggregation.count - 1) / 3) }
    blip.attr("transform", `translate(${xy.x},${xy.y}) scale(${scaleFactor})`)
        .attr("id", `blip-${d.id}`)
    if (!viewpoint.blipDisplaySettings.showLabels
        || (!viewpoint.blipDisplaySettings.showImages && d.rating.object.image
            || d.artificial == true
        )
    ) { // any content for the tooltip
        blip
            .on("mouseover", (e, d) => {

                addTooltip(
                    (d) => {
                        let content = `<div>     
                    ${viewpoint.blipDisplaySettings.showLabels ? "" : getNestedPropertyValueFromObject(d.rating, viewpoint.propertyVisualMaps.blip.label)}
                    `
                        if (!viewpoint.blipDisplaySettings.showImages && getNestedPropertyValueFromObject(d.rating, viewpoint.propertyVisualMaps.blip.image) != null) {
                            content = `${content}<img src="${getNestedPropertyValueFromObject(d.rating, viewpoint.propertyVisualMaps.blip.image)}" width="100px"></img>`
                        }
                        if (d.artificial == true) {
                            content += ` by ${d.aggregation.label}`
                        }

                        return `${content}</div>`
                    }
                    , d, e.pageX, e.pageY);
            })
            .on("mouseout", () => {
                removeTooltip();
            })
    }




    blip.on("dblclick", (e, d) => {
        blipWindow(d, viewpoint)

    })
    // the blip can consist of:
    // text/label (with color and text style?) and/or either an image or a shape
    // the user determines which elements should be displayed for a blip 
    // perhaps the user can also indicate whether colors, shapes and sizes should be visualized (or set to default values instead)
    // and if text font size should decrease/increase with size?
    // TODO: label consisting of two lines 
    if (viewpoint.blipDisplaySettings.showLabels || (viewpoint.blipDisplaySettings.showImages && getNestedPropertyValueFromObject(d.rating, viewpoint.propertyVisualMaps.blip.image) == null)) {
        let label = getNestedPropertyValueFromObject(d.rating, viewpoint.propertyVisualMaps.blip.label).trim()

        if (d.artificial == true) {
            label += ` (# ${d.aggregation.count})`
        }
        // TODO find smarter ways than breaking on spaces to distribute label over multiple lines
        let line = label
        let line0
        if (label.length > 11) {
            line = label.trim().substring(label.trim().indexOf(" "))
            line0 = label.split(" ")[0]
        }
        if (label.length > 11 && line != line0) { // if long label, show first part above second part of label
            blip.append("text")
                .text(line0)
                .attr("x", 0) // if on left side, then move to the left, if on the right side then move to the right
                .attr("y", -45) // if on upper side, then move up, if on the down side then move down
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "before-edge")
                .style("fill", "#000")
                .style("font-family", "Arial, Helvetica")
                .style("font-stretch", "extra-condensed")
                .style("font-size", "14px")
        }
        blip.append("text")
            .text(line)
            .attr("x", 0) // if on left side, then move to the left, if on the right side then move to the right
            .attr("y", -30) // if on upper side, then move up, if on the down side then move down
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "before-edge")
            .style("fill", "#000")
            .style("font-family", "Arial, Helvetica")
            .style("font-stretch", "extra-condensed")
            .style("font-size", function (d) { return label.length > 2 ? `${14}px` : "17px"; })
    }

    if (viewpoint.blipDisplaySettings.showShapes) {
        let shape

        if (blipShape == "circle") {
            shape = blip.append("circle")
                .attr("r", 15)
        }
        if (blipShape == "diamond") {
            const diamond = d3.symbol().type(d3.symbolDiamond).size(800);
            shape = blip.append('path').attr("d", diamond)
        }
        if (blipShape == "square") {
            const square = d3.symbol().type(d3.symbolSquare).size(800);
            shape = blip.append('path').attr("d", square)
        }

        if (blipShape == "star") {
            const star = d3.symbol().type(d3.symbolStar).size(720);
            shape = blip.append('path').attr("d", star)
        }
        if (blipShape == "plus") {
            const plus = d3.symbol().type(d3.symbolCross).size(720);
            shape = blip.append('path').attr("d", plus)
        }
        if (blipShape == "triangle") {
            const triangle = d3.symbol().type(d3.symbolTriangle).size(720);
            shape = blip.append('path').attr("d", triangle)
        }
        if (blipShape == "rectangleHorizontal") {
            shape = blip.append('rect').attr('width', 38)
                .attr('height', 10)
                .attr('x', -20)
                .attr('y', -4)
        }
        if (blipShape == "rectangleVertical") {
            shape = blip.append('rect')
                .attr('width', 10)
                .attr('height', 38)
                .attr('x', -5)
                .attr('y', -15)
        }
        shape.attr("fill", blipColor);
        shape.attr("opacity", "0.4");
    }

    if (viewpoint.blipDisplaySettings.showImages && getNestedPropertyValueFromObject(d.rating, viewpoint.propertyVisualMaps.blip.image) != null) {
        let image = blip.append('image')
            .attr('xlink:href', getNestedPropertyValueFromObject(d.rating, viewpoint.propertyVisualMaps.blip.image))
            .attr('width', 80)
            .attr('height', 40)
            .attr("x", "-40") // if on left side, then move to the left, if on the right side then move to the right
            .attr("y", "-15")
        //.attr("class","outlinedImage")
        // to create a colored border around the image, use a rectangle
        let border = blip.append('rect')
            .attr('width', 80)
            .attr('height', 40)
            .attr('x', -40)
            .attr('y', -15)
            .style('fill', "none")
            .style("stroke", "red") // TODO: use the blip color
            .style("stroke-width", "0px") // TODO: when a color is derived properly, set a border width
    }
}

const handleBlipScaleFactorChange = (event) => {
    currentViewpoint.blipDisplaySettings.blipScaleFactor = event.target.value
    //  console.log(`handle scale factor change ${currentViewpoint.blipDisplaySettings.blipScaleFactor}`)
    drawRadarBlips(currentViewpoint)
}

const handleShowImagesChange = (event) => {
    currentViewpoint.blipDisplaySettings.showImages = event.target.checked
    drawRadarBlips(currentViewpoint)
}

const handleShowLabelsChange = (event) => {
    currentViewpoint.blipDisplaySettings.showLabels = event.target.checked
    drawRadarBlips(currentViewpoint)
}

const handleAggregationModeChange = (event) => {
    currentViewpoint.blipDisplaySettings.aggregationMode = event.target.checked
    drawRadarBlips(currentViewpoint)
    publishRefreshRadar();
}


const handleShowRingMinusOneChange = (event) => {
    currentViewpoint.blipDisplaySettings.showRingMinusOne = event.target.checked
    publishRefreshRadar();
}


const handleShowShapesChange = (event) => {
    currentViewpoint.blipDisplaySettings.showShapes = event.target.checked
    drawRadarBlips(currentViewpoint)
}
const handleTagFilterChange = (event) => {

    const filterTagValue = document.getElementById("filterTagSelector").value
    if (filterTagValue != null && filterTagValue.length > 0) {
        getViewpoint().blipDisplaySettings.tagFilter.push({ type: "plus", tag: filterTagValue })
        document.getElementById("filterTagSelector").value = ""
        drawRadarBlips(getViewpoint())
    }
}

const handleApplyColorsChange = (event) => {
    currentViewpoint.blipDisplaySettings.applyColors = event.target.checked
    document.getElementById("colorsLegend").setAttribute("style", `display:${event.target.checked ? "block" : "none"}`)
    drawRadarBlips(currentViewpoint)
}

const handleApplySizesChange = (event) => {
    currentViewpoint.blipDisplaySettings.applySizes = event.target.checked
    document.getElementById("sizesLegend").setAttribute("style", `display:${event.target.checked ? "block" : "none"}`)
    drawRadarBlips(currentViewpoint)
}
const handleApplyShapesChange = (event) => {
    currentViewpoint.blipDisplaySettings.applyShapes = event.target.checked
    document.getElementById("shapesLegend").setAttribute("style", `display:${event.target.checked ? "block" : "none"}`)

    drawRadarBlips(currentViewpoint)
}

const createContextMenu = (e, d, blip, viewpoint) => {
    menu(e.pageX, e.pageY, d, blip, viewpoint);
    e.preventDefault();
}

const menu = (x, y, d, blip, viewpoint) => {
    const config = viewpoint.template
    d3.select('.context-menu').remove(); // if already showing, get rid of it.
    d3.select('body') // click anywhere outside the context menu to hide it TODO perhaps remove on mouse out?
        .on('click', function () {
            //  d3.select('.context-menu').remove();
        });


    // TODO dynamically adjust width and height with number of visual dimensions and max number of values

    const entryHeight = 45 // number vertical pixel per context menu entry
    let height = 30 + Math.max(0,
        viewpoint.propertyVisualMaps.size?.valueMap == null ? 0 : config.sizesConfiguration?.sizes?.length ?? 0
        , viewpoint.propertyVisualMaps.shape?.valueMap == null ? 0 : config.shapesConfiguration?.shapes?.length ?? 0
        , viewpoint.propertyVisualMaps.color?.valueMap == null ? 0 : config.colorsConfiguration?.colors?.length ?? 0
    )
        * entryHeight // derive from maximum number of entries in each category
    const circleRadius = 12
    const initialColumnIndent = 30
    const columnWidth = 70
    let width = initialColumnIndent + 10 + 4 * columnWidth
    const xShift = x > 500 ? -220 : 0
    const yShift = y > 500 ? -250 : 0
    const contextMenu = d3.select(`svg#${config.svg_id}`)
        .append('g').attr('class', 'context-menu')
        .attr('transform', `translate(${x + xShift},${y + yShift})`) // TODO if x and y are on the edge, then move context menu to the left and up

    contextMenu.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'rect')
        .attr("style", "fill:lightgray;")
        .style("opacity", 0.8)
        .on("mouseout", (e) => {
            // check x and y - to see whether they are really outside context menu area (mouse out also fires when mouse is on elements inside context menu)
            const deltaX = x - e.pageX + xShift
            const deltaY = y - e.pageY + yShift
            if (((deltaX > 0) || (deltaX <= - width + 20) || (deltaY > 0) || (deltaY <= - height))
            ) {
                d3.select('.context-menu').remove();
            }
        })
    const sizesBox = contextMenu.append('g')
        .attr('class', 'sizesBox')
        .attr("transform", `translate(${initialColumnIndent}, ${15})`)

    sizesBox.append("text")
        .text(config.sizesConfiguration.label)
        .attr("x", -25)
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "12px")
        .style("font-weight", "normal")
        .attr("transform", "scale(0.7,1)")
    if (viewpoint.propertyVisualMaps.size?.valueMap != null) {
        for (let i = 0; i < config.sizesConfiguration?.sizes.length ?? 0; i++) {
            const scaleFactor = config.sizesConfiguration.sizes[i].size
            const label = config.sizesConfiguration.sizes[i].label
            const sizeEntry = sizesBox.append('g')
                .attr("transform", `translate(0, ${30 + i * entryHeight})`)
                .append('circle')
                .attr("id", `templateSizes${i}`)
                .attr("r", circleRadius)
                .attr("fill", "black")
                .attr("transform", `scale(${scaleFactor})`)
            const keyForValue = getKeyForValue(viewpoint.propertyVisualMaps.size?.valueMap, i)
            decorateContextMenuEntry(sizeEntry, "size", keyForValue, d, viewpoint, label)
        }
    }
    const shapesBox = contextMenu.append('g')
        .attr('class', 'shapesBox')
        .attr("transform", `translate(${initialColumnIndent + columnWidth}, ${15})`)

    shapesBox.append("text")
        .text(config.shapesConfiguration.label)
        .attr("x", -25)
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "12px")
        .style("font-weight", "normal")
        .attr("transform", "scale(0.7,1)")

    if (viewpoint.propertyVisualMaps.shape?.valueMap != null) {

        for (let i = 0; i < config.shapesConfiguration?.shapes.length ?? 0; i++) {
            const shapeToDraw = config.shapesConfiguration.shapes[i].shape
            const label = config.shapesConfiguration.shapes[i].label

            // for (let i = 0; i < Object.keys(viewpoint.propertyVisualMaps.shape.valueMap).length; i++) {
            //     const key = Object.keys(viewpoint.propertyVisualMaps.shape.valueMap)[i]
            //     const shapeToDraw = config.shapesConfiguration.shapes[viewpoint.propertyVisualMaps.shape.valueMap[key]].shape
            //     const label = config.shapesConfiguration.shapes[viewpoint.propertyVisualMaps.shape.valueMap[key]].label
            const shapeEntry = shapesBox.append('g')
                .attr("transform", `translate(0, ${30 + i * entryHeight})`)
            let shape

            if (shapeToDraw == "circle") {
                shape = shapeEntry.append("circle")
                    .attr("r", circleRadius)
            }
            if (shapeToDraw == "diamond") {
                const diamond = d3.symbol().type(d3.symbolDiamond).size(420);
                shape = shapeEntry.append('path').attr("d", diamond)
            }
            if (shapeToDraw == "square") {
                const square = d3.symbol().type(d3.symbolSquare).size(420);
                shape = shapeEntry.append('path').attr("d", square)
            }
            if (shapeToDraw == "star") {
                const star = d3.symbol().type(d3.symbolStar).size(420);
                shape = shapeEntry.append('path').attr("d", star)
            }
            if (shapeToDraw == "plus") {
                const plus = d3.symbol().type(d3.symbolCross).size(420);
                shape = shapeEntry.append('path').attr("d", plus)
            }
            if (shapeToDraw == "triangle") {
                const triangle = d3.symbol().type(d3.symbolTriangle).size(420);
                shape = shapeEntry.append('path').attr("d", triangle)
            }
            if (shapeToDraw == "rectangleHorizontal") {
                shape = shapeEntry.append('rect').attr('width', 38)
                    .attr('height', 10)
                    .attr('x', -20)
                    .attr('y', -4)
            }

            if (shapeToDraw == "rectangleVertical") {
                shape = shapeEntry.append('rect')
                    .attr('width', 10)
                    .attr('height', 38)
                    .attr('x', -5)
                    .attr('y', -15)
            }
            if (shape != null) {
                shape
                    .attr("id", `templateSizes${i}`)
                    .attr("fill", "black")
                const keyForValue = getKeyForValue(viewpoint.propertyVisualMaps.shape?.valueMap, i)

                decorateContextMenuEntry(shapeEntry, "shape", keyForValue, d, viewpoint, label)
            }
        }
    }
    // draw color
    const colorsBox = contextMenu.append('g')
        .attr('class', 'colorsBox')
        .attr("transform", `translate(${initialColumnIndent + 2 * columnWidth}, ${15})`)
    colorsBox.append("text")
        .text(config.colorsConfiguration.label)
        .attr("x", -25)
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "12px")
        .style("font-weight", "normal")
        .attr("transform", "scale(0.7,1)")
    if (viewpoint.propertyVisualMaps.color?.valueMap != null) {

        for (let i = 0; i < config.colorsConfiguration?.colors.length ?? 0; i++) {
            const colorToFill = config.colorsConfiguration.colors[i].color
            const label = config.colorsConfiguration.colors[i].label

            // for (let i = 0; i < Object.keys(viewpoint.propertyVisualMaps.color.valueMap).length; i++) {
            //     const key = Object.keys(viewpoint.propertyVisualMaps.color.valueMap)[i]
            //     const colorToFill = config.colorsConfiguration.colors[viewpoint.propertyVisualMaps.color.valueMap[key]].color
            //     const label = config.colorsConfiguration.colors[viewpoint.propertyVisualMaps.color.valueMap[key]].label
            const colorEntry = colorsBox.append('g')
                .attr("transform", `translate(0, ${30 + i * entryHeight})`)
                .append('circle')
                .attr("id", `templateSizes${i}`)
                .attr("r", circleRadius)
                .attr("fill", colorToFill)

            const keyForValue = getKeyForValue(viewpoint.propertyVisualMaps.color?.valueMap, i)

            decorateContextMenuEntry(colorEntry, "color", keyForValue, d, viewpoint, label)
        }
    }
    const iconsBox = contextMenu.append('g')
        .attr('class', 'iconsBox')
        .attr("transform", `translate(${initialColumnIndent + 3 * columnWidth - 35}, ${15})`)

    // additional blip actions can be initiated    
    iconsBox.append("text")
        .text("Blip Actions")
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "12px")
        .style("font-weight", "normal")
        .attr("transform", "scale(0.7,1)")


    const menuItemHeight = 18
    // TODO: does clone blip mean clone rating (but for the same existing object?) it probably does; current implementation is full copy - object and rating
    iconsBox.append("text")
        .text("Clone Blip")
        .attr("x", 0)
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .attr("transform", `translate(0, ${20 + 0 * menuItemHeight})`)
        .attr("class", "clickableProperty")
        .on("click", () => {
            const newBlip = JSON.parse(JSON.stringify(d))
            viewpoint.blips.push(newBlip)
            newBlip.x = newBlip.x != null ? newBlip.x + 15 : null
            newBlip.y = newBlip.y != null ? newBlip.y + 15 : null
            newBlip.id = uuidv4()
            drawRadarBlips(viewpoint)
        })
    iconsBox.append("text")
        .text("Delete Blip")
        .attr("x", 0)
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .attr("transform", `translate(0, ${20 + 1 * menuItemHeight})`)
        .attr("class", "clickableProperty")
        .on("click", () => {
            const blipIndex = viewpoint.blips.indexOf(d)
            viewpoint.blips.splice(blipIndex, 1)
            d3.select('.context-menu').remove();
            drawRadarBlips(viewpoint)
        })

    iconsBox.append("text")
        .text("Show Similar Blips")
        .attr("x", 0)
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .attr("transform", `translate(0, ${20 + 2 * menuItemHeight})`)
        .attr("class", "clickableProperty")
        .on("click", () => {
            const blipIndex = viewpoint.blips.indexOf(d)
            // create tag filters from tags on d
            const tags = d.rating.object.tags
            if (tags != null && tags.length != null) {
                tags.forEach((tag) => viewpoint.blipDisplaySettings.tagFilter.push({ type: "plus", tag: tag }))
            }
            drawRadarBlips(viewpoint)
        })



}

function populateDatalistWithTags(includeDiscreteProperties = false) {
    const distinctValues = getDistinctTagValues(getViewpoint(), includeDiscreteProperties)
    const tagsList = document.getElementById('tagsList')
    //remove current contents
    tagsList.length = 0
    tagsList.innerHTML = null
    let option
    for (let tagvalue of distinctValues) {
        option = document.createElement('option')
        option.value = tagvalue
        tagsList.appendChild(option)
    }
}

function decorateContextMenuEntry(menuEntry, dimension, value, blip, viewpoint, label) { // dimension = shape, size, color
    menuEntry.attr("class", "clickableProperty")
        .on("click", () => {
            // if (dimension == "size") {
            //     setNestedPropertyValueOnObject(blip.rating, viewpoint.propertyVisualMaps.size.property, value)
            //     drawRadarBlips(viewpoint)
            // }
            // if (dimension == "shape") {
            //     setNestedPropertyValueOnObject(blip.rating, viewpoint.propertyVisualMaps.shape.property, value)
            //     drawRadarBlips(viewpoint)
            // }
            // if (dimension == "color") {
            setNestedPropertyValueOnObject(blip.rating, viewpoint.propertyVisualMaps[dimension].property, value)
            drawRadarBlips(viewpoint)
            //                }
        })
        .on("mouseover", (e, d) => {
            addTooltip(
                (d) => {
                    return `<div>     
            <b>${label}</b>
          </div>`}
                , d, e.pageX, e.pageY);
        })
        .on("mouseout", () => {
            removeTooltip();
        })
}

// Add the tooltip element to the radar
const tooltipElementId = "blip-tooltip"
const tooltip = document.querySelector(`#${tooltipElementId}`);
if (!tooltip) {
    const tooltipDiv = document.createElement("div");
    tooltipDiv.classList.add("tooltip"); // refers to div.tooltip CSS style definition
    tooltipDiv.style.opacity = "0";
    tooltipDiv.id = tooltipElementId;
    document.body.appendChild(tooltipDiv);
}
const div = d3.select(`#${tooltipElementId}`);

const addTooltip = (hoverTooltip, d, x, y) => { // hoverToolTip is a function that returns the HTML to be displayed in the tooltip
    div
        .transition()
        .duration(200)
        .style("opacity", 0.8);
    div
        .html(hoverTooltip(d))
        .style("left", `${x + 5}px`)
        .style("top", `${y - 28}px`);
};

const removeTooltip = () => {
    div
        .transition()
        .duration(200)
        .style("opacity", 0);
};





const getKeyForValue = function (object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

document.getElementById('showImages').addEventListener("change", handleShowImagesChange);
document.getElementById('blipScaleFactorSlider').addEventListener("change", handleBlipScaleFactorChange);

document.getElementById('showLabels').addEventListener("change", handleShowLabelsChange);
document.getElementById('showShapes').addEventListener("change", handleShowShapesChange);
document.getElementById('aggregationMode').addEventListener("change", handleAggregationModeChange);
document.getElementById('showRingMinusOne').addEventListener("change", handleShowRingMinusOneChange);
document.getElementById('displaySettings').addEventListener("click", () => { toggleShowHideElement('displaySettingsPanel') });


document.getElementById('addTagToFilter').addEventListener("click", handleTagFilterChange);

document.getElementById('applyColors').addEventListener("change", handleApplyColorsChange);
document.getElementById('applySizes').addEventListener("change", handleApplySizesChange);
document.getElementById('applyShapes').addEventListener("change", handleApplyShapesChange);


const addProperty = (label, value, parent) => {
    if (value != null && value.length > 0 && value != "undefined") {
        let p = parent.append("p")
            .html(`<b>${label}</b> ${value}`)
    }
}

const addTags = (label, tags, parent) => {
    let innerHTML = `<b>${label}</b> `
    for (let i = 0; i < tags.length; i++) {
        innerHTML = innerHTML + `<span class="extra tagfilter">${tags[i]}</span>`
    }
    parent.append("div").html(innerHTML)
}


// copied from http://bl.ocks.org/GerHobbelt/2653660
function blipWindow(blip, viewpoint) {

    const svgElementId = `svg#${viewpoint.template.svg_id}` //arguments[1][0]

    // inject a HTML form to edit the content here...

    const svg = d3.select(svgElementId)
    const foreignObject = svg.append("foreignObject");

    foreignObject
        //   .attr("x", d.layerX) // use x and y coordinates from mouse event // TODO for use in size/color/shape - the location needs to be derived differently 
        //   .attr("y", d.layerY)
        .attr("x", 100) // use x and y coordinates from mouse event // TODO for use in size/color/shape - the location needs to be derived differently 
        .attr("y", 100)

        .attr("width", 800)
        .attr("height", 600)

    const body = foreignObject
        .append("xhtml:body")
        .attr("style", "background-color:#fff4b8; padding:6px; opacity:0.9")

    body.append("h2").text(`Properties for ${getNestedPropertyValueFromObject(blip.rating, viewpoint.propertyVisualMaps.blip.label)}`)

    let ratingType = (typeof (viewpoint.ratingType) == "string") ? getData().model?.ratingTypes[viewpoint.ratingType] : viewpoint.ratingType

    try {
        for (let propertyName in ratingType.objectType.properties) {
            const property = ratingType.objectType.properties[propertyName]
            let value = blip.rating.object[propertyName]
            if (property.allowableValues != null && property.allowableValues.length > 0) {
                value = getLabelForAllowableValue(value, property.allowableValues)
            }
            if (property.type == "url" && value != null && value.length > 1 && value != "undefined") {
                let newLink = body.append("xlink:a")
                    .attr("src", value)
                    .text(`${property.label}: ${value}`)
                newLink.node().target = "_new"
                newLink.node().addEventListener("click", (e) => { window.open(value); })
            } else if (property.type == "image" && value != null && value.length > 0 && value != "undefined") {
                let img = body.append("img")
                    .attr("src", value)
                    .attr("style", "width: 350px;float:right;padding:15px")
            } else if (property.type == "tags" && value != null && value.length > 0) {
                addTags("Tags", value, body)
            }

            else {

                addProperty(property.label, value, body)
            }
        }


        const ratingDiv = body.append("div")
            .attr("id", "ratingDiv")



        for (let propertyName in ratingType.properties) {
            const property = ratingType.properties[propertyName]
            let value = blip.rating[propertyName]
            if (property.type == "time") {
                // rewrite value to nice date time format
                const date = new Date(value)
                value = date.toDateString()
            }
            if (property.allowableValues != null && property.allowableValues.length > 0) {
                value = getLabelForAllowableValue(value, property.allowableValues)
            }

            // TODO AGGREGATION hard coded property name
            if (blip.artificial == true && propertyName == "scope") {
                addProperty(property.label, blip.aggregation.label, ratingDiv)
            } else if (blip.artificial == true && propertyName == "author") {
                addProperty(property.label, blip.aggregation.authors, ratingDiv)
            } else {
                addProperty(property.label, value, ratingDiv)
            }

        }




        let buttonDiv = body.append("div")
            .attr("id", "buttonDiv")
            .attr("style", "position: absolute; bottom: 30;left: 30;")
        if (!blip.artificial == true) {
            buttonDiv.append("button")
                .attr("style", "float:left;padding:15px")
                .on("click", () => {
                    svg.select("foreignObject").remove();
                    launchBlipEditor(blip, viewpoint, drawRadarBlips)
                })
                .html("Edit Blip")
        }
        buttonDiv.append("button")
            .attr("style", "float:right;padding:15px")
            .on("click", () => {
                svg.select("foreignObject").remove();

            }).html("Close")
            ;
    } catch (e) { console.log(`blip window exception ${e}`) }


}

