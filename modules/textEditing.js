export { getEditableDecorator }


const getEditableDecorator = (handleInputChange) => {
    const textEditHandler = handleInputChange;
    return (d, field) => makeEditable(d, field, textEditHandler)
}

// copied from http://bl.ocks.org/GerHobbelt/2653660
function makeEditable(d, field, textEditHandler) { // field is an array [svgElementId, valueToEdit, fieldIdentifier]

    const svgElementId = arguments[1][0]
    const valueToEdit = arguments[1][1]
    const fieldIdentifier = arguments[1][2]
    d // decorate element with event handlers
        .on("mouseover", function () {
            d3.select(this).style("fill", "red");
        })
        .on("mouseout", function () {
            d3.select(this).style("fill", null); // TODO reset fill style to previous value, not reset to null
        })
        .on("click", function (d) {
            //            var p = this.parentNode;

            // inject a HTML form to edit the content here...

            const svg = d3.select(svgElementId)
            const foreignObject = svg.append("foreignObject");

            foreignObject
                .attr("x", d.layerX) // use x and y coordinates from mouse event // TODO for use in size/color/shape - the location needs to be derived differently 
                .attr("y", d.layerY)

                .attr("width", 400)
                .attr("height", 145)

            const body = foreignObject.append("xhtml:body").attr("style","background-color:#fff4b8; padding:6px")
            .on("mouseout", function () {
                // TODO start counter to abandon editor; the counter can be stopped by mouseover on this element or any other
                    // Note to self: frm.remove() will remove the entire <g> group! Remember the D3 selection logic!
            //        svg.select("foreignObject").remove();
                })
            var frm = body.append("xhtml:form")

            let inp = frm.append("input")
                .attr("title", "Edit value, then press tab or click outside of field")
                .attr("value", function () {
                    // nasty spot to place this call, but here we are sure that the <input> tag is available
                    // and is handily pointed at by 'this':
                    this.focus();
                    return valueToEdit;
                })
                .attr("style", "width: 494px;")
                .attr("style", "height: 45px; padding:8px;font-size:28px")
                // make the form go away when you jump out (form looses focus) or hit ENTER:
                // TODO if blur is followed by button, then let button handler act
                // .on("blur", function () {
                //     const txt = inp.node().value;
                //     textEditHandler(fieldIdentifier, txt)
                //     // Note to self: frm.remove() will remove the entire <g> group! Remember the D3 selection logic!
                //     svg.select("foreignObject").remove();
                // })
                .on("keypress", function () {
                    // IE fix
                    if (!d3.event)
                        d3.event = window.event;

                    const e = d3.event;
                    if (e.keyCode == 13) {
                        if (typeof (e.cancelBubble) !== 'undefined') // IE
                            e.cancelBubble = true;
                        if (e.stopPropagation)
                            e.stopPropagation();
                        e.preventDefault();

                        const txt = inp.node().value;
                        textEditHandler(fieldIdentifier, txt)

                        // odd. Should work in Safari, but the debugger crashes on this instead.
                        // Anyway, it SHOULD be here and it doesn't hurt otherwise.
                        svg.select("foreignObject").remove();
                    }
                })
            frm.append("button")
                .on("click", () => {
                    const txt = inp.node().value;
                    console.log(`click save value ${txt}`)
                    textEditHandler(fieldIdentifier, txt)
                    svg.select("foreignObject").remove();

                })
                .html("Save")
            frm.append("button")
                .on("click", () => {
                    console.log(`click CANCEL`)
                    svg.select("foreignObject").remove();

                }).html("Cancel")
                ;
        });
}

