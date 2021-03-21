export { getSampleData }
const getSampleData = () => {
    return sample
}

const technologies = [
    {
        label: "Kubernetes", category: "infrastructure", image: "data:image/png;base64,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"
        , homepage: "", tags: ["container", "cncf", "open source", "cluster"], offering:"oss"
    },

    { label: "Java", category: "language", image: "https://logoeps.com/wp-content/uploads/2013/03/java-eps-vector-logo.png", homepage: "", tags: ['programming', 'java', 'open source', 'oo'] , offering:"oss"},
    { label: "Python", category: "language", image: "", homepage: "", tags: ["", ""] , offering:"oss"},
    {
        label: "PostgreSQL", category: "database", image: "https://w7.pngwing.com/pngs/559/367/png-transparent-postgresql-object-relational-database-oracle-database-freebsd-icon-text-logo-head.png"
        , homepage: "https://www.postgresql.org/", tags: ["open source", "rdbms", "sql", "acid"], offering:"oss"
    },
    {
        label: "Elasticsearch", category: "database", image: "data:image/png;base64,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"
        , homepage: "", tags: ['data', 'data analytics', 'nosql', 'database'], offering:"oss"
    },
    {
        label: "Redis", category: "database", image: "https://www.nditech.org/sites/default/files/styles/small_photo/public/redis-logo.png?itok=LrULOkWT"
        , homepage: "", tags: ['data', 'database', 'cache', 'open source'], offering:"oss"
    },
    {
        label: "Oracle Database", category: "database", image: "https://i1.wp.com/deepinthecode.com/wp-content/uploads/2018/09/Oracle_Database.png?fit=432%2C203&ssl=1"
        , homepage: "", tags: ['data', 'database', 'sql', 'rdbms', 'oracle'], offering:"commercial"
    },
    {
        label: "Node.js", category: "language", image: "data:image/png;base64,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"
        , homepage: "", tags: ['programming', 'open source'], offering:"oss"
    },
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
            sizeMap: { "tiny": 0, "medium": 1, "large": 2 } // the rating magnitude property drives the size; the values of magnitude are mapped to values for size
            , sectorMap: { "database": 0, "language": 3, "infrastructure": 2,"concepts": 4,"libraries":1 } // the object category property drives the sector; the values of category are mapped to values for sector
            , ringMap: { "hold": 1, "assess": 2, "adopt": 4, "spotted": 0,"trial":3 } // the rating ambition property drives the ring; the values of ambition are mapped to values for ring
            , shapeMap: {"oss" : 1, "commercial" : 0 ,"other":3}
            , colorMap: { "short": 0, "long":1,"intermediate":3, "other":2}
        },
        blipDisplaySettings: {showImages: false, showShapes: true, showLabels:true}
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
           // ambition: Math.random() < 0.3 ? "spotted" : (Math.random() < 0.5 ? "assess" : "adopt")
             magnitude: Math.random() < 0.3 ? "medium" : (Math.random() < 0.5 ? "tiny" : "large")
            , experience: Math.random() < 0.3 ? "short" : (Math.random() < 0.5 ? "long" : "medium")
            , timestamp : Date.now()
            , scope: "Conclusion"
            , comment : "no comment yet"
            , author : "system generated"
            , object: object
        }
        const blip = { id: `${i}`, rating: rating, }
        blips.push(blip)
    }
    return blips
}

viewpoints[0].blips = generateBlips()

/*
rating : object - ratingType: property assignments (timestamp, scope, scorer, tags, notes)

viewpoint (actual representation on template of ratings)
- title/description
- based on radar template
- contains blips - visual mapping of ratings (x,y, color/shape/size, label )  

snapshot = viewpoint frozen in time

*/


const sample = {
    "viewpoints": viewpoints,
    "templates": [
        {
            "svg_id": "radarSVGContainer",
            "width": 1450,
            "height": 1100,
            "topLayer": "sectors",
            "selectedRing": 1,
            "selectedSector": 2,
            "rotation": 0,
            "maxRingRadius": 450,
            "sectorBoundariesExtended": true,
            "editMode": true,
            "defaultFont": {
                "color": "blue",
                "fontSize": "38px",
                "fontFamily": "Arial, Helvetica",
                "fontStyle": "italic",
                "fontWeight": "bold"
            },
            "title": {
                "text": "Conclusion Technology Radar",
                "x": -700,
                "y": -520,
                "font": {
                    "fontSize": "34px",
                    "fontFamily": "Courier"
                }
            },
            "colors": {
                "background": "#fFf",
                "grid": "#bbb",
                "inactive": "#ddd"
            },
            "ringConfiguration": {
                "outsideRingsAllowed": true,
                "font": {
                    "color": "purple",
                    "fontSize": "24px",
                    "fontFamily": "Arial, Helvetica",
                    "fontStyle": "normal",
                    "fontWeight": "normal"
                },
                "stroke": {
                    "strokeWidth": 4,
                    "strokeColor": "blue",
                    "strokeArray": "100 1"
                },
                "rings": [
                    {
                        "label": "Spotted",
                        "width": 0.2,
                        "opacity": 0.2
                    },
                    {
                        "label": "Hold",
                        "width": 0.15
                    },
                    {
                        "label": "Assess",
                        "width": 0.18
                    },
                    {
                        "label": "Trial",
                        "width": 0.12
                    },
                    {
                        "label": "Adopt",
                        "width": 0.35
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
                    "strokeWidth": 2,
                    "strokeColor": "gray",
                    "strokeArray": "100 1"
                },
                "sectors": [
                    {
                        "label": "Data Management",
                        "angle": 0.2,
                        "backgroundImage": {
                        }
                    },
                    {
                        "label": "Libraries & Frameworks",
                        "angle": 0.2,
                        "backgroundImage": {
                        }
                    },
                    {
                        "label": "Infrastructure",
                        "angle": 0.25
                    },
                    {
                        "label": "Languages",
                        "angle": 0.2,
                    },
                    {
                        "label": "Concepts & Methodology",

                        "angle": 0.15
                    }
                ]
            },
            "colorsConfiguration": { "label":"Maturity",
                "colors": [
                    {
                        "label": "Fresh",
                        "color": "green",
                        "enabled": true
                    },
                    {
                        "label": "Been Around",
                        "color": "blue",
                        "enabled": true
                    },
                    {
                        "label": "Very Mature",
                        "color": "gray",
                        "enabled": true
                    },
                    {
                        "label": "Intermediate",
                        "color": "pink",
                        "enabled": true
                    },
                    {
                        "label": "Unassigned",
                        "color": "white"
                    }
                ]
            },
            "sizesConfiguration": {"label":"Relevance",
                "sizes": [
                    {
                        "label": "Niche",
                        "size": 0.7,
                        "enabled": true
                    },
                    {
                        "label": "Medium    ",
                        "size": 0.9,
                        "enabled": false
                    },
                    {
                        "label": "Very relevant",
                        "size": 1.3,
                        "enabled": true
                    },
                    {
                        "label": "Regular",
                        "size": 4
                    },
                    {
                        "label": "Regular",
                        "size": 5,
                        "enabled": false
                    }
                ]
            },
            "shapesConfiguration": {"label":"Offering",
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
        {
            "svg_id": "radarSVGContainer",
            "width": 1450,
            "height": 1000,
            "topLayer": "rings",
            "selectedRing": 1,
            "selectedSector": 0,
            "rotation": 0,
            "maxRingRadius": 450,
            "sectorBoundariesExtended": false,
            "editMode": true,
            "defaultFont": {
                "color": "black",
                "fontSize": "38px",
                "fontFamily": "Arial, Helvetica",
                "fontStyle": "normal",
                "fontWeight": "normal"
            },
            "title": {
                "text": "AMIS Inzet Overzicht ",
                "x": -700,
                "y": -470,
                "font": {
                    "fontSize": "34px"
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
                    "color": "purple"
                },
                "rings": [
                    {
                        "label": "> 3 maanden",
                        "width": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    },
                    {
                        "label": "> 1 maand",
                        "width": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    },
                    {
                        "label": "< 1 maand",
                        "width": 0.25,
                        "opacity": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    },
                    {
                        "label": "Beschikbaar",
                        "width": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    }
                ]
            },
            "sectorConfiguration": {
                "outsideSectorsAllowed": true,
                "font": {
                    "fontSize": "32px",
                    "fontFamily": "Arial, Helvetica"
                },
                "sectors": [
                    {
                        "label": "Frontend",
                        "angle": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Integratie",
                        "angle": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Platform Engineering",
                        "angle": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Regie",
                        "angle": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Platform Beheer",
                        "angle": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    }
                ]
            },
            "colorsConfiguration": {
                "colors": [
                    {
                        "label": "Super Status",
                        "color": "blue",
                        "enabled": true
                    },
                    {
                        "label": "Unassigned",
                        "color": "white",
                        "enabled": false
                    },
                    {
                        "label": "Unassigned",
                        "color": "white",
                        "enabled": false
                    },
                    {
                        "label": "Unassigned",
                        "color": "white",
                        "enabled": false
                    },
                    {
                        "label": "Unassigned",
                        "color": "white"
                    }
                ]
            },
            "sizesConfiguration": {
                "sizes": [
                    {
                        "label": "< 8 uur",
                        "size": 1,
                        "enabled": true
                    },
                    {
                        "label": "1-4 dagen",
                        "size": 2,
                        "enabled": true
                    },
                    {
                        "label": "Full Time",
                        "size": 3,
                        "enabled": true
                    }
                ]
            },
            "shapesConfiguration": {
                "shapes": [
                    {
                        "label": "enkele opties",
                        "shape": "square",
                        "enabled": true
                    },
                    {
                        "label": "goede opties",
                        "shape": "diamond",
                        "enabled": true
                    },
                    {
                        "label": "geen opties",
                        "shape": "rectangleHorizontal",
                        "enabled": true
                    },
                    {
                        "label": "Shape Label",
                        "shape": "circle",
                        "enabled": false
                    }
                ]
            }
        },
        {
            "svg_id": "radarSVGContainer",
            "width": 1450,
            "height": 1000,
            "topLayer": "sectors",
            "selectedRing": 1,
            "selectedSector": 0,
            "rotation": 0,
            "maxRingRadius": 450,
            "sectorBoundariesExtended": false,
            "editMode": true,
            "defaultFont": {
                "color": "black",
                "fontSize": "38px",
                "fontFamily": "Arial, Helvetica",
                "fontStyle": "normal",
                "fontWeight": "normal"
            },
            "title": {
                "text": "Project Management",
                "x": -700,
                "y": -470,
                "font": {
                    "fontSize": "34px"
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
                    "color": "purple"
                },
                "rings": [
                    {
                        "label": "Todo",
                        "width": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    },
                    {
                        "label": "Doing",
                        "width": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    },
                    {
                        "label": "Review",
                        "width": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    },
                    {
                        "label": "Done",
                        "width": 0.2,
                        "opacity": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    },
                    {
                        "label": "Live",
                        "width": 0.2,
                        "backgroundImage": {},
                        "backgroundColor": "white"
                    }
                ]
            },
            "sectorConfiguration": {
                "outsideSectorsAllowed": true,
                "font": {
                    "fontSize": "32px",
                    "fontFamily": "Arial, Helvetica"
                },
                "sectors": [
                    {
                        "label": "Epic 1",
                        "angle": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Epic 4",
                        "angle": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Epic 3",
                        "angle": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    },
                    {
                        "label": "Epic 2",
                        "angle": 0.25,
                        "backgroundImage": {},
                        "backgroundColor": "white",
                        "outerringBackgroundColor": "#FFF"
                    }
                ]
            },
            "colorsConfiguration": {
                "colors": [
                    {
                        "label": "Recent",
                        "color": "#08c42a",
                        "enabled": true
                    },
                    {
                        "label": "Some Time",
                        "color": "#f2f25a",
                        "enabled": true
                    },
                    {
                        "label": "Quite Some Time",
                        "color": "#f29a1f",
                        "enabled": true
                    },
                    {
                        "label": "Very Long",
                        "color": "#f20039",
                        "enabled": true
                    },
                    {
                        "label": "Impediment",
                        "color": "#000000",
                        "enabled": true
                    }
                ]
            },
            "sizesConfiguration": {
                "sizes": [
                    {
                        "label": "Small",
                        "size": 1,
                        "enabled": true
                    },
                    {
                        "label": "Medium",
                        "size": 2,
                        "enabled": true
                    },
                    {
                        "label": "Large",
                        "size": 3,
                        "enabled": true
                    }
                ]
            },
            "shapesConfiguration": {
                "shapes": [
                    {
                        "label": "User Interface",
                        "shape": "square",
                        "enabled": true
                    },
                    {
                        "label": "API",
                        "shape": "diamond",
                        "enabled": true
                    },
                    {
                        "label": "Design",
                        "shape": "rectangleHorizontal",
                        "enabled": true
                    },
                    {
                        "label": "Test",
                        "shape": "circle",
                        "enabled": true
                    }
                ]
            }
        }
    ],
    "objects": []
}

sample.viewpoints[0].template = sample.templates[0]