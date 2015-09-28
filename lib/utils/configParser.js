var et = require('elementtree');
var fs = require('fs');


function parseXml(filename) {
    return new et.ElementTree(et.XML(fs.readFileSync(filename, "utf-8").replace(/^\uFEFF/, "")));
}

// function getStartPage(configXML) {
//     var filename = configXML;
//     configXml = parseXml(filename);
//     var contentTag = configXml.find('content[@src]');
//     return contentTag && contentTag.attrib.src;
// };

//module.exports.getStartPage = getStartPage;

module.exports.ChangeStartPage = function(hostedPage, configXML) {
    var filename = configXML;
    configXml = parseXml(filename);
    var contentTag = configXml.find('content[@src]');
    if (contentTag) {
        contentTag.attrib.src = hostedPage;
    }
    // Also add allow nav in case of 
    var allowNavTag = et.SubElement(configXml.find('.'), 'allow-navigation');
    allowNavTag.set('href', '*');
    fs.writeFileSync(filename, configXml.write({
        indent: 4
    }), "utf-8");
    return filename;
};
