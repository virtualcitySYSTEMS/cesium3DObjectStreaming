importScripts('rbush.js');
importScripts('helper.js');

var rtree = rbush(16);
var baseUrl = "";
var baseName = "";

var data ={};


var loadSettings = function(url){
	loadJson(url, initializeSettings);
}
var initializeSettings = function(json){
	for (var key in json){
	    var item = json[key].envelope;
	    var url = baseUrl + json[key].link;
	    item.push({id:key, url:url, tile:json[key].tile});	   
	    rtree.insert(item);
	}
}
var loadTile = function(id, url){
	if(tilesLoading[id] && tilesLoading[id] == true){
		return
	}else{
		loadJson(url, function(json){
			data[id] = rbush(9);
			for  (var key in json){
				var jsonItem = json[key];
				var item = jsonItem.envelope;
				var url = baseUrl + baseName + "_Tile_" + jsonItem.tile[0] + "_" + jsonItem.tile[1] + "_collada/" + jsonItem.path + '/' + key + '.bgltf';
				item.push({id:key, url:url, x:jsonItem.x,  y:jsonItem.y, z:jsonItem.z});
				data[id].insert(item);
			}	
			tilesLoading[id] = false;
			
			if (typeof timer != "undefined")	        	
		         clearTimeout(timer);
		      timer = setTimeout(function() {
		    	  updateTileStructure(data.tiles, maxLevel, maxModels);
		       }, 150);
		});
		tilesLoading[id] = true;
	}
}
var addModel = function(){
	if(listenToRender){
		if(tilesToRemove.length > 0){
			var ids = [];
			for(var i = 0; i < tilesToRemove.length; i++){
				ids.push(tilesToRemove[i]);
			}
			tilesToRemove = [];
			self.postMessage({'cmd':'remove', 'ids':ids});
		}else  if(tilesToRender.length > 0){
			var tile = tilesToRender.shift();
			tilesRendered.push(tile.id);
			self.postMessage({'cmd':'add', 'data':tile});
		}
	}
}

var all = rtree.all();
for (var i = 0; i < all.length; i++){
    var url = all[i][4].url;
    var id = all[i][4].id;
    loadTile(id, url);
}
var tilesRendered = [];
var tilesToRemove = [];
var tilesToRender = [];
var tilesRenderedCount = 0;
var listenToRender = true;

var tilesToLoad = {};
var tilesLoading = {};
var collectCurrentTiles = function(){		
	tilesToLoad = {};
	var count = 0;
	for (var i = 0; i < tiles.length; i++){
		var tile = tiles[i];		  
	    tile.bbox[0] = toDegrees(tile.bbox[0]);
	    tile.bbox[1] = toDegrees(tile.bbox[1]);
	    tile.bbox[2] = toDegrees(tile.bbox[2]);
	    tile.bbox[3] = toDegrees(tile.bbox[3]);
		var dataTiles = rtree.search(tile.bbox);
		for(var j = 0; j < dataTiles.length; j++){
			var dataTile = dataTiles[j][4];
			if(!data[dataTile.id]){
				tilesToLoad[dataTile.id] = dataTile;
				count++;
			}						
		}
	}
	if(count > 0){		
		for(var key in tilesToLoad){
			var tile = tilesToLoad[key];
			loadTile(tile.id, tile.url);
		}	
	}else{
		 if (typeof timer != "undefined")	        	
	         clearTimeout(timer);
	      timer = setTimeout(function() {
	    	  updateTileStructure(data.tiles, maxLevel, maxModels);
	       }, 150);
	}
}

var updateTileStructure = function(){
	listenToRender = false;
    tilesToRemove = tilesRendered.slice();
    tilesRendered = [];
    tilesToRender = [];
    var modelCount = 0;
    for (var i = 0; i < tiles.length; i++){
        var tile = tiles[i];

        if(tile.level > maxLevel){
			var dataTiles = rtree.search(tile.bbox);
			var models = [];
			for(var j = 0; j < dataTiles.length; j++){
				if(data[dataTiles[j][4].id]){
					var modelsSelection = data[dataTiles[j][4].id].search(tile.bbox);
					models = models.concat(modelsSelection);
				}				
			}
            for(var j = 0; j < models.length; j++){
                var model = models[j][4];
                var alreadyInside = false;
                for(var l = 0; l < tilesToRender.length; l++){
                    //check if model already active;
                    if(tilesToRender[l].id == model.id){
                        alreadyInside = true;
                        break;
                    }
                }
                for(var l = 0; l < tilesRendered.length;l++){
                    if(tilesRendered[l] == model.id){
                        alreadyInside = true;
                        break;
                    }
                }
                if(!alreadyInside){
                    var alreadyRendered = false;
                    for(var k = 0; k < tilesToRemove.length; k++){
                        if(tilesToRemove[k] == model.id){
                            tilesToRemove.splice(k, 1);
                            tilesRendered.push(model.id);
                            alreadyRendered = true;
                            modelCount++;
                            if(modelCount >= maxModels){
                                listenToRender = true;
                                return;
                            }
                            break;

                        }
                    }
                    if(!alreadyRendered){
                        tilesToRender.push(model);
                        modelCount++;
                        if(modelCount >= maxModels){
                            listenToRender = true;
                            return;
                        }
                    }
                }
            }
        }
    }
    listenToRender = true;
}


var timer;
var tiles;
var maxLevel = 16;
var maxModels = 500;
self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
  	case 'initialize':
  		var url = data.url;
  		baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
  		baseName = url.substring(url.lastIndexOf("/"), url.lastIndexOf("."));
  		loadSettings(url);  		
    case 'postRender':
    	addModel();
    	break;
    case 'tileStructureChanged':
    	maxLevel = data.maxLevel;
    	maxModels = data.maxModels;
    	tiles = data.tiles;
    	collectCurrentTiles();
        break;
  };
}, false);

