//uglifyjs app.js -c -m -o app.min.js
var app = angular.module('droneApp', []).controller('droneCtrl', ['$scope', '$http', function($scope, $http) {
	var container = document.getElementById('popup');
	var content = document.getElementById('popup-content');
	var closer = document.getElementById('popup-closer');
	
    $scope.videoFilter = {
            search: ''
          };
	
	var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
		element: container,
		autoPan: true,
		autoPanAnimation: {
			duration: 250
		}
	}));
	
	$scope.filteredMapData;
	$scope.filterMap = function(){
		setTimeout(function(){ 
			$scope.features = [];
			angular.forEach($scope.filteredMapData, function(value, key) {
				$scope.features.push(new ol.Feature({
					geometry : new ol.geom.Point(
						ol.proj.transform($scope.getLatLonAsArray(value[0]), 'EPSG:4326','EPSG:3857')),
					youtube_id:value[1],
					descr:value[2]}));
			});
	    	$scope.videoMapSource.clear();
	    	$scope.videoMapSource.addFeatures($scope.features);
		}, 2000);
	}

	closer.onclick = function() {
		$scope.closePopup();
	};

	$scope.closePopup = function()
	{
		content.innerHTML = null;
		overlay.setPosition(undefined);
		closer.blur();
		return false;
	}

	//for angular to trust youtube url
	$scope.getIframeSrc = function(src) {
			return "https://www.youtube.com/watch?v=" + src;
	};
	
	$scope.view = new ol.View({
		center : ol.proj.transform([ 32.9, 39.9 ], 'EPSG:4326', 'EPSG:3857'),
		zoom : 10
//		rotation: Math.PI / 6
	});
	
	$scope.map = new ol.Map({
        interactions: ol.interaction.defaults().extend([
            new ol.interaction.DragRotateAndZoom()
          ]),
		target : 'map',
		layers : [new ol.layer.Tile({
            source: new ol.source.Stamen({
                layer: 'terrain'
              })
            })],
		view : $scope.view,
		overlays: [overlay]
	});
	
	$scope.screenBigEnough = function()
	{
		return $(window).width() > 750;
	}
	
	$scope.videoLayer = null;
	$scope.videoMapSource = null;
	$scope.features = [];
	$scope.mapData = [];
	new ol.source.Vector({
		features: null
	});
	var allMapData = [];
	
	$http.get("https://sheets.googleapis.com/v4/spreadsheets/1_2J3C_78i9GGbZNznGZD3OIzBaFGZFv1OBiGcCG5s1U/values/A1:D250?key=AIzaSyBalaFs-lUjr0cck_aGIqI4WQHcCYRZ2FE")
	.then(function(response) {
		$scope.mapData = response.data.values;
		allMapData = response.data.values;
		angular.forEach($scope.mapData, function(value, key) {
			$scope.features.push(new ol.Feature({
				geometry : new ol.geom.Point(
					ol.proj.transform($scope.getLatLonAsArray(value[0]), 'EPSG:4326','EPSG:3857')),
				youtube_id:value[1],
				descr:value[2]}));
		});

		$scope.videoMapSource = new ol.source.Vector({
			features: $scope.features
		});

		$scope.videoLayer = new ol.layer.Vector({
			source: $scope.videoMapSource,
			style: new ol.style.Style({
				image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
					src: 'img/videoIcon.png'
				}))
			})
		});
		$scope.map.addLayer($scope.videoLayer);
		
		$scope.map.getView().fit($scope.videoLayer.getSource().getExtent(), $scope.map.getSize());
	});
	
	//used on zooming selected point
    function elastic(t) {
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
      }
    
    $scope.zoomToVideo = function(argCoordinate)
    {
    	$scope.view.animate({
            center: ol.proj.fromLonLat($scope.getLatLonAsArray(argCoordinate)),
            duration: 2000,
            easing: elastic
          });
    }
    
    $scope.getPopupContent = function(argFeature)
    {
    	if($scope.screenBigEnough())
		{
    		return argFeature.get('descr') + "<iframe width='350' height='250' src='https://www.youtube.com/embed/" + argFeature.get('youtube_id') + "' frameborder='0' allowfullscreen></iframe>";
		}
    	else
		{
    		return argFeature.get('descr') + "<br><a href='https://www.youtube.com/watch?v=" + argFeature.get('youtube_id') + "' target='_blank'>Click for Video</a>";
		}
    }
    
    //openlayers works just with float values
    $scope.getLatLonAsArray = function(argLonLatStr)
    {
    	var latLon = argLonLatStr.split(",");
    	return [parseFloat(latLon[1]),parseFloat(latLon[0])];
    }
	
	$scope.map.on('click', function(evt) {
		var feature = $scope.map.forEachFeatureAtPixel(evt.pixel,
			function(feature) {
				return feature;
			});
		if (feature) {
			content.innerHTML = $scope.getPopupContent(feature);
			overlay.setPosition(evt.coordinate);
		}
		else{
			$scope.closePopup();
		}
	});

    $scope.map.on('moveend', function onMoveEnd(evt) {
        var map = evt.map;
        var extent = map.getView().calculateExtent(map.getSize());
        var bottomLeft = ol.proj.transform(ol.extent.getBottomLeft(extent),
            'EPSG:3857', 'EPSG:4326');
        var topRight = ol.proj.transform(ol.extent.getTopRight(extent),
            'EPSG:3857', 'EPSG:4326');
        
        $scope.mapData = [];
    	
		angular.forEach(allMapData, function(value, key) {
	    	var lonLat = $scope.getLatLonAsArray(value[0]);
	    	if(lonLat[0] > bottomLeft[0] && lonLat[0] < topRight[0] &&
	    			lonLat[1] > bottomLeft[1] && lonLat[1] < topRight[1])
	    		{
	    			$scope.mapData.push(value);
	    		}
		});
		
    	$scope.$apply();
      });
}]);