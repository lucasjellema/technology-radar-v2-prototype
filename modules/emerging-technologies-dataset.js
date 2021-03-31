export { getDataSet }
const getDataSet = () => {
    return dataset
}

const dataset = 
{
    "model": {
        "objectTypes": {
            "technology": {
                "name": "technology",
                "label": "Technology",
                "properties": {
                    "label": {
                        "label": "Label",
                        "type": "string",
                        "defaultValue": "Some Technology",
                        "displayLabel": true
                    },
                    "description": {
                        "label": "Description",
                        "type": "text"
                    },
                    "reference": {
                        "label": "Internet Resource",
                        "type": "url"
                    },
                    "image": {
                        "label": "Visualization",
                        "type": "image"
                    },
                    "tags": {
                        "label": "Tags",
                        "type": "tags"
                    },
                    "category": {
                        "label": "Category",
                        "type": "string",
                        "allowableValues": [
                            {
                                "value": "businessEnabler",
                                "label": "Business Enabler"
                            },
                            {
                                "value": "interfaceExperience",
                                "label": "Interface Experience"
                            },
                            {
                                "value": "productivityRevolution",
                                "label": "Productivity Revolution"
                            }
                        ],
                        "defaultValue": "businessEnabler"
                    }
                }
            }
        },
        "ratingTypes": {
            "technologyAdoption": {
                "label": "Technology Adoption",
                "objectType": {
                    "name": "technology",
                    "label": "Technology",
                    "properties": {
                        "label": {
                            "label": "Label",
                            "type": "string",
                            "defaultValue": "Some Technology",
                            "displayLabel": true
                        },
                        "description": {
                            "label": "Description",
                            "type": "text"
                        },
                        "reference": {
                            "label": "Internet Resource",
                            "type": "url"
                        },
                        "image": {
                            "label": "Visualization",
                            "type": "image"
                        },
                        "tags": {
                            "label": "Tags",
                            "type": "tags"
                        },
                        "category": {
                            "label": "Category",
                            "type": "string",
                            "allowableValues": [
                                {
                                    "value": "businessEnabler",
                                    "label": "Business Enabler"
                                },
                                {
                                    "value": "interfaceExperience",
                                    "label": "Interface Experience"
                                },
                                {
                                    "value": "productivityRevolution",
                                    "label": "Productivity Revolution"
                                }
                            ],
                            "defaultValue": "businessEnabler"
                        }
                    }
                },
                "properties": {
                    "ambition": {
                        "label": "Range",
                        "description": "Range estimates the distance (in years) that the technology or trend is from “crossing the chasm” from early-adopter to early majority adoption",
                        "defaultValue": "68yrs",
                        "allowableValues": [
                            {
                                "value": "68yrs",
                                "label": "6-8 Years"
                            },
                            {
                                "value": "36yrs",
                                "label": "3-6 Years"
                            },
                            {
                                "value": "13yrs",
                                "label": "1-3 Years"
                            },
                            {
                                "value": "now",
                                "label": "Now (0-1 Years)"
                            }
                        ]
                    },
                    "magnitude": {
                        "label": "Mass",
                        "description": "This indicates how substantial an impact the technology or trend will have on existing products and markets.",
                        "defaultValue": "medium",
                        "allowableValues": [
                            {
                                "value": "low",
                                "label": "Low"
                            },
                            {
                                "value": "medium",
                                "label": "Medium"
                            },
                            {
                                "value": "high",
                                "label": "High"
                            },
                            {
                                "value": "veryhigh",
                                "label": "Very High"
                            }
                        ]
                    },
                    "experience": {
                        "label": "Experience/Maturity",
                        "description": "The relative time this technology has been around (for us)",
                        "defaultValue": "medium",
                        "allowableValues": [
                            {
                                "value": "short",
                                "label": "Fresh"
                            },
                            {
                                "value": "medium",
                                "label": "Intermediate"
                            },
                            {
                                "value": "long",
                                "label": "Very Mature"
                            }
                        ]
                    },
                    "scope": {
                        "label": "Scope",
                        "description": "The scope or context to which the rating applies",
                        "defaultValue": "Conclusion"
                    },
                    "author": {
                        "label": "Author/Evaluator",
                        "description": "The name of the person who made the judgement",
                        "defaultValue": "System Generated"
                    },
                    "timestamp": {
                        "label": "Time of Evaluation",
                        "description": "When was this rating defined"
                    },
                    "comment": {
                        "label": "Comment/Rationale",
                        "description": "Additional remark regarding this rating",
                        "type": "text"
                    }
                }
            }
        }
    },
    "viewpoints": [
        {
            "name": "Emerging Technologies and Trends Impact Radar",
            "id": "emerging-tech-trends",
            "ratingType": "technologyAdoption",
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
                "blip": {
                    "label": "object.label",
                    "image": "object.image"
                },
                "size": {
                    "property": "magnitude",
                    "valueMap": {
                        "low": 0,
                        "medium": 1,
                        "high": 2,
                        "veryhigh": 3
                    }
                },
                "sector": {
                    "property": "object.category",
                    "valueMap": {
                        "businessEnabler": 0,
                        "interfaceExperience": 1,
                        "productivityRevolution": 2
                    }
                },
                "ring": {
                    "property": "ambition",
                    "valueMap": {
                        "68yrs": 0,
                        "36yrs": 1,
                        "13yrs": 2,
                        "now": 3
                    }
                },
                "shape": {
                    "property": "object.offering",
                    "valueMap": {
                        "other": 0
                    }
                },
                "color": {
                    "property": "experience",
                    "valueMap": {
                        "low": 0,
                        "medium": 1,
                        "high": 2,
                        "veryhigh": 3
                    }
                }
            },
            "blipDisplaySettings": {
                "showImages": false,
                "showShapes": true,
                "showLabels": true,
                "applyShapes": false,
                "applySizes": true,
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
                            "category": "businessEnabler",
                            "id": "aad68517-61fb-4026-8748-be3b0ea2d9df"
                        },
                        "id": "1079e455-e641-4f9e-ae00-1415f1440510"
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
                            "category": "businessEnabler",
                            "id": "dfe40b87-5ba8-487c-987b-7b0c961e5aa5"
                        },
                        "id": "8ad85663-e841-4dc6-81d7-55d1e378124f"
                    },
                    "x": 91.1558837890625,
                    "y": -270.5555419921875
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
                            "category": "businessEnabler",
                            "id": "3fb726d3-dd5f-418a-b859-8c278c73edb5"
                        },
                        "id": "99a05731-0276-4df2-a8cc-34f8ac75db7d"
                    },
                    "x": -58.02020263671875,
                    "y": -268.0058898925781
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
                            "category": "interfaceExperience",
                            "id": "428a2fca-8051-4044-a73c-fa71fe232624"
                        },
                        "id": "ab7fcf80-2a26-4309-a167-d9485322a5d0"
                    },
                    "x": -203.8729705810547,
                    "y": -189.46595764160156
                },
                {
                    "id": "4",
                    "rating": {
                        "ambition": "13yrs",
                        "magnitude": "medium",
                        "experience": "medium",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Application Ecosystems",
                            "category": "businessEnabler",
                            "id": "c79be77b-be15-459f-9dc7-c1e3d4d036eb"
                        },
                        "id": "e4182cb4-0e64-413c-b9b5-394a0d9f27f2"
                    },
                    "x": 94.7358169555664,
                    "y": -158.8962860107422
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
                            "category": "businessEnabler",
                            "id": "feeb0394-37b1-4a0c-9936-aa4591d435bf"
                        },
                        "id": "ed706ad3-9663-4a53-b8f8-d98cb2dabdde"
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
                            "category": "businessEnabler",
                            "id": "7220d341-528d-4fdc-a9b7-ae51f58e25ed"
                        },
                        "id": "ece7f7fa-7ace-46b4-89ee-c80c60388fc0"
                    },
                    "x": 232.503662109375,
                    "y": -190.65847778320312
                },
                {
                    "id": "7",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "medium",
                        "experience": "medium",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Productization of Data",
                            "category": "businessEnabler",
                            "id": "ddf6c64a-654b-4e69-8308-c85c112a362e"
                        },
                        "id": "d0dc032b-c159-4e6c-8a41-aa3e143f674b"
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
                            "category": "businessEnabler",
                            "id": "08b1c110-a5a1-43a4-b51c-a50ffd459b06"
                        },
                        "id": "50cc08f2-8962-4cd8-940a-032a02df7705"
                    },
                    "x": 290.99705505371094,
                    "y": -34.341400146484375
                },
                {
                    "id": "9",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "medium",
                        "experience": "medium",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Packaged Business Capabilities",
                            "category": "businessEnabler",
                            "id": "296ba436-e8fa-49f1-83f7-64799368d451"
                        },
                        "id": "0befb550-1a42-4958-b2ad-07b004633e0a"
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
                            "category": "businessEnabler",
                            "id": "0cd2bfe7-ad29-4a6b-afbd-28016e818d04"
                        },
                        "id": "1d199d0f-3ce7-414c-9331-6826bbefa08b"
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
                            "category": "businessEnabler",
                            "id": "e9e2b387-6835-4bf3-a7d3-799dbf6a0ffb"
                        },
                        "id": "796e54ca-6b56-4b1a-988e-6c6e7b5850e4"
                    },
                    "x": -145.38397216796875,
                    "y": -338.10899353027344
                },
                {
                    "id": "12",
                    "rating": {
                        "ambition": "36yrs",
                        "magnitude": "veryhigh",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "IoT Platforms",
                            "category": "interfaceExperience",
                            "id": "7d7503a8-0537-480a-b2fd-fccb4a3ce1d3"
                        },
                        "id": "c59e867a-3898-41bb-b031-8504a8460eb5"
                    },
                    "x": -290.4978332519531,
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
                            "category": "interfaceExperience",
                            "id": "79982341-a313-48f0-97a0-de1c4377886b"
                        },
                        "id": "43a74400-cf82-4f4f-9093-6c619f8f3deb"
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
                            "category": "interfaceExperience",
                            "id": "944f020c-a44e-4672-86a0-2b8816b07232"
                        },
                        "id": "9b9a7d80-5ff5-47fd-be32-e25894ee9d52"
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
                            "category": "productivityRevolution",
                            "id": "dc17258c-d126-4b3c-b220-08f767c3e964"
                        },
                        "id": "4effa573-f00e-4412-8d23-b80a9ddbf0a6"
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
                            "category": "productivityRevolution",
                            "id": "bd084975-f61f-4510-bc63-effa6cfbedd8"
                        },
                        "id": "dcbdd8f5-64fb-42e9-9bc7-a12d7c23d389"
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
                            "category": "interfaceExperience",
                            "id": "7275466d-3bb7-4ce5-a68d-0cd20738f765"
                        },
                        "id": "2c8bc9b6-e716-4e82-ba98-868716797a36"
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
                            "category": "productivityRevolution",
                            "id": "95fc7854-d208-496f-b636-5b555a93adc3"
                        },
                        "id": "5deab9f6-974d-4804-961f-fe4d34845f75"
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
                            "category": "productivityRevolution",
                            "id": "2e76dcac-be22-41ba-8d57-3b35cc86f2ba"
                        },
                        "id": "f332efc9-42cd-47bd-865c-ee4dfa7be4f0"
                    },
                    "x": -26.963943481445312,
                    "y": 125.60767364501953
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
                            "category": "interfaceExperience",
                            "id": "26c9c366-329f-457a-bdfa-c432a9c57199"
                        },
                        "id": "a6efd136-1efc-4f57-ba00-22f0f329cbe9"
                    },
                    "x": -167.39625549316406,
                    "y": 112.29374694824219
                },
                {
                    "id": "21",
                    "rating": {
                        "ambition": "now",
                        "magnitude": "veryhigh",
                        "experience": "veryhigh",
                        "timestamp": 1616445531644,
                        "scope": "Conclusion",
                        "comment": "no comment yet",
                        "author": "system generated",
                        "object": {
                            "label": "Cloud AI Developer Services",
                            "category": "productivityRevolution",
                            "id": "e599346a-883f-42cd-a20b-03a2e7157162"
                        },
                        "id": "f397d877-e3c6-45ca-8922-d5013991745c"
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
                            "category": "productivityRevolution",
                            "id": "2ce3711e-56b6-4811-aa5f-330972147aeb"
                        },
                        "id": "0472d87f-7890-46dd-a992-ff5f6073527a"
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
                            "category": "interfaceExperience",
                            "id": "57da4b38-10c3-4051-a92c-4a179b80ef26"
                        },
                        "id": "49a396a2-01c7-454f-80b5-150d742544b8"
                    },
                    "x": -700.9317321777344,
                    "y": 542.3108825683594
                }
            ]
        }
    ],
    "templates": [],
    "objects": {}
}