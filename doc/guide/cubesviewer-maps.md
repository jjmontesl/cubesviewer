CubesViewer Map Charts
======================

Features
--------

- Support geographic data in dimension attributes and fact details
- Geographic feature types: points, lines, polygons
- Sources: latitude/longitude (x/y), WKT, GeoJSON, reference to layer feature
- Multiple layers
- Layer types: GeoJson, WMTS
- Selectable CRS

- Configurable view:
  - Automatic bounding box, fixed bounding box, free view
  - Configurable min/max zoom level

- Representation:
` - Cloropleth: applies to all possible, info on hover
  - Points: info on hover
  - Circles (measure in radius), info on hover
  - Legends

Model configuration
-------------------

```
   "dimensions": [
        {
            "label": "Country",
            "levels": [
                {
                    "attributes": [
                        "country_code",
                        "country_label",
                        "country_iso3",
                    ],
                    "key": "country_code",
                    "label": "Country",
                    "label_attribute": "geo_label",
                    "info": {
                        "cv-geo-source": "ref",
                        "cv-geo-ref-layer": "countries",
                        "cv-geo-ref-attribute": "country_iso3",
                        "cv-geo-map-layers": [ {
                            "name": "osm-standard",
                            "type": "xyz",
                            "attribution": "&copy; Dataset owner",
                            "params": {
                                "url": "http://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            }
                        }, {
                            "name": "countries",
                            "type": "geojson",
                            "attribution": "&copy; Dataset owner",
                            "params": {
                                "url": "maps/ne_110m_admin_0_countries.geo.json"
                            }
                        } ]
                    },
                    "name": "country",
                    "role": "geo"
                }
            ],
            "name": "country"
        },
```


Further information
-------------------

* [Documentation index](index.md)

