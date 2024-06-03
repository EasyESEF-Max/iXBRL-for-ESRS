// Copyright 2024 EasyEsef Ltd. Confidential
// Version 2024-04-29


const srcpath = process.argv[2];
const fs = require('fs');
const util = require('util');
const srcparser = require('xml2js');
const csv = require('csv-parser');
const {JSDOM} = require('jsdom')
var idElement = 0;

//-------------Datei-Vorbearbeiten----------
{
    const xmlFilePath = srcpath.toString();
    const xmlData = fs.readFileSync(xmlFilePath, 'utf8');

// Verwende jsdom, um den HTML-Code zu parsen
    const dom = new JSDOM(xmlData);
    const document = dom.window.document;
    var ab = false


// Extrahiere den sichtbaren Text und umgebe ihn mit <div> Tags
    extractVisibleTextWithDiv(document.documentElement);

// Funktion zur Extraktion des sichtbaren Textes und Umgebung mit <div> Tags
    function extractVisibleTextWithDiv(node) {
        const excludeTags = ['script', 'style'];

        if (node.nodeType === 3) { // TEXT_NODE
            // Textknoten mit <div> Tags umgeben (ignoriere Leerzeichen)
            const trimmedText = node.textContent.trim();

            if (trimmedText !== '') {
                const divNode = document.createElement('div');
                divNode.textContent = trimmedText;
                divNode.setAttribute('style', '');
                node.parentNode.insertBefore(divNode, node);
                node.parentNode.removeChild(node);
            }
        } else if (node.nodeType === 1 && !excludeTags.includes(node.nodeName.toLowerCase())) { // ELEMENT_NODE
            // Elementknoten durchlaufen und Text rekursiv extrahieren
            for (const childNode of node.childNodes) {
                extractVisibleTextWithDiv(childNode);
            }
        }
    }

// Schreibe den bearbeiteten HTML-Code zurück in die XML-Datei
    const editedXmlData = dom.serialize();
    fs.writeFileSync("sp3.html", editedXmlData);
    console.log("\n\nThe process has completed successfully.");
    console.log('This XML-File has been converted:', xmlFilePath +"\n");
    console.log('The file should now be in the folder next to the js programm.')
    console.log("All operations ran smoothly without any issues.");
    console.log("Thank you for using our software!");

    console.log("If you encounter any bugs or have any questions, please do not hesitate to contact us!");

    console.log("Have a great day!\n\n");
}

function readCSV(fileName) {
    const csvContent = fs.readFileSync(fileName,'utf-8')
    const csvLines = csvContent.split('"\n');
    let firstLine = true;
    let fL = []

    const result = [];

    for (let csvLine of csvLines) {
        let a = true;
        for (let i = 0; i < csvLine.length; i++) {
            if (csvLine.charAt(i)==='"'&& a){
                a = false
                continue
            }
            if (csvLine.charAt(i)==='"'&& !a){
                a = true
                continue
            }
            if (a && csvLine.charAt(i)===","){
                const chars = csvLine.split("")
                chars[i]="*"
                csvLine = chars.join("")
            }
        }
        if (firstLine){
            fL = csvLine.split("*");
            firstLine = false
        }else {
            const mapper = new Map();
            for (let i = 0; i < csvLine.split("*").length; i++) {
                mapper.set(fL[i].replaceAll('"',''),csvLine.split("*")[i].replaceAll('"',""))
            }
            result.push(mapper)
        }
    }
    return result;
}


//-------------Const----------------
let read = fs.readFileSync("sp3.html", 'utf-8');


cleanSpec()
const csvData = readCSV('taxonomy.csv');
var idCounter = 1;
var parsed;
const stylesMap = new Map();
var footerText;
var basicFile;
var textStyle = "14px #000000 Open Sans", paragraphStyle = "14px #000000 Open Sans", headingStyle = "font-size: 17px; color: #2F5496; font-family: Open Sans", TOCStyle = "font-size:21px; min-height:21px; text-transform:uppercase", pagefooterStyle = "10px #44546A Open Sans";
const divMap = [];
const divMap2 = [];


//-------------Routine--------------

readSpecifications(read)
parseStyle(); // finished
parseContent();
readBasicData();
createxhtml(stylesMap, basicFile)

return;


//-----------Routine end------------

function readSpecifications(src) {
    const parser = new srcparser.Parser();
    parser.parseString(src, (parseErr, result) => {

        if (parseErr) {
            console.error('Fehler beim Parsen des XML:', parseErr);
            return;
        }
        parsed = result;
    });
}
function parseStyle(){
    const a = parsed['html']['body'][0]['div'][0]['div'][0]['$']['style'].toString().replaceAll("\n", "").replaceAll("\r", "").replaceAll("\t", "").replaceAll("--conix-", "").split(";");

    for (var string of a) {
        stylesMap.set(string.split(":")[0], string.split(":")[1].replaceAll("'",""));


        if (string.split(":")[0].includes("Text")){
            const textStylePre = stylesMap.get(string.split(":")[0]).split(" ")
            textStyle = "font-size: "+textStylePre[0]+"; color: "+textStylePre[1]+"; font-family: "+textStylePre[2];
            if (textStylePre.length===4){
                textStyle+= " "+textStylePre[3]
            }

        }
        if (string.split(":")[0].includes("Paragraph")){
            const paragraphStylePre = stylesMap.get(string.split(":")[0]).split(" ")
            paragraphStyle = "font-size: "+paragraphStylePre[0]+"; color: "+paragraphStylePre[1]+"; font-family: "+paragraphStylePre[2];
            if (paragraphStylePre.length===4){
                paragraphStyle+= " "+paragraphStylePre[3]
            }

        }
        if (string.split(":")[0].includes("pagefooter") && false){
            const pagefooterStylePre = stylesMap.get(string.split(":")[0]).split(" ")
            pagefooterStyle = "font-size: "+pagefooterStylePre[0]+"; color: "+pagefooterStylePre[1]+"; font-family: "+pagefooterStylePre[2];
            if (pagefooterStylePre.length===4){
                paragraphStyle+= " "+pagefooterStylePre[3]
            }

        }
        if (string.split(":")[0].includes("Heading")){
            const headingStylePre = stylesMap.get(string.split(":")[0]).split(" ")
            headingStyle = "font-size: "+headingStylePre[0]+"; color: "+headingStylePre[1]+"; font-family: "+headingStylePre[2];
            if (headingStylePre.length===4){
                headingStyle+= " "+headingStylePre[3]
            }

        }
        if (string.split(":")[0].includes("TOC")){
            const TOCStylePre = stylesMap.get(string.split(":")[0]).split(" ")
            TOCStyle = "font-size: "+TOCStylePre[0]+"; color: "+TOCStylePre[1]+"; font-family: "+TOCStylePre[2];
            if (TOCStylePre.length===4){
                TOCStyle+= " "+TOCStylePre[3]
            }
        }
    }
}
function parseContent(){
    const array = [];
    const a = parsed['html']['body'][0]['div'][0]['div'];

    for (var aElement of a) {
        array.push(aElement);
    }
    array.shift()
    recursive(array)
}
function recursive (array){
    for (const arrayElement of array) {
        if (arrayElement.hasOwnProperty('div')){
            divMap.push([arrayElement['$']['style'].toString(), [arrayElement['div'][0]['$']['style'], arrayElement['div'].length]])
            recursive(arrayElement['div'])
        }else {
            if (arrayElement.hasOwnProperty('_')){
                divMap.push([arrayElement['$']['style'].toString(), arrayElement['_'].toString()])
            }else {
                divMap.push([arrayElement['$']['style'].toString(), ""])
            }
        }
    }
}
function readBasicData(){
    try {basicFile = fs.readFileSync("basic.txt", 'utf8');}
    catch (err){console.error('Fehler beim Lesen der Datei:', err);}
}
function createxhtml(map, path){
    const filename = map.get("default")+"_"+map.get("period").toString()+"_SustainabilityReport.xhtml"
    fs.writeFileSync( filename, path, (err) =>{
        if (err){
            console.error("File could not be created")
        }else {
            console.log("The File was created successfully")
        }
    });
    xhtmlWrite(filename)
}

function xhtmlWrite(filename){

    const orgXHTML = fs.readFileSync(filename, 'utf-8');
    const dom = new JSDOM(orgXHTML);
    const document = dom.window.document;
    //xhtmlTOC(document, map)
    toc(document)
    setReferences(document)


    content(document)
    setHidden(document)
    var modifiedXHTML = dom.serialize();
    modifiedXHTML = modifiedXHTML.replaceAll("br>", "br />").replaceAll("hr>", "hr />").replaceAll("continuedat", "continuedAt")

    fs.writeFileSync(filename, modifiedXHTML, 'utf-8' )
}

function content(doc){
    let a,b;
    a = b = true;
    let factCounter = 1;
    var outer;
    var wordcounter = 0;
    var parentElement = new Array();
    while (divMap.length >0){
        const actual = divMap.shift()
        divMap2.push(actual.slice(0,3))


        if (actual[0].includes("TOC")){
            const newOuter = newPage(doc, true)
            outer = newOuter
            wordcounter = 0;
            continue;
        }else if (actual[0].includes("Heading")){
            const head = doc.createElement('div')
            head.classList.add("defaultParagraph", "Heading2")
            head.setAttribute("style", headingStyle)

            outer.appendChild(head)
            parentElement.push(["Heading", head,1])
            wordcounter+= 15
        }else if (actual[0].includes("Paragraph")){
            const para = doc.createElement('div')
            para.classList.add("defaultParagraph", "normalWeb")
            para.setAttribute("style", paragraphStyle)


            if (parentElement.length === 0){
                outer.appendChild(para)
            }else {
                const parent = parentElement.pop();
                if (parent[0].includes("Paragraph")){
                    if (parentElement.length===0){
                        outer.appendChild(para)
                    }else {
                        const scndParent = parentElement.pop()
                        if (scndParent[0].includes("Concept")){
                            scndParent[1].appendChild(para)
                        }else{
                            console.log("Hier ist etwas anderes Passiert!------------------------------------------")
                        }
                        parentElement.push(scndParent)
                    }
                }else if (parent[0].includes("tr")||parent[0].includes("td")||parent[0].includes("table")){
                    throw new Error("In dieser Version ist es nicht möglich Paragraphen in Tabellen einzubetten")
                }else{
                    parent[1].appendChild(para)
                    parentElement.push(parent)
                }
            }
            parentElement.push(["Paragraph", para, 1])
            wordcounter+= 15;
        }else if(actual[0].includes("table")){
            if (actual[0].includes("table:table")){

                const tbl = doc.createElement("table")
                tbl.classList.add("TableGrid")
                tbl.style = "width:601px; border-collapse:collapse; margin:0px auto 0px 0px; border-style:none; margin-top:20px";
                tbl.setAttribute("dir", "ltr")

                if (parentElement.length === 0){
                    outer.appendChild(tbl);
                }else {
                    const parent = parentElement.pop()

                    parent[1].appendChild(tbl)
                    if (parent[0].includes("Paragraph")){
                        parentElement.push(parent)
                    }else if (parent[2] >1){
                        parent[2]--;
                        parentElement.push(parent)
                    }
                    parentElement.push(["table", tbl, actual[1][1]])
                }


            }else if (actual[0].includes("table:tr")){
                if (a===b){
                    a = false;
                }else {
                    b = false
                    a = true;
                }
                const tr = doc.createElement("tr")
                const parent = parentElement.pop()
                parent[1].appendChild(tr)

                if (parent[2] >1){
                    parent[2]--;
                    parentElement.push(parent)
                }
                parentElement.push(["tr", tr, actual[1][1]])

            }else {
                var td = doc.createElement("td")
                var span = doc.createElement("span")
                var div = doc.createElement("div")

                if (!a){
                    td.classList.add("tableRwUp")
                }else {
                    td.classList.add("tableRw")
                }
                div.classList.add("defaultParagraph","Normal")
                div.style = "text-align:justify; margin-top:0px; margin-bottom:15px"
                span.style = "font-size:13px; min-height:13px; font-family:'Open Sans Light'"

                td.appendChild(div)
                div.appendChild(span)

                const parent = parentElement.pop()

                parent[1].appendChild(td)

                if (parent[2] >1){
                    parent[2]--;
                    parentElement.push(parent)
                }
                parentElement.push(["td", td, actual[1][1]])
            }
        }

        if (actual[0].includes("concept")){
            const outerxbrl = doc.createElement('ix:NonNumeric')
            var rightAtt;
            var cenvalue = null;
            if (actual[0].includes(";")){
                for (const splitElement of actual[0].split(";")) {
                    if (splitElement.includes("concept")){
                        rightAtt = splitElement.split(":")[1]
                    }
                    if (splitElement.includes("cenix-value")){
                        cenvalue = splitElement.split(":")[1]
                    }
                }
            }else {
                rightAtt = actual[0].split(":")[1]
            }

            outerxbrl.setAttribute("name", "esrs:" + rightAtt)
            outerxbrl.setAttribute("xml:lang", stylesMap.get("lang"))
            outerxbrl.setAttribute("id", "fact-"+factCounter++ )
            if (taxonomyScanner(rightAtt,"string")){
                outerxbrl.setAttribute("escape", "true")
                divMap2[divMap2.length-1] = [divMap2[divMap2.length-1][0], divMap2[divMap2.length-1][1],"fact-"+(factCounter-1), "true"]
            }else {
                outerxbrl.setAttribute("escape", "false")
                divMap2[divMap2.length-1] = [divMap2[divMap2.length-1][0], divMap2[divMap2.length-1][1],"fact-"+(factCounter-1), "false"]
            }

            if (actual[3] === undefined){
                outerxbrl.setAttribute("contextRef", "c-1")
                divMap2[divMap2.length-1].push("c-1")
            }else {
                outerxbrl.setAttribute("contextRef", "c-"+actual[3])
                divMap2[divMap2.length-1].push("c-"+actual[3])
            }

            outerxbrl.setAttribute("format", "xxx")

            if (parentElement.length === 0){
                outer.appendChild(outerxbrl)
            }else {
                const parent = parentElement.pop();
                if (parent[0].includes("Paragraph")){
                    if (parentElement.length !==0){
                        const scndParent = parentElement.pop();
                        if (scndParent[2]>1){
                            scndParent[2]-=1;
                            parentElement.push(scndParent);
                            parentElement.push(parent)
                        }
                    }else {
                        parentElement.push(parent)
                    }

                }else if ((parent[0].includes("Concept")|| parent[0].includes("table")||parent[0].includes("td")||parent[0].includes("tr") )&& parent[2]>1 && !parent[0].includes("Heading")){
                        parent[2]--;
                        parentElement.push(parent)
                }
                if (parent[0].includes("td")){
                    parent[1].children[parent[1].children.length-1].children[0].appendChild(outerxbrl)
                }else {
                    parent[1].appendChild(outerxbrl)
                }

            }
            parentElement.push(["Concept", outerxbrl, actual[1][1]])

        }


        if (!Array.isArray(actual[1])){ // ist gleichgültig mit (style = '')
            const innertext = doc.createElement('span')
            innertext.textContent = actual[1] + " ";

            if (parentElement.length === 0){
                outer.appendChild(innertext)
            }else {
                const parent = parentElement.pop()
                if (parent[0].includes("Paragraph")){
                    if (parentElement.length === 0){
                        parentElement.push(parent)
                    }else{
                        const scndParent = parentElement.pop()
                        if (scndParent[0].includes("Concept") && scndParent[2] >1){
                            scndParent[2]--;
                            parentElement.push(scndParent);
                        }
                    }
                }else if ((parent[0].includes("Concept")||parent[0].includes("table")||parent[0].includes("td")||parent[0].includes("tr"))&& parent[2]>1){
                    parent[2]--;
                    parentElement.push(parent)
                }
                if (parent[0].includes("td")){
                    parent[1].children[parent[1].children.length-1].children[0].appendChild(innertext)
                }else {
                    parent[1].appendChild(innertext)
                }

            }

            wordcounter+= actual[1].split(" ").length;
            var pa = outer;
            if (parentElement.length!== 0){
                pa = parentElement.pop()
                parentElement.push(pa)
                pa = pa[1]
            }
            if (divMap.length!==0 && divMap[0][0].includes("td")){
                wordcounter+=20*divMap[0][2];
            }
            if (wordcounter>= 510){
                var prop = continuation(doc,actual,pa,parentElement);
                parentElement = prop.newParentElement;
                wordcounter = 0;
                outer = prop.outer;
            }
        }
    }
}
function continuation(doc,actual,element,parentList){
    const newOuter = newPage(doc, false)
    var newParentElement = new Array();
    var outer = newOuter;
    const continuedIX = new Array();
    if (!element.classList.contains("page_body_after_0")) {
        continuedIX.push(element);
        while (element.parentNode !== null && !element.parentNode.classList.contains("page_body_after_0")) {
            continuedIX.push(element.parentNode)
            element = element.parentNode
        }
    }
    for (const continuedIX1 of continuedIX) {
        newParentElement.push(["x", continuedIX1, 0])
    }
    for (const newParentElementElement of newParentElement) {
        for (const parentListElement of parentList) {
            if (parentListElement[1].getAttribute("name") === newParentElementElement[1].getAttribute("name")){
                newParentElementElement[2] = parentListElement[2]
                newParentElementElement[0] = parentListElement[0]
            }
        }
    }
    let separateCounter = 0;
    while (continuedIX.length!==0){
        const elementc = continuedIX.pop()
        if (elementc.tagName === "DIV"){
            const para = doc.createElement("div")
            para.classList.add("defaultParagraph", "normalWeb")
            para.setAttribute("style", paragraphStyle)
            outer.appendChild(para)
            outer = para;
            newParentElement[newParentElement.length-1-separateCounter][1] = para;
        }else {
            const ix = doc.createElement("ix:continuation")
            elementc.setAttribute("continuedAt", "_ix-046a-"+idElement);
            ix.setAttribute("id", "_ix-046a-"+idElement++);
            outer.appendChild(ix)
            outer = ix;
            newParentElement[newParentElement.length-1-separateCounter][1] = ix;
        }
        separateCounter++;
    }
    for (const newParentElementElement of newParentElement) {
        if (newParentElementElement[0].includes("Paragraph")){
            newParentElement = newParentElement.filter(item=>item[0] !== "Paragraph")
        }
    }
    return {
        outer: newOuter,
        newParentElement: newParentElement
    }
}

function taxonomyScanner(technicalName,search){
    for (const result of csvData) {
        if (result.get("Technical Name").replace("esrs:", "") ===technicalName){
            return result.get("Type name short") ===search;
        }
    }
    return false;
}
function newPage(doc, trFa){
    const pageContent = doc.createElement('div')
    const footer = doc.createElement('div');
    const body = doc.createElement('div');


    pageContent.classList.add("page_after_0", "container")
    pageContent.setAttribute("style", textStyle)
    body.classList.add("page_body_after_0")
    if (trFa){
        createBody(body,doc)
    }
    footer.classList.add("page_footer_after_0")
    createFooter(footer,doc)

    doc.body.appendChild(pageContent);
    pageContent.appendChild(body)
    pageContent.appendChild(footer)
    return body;

}
function createBody(body,doc){
        tocElement = divMap.shift()
        divMap2.push(tocElement)
        const divBtoc = doc.createElement('div')
        const divBtoc2 = doc.createElement('span')

        divBtoc.classList.add("defaultParagraph", "Heading1")
        divBtoc.setAttribute("style", TOCStyle)
        divBtoc2.classList.add("hyperlink-no-style")
        divBtoc2.setAttribute("id", "xxxxxxx")
        divBtoc2.textContent = tocElement[1]




    body.appendChild(divBtoc)
    divBtoc.appendChild(divBtoc2)

}

function toc(document){
    let compName = document.getElementById("companyName")
    const div = document.createElement('div')
    div.setAttribute("dir", "ltr")
    div.setAttribute("style", "font-size:43px; min-height:43px; text-transform:uppercase")
    div.textContent = stylesMap.get("default").replaceAll("\'", "")
    compName.appendChild(div);
    tocTable(document)
}
function tocTable(document){
    let tocTableH = document.getElementById("tocTableH")

    var i = 2;
    var x = false
    for (const divMapElement of divMap) {

        if (divMapElement[0].includes("TOC")){
            x = true
            continue;
        }
        if (x){
            const outer1 = document.createElement('div')
            const left = document.createElement('div')
            const al = document.createElement('a')
            const right = document.createElement('div')
            const ar = document.createElement('a')

            outer1.classList.add("defaultParagraph", "TOC1", "toc-row")
            left.classList.add("float-left")
            al.setAttribute("href", "xxxx", )
            al.setAttribute("title", "Click to follow link")
            al.classList.add("hyperlink-no-style")
            al.textContent = divMapElement[1];

            right.classList.add("float-right")
            ar.setAttribute("href", "xxxx", )
            ar.setAttribute("title", "Click to follow link")
            ar.classList.add("hyperlink-no-style")
            ar.textContent = i++;

            tocTableH.appendChild(outer1)
            outer1.appendChild(left)
            left.appendChild(al)
            outer1.appendChild(right)
            right.appendChild(ar)
            x = false
        }

    }


}

function createFooter(footer,doc){
    const divF = doc.createElement('div')

    divF.classList.add("defaultParagraph", "Footer")
    divF.innerHTML = "<hr/><p><small>"+footerText+"</small</p>"

    footer.appendChild(divF)
}

function setReferences(doc){


    const allReferences = new Array();
    allReferences.push(["period:"+stylesMap.get("period").replaceAll("'", "")])
    for (const divMapElement of divMap) {
        if (divMapElement[0].includes("period")){
            let checkArray = new Array();
            for (const splitElement of divMapElement[0].split(";")) {
                if (splitElement.includes("period")){
                    checkArray.unshift("period:"+splitElement.split(":")[1].replaceAll("'", "").trim())
                }
                if (splitElement.includes("dimensions")){
                    checkArray.push("dimension:"+splitElement.split(":")[1].trim())
                }
            }
            checkArray.sort()
            if (!arrayInList(checkArray,allReferences)){
                allReferences.push(checkArray)
            }
            divMapElement[3] = arrayInListPosition(checkArray,allReferences)+1;
            continue
        }
        if (divMapElement[0].includes("cenix-dimensions")){
            let checkArray = new Array();
            for (const splitElement of divMapElement[0].split(";")) {
                if (splitElement.includes("dimensions")){
                    checkArray.push("dimension:"+splitElement.split(":")[1].trim())
                }
            }
            checkArray.sort()
            if (!arrayInList(checkArray,allReferences)){
                allReferences.push(checkArray)

            }
            divMapElement[3] = arrayInListPosition(checkArray,allReferences)+1;
        }
    }

    const ixResourcesElement = doc.querySelector('ix\\:Resources');

    for (const allReference of allReferences) {

        const a = doc.createElement("xbrli:context")
        const entity = doc.createElement("xbrli:entity")
        const identifier = doc.createElement("xbrli:identifier")
        const c = doc.createElement("xbrli:period")
        const d = doc.createElement("xbrli:startDate")
        const e = doc.createElement("xbrli:endDate")


        a.setAttribute("id", "c-"+idCounter++)
        identifier.setAttribute("scheme", "http://standards.iso.org/iso/17442")
        identifier.textContent = stylesMap.get("value")

        a.appendChild(entity)
        entity.appendChild(identifier)
        let key = allReference.find(item=>item.includes("period"));
        if (key!==undefined){
            if (key.split(":")[1].split(" ").length===1){
                d.textContent = key.split(":")[1]
                c.appendChild(d)
            }else{
                d.textContent = key.split(":")[1].split(" ")[0];
                e.textContent = key.split(":")[1].split(" ")[0];
                c.appendChild(d)
                c.appendChild(e)
            }
            allReference.splice(allReference.indexOf(key),1)
        }else {
            d.textContent = stylesMap.get("period").split(" ")[0];
            e.textContent = stylesMap.get("period").split(" ")[0];
            c.appendChild(d)
            c.appendChild(e)
        }
        a.appendChild(c)
        for (const allReferenceElement of allReference) {
            if (allReferenceElement.includes("dimension")){
                const scenario = doc.createElement("xbrli:scenario")
                if (!isNaN(parseInt(allReferenceElement.split(":")[1].split(" ")[1].trim()))){
                    const typedMember = doc.createElement("xbrldi:typedMember")
                    const TYP = doc.createElement("esrs:TYP")
                    TYP.textContent = allReferenceElement.split(":")[1].split(" ")[1];
                    typedMember.setAttribute("dimension", "esrs:"+allReferenceElement.split(":")[1].split(" ")[0])
                    typedMember.appendChild(TYP);
                    scenario.appendChild(typedMember)
                }else {
                    const explicitMember = doc.createElement("xbrldi:explicitMember")
                    explicitMember.setAttribute("dimension", "esrs:"+allReferenceElement.split(":")[1].split(" ")[0])
                    explicitMember.textContent = allReferenceElement.split(":")[1].split(" ")[1];
                    scenario.appendChild(explicitMember)
                }
                a.appendChild(scenario)
            }
        }
        if (ixResourcesElement) {
            ixResourcesElement.appendChild(a);
        } else {
            console.error('Das Element mit der Bezeichnung "ix:Resources" wurde nicht gefunden.');
        }
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    return arr1.every((value, index) => value === arr2[index]);
}

function arrayInList(arr, list) {
    return list.some(item => arraysEqual(item, arr));
}

function arrayInListPosition(arr, list) {
    const index = list.findIndex(item => arraysEqual(item, arr));
    return index !== -1 ? index : -1;
}

function setHidden(doc){
    const ixHiddenElement = doc.querySelector('ix\\:Hidden');

    for (const divMap2Element of divMap2) {
        if (divMap2Element[0].includes("cenix-value")&& !divMap2Element[0].includes("fixed-true")&& !divMap2Element[0].includes("fixed-false")&& !divMap2Element[0].includes("fixed-zero")&& !divMap2Element[0].includes("fixed-empty") ){
            const ixNonNum = doc.createElement("ix:NonNumeric")
            for (const tag of divMap2Element[0].split(";")) {
                if (tag.includes("concept")){
                    ixNonNum.setAttribute("name", "esrs:"+tag.split(":")[1])
                }
                if (tag.includes("cenix-value")){
                    for (const tagElement of tag.split(":")[1].replaceAll("'", "").split(" ")) {
                        ixNonNum.textContent += "https://xbrl.efrag.org/taxonomy/draft-esrs/2023-07-31#"+tagElement+"\n"
                    }

                }
            }
            ixNonNum.setAttribute("id", divMap2Element[2])
            ixNonNum.setAttribute("escape", divMap2Element[3])
            ixNonNum.setAttribute("contextRef", divMap2Element[4])
            ixHiddenElement.appendChild(ixNonNum)
        }
    }
}
function cleanSpec(){
    const startIndex = read.indexOf('<div style="');
    const end = read.indexOf(">", startIndex)
    var nextofClose = read.indexOf("</div>",startIndex)
    var nextofOpen = read.indexOf('<div style="',nextofClose)
    var nextofClose2 = read.indexOf("</div>",nextofClose+1)
    while (nextofOpen<nextofClose2){
        nextofClose = nextofClose2
        nextofOpen = read.indexOf('<div style="',nextofClose)
        nextofClose2 = read.indexOf("</div>",nextofClose+1)
    }
    var text = read.substring(end+1, nextofClose2)
    var textrep = text.replaceAll("<div style=\"\">", "").replaceAll("</div>", "")
    footerText = textrep;
    read = read.replace(text,textrep)
}