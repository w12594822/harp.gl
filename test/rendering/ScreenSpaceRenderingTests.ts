/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeatureCollection, Style } from "@here/harp-datasource-protocol";
import { EarthConstants, sphereProjection } from "@here/harp-geoutils";

import { GeoJsonTest } from "./utils/GeoJsonTest";
import { ThemeBuilder } from "./utils/ThemeBuilder";

//    Mocha discourages using arrow functions, see https://mochajs.org/#arrow-functions

describe("ScreenSpaceRendering Test", function () {
    const geoJsonTest = new GeoJsonTest();

    it("renders icon without text, if fontcatalog not found ", async function () {
        this.timeout(5000);

        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-no-text-icon",
            theme: new ThemeBuilder().withInvalidFontCatalog().withMarkerStyle().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "Marker" },
                        geometry: { type: "Point", coordinates: [14.6, 53.3] }
                    }
                ]
            },
            lookAt: { tilt: 80, zoomLevel: 19 },
            tileGeoJson: false
        });
    });

    it("renders interleaved icon and text", async function () {
        this.timeout(5000);

        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-interleaved-icon-text",
            theme: new ThemeBuilder().withFontCatalog().withMarkerStyle().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: {
                            text: "Marker0",
                            color: "red",
                            imageTexture: "red-icon",
                            renderOrder: 0
                        },
                        geometry: { type: "Point", coordinates: [14.6, 53.3] }
                    },
                    {
                        type: "Feature",
                        properties: {
                            text: "Marker1",
                            color: "green",
                            imageTexture: "green-icon",
                            renderOrder: 1
                        },
                        geometry: { type: "Point", coordinates: [14.6, 53.32] }
                    },
                    {
                        type: "Feature",
                        properties: {
                            text: "Marker2",
                            color: "blue",
                            imageTexture: "white-icon",
                            renderOrder: 2
                        },
                        geometry: { type: "Point", coordinates: [14.6, 53.28] }
                    }
                ]
            },
            lookAt: { tilt: 0, zoomLevel: 10 },
            tileGeoJson: false
        });
    });

    it("renders icons and text using double precision coordinates", async function () {
        this.timeout(5000);

        // HARP-14465: Text and cross icon must be centered on green square.
        const squaresStyle: Style = {
            when: "$geometryType == 'point'",
            technique: "squares",
            color: "green",
            size: 17,
            styleSet: "geojson"
        };
        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-precision-icon-text",
            theme: new ThemeBuilder()
                .withFontCatalog()
                .withMarkerStyle()
                .withStyle(squaresStyle)
                .build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: {
                            text: "o",
                            color: "white",
                            imageTexture: "plus-icon",
                            iconYOffset: 0,
                            size: 18
                        },
                        geometry: {
                            type: "MultiPoint",
                            coordinates: [
                                [14.60015, 53.30007],
                                [14.60015, 53.29993],
                                [14.59985, 53.29993],
                                [14.59985, 53.30007]
                            ]
                        }
                    }
                ]
            },
            lookAt: { tilt: 0, zoomLevel: 20 },
            tileGeoJson: false
        });
    });
    it("renders point using marker technique, with theme set to datasource", async function () {
        this.timeout(5000);

        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-point-after-theme-reset-in-datasource",
            theme: new ThemeBuilder().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "Marker", renderOrder: 1 },
                        geometry: { type: "Point", coordinates: [14.6, 53.3] }
                    }
                ]
            },
            lookAt: { tilt: 0, zoomLevel: 10 },
            tileGeoJson: false,
            beforeFinishCallback: async mapView => {
                await mapView
                    .getDataSourceByName("geojson")
                    ?.setTheme({ styles: [ThemeBuilder.markerStyle] });
            }
        });
    });

    it("renders point using marker technique, after fontcatalog added in set theme", async function () {
        this.timeout(5000);
        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-point-after-font-added",
            theme: new ThemeBuilder().withMarkerStyle().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "Marker", renderOrder: 1 },
                        geometry: { type: "Point", coordinates: [14.6, 53.3] }
                    }
                ]
            },
            lookAt: { tilt: 0, zoomLevel: 10 },
            tileGeoJson: false,
            beforeFinishCallback: async mapView => {
                await mapView
                    .getDataSourceByName("geojson")
                    ?.setTheme(new ThemeBuilder(true).withMarkerStyle().build());
                await mapView.setTheme(new ThemeBuilder().withFontCatalog().build());
            }
        });
    });

    it("renders point using marker technique, after theme reset", async function () {
        this.timeout(5000);
        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-point-after-theme-reset",
            theme: new ThemeBuilder().withMarkerStyle().withFontCatalog().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "Marker", renderOrder: 1, color: "blue" },
                        geometry: { type: "Point", coordinates: [14.6, 53.3] }
                    }
                ]
            },
            lookAt: { tilt: 0, zoomLevel: 10 },
            tileGeoJson: false,
            beforeFinishCallback: async mapView => {
                await mapView.setTheme(
                    new ThemeBuilder().withMarkerStyle().withFontCatalog().build()
                );
            }
        });
    });

    it("removes marker, after datasource is removed", async function () {
        this.timeout(5000);
        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-after-datasource-removed",
            theme: new ThemeBuilder().withMarkerStyle().withFontCatalog().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "Marker", renderOrder: 1, color: "blue" },
                        geometry: { type: "Point", coordinates: [14.6, 53.3] }
                    }
                ]
            },
            lookAt: { tilt: 0, zoomLevel: 10 },
            tileGeoJson: false,
            beforeFinishCallback: async mapView => {
                await mapView.removeDataSource(mapView.getDataSourceByName("geojson")!);
            }
        });
    });

    it("renders elevated point using marker technique", async function () {
        this.timeout(5000);

        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-elevated-point",
            theme: new ThemeBuilder().withMarkerStyle().withFontCatalog().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "Marker" },
                        geometry: { type: "Point", coordinates: [14.6, 53.3, 15] }
                    }
                ]
            },
            lookAt: { tilt: 80, zoomLevel: 19 },
            tileGeoJson: false
        });
    });

    it("renders a point which is elevated above MAX_BUILDING_HEIGHT", async function () {
        this.timeout(5000);

        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "geojson-elevated-point-above-max-building-height",
            theme: new ThemeBuilder().withMarkerStyle().withFontCatalog().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "Marker" },
                        geometry: {
                            type: "Point",
                            coordinates: [14.6, 53.3, 2 * EarthConstants.MAX_BUILDING_HEIGHT]
                        }
                    }
                ]
            },
            lookAt: { zoomLevel: 14 },
            tileGeoJson: false
        });
    });

    it("renders point markers using dataSourceOrder", async function () {
        this.timeout(5000);

        const markerStyle: Style = {
            when: ["==", ["geometry-type"], "Point"],
            technique: "labeled-icon",
            imageTexture: ["get", "icon"],
            text: ["get", "text"],
            size: 15,
            iconMayOverlap: true,
            iconReserveSpace: false,
            textMayOverlap: true,
            textReserveSpace: false,
            color: "black",
            renderOrder: ["get", "renderOrder"],
            styleSet: "geojson"
        };
        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "markers-with-different-dataSourceOrders",
            theme: new ThemeBuilder().withStyle(markerStyle).withFontCatalog().build(),
            geoJson: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { text: "1", icon: "red-icon", renderOrder: 1 },
                        geometry: { type: "Point", coordinates: [14.6, 53.3] }
                    },
                    {
                        type: "Feature",
                        properties: { text: "2", icon: "red-icon", renderOrder: 2 },
                        geometry: { type: "Point", coordinates: [14.65, 53.33] }
                    }
                ]
            },
            extraDataSource: {
                geoJson: {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            properties: { text: "3", icon: "green-icon", renderOrder: 0 },
                            geometry: { type: "Point", coordinates: [14.68, 53.26] }
                        }
                    ]
                },
                dataSourceOrder: 1
            }
        });
    });

    it("renders marker correctly on zoomed out globe", async function () {
        const geoJson: FeatureCollection = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { color: "#436981" },
                    geometry: {
                        type: "Polygon",
                        coordinates: [
                            [
                                [-180, -90],
                                [180, -90],
                                [180, 90],
                                [-180, 90],
                                [-180, -90]
                            ]
                        ]
                    }
                },
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [0, 0] }
                }
            ]
        };

        await geoJsonTest.run({
            mochaTest: this,
            testImageName: "marker-on-zoomed-out-globe",
            theme: new ThemeBuilder().withMarkerStyle().withFontCatalog().build(),
            geoJson,
            lookAt: {
                zoomLevel: 3,
                target: [0, 0]
            },
            projection: sphereProjection
        });
    });
});
