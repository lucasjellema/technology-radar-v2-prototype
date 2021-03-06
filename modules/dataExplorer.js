export { launchDataExplorer }
import { unselectAllTabs,getLabelForAllowableValue, findDisplayProperty, capitalize, getPropertyFromPropertyPath, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'
import { getViewpoint, getData, download, publishRefreshRadar, populateTemplateSelector, createObject, createRating } from './data.js';
import { launchBlipEditor } from './blipEditing.js'

const launchDataExplorer = () => {

    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Data Explorer")
    unselectAllTabs()
  

    document.getElementById("dataExplorerConfigurationTab").classList.add("selectedTab") 

    const contentContainer = document.getElementById("modalMainContentContainer")
    let html = ``
    html += `<h3>Data Explorer</h3>`
    html += `                    
    <div id="datamodelTreeContainer">
      <div >
         <h1>Radar Data Viewer</h1>
         <section>
         <div  id="detailDisplay" style="width:700px;float:right">
         <h3>Details for selected node</h3>
         <div id="detailPane">
         </div>
         </div>
         <div id="datamodelTree">
            </div>
            </section>
       </div>
<br />
</div>
`
    contentContainer.innerHTML = html

    initializeTree("datamodelTree", mapRadarDataToTreeModel(getData())
        , (data) => { // select handler
            console.log(` ${JSON.stringify(data)}`)
            const display = document.getElementById("detailPane")
            if (data.type == "object") {
                objectViewer(data.id, display)
            }
            else if (data.type == "rating") {
                ratingViewer(data.id, display)

            }
            else if (data.type == "viewpoint") {
                viewpointViewer(data.id, display)

            }
            else {
                display.innerHTML = `<div >${data.label}</div>${data.description ? `<div class="descr">${data.description}</div>` : ''}`;
            }
        })
    // show an overview of the current data content
    // object types, rating types
    // objects
    // ratings
    // allow editing of all of these
    // allow create and delete of individual objects and ratings
    // allow creation of rating for object (and all ratings for all objects without rating)


}


const addTags = (label, tags) => {
    let innerHTML = `<b>${label}</b> `
    for (let i = 0; i < tags.length; i++) {
        innerHTML = innerHTML + `<span class="extra tagfilter">${tags[i]}</span>`
    }
    return innerHTML
}


function writeProperty(object, propertyPath, property, html) {
    let value = getNestedPropertyValueFromObject(object, propertyPath);
    if (property.allowableValues != null && property.allowableValues.length > 0) {
        value = getLabelForAllowableValue(value, property.allowableValues);
    }
    if (property.type == "url" && value != null && value.length > 1 && value != "undefined") {
        html += `<b>${property.label}</b> <a href="${value}" target="_new">${value}</a>` + `<br />`;
    } else if (property.type == "image" && value != null && value.length > 0 && value != "undefined") {
        html += `<img src="${value}" style="width: 350px;float:right;padding:15px"></img>`;
    } else if (property.type == "tags" && value != null && value.length > 0) {
        html += `<br />` + addTags("Tags", value) + `<br />`;
    }
    else {
        if (value != null && value.length > 0 && value != "undefined") {
            html += `<b>${property.label}</b> ${value}<br/>`;
        }
    }
    return html;
}
const objectViewer = (objectId, displayContainer) => {
    let html = ``
    const object = getData().objects[objectId]
    const objectType = typeof (object.objectType) == "string" ? getData().model.objectTypes[object.objectType] : object.objectType

    for (let propertyName in objectType.properties) {
        const property = objectType.properties[propertyName]
        html = writeProperty(object, propertyName, property, html);
    }
    html += `<br /> <br /> <input type="button" id="editObject"  value="Edit Object" style="padding:6px;margin:10px" />
    <input type="button" id="deleteObject"  value="Delete Object" style="padding:6px;margin:10px" />`

    displayContainer.innerHTML = html

    document.getElementById("deleteObject").addEventListener("click", () => {
        deleteObject(objectId)
        launchDataExplorer() // TODO finer grained refresh
    })
}

const deleteObject = (objectId) => {
    // find all ratings that refer to this objectId and delete those blips
    Object.keys(getData().ratings).forEach((ratingId) => {
            if (getData().ratings[ratingId].object.id == objectId) {
                deleteRating(ratingId)
            }
        })
    // remove the object itself
    delete getData().objects[objectId]
}


const deleteRating = (ratingId) => {
        // find all blips that refer to this rating and delete those blips
        getData().viewpoints.forEach((viewpoint) => {
            viewpoint.blips.forEach((blip, i) => {
                if (blip.rating.id == ratingId) {
                    viewpoint.blips.splice(i, 1)
                }
            })
        })
        // remove the rating itself
        delete getData().ratings[ratingId]

}

const ratingViewer = (ratingId, displayContainer) => {
    let html = ``
    const rating = getData().ratings[ratingId]
    const ratingType = typeof (rating.ratingType) == "string" ? getData().model.ratingTypes[rating.ratingType] : rating.ratingType
    //    const objectType = typeof (object.objectType) == "string" ? getData().model.objectTypes[object.objectType] : object.objectType
    const properties = getRatingTypeProperties(ratingType, getData().model, true)
    for (let i = 0; i < properties.length; i++) {
        const property = properties[i]
        html = writeProperty(rating, property.propertyPath, property.property, html);
    }

    html += `<br /> <br /> <input type="button" id="editRating"  value="Edit Rating" style="padding:6px;margin:10px" />
    <input type="button" id="deleteRating"  value="Delete Rating" style="padding:6px;margin:10px" />`


    displayContainer.innerHTML = html
    document.getElementById('editRating').addEventListener("click", () => {
        launchBlipEditor({ rating: rating }, getData().viewpoints[0])
    })

    document.getElementById("deleteRating").addEventListener("click", () => {
        deleteRating(ratingId)
        launchDataExplorer() // TODO finer grained refresh
    })
}

const viewpointViewer = (viewpointId, displayContainer) => {
    let html = ``
    const data = getData()
    const viewpoint = data.viewpoints[viewpointId]
    html += `<b>Name</b> ${viewpoint.template.title.text}<br/>`
    html += `<b>Rating Type</b> ${undefinedToDefined(viewpoint.ratingType.name)}<br/>`

    html += `<b>Timestamp</b> ${undefinedToDefined( new Date(viewpoint.timestamp).toDateString(),"")}<br/>`
    html += `<b>Description</b> ${undefinedToDefined( viewpoint.template.description,"")}<br/>`

    html += `<br /> <br /> 
        <input type="button" id="deleteViewpoint"  value="Delete Viewpoint" style="padding:6px;margin:10px" />`

    displayContainer.innerHTML = html

    document.getElementById("deleteViewpoint").addEventListener("click", () => {
        viewpoint["deleted"]=true
        data.viewpoints.splice(viewpointId, 1)
        launchDataExplorer() // TODO finer grained refresh
        publishRefreshRadar()
    })
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

    addObjectTypes(radarData, data);
    addRatingTypes(radarData, data);
    addObjects(data, radarData);



    addRatings(data, radarData);
    if (radarData.viewpoints != null && radarData.viewpoints.length > 0) {
        data.viewpoints = { label: "Viewpoints", children: {} }

        radarData.viewpoints.forEach((viewpoint, i) => {
            const label = `${i + 1}.${viewpoint.name}`
            data.viewpoints.children[label] =
            {
                label: label, selectable: true, id: i, type: "viewpoint"
                , children: { blips: { label: `${viewpoint.blips.length} blips`, selectable: true } }
            }
        })
    }


    return data
}




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
            if (target != null) {
                target.outerHTML = this.walkData(data)
            }
        }
        else {
            const target = document.querySelector(`#${this.treeviewId}`);
            if (target != null) {
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


const initializeTree = (treeElementId, treeData, selectHandler = null) => {
    //  try {
    var treeview = new Treeview(treeElementId, "https://s3-us-west-2.amazonaws.com/s.cdpn.io/620300/");
    treeview.replaceData(treeData)

    treeview.on("select", (event) => {
        var node = event.target;
        var data = node.dataset
        console.log(`${event.target} ${JSON.stringify(data)}`)
        if (selectHandler) {
            selectHandler(data)
        }

    })
}


function addRatings(data, radarData) {
    data.ratings = { label: "Ratings", selectable: true, id: `ratings`, children: {} };
    if (radarData.model?.ratingTypes != null) {
        const ratingSets = {};
        for (let i = 0; i < Object.keys(radarData.model.ratingTypes).length; i++) {
            const ratingTypeKey = Object.keys(radarData.model.ratingTypes)[i];
            ratingSets[ratingTypeKey] = new Set();
        }
        // gather ratings per type
        for (let i = 0; i < Object.keys(radarData.ratings).length; i++) {
            const rating = radarData.ratings[Object.keys(radarData.ratings)[i]];
            const ratingTypeKey = typeof (rating.ratingType) == "string" ? rating.ratingType : rating.ratingType.name;
            ratingSets[ratingTypeKey].add(rating);
        }

        for (let i = 0; i < Object.keys(radarData.model.ratingTypes).length; i++) {
            const ratingType = radarData.model.ratingTypes[Object.keys(radarData.model.ratingTypes)[i]];
            const displayPropertyPath = findDisplayProperty(ratingType.properties).name;
            const contextPropertyKeys = Object.keys(ratingType.properties).filter((key) => ratingType.properties[key].context == true);
            const objectDisplayPropertyPath = findDisplayProperty(ratingType.objectType.properties).name;
            if (ratingSets[ratingType.name].size > -1) {
                data.ratings.children[ratingType.name] = { label: ratingType.label, selectable: true, id: `ratings${ratingType.name}`, children: {} };
                // TODO: HOW TO COMPOSE DISPLAY LABEL FOR RATING?
                ratingSets[ratingType.name].forEach((rating) => {
                    // use context properties to derive 

                    const ratingLabel = contextPropertyKeys.reduce((label, propertyKey, i) => { return label + (i > 0 ? " " : "") + rating[propertyKey] }, "")
                        + " for " + getNestedPropertyValueFromObject(rating.object, objectDisplayPropertyPath);
                    data.ratings.children[ratingType.name].children[ratingLabel] = { label: ratingLabel, id: rating.id, type: "rating" };
                });
            }
        }
    }
}

function addObjects(data, radarData) {
    data.data = { label: "Data Objects", selectable: true, id: `dataobjects`, children: {} };
    if (radarData.model?.objectTypes != null) {
        const objectSets = {};
        for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
            const objectTypeKey = Object.keys(radarData.model.objectTypes)[i];
            objectSets[objectTypeKey] = new Set();
        }
        // gather objects per type
        for (let i = 0; i < Object.keys(radarData.objects).length; i++) {
            const object = radarData.objects[Object.keys(radarData.objects)[i]];
            const objectTypeKey = typeof (object.objectType) == "string" ? object.objectType : object.objectType.name;
            objectSets[objectTypeKey].add(object);
        }

        for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
            const objectType = radarData.model.objectTypes[Object.keys(radarData.model.objectTypes)[i]];
            const displayPropertyPath = findDisplayProperty(objectType.properties).name;
            if (objectSets[objectType.name].size > -1) {
                data.data.children[objectType.name] = { label: objectType.label, selectable: true, id: `dataobjects${objectType.name}`, children: {} };

                objectSets[objectType.name].forEach((object) => {
                    const objectLabel = getNestedPropertyValueFromObject(object, displayPropertyPath);
                    data.data.children[objectType.name].children[objectLabel] = { label: objectLabel, id: object.id, type: "object" };
                });

                // TODO add ratings as children for object?
            }
        }
    }
}

function addObjectTypes(radarData, data) {
    if (radarData.model?.objectTypes != null) {
        for (let i = 0; i < Object.keys(radarData.model.objectTypes).length; i++) {
            const objectType = radarData.model.objectTypes[Object.keys(radarData.model.objectTypes)[i]];
            const objectTypeNode = { label: objectType.label, selectable: true, id: `objectType${i}`, children: { properties: { label: "Properties", children: {} } } };
            if (objectType.properties != null) {
                for (let j = 0; j < Object.keys(objectType.properties).length; j++) {
                    const property = objectType.properties[Object.keys(objectType.properties)[j]];
                    objectTypeNode.children.properties.children[Object.keys(objectType.properties)[j]] =
                    {
                        label: property.label == null ? property.name : property.label, propertyPath: `object.${Object.keys(objectType.properties)[j]}`,
                        objectType: objectType.name, type: "objectType",
                        data: property
                    };
                }
            }
            data.model.children.objectTypes.children[Object.keys(radarData.model.objectTypes)[i]] = objectTypeNode;
        }
    }
}

function addRatingTypes(radarData, data) {
    if (radarData.model?.ratingTypes != null) {
        for (let i = 0; i < Object.keys(radarData.model.ratingTypes).length; i++) {
            const ratingType = radarData.model.ratingTypes[Object.keys(radarData.model.ratingTypes)[i]];
            const ratingTypeNode = {
                label: ratingType.label != null ? ratingType.label : Object.keys(radarData.model.ratingTypes)[i], selectable: true, id: `ratingType${i}`,
                children: { properties: { label: "Properties", children: {} } }
            };
            if (ratingType.properties != null) {
                for (let j = 0; j < Object.keys(ratingType.properties).length; j++) {
                    const property = ratingType.properties[Object.keys(ratingType.properties)[j]];
                    ratingTypeNode.children.properties.children[Object.keys(ratingType.properties)[j]] =
                        { label: property.label, property: property, ratingType: ratingType.name, type: "ratingType", propertyPath: Object.keys(ratingType.properties)[j] };
                }
            }
            data.model.children.ratingTypes.children[Object.keys(radarData.model.ratingTypes)[i]] = ratingTypeNode;
        }
    }
}
