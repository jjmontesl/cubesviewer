CubesViewer Map Charts
======================

Maps require some extra configuration in order to define the maps will be used and
how data will be represented on them.

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
  - Cloropleth
  - Points
  - Bubbles (measure as radius)
  - Legends

Model configuration
-------------------

CubesViewer can represent data on maps on a dimension level basis. As usual,
CubesViewer options are prefixed with `cv-` and must be defined in the
`info` dictionary of the target level.

Reference
---------

This is the list of available options:

Key | Description
--- | -----------
cv-geo-source | Define how the data in the dimension will be mapped to map features. Possible values are 'ref'.
cv-geo-ref-layer | (When using 'ref' as source) Name of the layer with the geographic features to use for representation.
cv-geo-ref-model-attribute | (When using 'ref' as source) Dimension attribute which value will be searched along map features
cv-geo-ref-layer-attribute | (When using 'ref' as source) Map feature metadata key to use when matching dimension values
cv-geo-map-layers | Array of layer definitions. See the *Layers* section below.

Layers
------

Layers are defined inside the `cv-geo-map-layers` metadata attribute. This is an ordered list of layers
which will be drawn bottom to top, though many maps will need just a single layer.

There are different *providers* for map layers. Some providers require a web service, others can
work with a simple file (like GeoJSON or KML). The provider type is defined in the `type` attribute.

You need to provide your own map files or services, though  the `html/maps` directory contains a few samples.

*XYZ*

XYZ

```
    {
        "name": "ortophotos",
        "type": "xyz",
        "attribution": "&copy; Attribution Label",
        "params": {
            "url": "http://tile.server.example/{z}/{x}/{y}.png"
        }
    }
```

*Vector (GeoJSON, KML)*

```
    {
        "name": "countries",
        "type": "vector",
        "attribution": "&copy; NaturalEarth",
        "params": {
            "url": "maps/ne_110m_admin_0_countries.geo.json",
            "format": "geojson"
        }
    }
```

Format can be `geojson` or `kml`.


Examples
--------

* Map with two layers (XYZ + GeoJSON), using the GeoJSON vector layer features for representation (`ref` source).

```
   "dimensions": [
        {
            "label": "Country",
            "levels": [
                {
                    "attributes": [
                        "geo_code",
                        "geo_label"
                    ],
                    "key": "geo_code",
                    "label": "Country",
                    "label_attribute": "geo_label",
                    "name": "geo",
                    "role": "geo",
                    "info": {
                        "cv-geo-source": "ref",
                        "cv-geo-ref-layer": "countries",
                        "cv-geo-ref-model-attribute": "geo_code",
                        "cv-geo-ref-layer-attribute": "iso_a2",
                        "cv-geo-map-layers": [ {
                            "name": "ortophotos",
                            "type": "xyz",
                            "attribution": "&copy; Attribution Label",
                            "params": {
                                "url": "http://tile.server.example/{z}/{x}/{y}.png"
                            }
                        }, {
                            "name": "countries",
                            "type": "vector",
                            "attribution": "&copy; NaturalEarth",
                            "params": {
                                "url": "maps/ne_110m_admin_0_countries.geo.json",
                                "format": "geojson"
                            }
                        } ]
                    }
                }
            ],
            "name": "geo"
        },
```


Further information
-------------------

* [Documentation index](index.md)

![CubesViewer Map Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-map-1.png "CubesViewer Map Chart")
