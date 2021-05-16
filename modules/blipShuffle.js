import { getViewpoint, getData, publishRefreshRadar, getDistinctTagValues, getState } from './data.js'
import { cartesianFromPolar, polarFromCartesian, segmentFromCartesian, addTooltip, removeTooltip } from './drawingUtilities.js'

export { segmentShuffle }

const nodePadding = 2
const segmentShuffle = (segment) => {
  // segment sector, ring

  const segmentContext = getState().blipDrawingContext.segmentMatrix[segment.sector][segment.ring]
  console.log(`shuffle segment `)
  //   anglePercentage: 0.2
  // blips: (2) [{…}, {…}]
  // 
  // id: "29715410-f037-4ad0-8bc3-aad94f67dbec"
  // rating: {id: "3d898d82-3d7e-4e91-8271-c2841a18e40f", timestamp: 1619005384826, ratingType: "technologyAdoption", object: {…}, magnitude: "medium", …}
  // segmentAnglePercentage: 0.35051960470180565
  // segmentWidthPercentage: 0.8261927259103576
  // x: null
  // y: null
  // endAngle: 0.45
  // endPhi: 3.455751918948773
  // endR: 315
  // endWidth: 0.30000000000000004
  // startAngle: 0.25
  // startPhi: 4.71238898038469
  // startR: 392
  // startWidth: 0.13
  // visible: true
  // widthPercentage: 0.17
  let blipsLayer
  const blipsLayerElementId = "blipsLayer"
  blipsLayer = d3.select(`#${blipsLayerElementId}`)
  const blipElements = blipsLayer.selectAll(".blip")
  segmentContext.blips.forEach((blip) => {
    if (blip.locked == true) {
      blip.fx = blip.x; blip.fy = blip.y  // assign fixed positions - not to be manipulated by simulation
    } else {
      delete blip.fx
      delete blip.fy
    }
    //  blip.x = blip.x ; blip.y = 150 
  })
  console.log(`Segment Start R : ${segmentContext.startR} and End R : ${segmentContext.endR}`)
  console.log(`Segment Start Phi : ${segmentContext.startPhi} and End Phi : ${segmentContext.endPhi}`)
  console.log(`Segment Start Angle % : ${100 * segmentContext.startAngle}% and End Angle : ${100 * segmentContext.endAngle}%`)

  const numberOfSimulations = 70
  const sim = d3.forceSimulation(segmentContext.blips)
    .force("collide", d3.forceCollide().radius(d => d.scaleFactor * 15 + nodePadding))
    .force("charge", d3.forceManyBody().strength(-10))
    .force("bounded-segment", () => segmentContext.blips.forEach(blip => { restrainBlipToSegment(blip, segmentContext) }))
  // .stop()
  // .tick(50)
  let ticks = 0
  // update each node upon simulation tick
  sim.on("tick", () => {

    blipElements // TODO retain scale factor in transform
      .attr("transform", (d, i) => {
        return `translate(${d.x}, ${d.y})  scale(${d.scaleFactor ?? 1})`
      })
    ticks++
    if (ticks > numberOfSimulations) {
      sim.stop()
      segmentContext.blips.forEach((blip) => {
        const polar = polarFromCartesian(blip)
        const anglePercentage = polarAngleToAnglePercentage(polar.phi)        
        blip.segmentAnglePercentage = (anglePercentage - segmentContext.startAngle)/ (segmentContext.endAngle  - segmentContext.startAngle )
        // note StartR is larger than endR - we move from outside inward
        blip.segmentWidthPercentage = (segmentContext.startR - polar.r)/(segmentContext.startR - segmentContext.endR)
      })
    }
  })
}

// take a polar angle between -PI and PI and calculate angular percentage; 0 = 0%, -PI/2 = 25%, - PI = 50%, PI = 50% , PI/2=75%
const polarAngleToAnglePercentage = (polarAngle) => {
  let anglePercentage
  if (polarAngle < 0) {
    anglePercentage = - 0.5 * polarAngle / Math.PI
  } else {
    anglePercentage = 0.5 + 0.5 * (Math.PI - polarAngle) / Math.PI
  }
  return anglePercentage
}

// take an angle percentage and derive the polar angle between -PI and PI; 0% = 0, 25% = -PI/2, 50% = -PI or PI , 75% = PI/2
const anglePercentageToPolarAngle = (anglePercentage) => {
  let polarAngle
  if (anglePercentage < 0.5) {
    polarAngle = - anglePercentage * 2 * Math.PI
  } else {
    polarAngle = 2 * Math.PI * (1 - anglePercentage)
  }
  return polarAngle
}

const restrainBlipToSegment = (blip, segmentContext) => {
  // get blip.x , blip.y
  const polar = polarFromCartesian(blip)

  let corrected = false
  // check radial position; note StartR is larger than endR - we move from outside inward
  if ((polar.r + blip.scaleFactor * 15) > segmentContext.startR) {
    polar.r = segmentContext.startR - blip.scaleFactor * 15 - nodePadding
    corrected = true
  } else if ((polar.r - blip.scaleFactor * 15) < segmentContext.endR) {
    polar.r = segmentContext.endR + blip.scaleFactor * 15 + nodePadding
    corrected = true
  }
  // check angular position
  const anglePadding = 0.005
  // let blipAngle = (polar.phi < 0) ? (2 * Math.PI + polar.phi) : polar.phi  // convert from 0 .. -PI, PI,0 to 2PI..0
  let blipAnglePercentage = polarAngleToAnglePercentage(polar.phi)
  if (blipAnglePercentage < segmentContext.startAngle + anglePadding) {
    blipAnglePercentage = segmentContext.startAngle + 1.1 * anglePadding
    // console.log(`low end: go from polar phi ${polar.phi} or ${100 * polarAngleToAnglePercentage(polar.phi)}% 
    // to ${100 * blipAnglePercentage}% or phi ${anglePercentageToPolarAngle(blipAnglePercentage)}`)
    polar.phi = anglePercentageToPolarAngle(blipAnglePercentage)
    corrected = true
  } else if (blipAnglePercentage > segmentContext.endAngle - anglePadding) {
    blipAnglePercentage = segmentContext.endAngle - 1.1 * anglePadding
    // console.log(`high end: go from polar phi ${polar.phi} or ${100 * polarAngleToAnglePercentage(polar.phi)}% to ${100 * blipAnglePercentage}% or phi ${anglePercentageToPolarAngle(blipAnglePercentage)}`)
    polar.phi = anglePercentageToPolarAngle(blipAnglePercentage)
    corrected = true
  }

  if (corrected) {

    const xy = cartesianFromPolar(polar)
    blip.x = xy.x
    blip.y = xy.y
  }



}