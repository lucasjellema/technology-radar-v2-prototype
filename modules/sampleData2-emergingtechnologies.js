export { getSampleData }
const getSampleData = () => {
    return sample
}

const technologies = [
    
    {label:"AR Cloud"},
    {label:"Distributed Cloud"},
    {label:"Tokenization"},
    {label:"Smart Personalization"},
    {label:"Application Ecosystems"},
    {label:"Low-Code Application Platform"},
    {label:"Distributed Ledgers"},
    {label:"Productization of Data"},
    {label:"Smart Contract"},
    {label:"Packaged Business Capabilities"},
    {label:"mmWave 5G"},
    {label:"AI-Generated Composite Applications"},
    
    {label:"IoT Platforms"},
    {label:"Advanced Virtual Assistants"},
    {label:"Advanced Computer Vision"},
    
    {label:"Deep Learning"},
    {label:"Composite AI"},
    {label:"Digital Twin"},
    
    {label:"Quantum Computing"},
    {label:"Edge AI"},
    {label:"Transformer-Based Language Models"},
    {label:"Cloud AI Developer Services"},
    {label:"Model Compression"},
    {label:""},
    
    
]

// these genericRatingProperties are applied to every ratingType
const genericRatingProperties = [{ name: "scope", description: "The scope or context to which the rating applies" }
    , { name: "author", description: "The name of the person who made the judgement" }
    , { name: "timestamp", description: "When was this rating defined" }
    , { name: "tags", description: "Which tags are associated with this rating (tags are for example used for thematic filtering of ratings)" }
    , { name: "comment", description: "Additional remark regarding this rating" }
]

const model =
{
    objectTypes: [
        { name: "technology", properties: [] },
        { name: "consultant" },
        { name: "workitem" }
    ]
    , ratingType: [
        {
            name: "technologyAdoption", objectType: "technology", properties: [
                {
                    name: "ambition", description: "The current outlook or intent regarding this technology", defaultValue: "identified"
                    , values: [{ value: "identified", label: "Identified" }, { value: "hold", label: "Hold" }, { value: "assess", label: "Assess" }, { value: "adopt", label: "Adopt" }]
                },
                {
                    name: "magnitude", description: "The relative size of the technology (in terms of investment, people involved, percentage of revenue)", defaultValue: "medium"
                    , values: [{ value: "tiny", label: "Tiny or Niche" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]
                }

            ]
        }
        , { name: "cvRating", objectType: "technology", properties: [] }
        , { name: "allocationPipeline", objectType: "consultant", properties: [] }
        , { name: "progressStatus", objectType: "workitem", properties: [] }
    ]
}

// generate a viewpoint: select radar template, select rating type (and indirect object type), define filter - to restrict objects & ratings)
//                       select viewpoint template - which defines mapping of properties to visual characteristics (sector, ring, shape, color, size, ..)
//                       define viewpoint properties: title, description, visual overrides

const viewpoints = [
    {
        name: "My Technology Radar - Integration"
        , template: null
        , ratingTypes: []  // which rating type(s) - for which objectTypes - are displayed
        , propertyVisualMaps: { // mapping between property values in rating and object on the one hand and the corresponding visual elements on the other sectors, rings, shapes, colors, sizes ;
                                // which property value maps to which of visual elements (indicated by their sequence number in th template) 
            // note: the order of elements in these maps drives the order in which color/size/shape elements are shown in legend and context menu
            sizeMap: { "low": 0, "medium":1,"high":2, "veryhigh":2 } // the rating magnitude property drives the size; the values of magnitude are mapped to values for size
            , sectorMap: { "businessEnabler": 0, "interfaceExperience": 1, "productivityRevolution":2}
            , ringMap: { "68yrs": 0, "36yrs": 1, "13yrs": 2,"now":3 } // the rating ambition property drives the ring; the values of ambition are mapped to values for ring
            , shapeMap: {"other":0}
            , colorMap: { "low": 0, "medium":1,"high":2, "veryhigh":3}
        },
        blipDisplaySettings: {showImages: false, showShapes: true, showLabels:true
            , applyShapes:true, applySizes:true, applyColors:true, tagFilter:""}
        //for example: property category in objectType technology is mapped to sector in radar
        // the specific value mapping: maps technology.category values to sectors in the selected radar template
        // one of the sectors can be used to assign "others" - any value not already explicity mapped
        // when there is no "others" sector indicated or a technology.category is explicitly not mapped, then the corresponding blips are not visible
        , blips: [ // derived 
            { id: "1", rating: null, x: 300, y: 200, hidden: false },
        ]
    }
]

const generateBlips = () => {
    // for all technologies
    // create a rating
    // and for each rating, create a blip
    const blips = []
    for (let i = 0; i < technologies.length; i++) {
        const object = technologies[i]
        const rating = {
           ambition:"now",
             magnitude: Math.random() < 0.01 ? "medium" : (Math.random() < 0.9 ? "high" : "low")
            , experience: Math.random() < 0.01 ? "medium" : (Math.random() < 0.9 ? "high" : "low")
            , timestamp : Date.now()
            , scope: "Conclusion"
            , comment : "no comment yet"
            , author : "system generated"
            , object: object
        }
        if (object.category==null) {object.category="businessEnabler"}
        const blip = { id: `${i}`, rating: rating, }
        blips.push(blip)
    }
    return blips
}



/*
rating : object - ratingType: property assignments (timestamp, scope, scorer, tags, notes)

viewpoint (actual representation on template of ratings)
- title/description
- based on radar template
- contains blips - visual mapping of ratings (x,y, color/shape/size, label )  

snapshot = viewpoint frozen in time

*/


const sample = {
    "viewpoints": [
        {
            "name": "Emerging Technologies and Trends Impact Radar",
            "template": {
                "svg_id": "radarSVGContainer",
                "width": 1450,
                "height": 1100,
                "topLayer": "rings",
                "selectedRing": 0,
                "selectedSector": 0,
                "rotation": 0,
                "maxRingRadius": 450,
                "sectorBoundariesExtended": true,
                "editMode": false,
                "defaultFont": {
                    "color": "black",
                    "fontSize": "38px",
                    "fontFamily": "Arial, Helvetica",
                    "fontStyle": "italic",
                    "fontWeight": "bold"
                },
                "title": {
                    "text": "Emerging Technologies",
                    "x": -700,
                    "y": -520,
                    "font": {
                        "fontSize": "34px",
                        "fontFamily": "Courier"
                    }
                },
                "colors": {
                    "background": "#FFF",
                    "grid": "#bbb",
                    "inactive": "#ddd"
                },
                "ringConfiguration": {
                    "outsideRingsAllowed": true,
                    "font": {
                        "color": "blacvk",
                        "fontSize": "24px",
                        "fontFamily": "Arial, Helvetica",
                        "fontStyle": "normal",
                        "fontWeight": "bold"
                    },
                    "stroke": {
                        "strokeWidth": 6,
                        "strokeColor": "white",
                        "strokeArray": "100 1"
                    },
                    "rings": [
                        {
                            "label": "6-8 years",
                            "width": 0.25,
                            "backgroundImage": {},
                            "backgroundColor": "#737071"
                        },
                        {
                            "label": "3-6 years",
                            "width": 0.2,
                            "backgroundImage": {},
                            "backgroundColor": "#bdb9ba"
                        },
                        {
                            "label": "1-3 years",
                            "width": 0.2,
                            "backgroundImage": {},
                            "backgroundColor": "#ebe6e7"
                        },
                        {
                            "label": "Now (0-1 year)",
                            "width": 0.35,
                            "backgroundImage": {},
                            "backgroundColor": "#ffdb26"
                        }
                    ]
                },
                "sectorConfiguration": {
                    "outsideSectorsAllowed": true,
                    "font": {
                        "color": "#000",
                        "fontSize": "28px",
                        "fontFamily": "Arial, Helvetica",
                        "fontStyle": "normal",
                        "fontWeight": "normal"
                    },
                    "stroke": {
                        "strokeWidth": 6,
                        "strokeColor": "white",
                        "strokeArray": "100 1"
                    },
                    "sectors": [
                        {
                            "label": "Business Enablers",
                            "angle": 0.3333333333333333,
                            "backgroundImage": {},
                            "backgroundColor": "white",
                            "outerringBackgroundColor": "#FFF"
                        },
                        {
                            "label": "Interfaces and Experiences",
                            "angle": 0.3333333333333333,
                            "backgroundImage": {},
                            "backgroundColor": "white",
                            "outerringBackgroundColor": "#FFF"
                        },
                        {
                            "label": "Productivity Revolution",
                            "angle": 0.3333333333333333,
                            "backgroundImage": {},
                            "backgroundColor": "white",
                            "outerringBackgroundColor": "#FFF"
                        }
                    ]
                },
                "colorsConfiguration": {
                    "label": "Mass",
                    "colors": [
                        {
                            "label": "Low",
                            "color": "#4d94d1",
                            "enabled": true
                        },
                        {
                            "label": "Medium",
                            "color": "#44d4eb",
                            "enabled": true
                        },
                        {
                            "label": "High",
                            "color": "#3471a3",
                            "enabled": true
                        },
                        {
                            "label": "Very High",
                            "color": "#0e0f52",
                            "enabled": true
                        },
                        {
                            "label": "Unassigned",
                            "color": "white"
                        }
                    ]
                },
                "sizesConfiguration": {
                    "label": "Mass",
                    "sizes": [
                        {
                            "label": "Low",
                            "size": 0.55,
                            "enabled": false
                        },
                        {
                            "label": "Medium",
                            "size": 0.8,
                            "enabled": true
                        },
                        {
                            "label": "High",
                            "size": 1.05,
                            "enabled": true
                        },
                        {
                            "label": "Very High",
                            "size": 1.4,
                            "enabled": true
                        },
                        {
                            "label": "Very High",
                            "size": 5,
                            "enabled": true
                        }
                    ]
                },
                "shapesConfiguration": {
                    "label": "Offering",
                    "shapes": [
                        {
                            "label": "Commercial",
                            "shape": "square"
                        },
                        {
                            "label": "Open Source",
                            "shape": "diamond"
                        },
                        {
                            "label": "Label",
                            "shape": "rectangleHorizontal",
                            "enabled": false
                        },
                        {
                            "label": "Other",
                            "shape": "circle",
                            "enabled": false
                        },
                        {
                            "label": "Label",
                            "shape": "star",
                            "enabled": false
                        },
                        {
                            "label": "Label",
                            "shape": "rectangleVertical",
                            "enabled": false
                        },
                        {
                            "label": "Label",
                            "shape": "triangle",
                            "enabled": false
                        },
                        {
                            "label": "Label",
                            "shape": "ring",
                            "enabled": false
                        },
                        {
                            "label": "Label",
                            "shape": "plus",
                            "enabled": false
                        }
                    ]
                }
            },
            "ratingTypes": [],
            "propertyVisualMaps": {
                "sizeMap": {
                    "low": 0,
                    "medium": 1,
                    "high": 2,
                    "veryhigh": 3
                },
                "sectorMap": {
                    "businessEnabler": 0,
                    "interfaceExperience": 1,
                    "productivityRevolution": 2
                },
                "ringMap": {
                    "68yrs": 0,
                    "36yrs": 1,
                    "13yrs": 2,
                    "now": 3
                },
                "shapeMap": {
                    "other": 0
                },
                "colorMap": {
                    "low": 0,
                    "medium": 1,
                    "high": 2,
                    "veryhigh": 3
                }
            },
            "blipDisplaySettings": {
                "showImages": false,
                "showShapes": true,
                "showLabels": true,
                "applyShapes": false,
                "applySizes": false,
                "applyColors": true,
                "tagFilter": ""
            },
            "blips": [
                {
                    "id": "0",
                    "rating": {
                        "ambition": "68yrs",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "AR Cloud",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 97.01754760742188,
                    "y": -383.282470703125
                },
                {
                    "id": "1",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Distributed Cloud",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 81.1558837890625,
                    "y": -264.5555419921875
                },
                {
                    "id": "2",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Tokenization",
                            "category": "businessEnabler"
                        }
                    },
                    "x": -85.02020263671875,
                    "y": -262.0058898925781
                },
                {
                    "id": "3",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Smart Personalization",
                            "category": "interfaceExperience"
                        }
                    },
                    "x": -203.8729705810547,
                    "y": -189.46595764160156
                },
                {
                    "id": "4",
                    "rating": {
                        "ambition": "13yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Application Ecosystems",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 76.7358169555664,
                    "y": -181.89628982543945
                },
                {
                    "id": "5",
                    "rating": {
                        "ambition": "now",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Low-Code Application Platform",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 29.67843246459961,
                    "y": -50.70744323730469
                },
                {
                    "id": "6",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "medium",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Distributed Ledgers",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 232.503662109375,
                    "y": -190.65847778320312
                },
                {
                    "id": "7",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "medium",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Productization of Data",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 268.4955749511719,
                    "y": -113.04769897460938
                },
                {
                    "id": "8",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Smart Contract",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 290.99705505371094,
                    "y": -34.341400146484375
                },
                {
                    "id": "9",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "medium",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Packaged Business Capabilities",
                            "category": "businessEnabler"
                        }
                    },
                    "x": 165.34857177734375,
                    "y": -223.74972534179688
                },
                {
                    "id": "10",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "medium",
                        "experience": "medium",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "mmWave 5G",
                            "category": "businessEnabler"
                        }
                    },
                    "x": -124.58564758300781,
                    "y": -252.63987731933594
                },
                {
                    "id": "11",
                    "rating": {
                        "ambition": "68yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "AI-Generated Composite Applications",
                            "category": "businessEnabler"
                        }
                    },
                    "x": -145.38397216796875,
                    "y": -338.10899353027344
                },
                {
                    "id": "12",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "IoT Platforms",
                            "category": "interfaceExperience"
                        }
                    },
                    "x": -290.49783325195307,
                    "y": 17.463623046875
                },
                {
                    "id": "13",
                    "rating": {
                        "ambition": "13yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Advanced Virtual Assistants",
                            "category": "interfaceExperience"
                        }
                    },
                    "x": -189.22834014892578,
                    "y": -20.5234375
                },
                {
                    "id": "14",
                    "rating": {
                        "ambition": "now",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Advanced Computer Vision",
                            "category": "interfaceExperience"
                        }
                    },
                    "x": -108.55587577819824,
                    "y": -29.500450134277344
                },
                {
                    "id": "15",
                    "rating": {
                        "ambition": "now",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Deep Learning",
                            "category": "productivityRevolution"
                        }
                    },
                    "x": 112.3800048828125,
                    "y": 57.485015869140625
                },
                {
                    "id": "16",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Composite AI",
                            "category": "productivityRevolution"
                        }
                    },
                    "x": 68.90846252441406,
                    "y": 297.56378173828125
                },
                {
                    "id": "17",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "high",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Digital Twin",
                            "category": "interfaceExperience"
                        }
                    },
                    "x": -189.78863525390625,
                    "y": 232.59970092773438
                },
                {
                    "id": "18",
                    "rating": {
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Quantum Computing",
                            "category": "productivityRevolution"
                        }
                    },
                    "x": -144.52685546875,
                    "y": 490.431640625
                },
                {
                    "id": "19",
                    "rating": {
                        "ambition": "now",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Edge AI",
                            "category": "productivityRevolution"
                        }
                    },
                    "x": -7.9639434814453125,
                    "y": 112.60767364501953
                },
                {
                    "id": "20",
                    "rating": {
                        "ambition": "13yrs",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Transformer-Based Language Models",
                            "category": "interfaceExperience"
                        }
                    },
                    "x": -167.39625549316406,
                    "y": 112.29374694824219
                },
                {
                    "id": "21",
                    "rating": {
                        "ambition": "now",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Cloud AI Developer Services",
                            "category": "productivityRevolution"
                        }
                    },
                    "x": 63.934173583984375,
                    "y": 114.29736328125
                },
                {
                    "id": "22",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "high",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Model Compression",
                            "category": "productivityRevolution"
                        }
                    },
                    "x": 280.3481750488281,
                    "y": 67.96969604492188
                },
                {
                    "id": "23",
                    "rating": {
                        "magnitude": "low",
                        "experience": "low",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "",
                            "category": "interfaceExperience"
                        }
                    },
                    "x": -700.9317321777344,
                    "y": 542.3108825683594
                }
            ]
        }
    ],
    "templates": [
        {
            "svg_id": "radarSVGContainer",
            "width": 1450,
            "height": 1100,
            "topLayer": "rings",
            "selectedRing": 0,
            "selectedSector": 0,
            "rotation": 0,
            "maxRingRadius": 450,
            "sectorBoundariesExtended": true,
            "editMode": false,
            "defaultFont": {
                "color": "black",
                "fontSize": "38px",
                "fontFamily": "Arial, Helvetica",
                "fontStyle": "italic",
                "fontWeight": "bold"
            },
            "title": {
                "text": "Emerging Technologies",
                "x": -700,
                "y": -520,
                "font": {
                    "fontSize": "34px",
                    "fontFamily": "Courier"
                }
            },
            "colors": {
                "background": "#FFF",
                "grid": "#bbb",
                "inactive": "#ddd"
            },
            "ringConfiguration": {
                "outsideRingsAllowed": true,
                "font": {
                    "color": "blacvk",
                    "fontSize": "24px",
                    "fontFamily": "Arial, Helvetica",
                    "fontStyle": "normal",
                    "fontWeight": "bold"
                },
                "stroke": {
                    "strokeWidth": 6,
                    "strokeColor": "white",
                    "strokeArray": "100 1"
                },
                "rings": [
                    {
                        "label": "6-8 years",
                        "width": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "#737071"
                    },
                    {
                        "label": "3-6 years",
                        "width": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "#bdb9ba"
                    },
                    {
                        "label": "1-3 years",
                        "width": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "#ebe6e7"
                    },
                    {
                        "label": "Now (0-1 year)",
                        "width": 0.35,
                        "backgroundImage": {},
                        "backgroundColor": "#ffdb26"
                    }
                ]
            },
            "sectorConfiguration": {
                "outsideSectorsAllowed": true,
                "font": {
                    "color": "#000",
                    "fontSize": "28px",
                    "fontFamily": "Arial, Helvetica",
                    "fontStyle": "normal",
                    "fontWeight": "normal"
                },
                "stroke": {
                    "strokeWidth": 6,
                    "strokeColor": "white",
                    "strokeArray": "100 1"
                },
                "sectors": [
                    {
                        "label": "Business Enablers",
                        "angle": 0.3333333333333333,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Interfaces and Experiences",
                        "angle": 0.3333333333333333,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Productivity Revolution",
                        "angle": 0.3333333333333333,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    }
                ]
            },
            "colorsConfiguration": {
                "label": "Mass",
                "colors": [
                    {
                        "label": "Low",
                        "color": "#4d94d1",
                        "enabled": true
                    },
                    {
                        "label": "Medium",
                        "color": "#44d4eb",
                        "enabled": true
                    },
                    {
                        "label": "High",
                        "color": "#3471a3",
                        "enabled": true
                    },
                    {
                        "label": "Very High",
                        "color": "#0e0f52",
                        "enabled": true
                    },
                    {
                        "label": "Unassigned",
                        "color": "white"
                    }
                ]
            },
            "sizesConfiguration": {
                "label": "Mass",
                "sizes": [
                    {
                        "label": "Low",
                        "size": 0.55,
                        "enabled": false
                    },
                    {
                        "label": "Medium",
                        "size": 0.8,
                        "enabled": true
                    },
                    {
                        "label": "High",
                        "size": 1.05,
                        "enabled": true
                    },
                    {
                        "label": "Very High",
                        "size": 1.4,
                        "enabled": true
                    },
                    {
                        "label": "Very High",
                        "size": 5,
                        "enabled": true
                    }
                ]
            },
        "shapesConfiguration": {
                "label": "Offering",
                "shapes": [
                    {
                        "label": "Commercial",
                        "shape": "square"
                    },
                    {
                        "label": "Open Source",
                        "shape": "diamond"
                    },
                    {
                        "label": "Label",
                        "shape": "rectangleHorizontal",
                        "enabled": false
                    },
                    {
                        "label": "Other",
                        "shape": "circle",
                        "enabled": false
                    },
                    {
                        "label": "Label",
                        "shape": "star",
                        "enabled": false
                    },
                    {
                        "label": "Label",
                        "shape": "rectangleVertical",
                        "enabled": false
                    },
                    {
                        "label": "Label",
                        "shape": "triangle",
                        "enabled": false
                    },
                    {
                        "label": "Label",
                        "shape": "ring",
                        "enabled": false
                    },
                    {
                        "label": "Label",
                        "shape": "plus",
                        "enabled": false
                    }
                ]
            }
        }
    ],
    "objects": []
}


sample.viewpoints[0].template = sample.templates[0]
//sample.viewpoints[0].blips = generateBlips()
//sample.viewpoints[0].blips = generateBlips()