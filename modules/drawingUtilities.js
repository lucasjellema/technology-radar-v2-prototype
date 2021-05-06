export {cartesianFromPolar , polarFromCartesian,segmentFromCartesian, addTooltip, removeTooltip}

  const cartesianFromPolar = function(polar) {
    return {
      x: polar.r * Math.cos(polar.phi),
      y: polar.r * Math.sin(polar.phi)
    }
  }

  const polarFromCartesian = function (cartesian) {
    const x = cartesian.x;
    const y = cartesian.y;
  
    return {
      phi: Math.atan2(y, x),
      r: Math.sqrt(x * x + y * y)
    }
  }

  // const priorSectorsAnglePercentageSum = (sectorId, config) => config.sectorsConfiguration.sectors.filter((sector, index) => index < sectorId)
  // .reduce((sum, sector) =>
  //     sum + (sector?.visible != false ? sector.angle : 0), 0) * sectorExpansionFactor() + parseFloat(currentViewpoint.template.sectorsConfiguration.initialAngle ?? 0)


  const segmentFromCartesian = (cartesian, viewpoint, sectorExpansionFactor=1, ringExpansionFactor=1) => {
    const polar = polarFromCartesian({ x: cartesian.x, y: cartesian.y })
    const dropAnglePercentage = (polar.phi < 0) ? - polar.phi / (2 * Math.PI) : 1 - polar.phi / (2 * Math.PI)
    const dropRadialPercentage = polar.r / viewpoint.template.maxRingRadius
   
    let dropSector
    let segmentAnglePercentage // where in the segment in terms of % of the total angle are these coordinates located
    let angleSum = viewpoint.template.sectorsConfiguration.initialAngle ?? 0
    if (typeof(angleSum)=="string") {angleSum = parseFloat(angleSum)}
    // iterate over sectors until sum of sector angles > anglePercentage    ; the last sector is the dropzone 
    for (let i = 0; i < viewpoint.template.sectorsConfiguration.sectors.length; i++) {
        const currentSectorAngle = ((viewpoint.template.sectorsConfiguration.sectors[i]?.visible != false) ?  viewpoint.template.sectorsConfiguration.sectors[i].angle:0)

        angleSum = angleSum + currentSectorAngle
        if (angleSum * sectorExpansionFactor > dropAnglePercentage) {
            dropSector = i
            segmentAnglePercentage = (dropAnglePercentage - (angleSum - currentSectorAngle) *sectorExpansionFactor)/(sectorExpansionFactor*currentSectorAngle)
            break
        }
    }
    if (dropSector==null) {
      dropSector = viewpoint.template.sectorsConfiguration.sectors.length-1
    }


    // iterate of rings until sum of ring widths > 1- radialPercentage; the last ring is the dropzone
    let segmentWidthPercentage // where in the segment in terms of % of the total width are these coordinates located
    let dropRing

    if (dropRadialPercentage > 1){
      dropRing = -1
      segmentWidthPercentage =   dropRadialPercentage - 1 // distance from outerring relative to radius
           
    }  else {
      let widthSum = 0
    // iterate over rings until sum of ring widths > dropRadialPercentage    ; the last ring is the dropzone 
    for (let i = 0; i < viewpoint.template.ringsConfiguration.rings.length; i++) {
        const currentRingWidth =         ((viewpoint.template.ringsConfiguration.rings[i]?.visible != false) 
        ?  viewpoint.template.ringsConfiguration.rings[i].width:0)

        widthSum = widthSum + currentRingWidth
        if (widthSum * ringExpansionFactor > (1 - dropRadialPercentage)) {
            dropRing = i
            segmentWidthPercentage =  ((1- dropRadialPercentage) - ((widthSum - currentRingWidth)* ringExpansionFactor))/(ringExpansionFactor*currentRingWidth)
            break
        }
    }
    if (dropRing==null) {
      dropRing = viewpoint.template.ringsConfiguration.rings.length-1
    }

  }
    
   // console.log(`drop blip  ring ${dropRing} ${viewpoint.template.ringsConfiguration.rings[dropRing]?.label}`)
    return {sector: dropSector, ring: dropRing, segmentAnglePercentage: segmentAnglePercentage, segmentWidthPercentage:segmentWidthPercentage}
}

// Add the tooltip element to the radar
const tooltipElementId = "tooltip"
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
