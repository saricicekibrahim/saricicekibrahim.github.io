var map = new maplibregl.Map({
    container: 'map',
    style:
        'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=kHUnlOrFQWJix6vI46Hj',
    maxZoom: 9,
    minZoom: 4,
    zoom: 7,
    center: [30.665575, 36.198192],
    maxBounds: [
        [22, 32.5],
        [40, 41],
    ],
    pitch: 45
});

let dates = ["27/07/2021", "28/07/2021", "29/07/2021", "30/07/2021",
    "31/07/2021", "01/08/2021", "02/08/2021", "03/08/2021", "04/08/2021",
    "05/08/2021", "06/08/2021"]

function getPath(_index) {
    return (
        './img/' +
        _index +
        '.jpeg'
    );
}

map.on('load', function () {
    dates.forEach((date, index) => {
        map.addSource(date, {
            type: 'image',
            url: getPath(index),
            coordinates: [
                [25.065651, 39.0692],
                [36.816559, 39.0692],
                [36.816559, 34.564],
                [25.065651, 34.564]
            ]
        });

        map.addLayer({
            id: date,
            'type': 'raster',
            'source': date,
            'paint': {
                'raster-fade-duration': 1000
            },
            layout: { visibility: "none" }
        });
    })

    let i = 0;
    setInterval(function () {
        dates.forEach((date, index) => {
            setInterval(function () {
                map.setPaintProperty(
                    date,
                    "raster-opacity",
                    index === i ? 0.5 : 1
                );
            }, 1000);

            map.setLayoutProperty(
                date,
                "visibility",
                index === i || index === i - 1 ? "visible" : "none"
            );

            if (i == dates.length) {
                i = 0;

                dates.forEach((date, index) => {
                    map.setLayoutProperty(
                        date,
                        "visibility",
                        "none"
                    );
                });
                map.setLayoutProperty(
                    dates[0],
                    "visibility",
                    "visible"
                );
            }
        });
        document.getElementById('info').innerHTML = dates[i];
        i++;
    }, 1500);
});