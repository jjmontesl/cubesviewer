CubesViewer Map Charts
======================

Features
--------

- Geographic data on dimension attributes and fact details
- Features: points, lines, polygons
- Sources: latitude/longitude (x/y), WKG, GeoJSON, reference to Layer/Feature
- Support for multiple layers (basemap)
- Layer types: GeoJson, WMTS
- Configurable view:
  - Automatic bounding box, fixed bounding box, free view
  - Configurable min/max zoom level

- Representation:
` - cloropleth: applies to all possible, info on hover
  - points: info on hover
  - circles (measure in radius), info on hover
  - legends

Model configuration
-------------------

```
   "dimensions": [
        {
            "name": "date_created",
            "label": "Date Created",
            "role": "time",
            "info": {
                "cv-datefilter-hierarchy": "weekly"
            },
            "levels": [
                   {
                       "name":"year",
                       "label":"Year",
                       "role": "year"
                   },
                   {
                       "name":"quarter",
                       "label":"Quarter",
                       "role": "quarter"
                   },
```


Further information
-------------------

* [Documentation index](index.md)

