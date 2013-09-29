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

CubesViewer has an "Add Date Filter" option that shows a special cut filter for date dimensions. In order for it
to work, you need to add information to your model.  

1. For each date dimension, add an "info" attribute called "cv-datefilter" with "true" value.
2. Optionally, also add an "info" attribute "cv-datefilter-hierarchy" if your desired date 
   filtering hierarchy is not "default".
3. For each *level* involved in your date filtering, add an "info" attribute "cv-datefilter-field" 
   identifying the unit of date value (one of "year", "quarter", "month" or "week").   

This is an example dimension "date_created" showing this configuration:
 
```
    "dimensions": [ 
        {
            "name": "date_created",
            "label": "Date Created",
            "info": {
                "cv-datefilter": true,
                "cv-datefilter-hierarchy": "weekly"
            },
            "levels": [
                   {
                       "name":"year",
                       "label":"Year",
                       "info": { "cv-datefilter-field": "year" }
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
                       "info": { "cv-datefilter-field": "week" }                           
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
