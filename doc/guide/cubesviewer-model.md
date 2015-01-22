CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

CubesViewer model options
-------------------------

Some of CubesViewer features rely on your model being correctly configured. This is required, for example,
in order to identify date dimensions so CubesViewer knows which dimensions can be used by date filters.

Labels
------

Cubes supports the "label" attribute on every object. If available, CubesViewer will show this attribute
when refering to Cubes, Dimensions, Hierarchies, Levels and other Cubes objects.

Date Filtering
--------------

CubesViewer has a "Date Filter" option that shows a special cut filter for date dimensions. In order for it
to work, you need to add information to your model, using also the "role" attribute of dimension and levels.

1. For each date dimension, add an "role" attribute with "time" value.
2. Optionally, also add an "info" dictionary, with a "cv-datefilter-hierarchy" attribute pointing to
   your desired date filtering hierarchy, if it is not "default".
3. For each *level* involved in your date filtering, add a "role" attribute
   identifying the unit of date value (one of "year", "quarter", "month", "week" or "day").

More information about roles at https://pythonhosted.org/cubes/model.html#roles

This is an example dimension "date_created" showing this configuration:

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
                       "label":"Quarter"
                   },
                   {
                       "name":"month",
                       "label":"Month"
                   },
                   {
                       "name":"week",
                       "label":"Week",
                       "role": "week"
                   }
               ],
            "hierarchies": [
                {
                    "name": "weekly",
                    "label": "Weekly",
                    "levels": [ "year", "week"]
                },
                {
                    "name": "monthly",
                    "label": "Monthly",
                    "levels": [ "year", "quarter", "month"]

                }
            ]
        },
        {
            "name": "date_updated_last",
            "label": "Last Update",
            "template": "date_created"
        },
        ...
```

Range Filtering
---------------

CubesViewer has a "Range Filter" option that shows a special cut filter for ranges. This can be applied
to simple dimensions which *keys* are sortable.

In order for this to work, you need to add information to your model.

1. For each range dimension, add an "info" attribute called "cv-rangefilter" with "true" value.
2. Optionally, also add an "info" attribute "cv-rangefilter-slider" if you wish the filter
   to include a slider. This attribute must be a dictionary with "min", "max" and "step" keys, as shown
   in the example below:

This is an example dimension "year" showing this configuration:

```
    "dimensions": [
        {
            "name": "date_year",
            "label": "Year",
            "info": {
                "cv-rangefilter": true,
                "cv-rangefilter-slider": {
                    "min": 2006,
                    "max": 2012,
                    "step": 1
                }
            }
        },
        ...
```

Ignored Dimensions
------------------

You can make CubesViewer ignore a dimension by adding a "cv-ignore" information key as shown
in the example below. Ignored dimensions will not be shown by CubesViewer.

```
    "dimensions": [
        {
            "name": "company",
            "label": "Company",
            "info": {
                "cv-ignore": true
            }
        },
        ...
```


