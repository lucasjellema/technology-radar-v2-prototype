import { cartesianFromPolar, polarFromCartesian } from './drawingUtilities.js'
import { getState, getConfiguration } from './data.js'
import {prepareBlipDrawingContext} from './radarBlips.js'
export { drawRadar, subscribeToRadarEvents, publishRadarEvent }

const color_white = "#FFF"

const subscribers = []
const subscribeToRadarEvents = (subscriber) => { subscribers.push(subscriber) }
const publishRadarEvent = (event) => { subscribers.forEach((subscriber) => { subscriber(event) }) }

// configNode maps to ring.labelSettings (and sector.labelSettings)
const styleText = (textElement, configNode, config, alternativeFontSource = null) => {
    const fontStyleElements = [{ style: "fill", property: "color" }, { style: "font-size", property: "fontSize" }
        , { style: "font-family", property: "fontFamily" }, { style: "font-weight", property: "fontWeight" }
        , { style: "font-style", property: "fontStyle" }
    ]
    fontStyleElements.forEach((fontStyleElement) => {
        try {
            let styleProperty = (configNode?.[fontStyleElement.property] ?? configNode?.font?.[fontStyleElement.property] ?? alternativeFontSource?.font?.[fontStyleElement.property]) ?? config.defaultFont[fontStyleElement.property]
            textElement
                .style(fontStyleElement.style
                    , styleProperty
                )
        } catch (e) { console.log(`Exception in styleText for ${JSON.stringify(fontStyleElement)} applied to ${JSON.stringify(textElement)}`) }
    })
}

function drawRadar(viewpoint, elementDecorator = null) {
    const config = getConfiguration()
    const radar = initializeRadar(config)
    const radarCanvas = radar.append("g")
        .attr("id", "radarCanvas")

    let sectorCanvas, ringCanvas
    if ("sectors" == config.topLayer) { //&& config.editMode == true) { // draw top layer last 
        ringCanvas = drawRings(radarCanvas, config)
        sectorCanvas = drawSectors(radarCanvas, config, elementDecorator)
    }
    else {
        sectorCanvas = drawSectors(radarCanvas, config, elementDecorator)
        ringCanvas = drawRings(radarCanvas, config)
    }
    drawRingLabels(radar, config, elementDecorator)
    const title = config.title.text
    const titleElement = radar.append("text")
        .attr("id", "title")
        .attr("transform", `translate(${config.title.x != null ? config.title.x : -500}, ${config.title.y != null ? config.title.y : -400})`)
        .text(title)
        .attr("class", getState().editMode ? "draggable" : "")
        .on('contextmenu', (e, d) => {
            createRadarContextMenu(e, d, this, viewpoint);
        })
        .call(elementDecorator ? elementDecorator : () => { }, [`svg#${config.svg_id}`, config.title.text, `title`])
    styleText(titleElement, config.title, config)

    if (config.backgroundImage?.image != null) {
        radarCanvas.append('image')
            .attr("id", `radarBackgroundImage`)
            .attr('xlink:href', config.backgroundImage.image)
            .attr('width', 100)
            .attr("transform", `translate(${config.backgroundImage.x ?? 350},${config.backgroundImage.y ?? -350}) scale(${config.backgroundImage.scaleFactor ?? 1}) `)
            .attr("class", "draggable")
    }



    if (!getState().editMode) {
        // legend
        // try {
        initializeSizesLegend(viewpoint)
        // } catch (e) { console.log(`initializeSizesLegend failed with ${e} `) }
        // try {
        initializeShapesLegend(viewpoint)
        // } catch (e) { console.log(`initializeShapesLegend failed with ${e} `) }

        try {
            initializeColorsLegend(viewpoint)
        } catch (e) { console.log(`initializeColorsLegend failed with ${e} `) }

    }

    if (!viewpoint.blipDisplaySettings?.hasOwnProperty("blipScaleFactor") || viewpoint.blipDisplaySettings?.blipScaleFactor == null) {
        if (viewpoint.blipDisplaySettings == null) { viewpoint.blipDisplaySettings = {} }
        viewpoint.blipDisplaySettings.blipScaleFactor = 1
    }
    if (!viewpoint.blipDisplaySettings.hasOwnProperty("tagFilter") || viewpoint.blipDisplaySettings?.tagFilter == null
        || !(Array.isArray(viewpoint.blipDisplaySettings.tagFilter))) {
        viewpoint.blipDisplaySettings.tagFilter = []
    }
}

function initializeRadar(config) {
    const svg = d3.select(`svg#${config.svg_id}`)
        .style("background-color", config.colors.background)
        .attr("width", config.width)
        .attr("height", config.height)
    if (svg.node().firstChild) {
        svg.node().removeChild(svg.node().firstChild)
    }
    const radar = svg.append("g").attr("id", "radar");
    radar.attr("transform", `translate(${config.width / 2},${config.height / 2}) `);
    return radar;
}


const sectorExpansionFactor = (config) => {
    const totalAvailableAngle = parseFloat(config.sectorsConfiguration.totalAngle ?? 1)
    const initialAngle = parseFloat(config.sectorsConfiguration.initialAngle ?? 0)

    // factor to multiply each angle with - derived from the sum of angles of all visible sectors , calibrated with the total available angle
    const totalVisibleSectorsAngleSum = config.sectorsConfiguration.sectors.reduce((sum, sector) =>
        sum + (sector?.visible != false ? parseFloat(sector.angle) : 0), 0)
    const expansionFactor = parseFloat((totalAvailableAngle - initialAngle) * (totalVisibleSectorsAngleSum == 0 ? 1 : (1 / totalVisibleSectorsAngleSum)))
    console.log(`expansionFactor ${expansionFactor}`)
    return expansionFactor
}

const ringExpansionFactor = (config) => {
    // factor to multiply each witdh with - derived from the sum of widths of all visible rings , calibrated with the total available ring width
    const totalVisibleRingsWidthSum = config.ringsConfiguration.rings.reduce((sum, ring) =>
        sum + (ring?.visible != false ? parseFloat(ring.width) : 0), 0)
    return totalVisibleRingsWidthSum == 0 ? 1 : 1 / totalVisibleRingsWidthSum
}

const drawSectors = function (radar, config, elementDecorator = null) {

    const sectorCanvas = radar.append("g").attr("id", "sectorCanvas")
    .on('contextmenu', (e) => {
        console.log(`${e.pageX}, ${e.pageY}`);
        e.preventDefault();    
    })

    // sectorCanvas.append("line") //horizontal sector boundary
    //     .attr("x1", 0).attr("y1", 0)
    //     .attr("x2", config.sectorBoundariesExtended ? 2000 : config.maxRingRadius)
    //     .attr("y2", 0)
    //     .style("stroke", config.colors.grid)
    //     .style("stroke-width", 1);
    const initialAngle = parseFloat(config.sectorsConfiguration.initialAngle ?? 0)
    const sectorExpansionFctr = sectorExpansionFactor(config)
    for (let layer = 0; layer < 2; layer++) { // TODO if not edit mode then only one layer
        let currentAnglePercentage = initialAngle
        for (let i = 0; i < config.sectorsConfiguration.sectors.length; i++) {
            let sector = config.sectorsConfiguration.sectors[i]
            if (sector?.visible == false) continue;
            const sectorAnglePercentage = sectorExpansionFctr * sector.angle
            // console.log(`sector ${i} sector.angle ${sector.angle} actually allotted ${sectorAnglePercentage}; current angle % = ${currentAnglePercentage}`)
            let currentAngle = 2 * Math.PI * currentAnglePercentage
            const sectorEndpoint = cartesianFromPolar({ r: config.sectorBoundariesExtended ? 2000 : config.maxRingRadius, phi: currentAngle })
            let startAngle = (0.5 - 2 * (currentAnglePercentage + sectorAnglePercentage)) * Math.PI
            let endAngle = (0.5 - 2 * currentAnglePercentage) * Math.PI
            currentAnglePercentage += sectorAnglePercentage


            // .startAngle(((0.5 - 2 *  sectorExpansionFactor(config)) * Math.PI))
            // .endAngle(( 0.5 - 2 * initialAngle) * Math.PI)  

            if (layer == 0) {
                // using angle and maxring radius, determine x and y for endpoint of line, then draw line
                // sectorCanvas.append("line")
                //     .attr("x1", 0).attr("y1", 0)
                //     .attr("x2", sectorEndpoint.x).attr("y2", - sectorEndpoint.y)
                //     .style("stroke", config.colors.grid)
                //     .style("stroke-width", 4);

                const sectorArc = d3.arc()
                    .outerRadius(config.maxRingRadius)
                    .innerRadius(1) // bull's eye - how big should it be?
                    // startAngle and endAngle are measured clockwise from the 12 o’clock in radians; the minus takes care of anti-clockwise and the +0.5 is for starting at the horizontal axis pointing east
                    .startAngle(startAngle)
                    .endAngle(endAngle)
                sectorCanvas.append("path")
                    .attr("id", `piePiece${i}`)
                    .attr("d", sectorArc)
                    .style("fill", sector.backgroundColor ?? color_white)
                    .attr("opacity", sector.opacity != null ? sector.opacity : 0.6)
                    // define borders of sectors
                    .style("stroke", ("sectors" == config.topLayer && getState().selectedSector == i && getState().editMode) ? "red"
                        : sector?.edge?.color ?? config.sectorsConfiguration?.stroke?.strokeColor ?? "#000")
                    .style("stroke-width", ("sectors" == config.topLayer && getState().selectedSector == i && getState().editMode) ? 8
                        : sector?.edge?.width ?? config.sectorsConfiguration?.stroke?.strokeWidth ?? 3
                    )
                    .style("stroke-dasharray", ("sectors" == config.topLayer && getState().selectedSector == i && getState().editMode) ? "" : config.sectorsConfiguration?.stroke?.strokeArray ?? "#000")
                    .on('click', () => { const sector = i; publishRadarEvent({ type: "sectorClick", sector: i }) })
                    .on('dblclick', () => { const sector = i; publishRadarEvent({ type: "sectorDblClick", sector: i }) })

                    .on('contextmenu', (e) => {
                        console.log(`context menu on sector sector${i}`)
                        e.preventDefault()
                        sectorAndRingMenu(e.pageX, e.pageY, i, null, config);
        
                    })

                    // add color to the sector area outside the outer ring
                const outerringArc = d3.arc()
                    .outerRadius(config.maxRingRadius * 4)
                    .innerRadius(config.maxRingRadius)
                    .startAngle(startAngle)
                    .endAngle(endAngle)
                sectorCanvas.append("path")
                    .attr("id", `outerring${i}`)
                    .attr("d", outerringArc)
                    .style("fill", sector?.outerringBackgroundColor ?? "white")

                    .on('dblclick', () => { const sector = i; publishRadarEvent({ type: "sectorDblClick", sector: i }) })

                if (sector?.labelSettings?.showCurved ?? (config?.sectorsConfiguration?.showEdgeSectorLabels)) {
                    // print sector label along the edge of the arc
                    displaySectorLabel(currentAnglePercentage, startAngle, endAngle, sectorCanvas, i, sector, config, elementDecorator)
                }
            }

            // TODO make sure that background images are printed after and therefore on top of all sectors    
            if (layer == 1) {
                if (sector?.backgroundImage?.image != null) {
                    sectorCanvas.append('image')
                        .attr("id", `sectorBackgroundImage${i}`)
                        .attr('xlink:href', sector.backgroundImage.image)
                        .attr('width', 100)
                        .attr("transform", `translate(${sector.backgroundImage.x ?? 100},${sector.backgroundImage.y ?? 100}) scale(${sector.backgroundImage?.scaleFactor ?? 1}) `)
                        .attr("class", "draggable")

                }
                if (sector?.labelSettings?.showStraight ?? (config?.sectorsConfiguration?.showRegularSectorLabels)) {
                    // print horizontal sector label in the sector
                    const labelCoordinates = cartesianFromPolar({ phi: 2 * (1 - (currentAnglePercentage - 0.05)) * Math.PI, r: config.maxRingRadius * 1.2 })
                    const sectorLabel = sectorCanvas.append("text")
                        .attr("id", `sectorLabel${i}`)
                        .text(sector.label)
                        .attr("y", sector.y != null ? sector.y : labelCoordinates.y)
                        .attr("x", sector.x != null ? sector.x : labelCoordinates.x)
                        .attr("text-anchor", "middle")
                        .style("user-select", "none")
                        .attr("class", getState().editMode ? "draggable" : "")
                        .on('dblclick', () => { console(`sector drilldown`); publishRadarEvent({ type: "sectorDrilldown", sector: i }) }) // facilitate drilldown on sector
                        .call(elementDecorator ? elementDecorator : () => { }, [`svg#${config.svg_id}`, sector.label, `sectorLabel${i}`])

                    styleText(sectorLabel, sector.labelSettings, config, config.sectorsConfiguration)
                }



                if ("sectors" == config.topLayer && getState().editMode) {
                    // draw sector knob at the outer ring edge, on the sector boundaries
                    const sectorKnobPoint = cartesianFromPolar({ r: config.maxRingRadius, phi: currentAngle })
                    sectorCanvas.append("circle")
                        .attr("id", `sectorKnob${i}`)
                        .attr("cx", sectorKnobPoint.x)
                        .attr("cy", -sectorKnobPoint.y)
                        .attr("r", 15)
                        .style("fill", "red")
                        .attr("opacity", 1)
                        .style("stroke", "#000")
                        .style("stroke-width", 7)
                        .attr("class", "draggable")
                }
            }
        }
    }//layers
    return sectorCanvas
}

const drawRings = function (radar, config) {

    const ringCanvas = radar.append("g").attr("id", "ringCanvas")
    const totalRingPercentage = config.ringsConfiguration.rings.reduce((sum, ring) => { return sum + (ring?.visible != false ? ring.width : 0) }, 0)
    const initialAngle = config.sectorsConfiguration.initialAngle ?? 0
    const totalRadarAngle = config.sectorsConfiguration.totalAngle ?? 1
    // const totalSectorPercentage =config.sectorsConfiguration.sectors.reduce((sum, sector) => { return sum + ((sector?.visible != false) ? sector.angle : 0) }, initialAngle)  
    // 
    let currentRadiusPercentage = totalRingPercentage * ringExpansionFactor(config)
    for (let i = 0; i < config.ringsConfiguration.rings.length; i++) {
        let ring = config.ringsConfiguration.rings[i]
        if (ring?.visible == false) continue;

        let currentRadius = currentRadiusPercentage * config.maxRingRadius  //TODO cater for sector expansion / hidden sectors/ sectors total area

        const ringArc = d3.arc()
            .outerRadius(config.maxRingRadius * currentRadiusPercentage)
            .innerRadius(config.maxRingRadius * (currentRadiusPercentage - ring.width * ringExpansionFactor(config)))
            .startAngle(((0.5 - 2 * totalRadarAngle) * Math.PI))
            .endAngle((0.5 - 2 * initialAngle) * Math.PI)
        // -1.5 tot 0.5   van 0.5 - 2* total % tot 0.5 - 2* 0 
        ringCanvas.append("path")
            .attr("id", `ring${i}`)
            .attr("d", ringArc)
            .style("fill", ring.backgroundColor != null ? ring.backgroundColor : color_white)
            .attr("opacity", ring.opacity != null ? ring.opacity : 0.6)
            // define borders of rings
            .style("stroke", ("rings" == config.topLayer && getState().selectedRing == i && getState().editMode) ? "red" : config.ringsConfiguration?.stroke?.strokeColor ?? "#000")
            .style("stroke-width", ("rings" == config.topLayer && getState().selectedRing == i && getState().editMode) ? 6 : config.ringsConfiguration?.stroke?.strokeWidth ?? 2)
            .style("stroke-dasharray", ("rings" == config.topLayer && getState().selectedRing == i && getState().editMode) ? "" : config.ringsConfiguration?.stroke?.strokeArray ?? "9 1")
            .on('click', () => { const ring = i; publishRadarEvent({ type: "ringClick", ring: i }) })
            .on('dblclick', () => { console.log(`dbl click on ring`); const sectorring = i; publishRadarEvent({ type: "ringDblClick", ring: i }) })
            .on('contextmenu', (e) => {
                console.log(`context menu on ring ring${i}`)
                e.preventDefault()
                sectorAndRingMenu(e.pageX, e.pageY, null, i,config);
                
            })

        if (ring.backgroundImage && ring.backgroundImage.image) {
            ringCanvas.append('image')
                .attr("id", `ringBackgroundImage${i}`)
                .attr('xlink:href', ring.backgroundImage.image)
                .attr('width', 100)
                .attr("transform", "translate(100,100)")
                .attr("class", "draggable")
        }
        if (getState().editMode && "rings" == config.topLayer) {
            // draw ring knob at the out edge, horizontal axis
            ringCanvas.append("circle")
                .attr("id", `ringKnob${i}`)
                .attr("cx", config.maxRingRadius * currentRadiusPercentage)
                .attr("cy", 0)
                .attr("r", 15)
                .style("fill", "red")
                .attr("opacity", 1)
                .style("stroke", "#000")
                .style("stroke-width", 7)
                .attr("class", "draggable")
        }

        currentRadiusPercentage = currentRadiusPercentage - ring.width * ringExpansionFactor(config)
    }
    return ringCanvas
}


const drawRingLabels = function (radar, config, elementDecorator) {
    const totalRingPercentage = config.ringsConfiguration.rings.reduce((sum, ring) => { return sum + (ring?.visible != false ? ring.width : 0) }, 0)
    let currentRadiusPercentage = totalRingPercentage * ringExpansionFactor(config)
    for (let i = 0; i < config.ringsConfiguration.rings.length; i++) {
        let ring = config.ringsConfiguration.rings[i]
        if (ring?.visible == false) continue;
        let currentRadius = currentRadiusPercentage * config.maxRingRadius
        const ringlabel = radar.append("text")
            .attr("id", `ringLabel${i}`)
            .text(ring.label)
            .attr("y", ring.y != null ? ring.y : -currentRadius + 35) // 35 under the ring edge
            .attr("x", ring.x != null ? ring.x : 0) // 35 under the ring edge
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .attr("class", getState().editMode ? "draggable" : "")
            .on('dblclick', () => { console.log(`dbl click on ring`); publishRadarEvent({ type: "ringDrilldown", ring: i }) })

            .call(elementDecorator ? elementDecorator : () => { }, [`svg#${config.svg_id}`, ring.label, `ringLabel${i}`]);
        styleText(ringlabel, ring.labelSettings, config, config.ringsConfiguration)

        currentRadiusPercentage = currentRadiusPercentage - ring.width * ringExpansionFactor(config)
    }
}



function displaySectorLabel(currentAnglePercentage, startAngle, endAngle, sectorCanvas, sectorIndex, sector, config, elementDecorator = null) {
    let sum = startAngle / (2 * Math.PI) + 0.2
    let anticlockwise = sum < 0
    // if startAngle - endAngle < -6.20  => sector has entire circle 
    let fullCircle = startAngle - endAngle < -6.20

    let textArc = d3.arc()
        .outerRadius(config.maxRingRadius + 20)
        .innerRadius(150)
        // startAngle and endAngle are measured clockwise from the 12 o’clock in radians; the minus takes care of anti-clockwise and the +0.5 is for starting at the horizontal axis pointing east
        .endAngle(anticlockwise ? startAngle : endAngle)
        .startAngle(anticlockwise ? endAngle : startAngle)

    if (fullCircle) {
        textArc = d3.arc()
            .outerRadius(config.maxRingRadius + 20)
            .innerRadius(150)
            // startAngle and endAngle are measured clockwise from the 12 o’clock in radians; the minus takes care of anti-clockwise and the +0.5 is for starting at the horizontal axis pointing east
            // this fixed angle corresponds to 2 'o clock
            .endAngle(1.5)
            .startAngle(-0.2)
    }

    textArc = textArc().substring(0, textArc().indexOf("L"))
    // create the path following the circle along which the text is printed; the actual printing of the text is done next
    sectorCanvas.append("path")
        .attr("id", `pieText${sectorIndex}`)
        .attr("d", textArc)
        .attr("opacity", 0.0)

    const textPaths = sectorCanvas.append("g").attr('class', 'textPaths')
    const sectorLabel = textPaths.append("text")
        .attr("id", `sectorLabel${sectorIndex}`)
        .attr("dy", 10)
        .attr("dx", 45)
    styleText(sectorLabel, sector.labelSettings, config, config.sectorsConfiguration)

    sectorLabel.append("textPath")

        .attr("startOffset", "40%")
        .style("text-anchor", "middle")
        .attr("xlink:href", `#pieText${sectorIndex}`)
        .text(`${sector.label}`)
        .on('dblclick', () => { console.log(`sector drilldown on sector${sectorIndex}`); publishRadarEvent({ type: "sectorDrilldown", sector: sectorIndex }) }) // facilitate drilldown on sector

     
        .call(elementDecorator ? elementDecorator : () => { }, [`svg#${config.svg_id}`, sector.label, `sectorLabel${sectorIndex}`]);

}

const initializeSizesLegend = (viewpoint) => {
    const config = viewpoint.template
    document.getElementById('sizesLegendTitle').innerText = "";


    const sizesBox = d3.select("svg#sizesLegend")
        .style("background-color", "silver")
        .attr("width", "1%")
        .attr("height", 1)

    sizesBox.selectAll("*").remove(); // clean content (if there is any)

    if (viewpoint.propertyVisualMaps.size?.property == null
        || viewpoint.propertyVisualMaps.size.property == ""
        || viewpoint.propertyVisualMaps.size.valueMap == null
        || Object.keys(viewpoint.propertyVisualMaps.size.valueMap).length == 0) {
        return
    }

    const numberOfVisibleSizes = config.sizesConfiguration.sizes.filter((size) => !(size.visible == false)).length
    sizesBox
        .style("background-color", "silver")
        .attr("width", "80%")
        .attr("height", numberOfVisibleSizes * 55 + 20) 
        .on("dblclick", (e) => {
            publishRadarEvent({ type: "mainRadarConfigurator", tab:"size" })
        })

    sizesBox.append('g').attr('class', 'sizesBox')
    const legendTitle = config.sizesConfiguration.label ?? viewpoint.propertyVisualMaps.size.property
    document.getElementById('sizesLegendTitle').innerText = legendTitle;
    const circleIndent = 10
    const labelIndent = 70

    let displayedSizesCounter = 0
    for (let i = 0; i < config.sizesConfiguration.sizes.length; i++) {
        if (config.sizesConfiguration.sizes[i].visible == false) continue // skip invisible sizes
        const scaleFactor = config.sizesConfiguration.sizes[i].size
        const label = config.sizesConfiguration.sizes[i].label

        const sizeEntry = sizesBox.append('g')
            .attr("transform", `translate(${circleIndent + 20}, ${30 + displayedSizesCounter * 55})`)

            .append('circle')
            .attr("id", `templateSizes${i}`)
            .attr("r", 12)
            .attr("fill", "black")
            .attr("transform", `scale(${scaleFactor})`)

        sizesBox.append("text")
            .attr("id", `sizeLabel${i}`)
            .text(label)
            .attr("x", labelIndent)
            .attr("y", 42 + displayedSizesCounter * 55)
            .style("fill", "#e5e5e5")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "25px")
            .style("font-weight", "bold")

            displayedSizesCounter++
    }
}



const initializeShapesLegend = (viewpoint) => {

    const config = viewpoint.template
    document.getElementById('shapesLegendTitle').innerText = "";


    const shapesBox = d3.select("svg#shapesLegend")
        .style("background-color", "silver")
        .attr("width", "1%")
        .attr("height", 1)

    shapesBox.selectAll("*").remove(); // clean content (if there is any)

    
    if (viewpoint.propertyVisualMaps.shape?.property == null
        || viewpoint.propertyVisualMaps.shape.property == ""
        || viewpoint.propertyVisualMaps.shape.valueMap == null
        || Object.keys(viewpoint.propertyVisualMaps.shape.valueMap).length == 0) {
        return
    }
    const numberOfVisibleShapes = config.shapesConfiguration.shapes.filter((shape) => !(shape.visible == false)).length

    shapesBox
        .style("background-color", "#FEE")
        .attr("width", "80%")
        .attr("height", numberOfVisibleShapes * 45 + 20)
        .on("dblclick", (e) => {
            console.log(`shapesBox was clicked`)
            publishRadarEvent({ type: "mainRadarConfigurator", tab:"shape" })
        })
        

    shapesBox.append('g').attr('class', 'shapesBox')

    const legendTitle = config.shapesConfiguration.label ?? viewpoint.propertyVisualMaps.shape.property
    document.getElementById('shapesLegendTitle').innerText = legendTitle;

    const circleIndent = 5
    const labelIndent = 50
    let displayedShapesCounter = 0
    for (let i = 0; i < config.shapesConfiguration.shapes.length; i++) {
        if (config.shapesConfiguration.shapes[i].visible == false) continue // skip invisible shapes
        const shapeToDraw = config.shapesConfiguration.shapes[i].shape
        const label = config.shapesConfiguration.shapes[i].label

    // for (let i = 0; i < Object.keys(viewpoint.propertyVisualMaps.shape.valueMap).length; i++) {
    //     const key = Object.keys(viewpoint.propertyVisualMaps.shape.valueMap)[i]
    //     const vm = viewpoint.propertyVisualMaps.shape.valueMap[key]
    //     const shapeToDraw = config.shapesConfiguration.shapes[viewpoint.propertyVisualMaps.shape.valueMap[key]].shape
    //     const label = config.shapesConfiguration.shapes[viewpoint.propertyVisualMaps.shape.valueMap[key]].label

        shapesBox.append("text")
            .attr("id", `shapeLabel${i}`)
            .text(label)
            .attr("x", labelIndent)
            .attr("y", 38 + displayedShapesCounter * 45)
            .style("fill", "#000")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "18px")
            .style("font-weight", "normal")

        const shapeEntry = shapesBox.append('g')
            .attr("transform", `translate(${circleIndent + 20}, ${30 + displayedShapesCounter * 45})`)
            .attr("id", `templateShapes${i}`)
        // .append('circle')
        // .attr("r", 12)
        // .attr("fill", "black")

        let shape

        if (shapeToDraw == "circle") {
            shape = shapeEntry.append("circle")
                .attr("r", 12)
        }
        if (shapeToDraw == "diamond") {
            const diamond = d3.symbol().type(d3.symbolDiamond).size(500);
            shape = shapeEntry.append('path').attr("d", diamond)
        }
        if (shapeToDraw == "square") {
            const square = d3.symbol().type(d3.symbolSquare).size(500);
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
        if (shape==null) {
           console.log(`handled exception in shapes legend - shape ${shapeToDraw} cannot be drawn`)            
           continue
        }
        shape.attr("fill", "#000");
        shape.attr("opacity", "0.9");
        displayedShapesCounter++

    }
}

const initializeColorsLegend = (viewpoint) => {


    const config = viewpoint.template

    const colorsBox = d3.select("svg#colorsLegend")
        .style("background-color", "silver")
        .attr("width", "1%")
        .attr("height", 1)

    colorsBox.selectAll("*").remove(); // clean content (if there is any)
    document.getElementById('colorLegendTitle').innerText = "";

    if (viewpoint.propertyVisualMaps.color?.property == null
        || viewpoint.propertyVisualMaps.color.property == ""
        || viewpoint.propertyVisualMaps.color.valueMap == null
        || Object.keys(viewpoint.propertyVisualMaps.color.valueMap).length == 0) {
        return
    }
    const numberOfVisibleColors = config.colorsConfiguration.colors.filter((color) => !(color.visible == false)).length

    colorsBox
        .style("background-color", "#EFF")
        .attr("width", "80%")
        .attr("height", numberOfVisibleColors * 45 + 20)
        .on("dblclick", (e) => {
            publishRadarEvent({ type: "mainRadarConfigurator", tab:"color" })
        })

    document.getElementById('colorLegendTitle').innerText = config.colorsConfiguration.label;
    colorsBox.append('g').attr('class', 'colorsBox')
    const circleIndent = 5
    const labelIndent = 50
    let displayedColorsCounter = 0

    for (let i = 0; i < config.colorsConfiguration.colors.length; i++) {
        if (config.colorsConfiguration.colors[i].visible == false) continue // skip invisible colors
        const colorToShow = config.colorsConfiguration.colors[i].color
        const label = config.colorsConfiguration.colors[i].label
        const colorEntry = colorsBox.append('g')
            .attr("transform", `translate(${circleIndent + 20}, ${30 + displayedColorsCounter * 45})`)

            .append('circle')
            .attr("id", `templatecolors${i}`)
            .attr("r", 12)
            .attr("fill", colorToShow)

        colorsBox.append("text")
            .attr("id", `colorLabel${i}`)
            .text(label)
            .attr("x", labelIndent)
            .attr("y", 38 + displayedColorsCounter * 45)
            .style("fill", "#000")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "18px")
            .style("font-weight", "normal")
            displayedColorsCounter++
    }
}

const createRadarContextMenu = (e, d, blip, viewpoint) => {
    radarMenu(e.pageX, e.pageY, d, blip, viewpoint);
    e.preventDefault();
}


const radarMenu = (x, y, d, blip, viewpoint) => {
    const config = viewpoint.template
    d3.select('.radar-context-menu').remove(); // if already showing, get rid of it.

    const contextMenu = d3.select(`svg#${config.svg_id}`)
        .append('g').attr('class', 'radar-context-menu')
        .attr('transform', `translate(${x},${y + 30})`)


    const width = 170
    const height = 130
    contextMenu.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'rect')
        .attr("style", "fill:lightgray;")
        .style("opacity", 0.8)
        .on("mouseout", (e) => {

            // check x and y - to see whether they are really outside context menu area (mouse out also fires when mouse is on elements inside context menu)
            const deltaX = x - e.pageX
            const deltaY = y - e.pageY
            if (((deltaX > 0) || (deltaX <= - width) || (deltaY > 0) || (deltaY <= - height))
            ) {
                d3.select('.radar-context-menu').remove();
            }
        })

    const initialColumnIndent = 10
    const menuOptions = contextMenu.append('g')
        .attr('class', 'sizesBox')
        .attr("transform", `translate(${initialColumnIndent}, ${20})`)

    menuOptions.append("text")
        .text(`Create Blip[s]`)
        .style("fill", "blue")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .on("click", (e) => {
            console.log(`Create Blip was clicked`)
            d3.select('.radar-context-menu').remove();
            // create blip
            publishRadarEvent({ type: "blipCreation" })
        })
    menuOptions.append("text")
        .text(`Edit Default Settings`)
        .attr("transform", `translate(0, ${25})`)
        .style("fill", "blue")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .on("click", (e) => {
            console.log(`Edit Default Blip Settings was clicked`)
            d3.select('.radar-context-menu').remove();
            // create blip
            publishRadarEvent({ type: "editBlipDefaults" })
        })
    menuOptions.append("text")
        .text(`Shuffle Blips`)
        .attr("transform", `translate(0, ${50})`)
        .style("fill", "blue")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .on("click", (e) => {
            console.log(`Shuffle Blips`)
            d3.select('.radar-context-menu').remove();
            // create blip
            publishRadarEvent({ type: "shuffleBlips" })
        })

    menuOptions.append("text")
        .text(`Radar Configurator`)
        .attr("transform", `translate(0, ${75})`)
        .style("fill", "blue")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .on("click", (e) => {
            console.log(`Radar Config`)
            d3.select('.radar-context-menu').remove();
            // create blip
            publishRadarEvent({ type: "mainRadarConfigurator" })
        })

}


const sectorAndRingMenu = (x, y, sector, ring, config ) => {
    d3.select('.radar-context-menu').remove(); // if already showing, get rid of it.

    const contextMenu = d3.select(`svg#radarSVGContainer`)
        .append('g').attr('class', 'radar-context-menu')
        .attr('transform', `translate(${x},${y + 30})`)


    const width = 170
    const height = 130
    contextMenu.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'rect')
        .attr("style", "fill:lightgray;")
        .style("opacity", 0.8)
        .on("mouseout", (e) => {

            // check x and y - to see whether they are really outside context menu area (mouse out also fires when mouse is on elements inside context menu)
            const deltaX = x - e.pageX
            const deltaY = y - e.pageY
            if (((deltaX > 0) || (deltaX <= - width) || (deltaY > 0) || (deltaY <= - height))
            ) {
                d3.select('.radar-context-menu').remove();
            }
        })

    const initialColumnIndent = 10
    const menuOptions = contextMenu.append('g')
        .attr('class', 'sizesBox')
        .attr("transform", `translate(${initialColumnIndent}, ${20})`)

    menuOptions.append("text")
        .text(`Create Blip`)
        .style("fill", "blue")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .on("click", (e) => {
            console.log(`Create Blip was clicked`)
            d3.select('.radar-context-menu').remove();
            // create blip
            // TODO turn x,y position into segment and pass sector and ring to blip editor
            const polar = polarFromCartesian({x:x - config.width / 2,y:y - config.height/2})
            if (polar.phi < 0 ) {polar.phi += 2* Math.PI}
            const blipDrawingContext = prepareBlipDrawingContext()
            // find segment for polar coordinates; note: if polar.phi < 0, then add 2*Math.PI??
            let clickSector = -1
            let clickRing = -1
            for (let s=0;s<blipDrawingContext.segmentMatrix.length; s++) {
                 let polarPhi = polar.phi
                 let endPhi = blipDrawingContext.segmentMatrix[s][0].endPhi
                 if ( polarPhi > endPhi ) {
                    clickSector = s
                    break
                 }
            }
            for (let r=0;r<blipDrawingContext.segmentMatrix[0].length; r++) {
                let polarR = polar.r
                let endR = blipDrawingContext.segmentMatrix[0][r].endR
                if ( polarR > endR ) {
                   clickRing = r
                   break
                }
           }

            publishRadarEvent({ type: "blipCreation",segment:{sector:clickSector, ring:clickRing} })
        })
    menuOptions.append("text")
        .text(`Drill Down Segment`)
        .attr("transform", `translate(0, ${25})`)
        .style("fill", "blue")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .on("click", (e) => {
            console.log(`Drill down on segment`)
            d3.select('.radar-context-menu').remove();
            // create blip
            publishRadarEvent({ type: "drillDownSegment" })
        })
    // menuOptions.append("text")
    //     .text(`Shuffle Blips`)
    //     .attr("transform", `translate(0, ${50})`)
    //     .style("fill", "blue")
    //     .style("font-family", "Arial, Helvetica")
    //     .style("font-size", "15px")
    //     .style("font-weight", "bold")
    //     .on("click", (e) => {
    //         console.log(`Shuffle Blips`)
    //         d3.select('.radar-context-menu').remove();
    //         // create blip
    //         publishRadarEvent({ type: "shuffleBlips" })
    //     })

    // menuOptions.append("text")
    //     .text(`Radar Configurator`)
    //     .attr("transform", `translate(0, ${75})`)
    //     .style("fill", "blue")
    //     .style("font-family", "Arial, Helvetica")
    //     .style("font-size", "15px")
    //     .style("font-weight", "bold")
    //     .on("click", (e) => {
    //         console.log(`Radar Config`)
    //         d3.select('.radar-context-menu').remove();
    //         // create blip
    //         publishRadarEvent({ type: "mainRadarConfigurator" })
    //     })

}