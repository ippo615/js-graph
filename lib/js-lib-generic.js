// -----------------------------------------------------------------------------
// --------------------------------------------------------- Dom Manipulation -
function loadScript(url, onLoad){
    var script = document.createElement("script");
    script.type = "text/javascript";
    // Internet explorer
    if (script.readyState){
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" || script.readyState == "complete"){
                script.onreadystatechange = null;
                onLoad();
            }
        };
    // Others
    } else {
        script.onload = function(){
            onLoad();
        };
    }
    // Set the src after enabling the callback; otherwise, race condition
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}
// -----------------------------------------------------------------------------
// ----------------------------------------------------- Internationalization -
function getClosestLanguageCode(code){
	var valids = ["en-us","af","ar","be","bg","ca","cs-cz","da-dk","de-de","el-gr","en-us","es-es","es-us","et","fa","fi-fi","fil","fr-fr","hi-in","hr","hu-hu","it-it","iw-il","ja-jp","ko-kr","lt","lv","ms","nl-nl","no-no","pl-pl","pt-br","pt-pt","ro","ru-ru","sk","sl","sr","sv-se","sw","th","tr-tr","uk","vi","zh-cn","zh-tw"];
	var i = valids.length;
	var lowerCode = code.toLowerCase();
	while( i-- ){
		if( valids[i] === lowerCode ){
			return valids[i];
		}
	}
	// return default:
	return valids[0];
}
// Hopefully my data saving library has loaded before this is called
function loadTranslation(langDir,onLoad) {
    var language = data.loadValid('lang', 'NONE', data.any);
    if (language === 'NONE') {
        language = window.navigator.userLanguage || window.navigator.language;
	language = language.toLowerCase();
    }
    language = getClosestLanguageCode(language);
    loadScript(langDir + language + ".js", onLoad);
}

