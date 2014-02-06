//if(console === undefined) console = {};
//else
JSON.stringifyOnce = function(obj, replacer, indent){
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value){
        if ( printedObjects.length > 2000){ // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
            return 'object too long';
        }
        var printedObjIndex = false;
        printedObjects.forEach(function(obj, index){
            if(obj===value){
                printedObjIndex = index;
            }
        });

        if ( key == ''){ //root element
            printedObjects.push(obj);
            printedObjectKeys.push("root");
            return value;
        }

        else if(printedObjIndex+"" != "false" && typeof(value)=="object"){
            if ( printedObjectKeys[printedObjIndex] == "root"){
                return "(pointer to root)";
            }else{
                return "(see " + ((!!value && !!value.constructor) ? value.constructor.name.toLowerCase()  : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
            }
        }else{

            var qualifiedKey = key || "(empty key)";
            printedObjects.push(value);
            printedObjectKeys.push(qualifiedKey);
            if(replacer){
                return replacer(key, value);
            }else{
                return value;
            }
        }
    }
    return JSON.stringify(obj, printOnceReplacer, indent);
};

console.origLog = console.log;
console.lastMessage = null;
console.log = function(){
    if(console.origLog)
        console.origLog.apply(this,arguments);

    var value = '';
    for (var i = 0; i < arguments.length; i++) {
        if(arguments[i] !== undefined){
            var JSONRep = JSON.stringifyOnce(
                arguments[i], function(key, value) {
                    if(key === 'socket') return 'io.Socket';
                    else if(key === 'nodeHtmlContent') return 'jQuery.HTMLDomNode';
                    else return value;
                });
            if(JSONRep[0] === '"') JSONRep = JSONRep.substring(1, JSONRep.length - 1);
            value +=  JSONRep + ' ';
        }else
            value += 'undefined';
    }

    if(console.lastMessage === value){
        var ele = $('#console span:first-child');
        ele.animate({
            opacity: '0'
        }, 100, function(){
            ele.animate({
                opacity: '1'
            }, 100);
        });
        return;
    }else{
        $('#console').prepend($('<span>['+(new Date()).toLocaleString()+'] '+value+'</span>'))
        console.lastMessage = value;
    }


};
