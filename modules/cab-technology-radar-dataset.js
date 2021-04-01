export { getDataSet }
const getDataSet = () => {
    return dataset
}


const dataset = {
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
                        "type": "string"
                    },
                    "homepage": {
                        "label": "Homepage",
                        "type": "url"
                    },
                    "image": {
                        "label": "Logo",
                        "type": "image"
                    },
                    "vendor": {
                        "label": "Vendor",
                        "type": "string",
                        "discrete": true
                    },
                    "tags": {
                        "label": "Tags",
                        "type": "tags"
                    },
                    "offering": {
                        "label": "Offering",
                        "type": "string",
                        "allowableValues": [
                            {
                                "value": "oss",
                                "label": "Open Source Software"
                            },
                            {
                                "value": "commercial",
                                "label": "Commercial Software"
                            },
                            {
                                "value": "other",
                                "label": "Other type of offering"
                            }
                        ],
                        "defaultValue": "oss"
                    },
                    "category": {
                        "label": "Category",
                        "type": "string",
                        "allowableValues": [
                            {
                                "value": "opsmanagement",
                                "label": "Management"
                            },
                            {
                                "value": "deployment",
                                "label": "Deployment"
                            },
                            {
                                "value": "orchestration",
                                "label": "Orchestration"
                            },
                            {
                                "value": "migration",
                                "label": "Migration Services"
                            },
                            {
                                "value": "monitoring",
                                "label": "Monitoring"
                            },
                            {
                                "value": "notification",
                                "label": "Notification Services"
                            }
                        ],
                        "defaultValue": "opsmanagement"
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
                            "displayLabel": true,
                            "key": "label"
                        },
                        "description": {
                            "label": "Description",
                            "type": "string"
                        },
                        "homepage": {
                            "label": "Homepage",
                            "type": "url"
                        },
                        "image": {
                            "label": "Logo",
                            "type": "image"
                        },
                        "vendor": {
                            "label": "Vendor",
                            "type": "string",
                            "discrete": true
                        },
                        "tags": {
                            "label": "Tags",
                            "type": "tags"
                        },
                        "offering": {
                            "label": "Offering",
                            "type": "string",
                            "allowableValues": [
                                {
                                    "value": "oss",
                                    "label": "Open Source Software"
                                },
                                {
                                    "value": "commercial",
                                    "label": "Commercial Software"
                                },
                                {
                                    "value": "concept",
                                    "label": "Concept | Terminology"
                                },
                                {
                                    "value": "other",
                                    "label": "Other type of offering"
                                }
                            ],
                            "defaultValue": "oss"
                        },
                        "category": {
                            "label": "Category",
                            "type": "string",
                            "allowableValues": [
                                {
                                    "value": "opsmanagement",
                                    "label": "Management"
                                },
                                {
                                    "value": "deployment",
                                    "label": "Deployment"
                                },
                                {
                                    "value": "orchestration",
                                    "label": "Orchestration"
                                },
                                {
                                    "value": "migration",
                                    "label": "Migration Services"
                                },
                                {
                                    "value": "monitoring",
                                    "label": "Monitoring"
                                },
                                {
                                    "value": "notification",
                                    "label": "Notification Services"
                                }
                            ],
                            "defaultValue": "opsmanagement"
                        }
                    }
                },
                "properties": {
                    "ambition": {
                        "label": "Ambition",
                        "description": "The current outlook or intent regarding this technology",
                        "defaultValue": "identified",
                        "allowableValues": [
                            {
                                "value": "identified",
                                "label": "Waargenomen"
                            },
                            {
                                "value": "interesting",
                                "label": "Potentie"
                            },
                            {
                                "value": "assess",
                                "label": "Verkennen"
                            },
                            {
                                "value": "trial",
                                "label": "Toepassen"
                            },
                            {
                                "value": "adopt",
                                "label": "In Productie"
                            }
                        ]
                    },
                    "magnitude": {
                        "label": "Magnitude/Relevance",
                        "description": "The relative size of the technology (in terms of investment, people involved, percentage of revenue)",
                        "defaultValue": "medium",
                        "allowableValues": [
                            {
                                "value": "tiny",
                                "label": "Tiny or Niche"
                            },
                            {
                                "value": "medium",
                                "label": "Medium"
                            },
                            {
                                "value": "large",
                                "label": "Large"
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
                        "description": "When was this rating defined",
                        "type": "time",
                        "readOnly": true
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
            "name": "Conclusion Technology Radar 2021",
            "id": "cab-tech-radar-2021",
            "template": {
                "svg_id": "radarSVGContainer",
                "width": 1450,
                "height": 1100,
                "topLayer": "sectors",
                "selectedRing": 1,
                "selectedSector": 2,
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
                    "text": "Radar Operational Services - Spring 2021",
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
                        "color": "purple",
                        "fontSize": "24px",
                        "fontFamily": "Arial, Helvetica",
                        "fontStyle": "normal",
                        "fontWeight": "normal"
                    },
                    "stroke": {
                        "strokeWidth": 2,
                        "strokeColor": "gray",
                        "strokeArray": "100 1"
                    },
                    "rings": [
                        {
                            "label": "Potentie",
                            "width": 0.13
                        },
                        {
                            "label": "Verkennen",
                            "width": 0.17
                        },
                        {
                            "label": "Toepassen",
                            "width": 0.15
                        },
                        {
                            "label": "In Productie",
                            "width": 0.55
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
                            "label": "Management",
                            "angle": 0.19273060594494984,
                            "backgroundImage": {},
                            "backgroundColor": "white",
                            "outerringBackgroundColor": "#FFF",
                            "opacity": 0.35000000000000003
                        },
                        {
                            "label": "Deployment",
                            "angle": 0.2,
                            "backgroundImage": {},
                            "backgroundColor": "white",
                            "outerringBackgroundColor": "#FFF"
                        },
                        {
                            "label": "Orchestration",
                            "angle": 0.25,
                            "backgroundImage": {
                                "image": "data:image/png;base64,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",
                                "scaleFactor": "5",
                                "x": 419.99999928474426,
                                "y": -508
                            },
                            "backgroundColor": "white",
                            "outerringBackgroundColor": "#FFF"
                        },
                        {
                            "label": "Migration Services",
                            "angle": 0.15,
                            "backgroundColor": "white",
                            "opacity": 0.25,
                            "outerringBackgroundColor": "#FFF",
                            "backgroundImage": {}
                        },
                        {
                            "label": "Monitoring",
                            "angle": 0.2062336932086861,
                            "backgroundColor": "white",
                            "outerringBackgroundColor": "#FFF",
                            "backgroundImage": {}
                        }
                    ],
                    "showRegularSectorLabels": false
                },
                "colorsConfiguration": {
                    "label": "Maturity",
                    "colors": [
                        {
                            "label": "Fresh",
                            "color": "green",
                            "enabled": true
                        },
                        {
                            "label": "In Between",
                            "color": "pink",
                            "enabled": true
                        },
                        {
                            "label": "Very Mature",
                            "color": "blue",
                            "enabled": true
                        },
                        {
                            "label": "Other",
                            "color": "gray",
                            "enabled": true
                        },
                        {
                            "label": "Unassigned",
                            "color": "white"
                        }
                    ]
                },
                "sizesConfiguration": {
                    "label": "Relevance",
                    "sizes": [
                        {
                            "label": "Niche",
                            "size": 0.55,
                            "enabled": true
                        },
                        {
                            "label": "Medium",
                            "size": 0.8,
                            "enabled": true
                        },
                        {
                            "label": "Very relevant",
                            "size": 1.05,
                            "enabled": true
                        },
                        {
                            "label": "Crucial",
                            "size": 1.3
                        },
                        {
                            "label": "Regular",
                            "size": 1.8,
                            "enabled": false
                        }
                    ]
                },
                "shapesConfiguration": {
                    "label": "Offering",
                    "shapes": [
                        {
                            "label": "Concept | Term",
                            "shape": "square"
                        },
                        {
                            "label": "Open Source",
                            "shape": "diamond"
                        },
                        {
                            "label": "PaaS",
                            "shape": "rectangleHorizontal",
                            "enabled": false
                        },
                        {
                            "label": "Other",
                            "shape": "circle",
                            "enabled": false
                        },
                        {
                            "label": "Open Source Software",
                            "shape": "star",
                            "enabled": false
                        },
                        {
                            "label": "Other",
                            "shape": "rectangleVertical",
                            "enabled": false
                        },
                        {
                            "label": "Commercial",
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
            "ratingType": "technologyAdoption",
            "propertyVisualMaps": {
                "blip": {
                    "label": "object.label",
                    "image": "object.image"
                },
                "size": {
                    "property": "magnitude",
                    "valueMap": {
                        "tiny": 0,
                        "medium": 1,
                        "large": 2
                    }
                },
                "sector": {
                    "property": "object.category",
                    "valueMap": {
                        "opsmanagement": 0,
                        "deployment": 1,
                        "orchestration": 2,
                        "migration": 3,
                        "monitoring": 4,
                        "notification": 4
                    }
                },
                "ring": {
                    "property": "ambition",
                    "valueMap": {
                        "identified": -1,
                        "potentie": 0,
                        "assess": 1,
                        "adopt": 3,
                        "trial": 2
                    }
                },
                "shape": {
                    "property": "object.offering",
                    "valueMap": {
                        "oss": 4,
                        "commercial": 6,
                        "concept": 0,
                        "other": 5
                    }
                },
                "color": {
                    "property": "experience",
                    "valueMap": {
                        "short": 0,
                        "intermediate": 1,
                        "long": 2,
                        "other": 3
                    }
                }
            },
            "blipDisplaySettings": {
                "showImages": false,
                "showShapes": true,
                "showLabels": true,
                "applyShapes": false,
                "applySizes": false,
                "applyColors": true,
                "tagFilter": []
            },
            "blips": [
                {
                    "id": "0",
                    "rating": {
                        "id": "64fe65bd-3ed2-40e5-92e6-e0478728e1eb",
                        "timestamp": 1617188001693,
                        "object": {
                            "label": "ServiceNow IT SM",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "id": "3a25286f-506c-4fb8-81a9-8dec31a2bad5",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "long",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 519.6580810546875,
                    "y": -145.91754913330078
                },
                {
                    "id": "1",
                    "rating": {
                        "id": "2a02b181-e970-4184-80bc-3adca9f78b6f",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "PagerDuty",
                            "category": "monitoring",
                            "offering": "commercial",
                            "id": "0a353d94-f1a4-4b76-a33c-e00e77192764",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "2",
                    "rating": {
                        "id": "8ea50b5f-b6af-4c51-8e05-bd8ff9a20cc8",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "Elastic Stack",
                            "category": "monitoring",
                            "offering": "commercial",
                            "id": "aaf0a220-8243-4d31-9de1-fecbbd733c46",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 281.6729431152344,
                    "y": 419.35784912109375
                },
                {
                    "id": "3",
                    "rating": {
                        "id": "a2bed0ab-8593-4d50-9ea3-6c4832ff9275",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "log.io",
                            "category": "monitoring",
                            "homepage": "https://logz.io/",
                            "offering": "commercial",
                            "id": "5277eab2-6ff7-46d3-9044-ccffc46c277c",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 621.3713073730469,
                    "y": 221.15562438964844
                },
                {
                    "id": "4",
                    "rating": {
                        "id": "6e4eda63-fcdd-4da3-a49f-81f083dda512",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "Cloudwatch",
                            "category": "monitoring",
                            "offering": "commercial",
                            "vendor": "AWS",
                            "id": "92dcee52-e12b-401d-9539-06f8f9717604",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 391.71136474609375,
                    "y": 399.3595275878906
                },
                {
                    "id": "5",
                    "rating": {
                        "id": "aaa31b33-0116-4f09-bff3-fa5d3e6a1090",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "Dynatrace",
                            "category": "monitoring",
                            "offering": "commercial",
                            "vendor": "https://www.dynatrace.com/",
                            "id": "fcfb807a-9acd-4ebe-b3d5-2a72c5a377b4",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 541.377197265625,
                    "y": 62.3155517578125
                },
                {
                    "id": "6",
                    "rating": {
                        "id": "f824ddfa-b79f-4da5-a151-2293547565c9",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "Azure Monitor",
                            "category": "monitoring",
                            "homepage": "https://azure.microsoft.com/en-us/services/monitor/",
                            "offering": "commercial",
                            "vendor": "Microsoft",
                            "id": "c3b3a98e-d570-4d38-84bc-0a3e4cc0f833",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 557.0096130371094,
                    "y": 175.6744384765625
                },
                {
                    "id": "7",
                    "rating": {
                        "id": "c6dc81ef-ae5d-4ff4-97d7-32d82bf91d59",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "DataDog",
                            "category": "monitoring",
                            "homepage": "https://www.datadoghq.com/",
                            "offering": "commercial",
                            "id": "6640a2d5-a329-4a26-85aa-c869039a5b2d",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 204.33551025390625,
                    "y": 465.7921447753906
                },
                {
                    "id": "9",
                    "rating": {
                        "id": "37738b35-ac6d-48c6-95ef-e6199892ec4a",
                        "timestamp": 1617188001694,
                        "object": {
                            "label": "Prometheus",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "ed39db1a-8f7f-4367-ade6-e9687e47a281",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "intermediate",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 393.51885986328125,
                    "y": 461.42449951171864
                },
                {
                    "id": "10",
                    "rating": {
                        "id": "20ccc539-715b-4bb5-ba8f-3ccc56f6cfe3",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "OpenMetrics",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "97accf99-bec6-430c-a6b0-13936a3f7bcc",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 457.6703186035156,
                    "y": 292.10741424560547
                },
                {
                    "id": "11",
                    "rating": {
                        "id": "b91a9a45-8545-4baf-9fb2-a373b00a2261",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Grafana",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "92784819-09d6-4b5e-99e9-0535e8f849e3",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 283.70703125,
                    "y": 469.2892150878906
                },
                {
                    "id": "12",
                    "rating": {
                        "id": "3436c9d9-e03e-4a77-a82a-fa286c2d840d",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Jaeger",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "47f91da7-56f6-4bcd-b6f5-016d567574ed",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "13",
                    "rating": {
                        "id": "3ef618c2-0f42-4eb0-af3a-395d0200510a",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Statsd",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "55315d34-8ff5-4d4b-abb8-ce2e5a4ee885",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "14",
                    "rating": {
                        "id": "3a36e2e1-9558-408e-a2d1-296e2303f17d",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Lightstep",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "f65e5029-45f5-4296-97cd-55636b96908a",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 540.1412048339844,
                    "y": 347.462158203125
                },
                {
                    "id": "15",
                    "rating": {
                        "id": "54e0a7f6-c297-4656-95c5-35f5e364b239",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Splunk",
                            "category": "monitoring",
                            "offering": "commercial",
                            "id": "def3dce4-d92e-48e7-8790-6a60b1d350fd",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "long",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 486.0550231933594,
                    "y": 397.5338134765625
                },
                {
                    "id": "16",
                    "rating": {
                        "id": "89a00dd4-d860-449c-8f74-bd87d2f6d390",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Sentry",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "fbd0cb3f-9422-4c15-9405-1854d84c93c8",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 530.2696838378906,
                    "y": 269.58522033691406
                },
                {
                    "id": "17",
                    "rating": {
                        "id": "02e8ca99-1ec4-43dc-828e-c977e014ab0d",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Kiali",
                            "category": "monitoring",
                            "offering": "oss",
                            "id": "b97fb1bc-bb97-4770-a4ee-5517bfb3a112",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "18",
                    "rating": {
                        "id": "17590f44-5511-43f4-9069-793dcc6c3ee0",
                        "timestamp": 1617188001695,
                        "object": {
                            "label": "Harness Cloud Cost Management",
                            "category": "opsmanagement",
                            "homepage": "https://harness.io/platform/continuous-efficiency/",
                            "offering": "commercial",
                            "id": "48eb3990-52bb-4de2-b676-ffd50ab77b6f",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 482.096435546875,
                    "y": -318.27154541015625
                },
                {
                    "id": "19",
                    "rating": {
                        "id": "f95d2617-6b08-4569-b247-1f9efdd5b05c",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "AWS Cost Explorer",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "AWS",
                            "id": "f7169a29-6716-4551-b95f-8c972fd61f68",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 566.1680908203125,
                    "y": -229.74562072753906
                },
                {
                    "id": "20",
                    "rating": {
                        "id": "4e192735-d14e-4c2b-8775-3ff299d0ce21",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "GCP Billing",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "Google",
                            "id": "0073e707-7ffc-434e-8e73-bfd9003af793",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 352.0934143066406,
                    "y": -368.6368713378906
                },
                {
                    "id": "21",
                    "rating": {
                        "id": "84d9083c-d53c-43d4-ba46-e92249f9f1fb",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "Azure Cost Management & Billing",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "Microsoft",
                            "id": "aade1423-a2e2-452f-b89d-263440ddf1bf",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "22",
                    "rating": {
                        "id": "431d2ba5-e437-4c4a-8c4d-1850f9b89434",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "Cloudability",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "Apptio",
                            "id": "4bac883f-d4e7-4343-8ee0-c1e27ee33fbc",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "23",
                    "rating": {
                        "id": "fec2249c-a08b-4876-9692-7b40d569c810",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "CloudHealth",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "VMWare",
                            "id": "6a46b0a4-8c25-411a-867f-67411fd72ba8",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 655.8257141113281,
                    "y": -344.5084533691406
                },
                {
                    "id": "24",
                    "rating": {
                        "id": "a093f85c-1807-4488-8bed-ee3581030784",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "Spot",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "NetApp",
                            "id": "56099865-7408-42e9-a24f-e9c610af7ce3",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "25",
                    "rating": {
                        "id": "f377d1ea-310e-439a-8e08-fab56472b283",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "kubecost",
                            "category": "opsmanagement",
                            "offering": "oss",
                            "id": "d0989e0e-a43f-4f8d-b72d-943ffcd200ff",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 243.58334350585938,
                    "y": -488.9289245605469
                },
                {
                    "id": "26",
                    "rating": {
                        "id": "f5b27bca-447f-4265-afe2-546a214692fb",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "ParkMyCloud",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "Turbonomic",
                            "id": "7c2e4bc5-6abd-4a7e-be6d-9dd4da6a7c75",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 568.0251770019531,
                    "y": -372.21429443359375
                },
                {
                    "id": "27",
                    "rating": {
                        "id": "c5340bcc-e3a8-4ffe-99b4-32e24462d5b5",
                        "timestamp": 1617188001696,
                        "object": {
                            "label": "Nutanix Beam",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "id": "2f775113-b1f9-4853-bd19-d300ec2c4782",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 483.6351623535156,
                    "y": -38.49937438964844
                },
                {
                    "id": "28",
                    "rating": {
                        "id": "7b45ef7d-09bd-4e4a-b98f-75b6df27db32",
                        "timestamp": 1617188001697,
                        "object": {
                            "label": "Flexera One",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "vendor": "Flexera",
                            "id": "07ea9be7-9e6e-4bdf-ab51-75695f94afe6",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 490.9049987792969,
                    "y": -258.9012145996094
                },
                {
                    "id": "29",
                    "rating": {
                        "id": "891d86b0-b8fb-422b-b751-f33f91a9224f",
                        "timestamp": 1617188001697,
                        "object": {
                            "label": "Densify",
                            "category": "opsmanagement",
                            "offering": "commercial",
                            "id": "2b218d9a-68e7-4750-b85c-7291a6d2a1af",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 626.4782104492188,
                    "y": -270.87294006347656
                },
                {
                    "id": "30",
                    "rating": {
                        "id": "e923bcfa-718f-4e60-8fea-7aed06a56256",
                        "timestamp": 1617188699720,
                        "object": {
                            "label": "Kubernetes",
                            "category": "orchestration",
                            "offering": "oss",
                            "id": "a55dd3c7-0251-4d0e-aed0-80c87070cb43",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "intermediate",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": null,
                    "y": null
                },
                {
                    "id": "31",
                    "rating": {
                        "id": "3532b139-992e-47b6-b460-fa5ad2834403",
                        "timestamp": 1617188699720,
                        "object": {
                            "label": "AKS",
                            "category": "orchestration",
                            "offering": "commercial",
                            "vendor": "Microsoft",
                            "id": "01ff4042-95ef-4317-8e60-82c343185015",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "intermediate",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -544.4757080078125,
                    "y": -84.1643676757812
                },
                {
                    "id": "32",
                    "rating": {
                        "id": "b33fddb3-c8a6-4538-8d45-d337055b97ba",
                        "timestamp": 1617188699720,
                        "object": {
                            "label": "Azure Automation",
                            "category": "orchestration",
                            "offering": "commercial",
                            "vendor": "Microsoft",
                            "id": "51dbe9b5-1aae-4f03-80d8-c2a6a762fc74",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "intermediate",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -602.5260620117188,
                    "y": -23.6331787109375
                },
                {
                    "id": "33",
                    "rating": {
                        "id": "23db496b-0404-4448-a4a9-f31eb8626047",
                        "timestamp": 1617188699720,
                        "object": {
                            "label": "Puppet Bolt",
                            "category": "orchestration",
                            "homepage": "orchestration",
                            "offering": "oss",
                            "vendor": "oss",
                            "id": "0a300c83-75f1-4cd9-866e-3d72f8192d76",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -602.4943237304688,
                    "y": 59.17462921142578
                },
                {
                    "id": "34",
                    "rating": {
                        "id": "f7cfa406-9a57-4f3b-972c-b6db8ffd3967",
                        "timestamp": 1617188699720,
                        "object": {
                            "label": "BMC Multi Cloud Management",
                            "category": "orchestration",
                            "homepage": "orchestration",
                            "offering": "oss",
                            "vendor": "commercial",
                            "id": "8cca901b-21f0-4a61-8beb-6b4a4b0461e3",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -557.3302001953125,
                    "y": 147.00973510742188
                },
                {
                    "id": "35",
                    "rating": {
                        "id": "1c061a28-1a80-430e-8caf-0c1913103e74",
                        "timestamp": 1617188699720,
                        "object": {
                            "label": "Morpheus",
                            "category": "orchestration",
                            "homepage": "orchestration",
                            "offering": "oss",
                            "vendor": "oss",
                            "id": "c43ab0b7-0b72-4110-91d6-7e905c932c04",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -499.9582214355469,
                    "y": 337.47674560546875
                },
                {
                    "id": "36",
                    "rating": {
                        "id": "8b1ece8f-760b-49db-b821-32ad7e9219e8",
                        "timestamp": 1617269993921,
                        "object": {
                            "label": "Terraform",
                            "category": "deployment",
                            "offering": "oss",
                            "vendor": "Hashicorp",
                            "id": "aeca0053-b079-40d7-8d45-8c0f7d56c8fa",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 109.7580795288086,
                    "y": -465.0520935058594
                },
                {
                    "id": "37",
                    "rating": {
                        "id": "eadadfce-7d9e-4ca2-a926-8d4b4a43a8ad",
                        "timestamp": 1617269993921,
                        "object": {
                            "label": "Ansible",
                            "category": "deployment",
                            "offering": "oss",
                            "vendor": "Hashicorp",
                            "id": "e93ad69e-b16a-46d4-a9a0-9e7ed7a5341c",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -304.1287536621093,
                    "y": -428.8214111328125
                },
                {
                    "id": "38",
                    "rating": {
                        "id": "96b973f6-fb0d-4e16-ad24-2c8bf46db5b3",
                        "timestamp": 1617269993922,
                        "object": {
                            "label": "Helm",
                            "category": "deployment",
                            "offering": "oss",
                            "vendor": "CNCF",
                            "id": "f212f301-da82-41aa-875e-2c6add8670f4",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -229.04103469848627,
                    "y": -465.99957275390625
                },
                {
                    "id": "39",
                    "rating": {
                        "id": "38ded420-f901-449d-9e5d-153f8ce7e2c1",
                        "timestamp": 1617269993922,
                        "object": {
                            "label": "Puppet Bolt",
                            "category": "deployment",
                            "offering": "oss",
                            "vendor": "PuppetLabs",
                            "id": "11487c77-045a-4469-823f-4f0fa799d0b4",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -28.197738647460938,
                    "y": -470.1956787109375
                },
                {
                    "id": "40",
                    "rating": {
                        "id": "3ee8961f-b443-49ea-9297-dc12f6729b18",
                        "timestamp": 1617269993922,
                        "object": {
                            "label": "Chef",
                            "category": "deployment",
                            "offering": "oss",
                            "id": "b5f88ee6-ec7f-475a-92bf-ebe9d5cf81e0",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -275.56726074218744,
                    "y": -382.76715087890625
                },
                {
                    "id": "41",
                    "rating": {
                        "id": "7f6d842d-9b72-454b-86d9-48ca58ac8571",
                        "timestamp": 1617269993922,
                        "object": {
                            "label": "Salt Stack",
                            "category": "deployment",
                            "offering": "oss",
                            "id": "88cf3eb9-a7ca-415d-8040-2c7c19d60e96",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": 47.33382797241211,
                    "y": -462.8179626464844
                },
                {
                    "id": "42",
                    "rating": {
                        "id": "1b537855-239b-4ccf-98ea-233f7a09791b",
                        "timestamp": 1617269993922,
                        "object": {
                            "label": "Azure Resource Manager",
                            "category": "deployment",
                            "offering": "commercial",
                            "vendor": "Microsoft",
                            "id": "5e7e2eda-89e5-405e-bb38-f56e92ddf721",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -342.67932128906244,
                    "y": -343.5522155761719
                },
                {
                    "id": "43",
                    "rating": {
                        "id": "c2ef0be3-a09a-450b-a848-929a4cb31a3e",
                        "timestamp": 1617271424337,
                        "object": {
                            "label": "OpenShift",
                            "category": "orchestration",
                            "offering": "oss",
                            "vendor": "RedHat",
                            "id": "0593f5ff-d786-473e-8761-02a099e94fa8",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -421.97869873046875,
                    "y": 259.1285705566406
                },
                {
                    "id": "44",
                    "rating": {
                        "id": "dc874c40-6116-48ae-a6f3-70927d236500",
                        "timestamp": 1617271424337,
                        "object": {
                            "label": "ARO",
                            "category": "orchestration",
                            "offering": "commercial",
                            "vendor": "Microsoft",
                            "id": "b8f8d314-7918-4591-aba5-705d5bcfccfb",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -562.1755981445312,
                    "y": -150.37557983398432
                },
                {
                    "id": "45",
                    "rating": {
                        "id": "470046da-fa5b-4abb-b712-4f2ddcc8ee37",
                        "timestamp": 1617271424337,
                        "object": {
                            "label": "AWS EKS",
                            "category": "orchestration",
                            "offering": "commercial",
                            "vendor": "AWS",
                            "id": "6f5820f4-fce6-4f58-8dc2-06bd21cc56b7",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -478.2458801269531,
                    "y": -139.22514343261713
                },
                {
                    "id": "46",
                    "rating": {
                        "id": "01ca8db7-b54d-4290-a7dc-aa351c733291",
                        "timestamp": 1617271424338,
                        "object": {
                            "label": "AWS ECS",
                            "category": "orchestration",
                            "offering": "commercial",
                            "vendor": "AWS",
                            "id": "432720a5-22be-4d36-9fe7-785f5a5ceb54",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -468.0396728515625,
                    "y": 169.76931762695312
                },
                {
                    "id": "47",
                    "rating": {
                        "id": "bbce1b73-625b-4a75-b53f-d4b180447cb5",
                        "timestamp": 1617271424338,
                        "object": {
                            "label": "AWS Fargate",
                            "category": "orchestration",
                            "offering": "commercial",
                            "vendor": "AWS",
                            "id": "97204952-ecc4-43ea-92e2-1eb5b8257d2c",
                            "tags": []
                        },
                        "ambition": "identified",
                        "experience": "medium",
                        "magnitude": "medium",
                        "scope": "Conclusion",
                        "author": "System Generated"
                    },
                    "x": -364.09326171875,
                    "y": 341.8046875
                }
            ]
        }
    ],
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
            "editMode": false,
            "defaultFont": {
                "color": "black",
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
                        "label": "Hold",
                        "width": 0.13
                    },
                    {
                        "label": "Assess",
                        "width": 0.17
                    },
                    {
                        "label": "Trial",
                        "width": 0.15
                    },
                    {
                        "label": "Adopt",
                        "width": 0.55
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
                        "backgroundImage": {}
                    },
                    {
                        "label": "Libraries & Frameworks",
                        "angle": 0.2,
                        "backgroundImage": {}
                    },
                    {
                        "label": "Infrastructure",
                        "angle": 0.25
                    },
                    {
                        "label": "Languages",
                        "angle": 0.2
                    },
                    {
                        "label": "Concepts & Methodology",
                        "angle": 0.15
                    }
                ]
            },
            "colorsConfiguration": {
                "label": "Maturity",
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
            "sizesConfiguration": {
                "label": "Relevance",
                "sizes": [
                    {
                        "label": "Niche",
                        "size": 0.55,
                        "enabled": true
                    },
                    {
                        "label": "Medium    ",
                        "size": 0.8,
                        "enabled": false
                    },
                    {
                        "label": "Very relevant",
                        "size": 1.05,
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
    "objects": {}
}