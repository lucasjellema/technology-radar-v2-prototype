import { getNestedPropertyValueFromObject ,findDisplayProperty} from './utils.js'
export { initializeTree }

class Treeview {
    constructor(treeviewId, imageBaseUrl) {
        this.treeviewId = treeviewId;
        this.selected = null;
        this.imageBase = imageBaseUrl;
    };
    on(eventName, eventHandler) {
        var me = this;
        switch (eventName) {
            case "select": {
                const tree = document.getElementById(this.treeviewId)
                tree.addEventListener("click", (event) => {
                    if (event.target.nodeName == 'SUMMARY') {
                        if (me.selected != null) {
                            document.getElementById(me.selected).removeAttribute("selected");
                        }
                        document.getElementById(event.target.id).setAttribute("selected", "true");
                        //console.log(event.target.id);
                        me.selected = event.target.id;
                        event.target.setAttribute("open", !event.target.parentNode.hasAttribute("open"));
                        eventHandler(event)
                    }
                });
                break;
            }
        }
    }
    appendData(data, targetId) {
        document.getElementById(targetId).parentNode.innerHTML += this.walkData(data);
    };
    replaceData(data, targetId) {
        if (targetId != null) {
            var target = document.getElementById(targetId);
            if (target!=null) {
                target.outerHTML = this.walkData(data)
            }
        }
        else {
            const target = document.querySelector(`#${this.treeviewId}`);
            if (target!=null) {
              target.innerHTML = this.walkData(data);
            }
        }
    };
    walkData(data) {
        var me = this;
        var buf = Object.keys(data).map((key) =>
            `<details>
            <summary  id="${key}" ${Object.keys(data[key]).map((subkey) => { return subkey != 'children' ? `data-${subkey}="${data[key][subkey]}"` : ' ' }).join(' ')}>
                <img class="icon" src="${me.imageBase}${data[key].icon ? data[key].icon : data[key].children ? 'Folder.png' : 'Item.png'}"> </img>
                ${data[key].label}
                <input type="checkbox" checked id="check${this.treeviewId}${data[key].id}" style="margin:8px;${(data[key]['selectable'] ?? false) ? '' : 'display:none'}"></input>
            </summary>
             ${data[key].children ? me.walkData(data[key].children) : ""}
          </details>`);
        return buf.join("\n")
    };
    open(id) {
        var node = document.getElementById(id);
        while (node.parentNode.nodeName == "DETAILS") {
            node = node.parentNode;
            node.setAttribute("open", "true");
        }
    };
    close(id) {
        var node = document.getElementById(id).parentNode;
        node.removeAttribute("open");
        var detailNodes = node.querySelectorAll("DETAILS");
        console.log(detailNodes); detailNodes.forEach((node) => node.removeAttribute("open"));
    };
    select(id) {
        this.open(id);
        document.getElementById(id).focus();
        document.getElementById(id).click();
    }
}



const mapRadarDataToTreeModel = (radarData) => {
    const data = {}
    if (radarData.model != null) {
        data.model = {
            label: "Model"
            , description: "Meta Model for Radar Objects"
            , selectable: true
            , id: "model"
            , children: {}
        }
        if (radarData.model.objectTypes != null) {
            data.model.children.objectTypes = {
                label: "Object Types",
                children: {}
                , selectable: true,
                id: "objectTypes"
            }
        }
        if (radarData.model.ratingTypes != null) {

            data.model.children.ratingTypes = {
                label: "Rating Types",
                children: {},
                id: "ratingTypes", selectable: true
            }
        }
    }


    if (radarData.model?.objectTypes != null) {
        for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
            const objectType = radarData.model.objectTypes[Object.keys(radarData.model.objectTypes)[i]]
            const objectTypeNode = { label: objectType.label, selectable: true, id: `objectType${i}`, children: { properties: { label: "Properties", children: {} } } }
            if (objectType.properties != null) {
                for (let j = 0; j < Object.keys(objectType.properties).length; j++) {
                    const property = objectType.properties[Object.keys(objectType.properties)[j]]
                    objectTypeNode.children.properties.children[Object.keys(objectType.properties)[j]] =
                     { label: property.label , propertyPath: `object.${Object.keys(objectType.properties)[j]}`
                    , data: property}
                }
            }
            data.model.children.objectTypes.children[Object.keys(radarData.model.objectTypes)[i]] = objectTypeNode
        }
    }
    if (radarData.model?.ratingTypes != null) {
        for (let i = 0; i < Object.keys(radarData.model.ratingTypes).length; i++) {
            const ratingType = radarData.model.ratingTypes[Object.keys(radarData.model.ratingTypes)[i]]
            const ratingTypeNode = {
                label: ratingType.label != null ? ratingType.label : Object.keys(radarData.model.ratingTypes)[i], selectable: true, id: `ratingType${i}`
                , children: { properties: { label: "Properties", children: {} } }
            }
            if (ratingType.properties != null) {
                for (let j = 0; j < Object.keys(ratingType.properties).length; j++) {
                    const property = ratingType.properties[Object.keys(ratingType.properties)[j]]
                    ratingTypeNode.children.properties.children[Object.keys(ratingType.properties)[j]] = 
                    { label: property.label , property: property,  propertyPath: Object.keys(ratingType.properties)[j]}
                }
            }
            data.model.children.ratingTypes.children[Object.keys(radarData.model.ratingTypes)[i]] = ratingTypeNode
        }
    }
    let i = 0

    if (radarData.templates != null && radarData.templates.length > 0) {
        data.templates = { label: "Templates", children: {} }
        radarData.templates.forEach((template) => {
            data.templates.children[template.title.text] =
                { label: template.title.text, selectable: true, id: `template${i++}`, children: { details: { label: `${template.sectorConfiguration.sectors.length} sectors, ${template.ringConfiguration.rings.length} rings` } } }
        })
    }
    if (radarData.viewpoints != null && radarData.viewpoints.length > 0) {
        data.viewpoints = { label: "Viewpoints", children: {} }
        i = 0
        radarData.viewpoints.forEach((viewpoint) => {
            data.viewpoints.children[viewpoint.name] =
                { label: viewpoint.name, selectable: true, id: `viewpoint${i++}`, children: { blips: { label: `${viewpoint.blips.length} blips`, selectable: true } } }
        })
    }

    data.data = { label: "Data Objects", selectable: true, id: `dataobjects`, children: {} }
    // loop over all blips; extract object type, check if in set; if not, then add to set and add to data.data
    // TODO CATER for OBJECTs loaded from file
    if (radarData.viewpoints != null && radarData.viewpoints.length > 0) {
        if (radarData.model?.objectTypes != null) {
            const objectSets = {}
            for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
                const objectTypeKey = Object.keys(radarData.model.objectTypes)[i]
                objectSets[objectTypeKey] = new Set()
            }

            for (let i = 0; i < radarData.viewpoints.length; i++) { // viewpoints
                let ratingType = radarData.viewpoints[i].ratingType
                if (typeof(ratingType)=="string") {
                    ratingType = radarData.model?.ratingTypes[ratingType]
                }
                const objectTypeKey = ratingType.objectType.name
                const displayPropertyPath = findDisplayProperty(ratingType.objectType.properties).key
                for (let j = 0; j < radarData.viewpoints[i].blips.length; j++) {
                    const blip = radarData.viewpoints[i].blips[j]
                    if (!objectSets[objectTypeKey].has(getNestedPropertyValueFromObject(blip.rating.object, displayPropertyPath))) {
                        objectSets[objectTypeKey].add(getNestedPropertyValueFromObject(blip.rating.object, displayPropertyPath))
                    }
                }
            }

            for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
                const objectTypeKey = Object.keys(radarData.model.objectTypes)[i]
                if (objectSets[objectTypeKey].size > 0) {
                    const objectType = radarData.model.objectTypes[objectTypeKey]
                    data.data.children[objectTypeKey] = { label: objectType.label, selectable: true, id: `dataobjects${objectTypeKey}`, children: {} }
                    objectSets[objectTypeKey].forEach((objectLabel) => data.data.children[objectTypeKey].children[objectLabel] = { label: objectLabel, id:"uuid" })
                }
            }
        }
    }
    return data
    // TODO fix issue with properties exception : data.objects is not organized by object type ; object keys are UUID 
    if (radarData.objects != null) {
        for (let i = 0; i < Object.keys(radarData.objects).length; i++) {
            const objectTypeKey = Object.keys(radarData.objects)[i]
            const objectType = radarData.model.objectTypes[objectTypeKey]
            const displayPropertyPath = findDisplayProperty(objectType.properties).key

            data.data.children[objectTypeKey] = { label: objectType?.label ?? objectTypeKey, selectable: true, id: `dataobjects${objectTypeKey}`, children: {} }
            radarData.objects[objectTypeKey].forEach((object) => {
                const objectLabel = getNestedPropertyValueFromObject(object, displayPropertyPath)
                data.data.children[objectTypeKey].children[objectLabel] = { label: objectLabel }
            })
        }
    }



    return data
}

// NOTE: COPY FROM data.js - move to util.js?
// source: https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function isElementChecked(elementId) {
    const checkbox = document.getElementById(elementId);
    return checkbox != null ? checkbox.checked : false
}

const downloadData = (treeElementId, radarData) => {
    const data = getDataFromSelectedTreeElementsInRadarData(treeElementId, radarData)
    download(`radar-data.json`, JSON.stringify(data))
}

const getDataFromSelectedTreeElementsInRadarData = (treeElementId, radarData) => {
    const data = {}
    if (isElementChecked(`check${treeElementId}model`)) {
        data.model = {}
        if (isElementChecked(`check${treeElementId}objectTypes`)) {
            data.model.objectTypes = {}
            if (radarData.model?.objectTypes != null) {
                for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
                    const objectType = radarData.model.objectTypes[Object.keys(radarData.model.objectTypes)[i]]
                    if (isElementChecked(`check${treeElementId}objectType${i}`)) {
                        data.model.objectTypes[Object.keys(radarData.model.objectTypes)[i]] = JSON.parse(JSON.stringify(objectType))
                    }
                }
            }
        }
        if (isElementChecked(`check${treeElementId}ratingTypes`)) {
            data.model.ratingTypes = {}
            if (radarData.model?.ratingTypes != null) {
                for (let i = 0; i < Object.keys(radarData.model.ratingTypes).length; i++) {
                    const ratingType = radarData.model.ratingTypes[Object.keys(radarData.model.ratingTypes)[i]]
                    if (isElementChecked(`check${treeElementId}ratingType${i}`)) {
                        data.model.ratingTypes[Object.keys(radarData.model.ratingTypes)[i]] = JSON.parse(JSON.stringify(ratingType))
                    }
                }
            }
        }
    }
    let i = 0
    if (radarData.templates && radarData.templates.length > 0) {
        let firstTemplate = true
        radarData.templates.forEach((template) => {
            if (isElementChecked(`check${treeElementId}template${i++}`)) {
                if (firstTemplate) { data.templates = []; firstTemplate = false }
                data.templates.push(JSON.parse(JSON.stringify(template)))
            }
        })
    }
    if (radarData.viewpoints && radarData.viewpoints.length > 0) {
        i = 0
        let firstViewpoint = true
        radarData.viewpoints.forEach((viewpoint) => {
            if (isElementChecked(`check${treeElementId}viewpoint${i++}`)) {
                if (firstViewpoint) { data.viewpoints = []; firstViewpoint = false }
                data.viewpoints.push(JSON.parse(JSON.stringify(viewpoint)))
            }
        })
    }
    if (isElementChecked(`check${treeElementId}dataobjects`)) {
        data.objects = {}

        if (radarData.viewpoints != null && radarData.viewpoints.length > 0) {
            if (radarData.model?.objectTypes != null) {
                const objectSets = {}
                const objectArrays = {}

                for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
                    const objectTypeKey = Object.keys(radarData.model.objectTypes)[i]
                    objectSets[objectTypeKey] = new Set()
                    objectArrays[objectTypeKey] = []
                }

                for (let i = 0; i < radarData.viewpoints.length; i++) { // viewpoints
                    let ratingType = radarData.viewpoints[i].ratingType
                    if (typeof(ratingType)=="string") {
                        ratingType = radarData.model?.ratingTypes[ratingType]

                    }
                    const objectTypeKey = ratingType.objectType.name
                    const displayPropertyPath = findDisplayProperty(ratingType.objectType.properties).key
                    for (let j = 0; j < radarData.viewpoints[i].blips.length; j++) {
                        const blip = radarData.viewpoints[i].blips[j]
                        if (!objectSets[objectTypeKey].has(getNestedPropertyValueFromObject(blip.rating.object, displayPropertyPath))) // TODO no hard coded reference to object property
                        {
                            objectSets[objectTypeKey].add(getNestedPropertyValueFromObject(blip.rating.object, displayPropertyPath))
                            objectArrays[objectTypeKey].push(blip.rating.object)
                        }
                    }
                }
                for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
                    const objectTypeKey = Object.keys(radarData.model.objectTypes)[i]
                    if (objectSets[objectTypeKey].size > 0 && (isElementChecked(`check${treeElementId}dataobjects${objectTypeKey}`))) {
                        data.objects[objectTypeKey] = objectArrays[objectTypeKey]
                    }
                }
            }
        }
    }
    return data
}

// const processUploadedData = (treeElementId, radarData) => {
//     console.log(`process uploaded data`)
//     const data = getDataFromSelectedTreeElementsInRadarData(treeElementId, radarData)

//     console.log(`data`)
// }

const initializeTree = (treeElementId, radarData, treeDataProcessingType = null, uploadedDataProcessorFunction=null) => {
  //  try {
    var treeview = new Treeview(treeElementId, "https://s3-us-west-2.amazonaws.com/s.cdpn.io/620300/");
    treeview.replaceData(mapRadarDataToTreeModel(radarData));

    if (treeDataProcessingType == "download") {
        // button for downloading parts of the current data model
        let downloadSelectedElementsButton = document.getElementById("downloadPartialData")
        if (downloadSelectedElementsButton) {
            downloadSelectedElementsButton.remove()
        }
        const container = document.getElementById("datamodelTreeContainer")
        container.innerHTML = `${container.innerHTML}<input type="button" id="downloadPartialData" name="download" value="Download Data File with Selected Elements"></input>`
        downloadSelectedElementsButton = document.getElementById("downloadPartialData")
        downloadSelectedElementsButton.addEventListener("click", (e) => { downloadData(treeElementId, radarData) })
    }

    if (treeDataProcessingType == "upload") {
        // button for processing parts of the uploaded file contents into the current data model
        let processUploadedDataButton = document.getElementById("processSelectedUploadedData")
        if (processUploadedDataButton) {
            processUploadedDataButton.remove()
        }
        const container = document.getElementById("filemodelTreeContainer")
        container.innerHTML = `${container.innerHTML}<input type="button" id="processSelectedUploadedData" name="processUploaded"
    value="Process Selected Elements from Uploaded Data"></input>`
        processUploadedDataButton = document.getElementById("processSelectedUploadedData")
        processUploadedDataButton.addEventListener("click", (e) => { uploadedDataProcessorFunction(getDataFromSelectedTreeElementsInRadarData(treeElementId, radarData)) })
    }
    treeview.on("select", (event) => {
        var node = event.target;
        var data = node.dataset
const display = document.getElementById("display")
   display.innerHTML = `<div >${data.label}</div>${data.description ? `<div class="descr">${data.description}</div>` : ''}`;
        console.log(`${event.target} ${JSON.stringify(data)}`)
    });

    // } catch (e) {
    //     console.log(`initializeTree failed with ${e}`)
    // }
}


