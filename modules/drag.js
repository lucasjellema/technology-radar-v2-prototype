export { makeDraggable }

// https://www.telerik.com/blogs/debouncing-and-throttling-in-javascript
var timerId;
var throttleFunction = function (func, delay = 150) {
    // If setTimeout is already scheduled, no need to do anything
    if (timerId) {
        return
    }

    // Schedule a setTimeout after delay seconds
    timerId = setTimeout(function () {
        func()

        // Once setTimeout function execution is finished, timerId = undefined so that in <br>
        // the next scroll event function execution can be scheduled by the setTimeout
        timerId = undefined;
    }, delay)
}
function makeDraggable(svg, handleDragEvent, throttleDelay = 150) {
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    function getMousePosition(evt) {
        var CTM = svg.getScreenCTM();
        if (evt.touches) { evt = evt.touches[0]; }
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }

    var selectedElement, offset, transform;
    let isRingDrag = false

    function initialiseDragging(evt) {
        offset = getMousePosition(evt);

        // Make sure the first transform on the element is a translate transform
        var transforms = selectedElement.transform.baseVal;

        if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            // Create an transform that translates by (0, 0)
            var translate = svg.createSVGTransform();
            translate.setTranslate(0, 0);
            selectedElement.transform.baseVal.insertItemBefore(translate, 0);
        }

        // Get initial translation
        transform = transforms.getItem(0);
        offset.x -= transform.matrix.e;
        offset.y -= transform.matrix.f;
    }

    function startDrag(evt) {
        if (evt.target.classList.contains('draggable')) {
            selectedElement = evt.target;
            initialiseDragging(evt);
        } else if (evt.target.parentNode.classList.contains('draggable-group')) {
            selectedElement = evt.target.parentNode;
            initialiseDragging(evt);
        }
    }

    function drag(evt) {
        if (selectedElement) {
            evt.preventDefault();
            var coord = getMousePosition(evt);
            //  console.log(`x move ${coord.x - offset.x}, y move ${coord.y - offset.y}, coord x: ${coord.x}, offset.x ${offset.x}`)
            throttleFunction(
                () => {
                    const newCoord = handleDragEvent("drag", selectedElement, { deltaX: coord.x - offset.x, deltaY: coord.y - offset.y, x: coord.x, y: coord.y, offset: offset })
                    if (newCoord != null && newCoord.deltaX != null && newCoord.deltay != null) {
                        transform.setTranslate(newCoord.deltaX, newCoord.deltaY);
                    }
                }, throttleDelay)             // Do not execute this function more ofthen than one per this number of miliseconds 

        }
    }

    function endDrag(evt) {
        if (selectedElement) {
            var coord = getMousePosition(evt);
            //   const blipId = selectedElement.getAttributeNS(null, "id")
            //   // find entry with blipId
            //   const entry = getCurrentConfiguration().getEntries().filter((entry) => entry.label == blipId)[0]
            //   //console.log(`end drag of ${blipId} x= ${coord.x}, y = ${coord.y}`)
            //   const sector = getSectorForXYCoordinates(coord.x - offset.x, coord.y - offset.y)
            //   //console.log(`drop Sector  ${JSON.stringify(sector)} `)
            //   entry.x= (coord.x - offset.x)
            //   entry.y =  coord.y - offset.y
            //   if (getCurrentConfiguration().handleSectorDrop)
            //     getCurrentConfiguration().handleSectorDrop(entry, sector)
            selectedElement = false;
        }
    }
}
