var libData = (function ($self) {

    $self.save = function (key, value) {
        // Cookie Writing
        // document.cookie='KEY=VALUE; expires=DATE; path=/'
        var expire = (new Date("2099/12/31")).toUTCString();
        document.cookie = key + '=' + value + '; expires=' + expire + '; path=/';
        //console.info( key+'='+value+'; expires='+expire+'; path=/' ); // DEBUG

        // Local storage
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    };

    // validation functions
    $self.any = function (value) {
        return value;
    };
    $self.int10 = function (value) {
        return parseInt(value, 10);
    };
    $self.float = function (value) {
        return parseFloat(value);
    };

    $self.load = function (key, valueDefault) {
        return $self.loadValid(key, valueDefault, $self.any);
    };

    $self.loadValid = function (key, valueDefault, validate) {
        // Cookie Reading
        // 'key1=value1; key2=value2' === document.cookie
        var allCookies = decodeURIComponent(document.cookie),
            searchKey = key + '=',
            keyIndex = allCookies.indexOf(searchKey),
            semicolonPosition = allCookies.indexOf(';', keyIndex),
            valueCookie = '',
            valueLocalStorage = '';
        if (keyIndex > -1) {
            if (semicolonPosition > 0) {
                valueCookie = allCookies.slice(keyIndex + searchKey.length, semicolonPosition);
            } else {
                valueCookie = allCookies.slice(keyIndex + searchKey.length);
            }
        }

        // Local Storage
        try {
            valueLocalStorage = localStorage.getItem(key);
        } catch (e) {}

        // Prefer local storage then cookie then default
        //console.info('Loading Key: '+ key ); // DEBUG
        if (valueLocalStorage !== null && valueLocalStorage !== '') {
            //console.info('Local Raw: '+ valueLocalStorage ); // DEBUG
            //console.info('Local Valid: '+ validate(valueLocalStorage) ); // DEBUG
            return validate(valueLocalStorage);
        }
        if (valueCookie !== '') {
            //console.info('Cookie Raw: '+ valueCookie ); // DEBUG
            //console.info('Cookie Valid: '+ validate(valueCookie) ); // DEBUG
            return validate(valueCookie);
        }
        //console.info('Default Raw: '+ validate(valueDefault) ); // DEBUG
        //console.info('Default Valid: '+ validate(valueDefault) ); // DEBUG
        return validate(valueDefault);
    };

    $self.clearAll = function () {
        document.cookie = "";
        try {
            localStorage.clear();
        } catch (e) {}
    };

    $self.dumpAll = function () {
        var output = '';
        output += 'Cookie:\n';
        output += document.cookie.split('; ').join(';\n') + '\n';
        try {
            var i = localStorage.length;
            output += 'Local Storage:\n';
            while (i--) {
                output += localStorage.key(i);
                output += ':';
                output += localStorage.getItem(localStorage.key(i));
                output += ';\n';
            }
        } catch (e) {}

        return output;
    };

    $self.download = function () {
        var savedData = 'Saved Data\n';
        savedData += 'From: ' + window.location.href + '\n';
        savedData += 'Date: ' + (new Date()).toUTCString() + '\n';
        savedData += $self.dumpAll();
        var uri = 'data:application/octet-stream,' + encodeURIComponent(savedData);
        //window.location.href = uri;
        window.open(uri);
    };

    return $self;
}({}));
var data = libData;
/*
// Testing
var x = data.loadValid('x',10,data.int10),
    y = data.loadValid('y',20,data.int10),
    z = data.loadValid('z',30,data.int10);
////console.info('x:'+x);
////console.info('y:'+y);
////console.info('z:'+z);
data.save('x',x+1);
data.save('y',y);
data.save('z',z);
//document.cookie = 'ppkcookie1=testcookie; expires=Thu, 2 Aug 2001 20:47:11 UTC; path=/'
////console.info( document.cookie );
//alert(data.dumpAll());
//data.download();
*/