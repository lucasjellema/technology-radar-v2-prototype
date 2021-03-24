import { cartesianFromPolar, polarFromCartesian } from './drawingUtilities.js'
import {getState, getConfiguration} from './data.js'
export { drawRadar, subscribeToRadarEvents }

const color_white = "#FFF"

const subscribers = []
const subscribeToRadarEvents = (subscriber) => { subscribers.push(subscriber) }
const publishRadarEvent = (event) => { subscribers.forEach((subscriber) => { subscriber(event) }) }

const styleText = (textElement, configNode, config, alternativeFontSource = null) => {
    const fontStyleElements = [{ style: "fill", property: "color" }, { style: "font-size", property: "fontSize" }
        , { style: "font-family", property: "fontFamily" }, { style: "font-weight", property: "fontWeight" }
        , { style: "font-style", property: "fontStyle" }
    ]
    fontStyleElements.forEach((fontStyleElement) => {
        try {
            let styleProperty = (configNode?.font?.[fontStyleElement.property] ?? alternativeFontSource?.font?.[fontStyleElement.property]) ?? config.defaultFont[fontStyleElement.property]
            textElement
                .style(fontStyleElement.style
                    , styleProperty
                )
        } catch (e) { console.log(`Exception in styleText for ${JSON.stringify(fontStyleElement)} applied to ${JSON.stringify(textElement)}`) }
    })
}

function drawRadar(viewpoint, elementDecorator = null) {
    const config =  getConfiguration()
    const radar = initializeRadar(config)
    const radarCanvas = radar.append("g")
        .attr("id", "radarCanvas")

    let sectorCanvas, ringCanvas
    if ("sectors" == config.topLayer) { // draw top layer last 
        ringCanvas = drawRings(radarCanvas, config)
        sectorCanvas = drawSectors(radarCanvas, config, elementDecorator)
    }
    else {
        sectorCanvas = drawSectors(radarCanvas, config, elementDecorator)
        ringCanvas = drawRings(radarCanvas, config)
    }
    //rotation only on sectors - not on rings
    sectorCanvas.attr("transform", `rotate(${-360 * config.rotation})`) // clockwise rotation
    drawRingLabels(radar, config, elementDecorator)
    const title = config.title.text
    const titleElement = radar.append("text")
        .attr("transform", `translate(${config.title.x != null ? config.title.x : -500}, ${config.title.y != null ? config.title.y : -400})`)
        .text(title)
        // .attr("class", "draggable")
        .on('contextmenu', (e, d) => {
            createRadarContextMenu(e, d, this, viewpoint);
        })
        .call(elementDecorator ? elementDecorator : () => { }, [`svg#${config.svg_id}`, config.title.text, `title`])
    styleText(titleElement, config.title, config)

    if (!getState().editMode) {
    // legend
    initializeSizesLegend(viewpoint)
    initializeShapesLegend(viewpoint)
    initializeColorsLegend(viewpoint)
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



const drawSectors = function (radar, config, elementDecorator = null) {

    const sectorCanvas = radar.append("g").attr("id", "sectorCanvas")

    sectorCanvas.append("line") //horizontal sector boundary
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", config.sectorBoundariesExtended ? 2000 : config.maxRingRadius)
        .attr("y2", 0)
        .style("stroke", config.colors.grid)
        .style("stroke-width", 3);

    for (let layer = 0; layer < 2; layer++) { // TODO if not edit mode then only one layer
        let currentAnglePercentage = 0
        for (let i = 0; i < config.sectorConfiguration.sectors.length; i++) {
            let sector = config.sectorConfiguration.sectors[i]
            currentAnglePercentage = currentAnglePercentage + sector.angle
            let currentAngle = 2 * Math.PI * currentAnglePercentage
            const sectorEndpoint = cartesianFromPolar({ r: config.sectorBoundariesExtended ? 2000 : config.maxRingRadius, phi: currentAngle })

            let startAngle = (- 2 * (currentAnglePercentage - sector.angle) + 0.5) * Math.PI
            let endAngle = (- 2 * currentAnglePercentage + 0.5) * Math.PI
            if (layer == 0) {
                // using angle and maxring radius, determine x and y for endpoint of line, then draw line
                sectorCanvas.append("line")
                    .attr("x1", 0).attr("y1", 0)
                    .attr("x2", sectorEndpoint.x).attr("y2", - sectorEndpoint.y)
                    .style("stroke", config.colors.grid)
                    .style("stroke-width", 4);

                const sectorArc = d3.arc()
                    .outerRadius(config.maxRingRadius)
                    .innerRadius(15)
                    // startAngle and endAngle are measured clockwise from the 12 o’clock in radians; the minus takes care of anti-clockwise and the +0.5 is for starting at the horizontal axis pointing east
                    .startAngle(startAngle)
                    .endAngle(endAngle)
                sectorCanvas.append("path")
                    .attr("id", `piePiece${i}`)
                    .attr("d", sectorArc)
                    .style("fill", sector.backgroundColor != null ? sector.backgroundColor : color_white)
                    .attr("opacity", sector.opacity != null ? sector.opacity : 0.6)
                    // define borders of sectors
                    .style("stroke", ("sectors" == config.topLayer && getState().selectedSector == i && getState().editMode) ? "red" : config.sectorConfiguration?.stroke?.strokeColor ?? "#000")
                    .style("stroke-width", ("sectors" == config.topLayer && getState().selectedSector == i && getState().editMode) ? 8 : config.sectorConfiguration?.stroke?.strokeWidth ?? 3)
                    .style("stroke-dasharray", ("sectors" == config.topLayer && getState().selectedSector == i && getState().editMode) ? "" : config.sectorConfiguration?.stroke?.strokeArray ?? "#000")
                    .on('click', () => { const sector = i; publishRadarEvent({ type: "sectorClick", sector: i }) })
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

                // print sector label along the edge of the arc
                displaySectorLabel(currentAnglePercentage, startAngle, endAngle, sectorCanvas, i, sector, config, elementDecorator)

            }
            // TODO make sure that background images are printed after and therefore on top of all sectors    
            if (layer == 1 && sector?.backgroundImage?.image != null) {
                sectorCanvas.append('image')
                    .attr("id", `sectorBackgroundImage${i}`)
                    .attr('xlink:href', sector.backgroundImage.image)
                    .attr('width', 100)
                    .attr("transform", `translate(${sector.backgroundImage.x ?? 100},${sector.backgroundImage.y ?? 100}) scale(${sector.backgroundImage?.scaleFactor ?? 1}) `)
                    .attr("class", "draggable")

            }



            if (layer == 1 && "sectors" == config.topLayer && getState().editMode) {
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
    }//layers
    return sectorCanvas
}


const drawRings = function (radar, config) {
    const ringCanvas = radar.append("g").attr("id", "ringCanvas")
    const totalRingPercentage = config.ringConfiguration.rings.reduce((sum, ring) => { return sum + ring.width }, 0)
    let currentRadiusPercentage = totalRingPercentage
    for (let i = 0; i < config.ringConfiguration.rings.length; i++) {
        let ring = config.ringConfiguration.rings[i]
        let currentRadius = currentRadiusPercentage * config.maxRingRadius

        const ringArc = d3.arc()
            .outerRadius(config.maxRingRadius * currentRadiusPercentage)
            .innerRadius(config.maxRingRadius * (currentRadiusPercentage - ring.width))
            .startAngle(0)
            .endAngle(359)
        ringCanvas.append("path")
            .attr("id", `ring${i}`)
            .attr("d", ringArc)
            .style("fill", ring.backgroundColor != null ? ring.backgroundColor : color_white)
            .attr("opacity", ring.opacity != null ? ring.opacity : 0.6)
            // define borders of rings
            .style("stroke", ("rings" == config.topLayer && getState().selectedRing == i && getState().editMode) ? "red" : config.ringConfiguration?.stroke?.strokeColor ?? "#000")
            .style("stroke-width", ("rings" == config.topLayer && getState().selectedRing == i && getState().editMode) ? 6 : config.ringConfiguration?.stroke?.strokeWidth ?? 2)
            .style("stroke-dasharray", ("rings" == config.topLayer && getState().selectedRing == i && getState().editMode) ? "" : config.ringConfiguration?.stroke?.strokeArray ?? "9 1")
            .on('click', () => { const ring = i; publishRadarEvent({ type: "ringClick", ring: i }) })
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

        currentRadiusPercentage = currentRadiusPercentage - ring.width
    }
    return ringCanvas
}


const drawRingLabels = function (radar, config, elementDecorator) {
    const totalRingPercentage = config.ringConfiguration.rings.reduce((sum, ring) => { return sum + ring.width }, 0)
    let currentRadiusPercentage = totalRingPercentage
    for (let i = 0; i < config.ringConfiguration.rings.length; i++) {
        let ring = config.ringConfiguration.rings[i]
        let currentRadius = currentRadiusPercentage * config.maxRingRadius
        const ringlabel = radar.append("text")
            .attr("id", `ringLabel${i}`)
            .text(ring.label)
            .attr("y", -currentRadius + 35) // 35 under the ring edge
            .attr("text-anchor", "middle")

            //            .style("pointer-events", "none")
            .style("user-select", "none")
            .call(elementDecorator ? elementDecorator : () => { }, [`svg#${config.svg_id}`, ring.label, `ringLabel${i}`]);
        styleText(ringlabel, ring, config, config.ringConfiguration)

        currentRadiusPercentage = currentRadiusPercentage - ring.width
    }
}



function displaySectorLabel(currentAnglePercentage, startAngle, endAngle, sectorCanvas, sectorIndex, sector, config, elementDecorator = null) {
    let textArc = d3.arc()
        .outerRadius(config.maxRingRadius + 30)
        .innerRadius(150)
        // startAngle and endAngle are measured clockwise from the 12 o’clock in radians; the minus takes care of anti-clockwise and the +0.5 is for starting at the horizontal axis pointing east
        // for angle + rotation percentages up to 70%, we flip the text - by sweeping from end to begin
        .endAngle((currentAnglePercentage + config.rotation) % 1 < 0.6 ? startAngle : endAngle)
        .startAngle((currentAnglePercentage + config.rotation) % 1 < 0.6 ? endAngle : startAngle)
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
    styleText(sectorLabel, sector, config, config.sectorConfiguration)

    sectorLabel.append("textPath")

        .attr("startOffset", "40%")
        .style("text-anchor", "middle")
        .attr("xlink:href", `#pieText${sectorIndex}`)
        .text(`${sector.label}`)
        .call(elementDecorator ? elementDecorator : () => { }, [`svg#${config.svg_id}`, sector.label, `sectorLabel${sectorIndex}`]);

}

const initializeSizesLegend = (viewpoint) => {
    const config = viewpoint.template
    document.getElementById('sizesLegendTitle').innerText = config.sizesConfiguration.label;


    const sizesBox = d3.select("svg#sizesLegend")
        .style("background-color", "silver")
        .attr("width", "80%")
        .attr("height", Object.keys(viewpoint.propertyVisualMaps.sizeMap).length * 55 + 20)
    sizesBox.selectAll("*").remove(); // clean content (if there is any)

    sizesBox.append('g').attr('class', 'sizesBox')
    const circleIndent = 10
    const labelIndent = 70
    for (let i = 0; i < Object.keys(viewpoint.propertyVisualMaps.sizeMap).length; i++) {
        const key = Object.keys(viewpoint.propertyVisualMaps.sizeMap)[i]
        const scaleFactor = config.sizesConfiguration.sizes[viewpoint.propertyVisualMaps.sizeMap[key]].size
        const label = config.sizesConfiguration.sizes[viewpoint.propertyVisualMaps.sizeMap[key]].label

        const sizeEntry = sizesBox.append('g')
            .attr("transform", `translate(${circleIndent + 20}, ${30 + i * 55})`)

            .append('circle')
            .attr("id", `templateSizes${i}`)
            .attr("r", 12)
            .attr("fill", "black")
            .attr("transform", `scale(${scaleFactor})`)

        sizesBox.append("text")
            .attr("id", `sizeLabel${i}`)
            .text(label)
            .attr("x", labelIndent)
            .attr("y", 42 + i * 55)
            .style("fill", "#e5e5e5")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "25px")
            .style("font-weight", "bold")


    }
}



const initializeShapesLegend = (viewpoint) => {
    const config = viewpoint.template
    document.getElementById('shapesLegendTitle').innerText = config.shapesConfiguration.label;

    const shapesBox = d3.select("svg#shapesLegend")
        .style("background-color", "#FEE")
        .attr("width", "80%")
        .attr("height", Object.keys(viewpoint.propertyVisualMaps.shapeMap).length * 45 + 20)
    shapesBox.selectAll("*").remove(); // clean content (if there is any)

    shapesBox.append('g').attr('class', 'shapesBox')
    const circleIndent = 5
    const labelIndent = 50
    for (let i = 0; i < Object.keys(viewpoint.propertyVisualMaps.shapeMap).length; i++) {
        const key = Object.keys(viewpoint.propertyVisualMaps.shapeMap)[i]
        const shapeToDraw = config.shapesConfiguration.shapes[viewpoint.propertyVisualMaps.shapeMap[key]].shape
        const label = config.shapesConfiguration.shapes[viewpoint.propertyVisualMaps.shapeMap[key]].label

        shapesBox.append("text")
            .attr("id", `shapeLabel${i}`)
            .text(label)
            .attr("x", labelIndent)
            .attr("y", 38 + i * 45)
            .style("fill", "#000")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "18px")
            .style("font-weight", "normal")

        const shapeEntry = shapesBox.append('g')
            .attr("transform", `translate(${circleIndent + 20}, ${30 + i * 45})`)
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



        shape.attr("fill", "#000");
        shape.attr("opacity", "0.9");

    }
}

const initializeColorsLegend = (viewpoint) => {
    const config = viewpoint.template
    document.getElementById('colorLegendTitle').innerText = config.colorsConfiguration.label;

    const colorsBox = d3.select("svg#colorsLegend")
        .style("background-color", "#EFF")
        .attr("width", "80%")
        .attr("height", Object.keys(viewpoint.propertyVisualMaps.colorMap).length * 45 + 20)
    colorsBox.selectAll("*").remove(); // clean content (if there is any)

    colorsBox.append('g').attr('class', 'colorsBox')
    const circleIndent = 5
    const labelIndent = 50
    for (let i = 0; i < Object.keys(viewpoint.propertyVisualMaps.colorMap).length; i++) {
        const key = Object.keys(viewpoint.propertyVisualMaps.colorMap)[i]
        const colorToShow = config.colorsConfiguration.colors[viewpoint.propertyVisualMaps.colorMap[key]].color
        const label = config.colorsConfiguration.colors[viewpoint.propertyVisualMaps.colorMap[key]].label

        const colorEntry = colorsBox.append('g')
            .attr("transform", `translate(${circleIndent + 20}, ${30 + i * 45})`)

            .append('circle')
            .attr("id", `templatecolors${i}`)
            .attr("r", 12)
            .attr("fill", colorToShow)

        colorsBox.append("text")
            .attr("id", `colorLabel${i}`)
            .text(label)
            .attr("x", labelIndent)
            .attr("y", 38 + i * 45)
            .style("fill", "#000")
            .style("font-family", "Arial, Helvetica")
            .style("font-size", "18px")
            .style("font-weight", "normal")


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
    const width = 100
    const height = 100
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
            console.log(`mouse out ${x}${deltaX}`)
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
            publishRadarEvent({ type: "blipCreation"})
            // enage blip editing ?? via event ? 
            

        })
}