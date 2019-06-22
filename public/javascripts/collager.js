let socket = io("/controller");

let collectionUri = 'https://www.harvardartmuseums.org/profile/jeff_steward@harvard.edu/mycollections/3818/art-forest/iiif/top';
let currentManifestIndex = 0;

let overlaySVG;
let drag = d3.drag();
let box;

let object = {
    manifest: '',
    manifestUri: '',
    imageInfoUri: '',
    imageID: '',
    objectID: 0,
    scaleFactor: 0,
    cutting: '',
    cuttingImageFragment: '',
};

let annotations = [
    {name: 'cutting', color: 'green', x: 0, y: 0, width: 50, height: 50},
];

function init() {
    // Prepare the raw materials panel
    overlaySVG = d3.select('#cutting-mat')
        .append('svg')
        .attr('id', 'overlay')
        .on("mousedown", mousedown)
        .on("mouseup", mouseup);
    
    $("#collectionUri")
        .attr("value", collectionUri)
        .on("change", function(i, e) { 
            console.log(i.target.value);
            collectionUri = i.target.value;
            getCollection();});

    getCollection();
}

let x0 = 0;
let y0 = 0;
function mousedown() {
    var m = d3.mouse(this);
    x0 = m[0];
    y0 = m[1];

    box = overlaySVG.append("rect")
        .attr('id', 'cutting')
        .attr('stroke', 'green')
        .attr('stroke-width', 5)
        .attr('fill', 'transparent')
        .attr("x", m[0])
        .attr("y", m[1])
        .attr("width", 0)
        .attr("height", 0);

    overlaySVG.on("mousemove", mousemove);
}

function mousemove() {
    var m = d3.mouse(this);
    box.attr("width", m[0] - x0)
        .attr("height", m[1] - y0);
}

function mouseup() {
    var m = d3.mouse(this);
    overlaySVG.on("mousemove", null);
    if (m[0] - x0 > 10 && m[1] - y0 > 10) {
        updateObject();
        addCuttingToPanel();
    } 
    overlaySVG.select("#cutting").remove();
}

function addCuttingToPanel() {
    socket.emit('add-cutting', object);
}

function next() {
    currentManifestIndex +=1;
    if (currentManifestIndex >= collection.getManifests().length) {
        currentManifestIndex = 0;
    }
    showImage(collection.getManifests()[currentManifestIndex].getProperty('id'));
}

function previous() {
    currentManifestIndex -=1;
    if (currentManifestIndex < 0) {
        currentManifestIndex = collection.getManifests().length - 1;
    }
    showImage(collection.getManifests()[currentManifestIndex].getProperty('id'));
}

function updateObject() {
    let cuttingBB = d3.select("#cutting").node().getBBox();
    object.cuttingImageFragment =  Math.round(cuttingBB.x * object.scaleFactor) + ',' + Math.round(cuttingBB.y * object.scaleFactor) + ',' + Math.round(cuttingBB.width * object.scaleFactor) + ',' + Math.round(cuttingBB.height * object.scaleFactor);    
    object.cutting = object.imageID + '/' + object.cuttingImageFragment + '/full/0/default.jpg';
}

function getCollection() {
    manifesto.loadManifest(collectionUri).then((manifest) => {
        let c = manifesto.create(manifest);
        if (c.isCollection()) {
            collection = c;
            if (collection.getManifests().length > 0) {
                showImage(collection.getManifests()[currentManifestIndex].getProperty('id'));

                collection.getManifests().forEach(function(m) {
                    loadThumbnails(m.getProperty('id'))
                });
            }
        }
    });
}

async function loadThumbnails(manifestUri) {
    manifesto.loadManifest(manifestUri).then((manifest) => {
        let m = manifesto.create(manifest);
        $("<img/>", {
                        id: m.id,
                        src: m.getThumbnail().getServices()[0].getProperty('@id') + '/full/,120/0/default.jpg'
                    })
            .on("click", function(e) {showImage($(this).attr("id"))})
            .appendTo("#filmstrip");
    });
}


function getObjectIdFromManifestUri(manifestUri) {
    return parseInt(manifestUri.replace('https://iiif.harvardartmuseums.org/manifests/object/',''));
}

function showImage(manifestUri) {
    manifesto.loadManifest(manifestUri).then((manifest) => {
        object.manifestUri = manifestUri
        object.manifest = manifest;

        let m = manifesto.create(manifest);
        let s = m.getSequences()[0];
        let c = s.getCanvasByIndex(0);
        let i = c.getImages()[0];

        object.objectID = getObjectIdFromManifestUri(manifestUri);

        object.imageInfoUri = i.getResource().getServices()[0].getInfoUri();
        object.imageID = i.getResource().getServices()[0].getProperty('@id');
        
        // let imageHeight = $("#cutting-mat").height();
        // if (i.getResource().getHeight() < 700) {
        //     imageHeight = i.getResource().getHeight();
        // }
        // object.scaleFactor = i.getResource().getHeight()/imageHeight;

        // let imageURL = object.imageID + '/full/,' + Math.round(imageHeight) + '/0/default.jpg';

        let imageWidth = $("#cutting-mat").width();
        if (i.getResource().getWidth() < 700) {
            imageWidth = i.getResource().getWidth();
        }
        object.scaleFactor = i.getResource().getWidth()/imageWidth;

        let imageURL = object.imageID + '/full/' + Math.round(imageWidth) + ',/0/default.jpg';        
        let targetImage = $('#target')
                            .attr('src',imageURL)
                            .on('load', initializeAnnotations);
    });
}

function initializeAnnotations() {
    let targetImage = $('#target');
    // resize the SVG window to exact dimensions of the underlying image
    overlaySVG.attr('width', targetImage.width())
                   .attr('height', targetImage.height())
                   .style('top', targetImage.position().top)
                   .style('left', targetImage.position().left);

    // if (overlaySVG.selectAll('rect').empty()) {
    //     overlaySVG.selectAll('rect')
    //                 .data(annotations)
    //             .enter().append('rect')
    //                 .attr('stroke', (d) => {return d.color})
    //                 .attr('stroke-width', 5)
    //                 .attr('fill', 'transparent')
    //                 .attr('x', (d) => {return d.x})
    //                 .attr('y', (d) => {return d.y})
    //                 .attr('width', (d) => {return d.width})
    //                 .attr('height', (d) => {return d.height})
    //                 .attr('id', (d) => {return d.name})
    //                 .call(drag
    //                         .on('start', dragStarted)
    //                         .on('end', dragEnded)
    //                         .on('drag', dragged));
    // } else { 
    //     moveAnnotationInbounds("#cutting");
    // }

    // updateObject();
}

// function dragged() {
//     d3.select(this)
//         .attr('x', (d3.event.x - x0))
//         .attr('y', (d3.event.y - y0));
// }

// let x0 = 0;
// let y0 = 0;
// function dragStarted() {
//     x0 = d3.event.x - d3.select(this).node().getBBox().x;
//     y0 = d3.event.y - d3.select(this).node().getBBox().y;
// }

// function dragEnded() {
//     moveAnnotationInbounds(this);
// }