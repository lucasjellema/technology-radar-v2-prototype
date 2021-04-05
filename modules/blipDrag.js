export { makeDraggable }

function makeDraggable(svg, handleEndDragEvent) {
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
    var initialDragEvent 


    function initialiseDragging(evt) {
        initialDragEvent  = evt
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
        hideTooltip()
    }
            //hide tooltip during dragging
            const div = d3.select("#graph-tooltip");

    const hideTooltip = () => {
            div
                .transition()
                .duration(200)
                .style("opacity", 0);
}
    function startDrag(evt) {
        if (evt.target.classList.contains('draggable')) {
            if (evt.target.id !=null) {
            selectedElement = evt.target;
            initialiseDragging(evt);
            }
        } else if (evt.target.parentNode.classList.contains('draggable-group')) {
            selectedElement = evt.target.parentNode;
            initialiseDragging(evt);
        }
    }

    function drag(evt) {
        
        if (selectedElement) {
            evt.preventDefault();
            var coord = getMousePosition(evt);
            transform.setTranslate(coord.x - offset.x, coord.y - offset.y);
            hideTooltip()
        }
    }

    function endDrag(evt) {
        if (selectedElement ) {  
            var coord = getMousePosition(evt);
            const blipId = selectedElement.getAttributeNS(null, "id")
            if ( ( Math.abs(initialDragEvent.clientX - evt.clientX)>3 ||Math.abs(initialDragEvent.clientY - evt.clientY)>3 ) && handleEndDragEvent) {// only a real drag event if there is real movement
                handleEndDragEvent({ blipId: blipId, newX: (coord.x - offset.x), newY: (coord.y - offset.y) })
            }
            hideTooltip()
            selectedElement = false;
        }
    }
}
