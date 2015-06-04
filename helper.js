
/**
 * loads a JSON File
 * @param {string} url
 * @param {function} callback callback parameter is a jsonObject
 */
var loadJson = function(url, callback){
	var xhr;
	if(typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
	else {
		var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0","MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0","Microsoft.XmlHttp"];
		for(var i = 0, len = versions.length; i < len; i++) {
		try {
			xhr = new ActiveXObject(versions[i]);
			break;
		}
			catch(e){}
		}
	}
	xhr.onreadystatechange = ensureReadiness;
	function ensureReadiness() {
		if(xhr.readyState < 4) {
			return;
		}			
		if(xhr.status !== 200) {
			return;
		} 
		// all is well	
		if(xhr.readyState === 4) {
			var input = JSON.parse(xhr.responseText);
			callback(input);
		}
	}
	xhr.open('GET', url, true);
	xhr.send('');	
}


var DEGREES_PER_RADIAN = 180.0 / Math.PI;
var RADIANS_PER_DEGREE = Math.PI / 180.0;

var toRadians = function(degrees) {
    return degrees * RADIANS_PER_DEGREE;
};
var toDegrees = function(radians) {
    return radians * DEGREES_PER_RADIAN;
};