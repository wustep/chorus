Chorus-Leaflet demo

incomplete:
- delete / edit merges

bugs:
- polyline drawing on touch is buggy
- "draws" checkbox only hides/shows local draws
- when "draws" is hidden, drawing circles pushes markers instead of circles

"hacks":
- GeoJSON doesn't store circles, so a work-around is used to store radius and type
- leaflet draw's touches are buggy, fixed for shapes but not polylines
- leaflet 1.0.2 is used instead of 1.1.0, (1.0.0's geoJSON doesn't work properly, 1.1.0 breaks L.extends)
