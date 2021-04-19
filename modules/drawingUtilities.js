export {cartesianFromPolar , polarFromCartesian,segmentFromCartesian}

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

  const segmentFromCartesian = (cartesian, viewpoint, sectorExpansionFactor=1, ringExpansionFactor=1) => {
    const polar = polarFromCartesian({ x: cartesian.x, y: cartesian.y })
    const dropAnglePercentage = (polar.phi < 0) ? - polar.phi / (2 * Math.PI) : 1 - polar.phi / (2 * Math.PI)
    const dropRadialPercentage = polar.r / viewpoint.template.maxRingRadius
   
    let dropSector
    let angleSum = 0
    // iterate over sectors until sum of sector angles > anglePercentage    ; the last sector is the dropzone 
    for (let i = 0; i < viewpoint.template.sectorConfiguration.sectors.length; i++) {
        angleSum = angleSum + 
        ((viewpoint.template.sectorConfiguration.sectors[i]?.visible != false) ?  viewpoint.template.sectorConfiguration.sectors[i].angle:0)
        if (angleSum * sectorExpansionFactor > dropAnglePercentage) {
            dropSector = i
            break
        }
    }
    if (dropSector==null) {
      dropSector = viewpoint.template.sectorConfiguration.sectors.length-1
    }
    // iterate of rings until sum of ring widths > 1- radialPercentage; the last ring is the dropzone

    let dropRing
    let widthSum = 0
    // iterate over rings until sum of ring widths > dropRadialPercentage    ; the last ring is the dropzone 
    for (let i = 0; i < viewpoint.template.ringConfiguration.rings.length; i++) {
        widthSum = widthSum +
        ((viewpoint.template.ringConfiguration.rings[i]?.visible != false) 
        ?  viewpoint.template.ringConfiguration.rings[i].width:0)
        if (widthSum * ringExpansionFactor > (1 - dropRadialPercentage)) {
            dropRing = i
            break
        }
    }
    if (dropRing==null) {
      dropRing = viewpoint.template.ringConfiguration.rings.length-1
    }


    if (dropRadialPercentage > 1) dropRing = -1
   // console.log(`drop blip  ring ${dropRing} ${viewpoint.template.ringConfiguration.rings[dropRing]?.label}`)
    return {sector: dropSector, ring: dropRing}
}
