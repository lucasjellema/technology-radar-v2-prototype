export { launchDatamodelConfigurator }
import { drawRadar, subscribeToRadarEvents, publishRadarEvent } from './radar.js';
import { getViewpoint, getData, publishRefreshRadar } from './data.js';
import { initializeTree } from './tree.js'

import { capitalize, getPropertyFromPropertyPath, populateFontsList, createAndPopulateDataListFromBlipProperties, undefinedToDefined, getAllKeysMappedToValue, getNestedPropertyValueFromObject, setNestedPropertyValueOnObject, initializeImagePaster, populateSelect, getElementValue, setTextOnElement, getRatingTypeProperties, showOrHideElement } from './utils.js'

const launchDatamodelConfigurator = (viewpoint, drawRadarBlips) => {
    showOrHideElement("modalMain", true)
    setTextOnElement("modalMainTitle", "Radar Configurator - Data Model")
    document.getElementById("datamodelConfigurationTab").classList.add("warning") // define a class SELECTEDTAB 
    const contentContainer = document.getElementById("modalMainContentContainer")
    contentContainer.innerHTML =''

    const html =` <div><div id="datamodelTreeContainer">
    <div>
        <h1>Radar Data Viewer</h1>

        <section>
        <table>
        <tr>
        <td>
            <div id="datamodelTree" >

            </div>
            </td>
            <td class="">
            <div id="display" ></div>
            </td>
            </tr>
            </table>
        </section>
    </div>
    </div
    <br />
</div>`
contentContainer.innerHTML = html
initializeTree("datamodelTree",getData())
}