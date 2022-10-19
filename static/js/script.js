const ctx = {
    GLYPH_SIZE: 16,
    w: 820,
    h: 720,
    data: {},
};

function initSVGcanvas(){
    console.log(ctx.data);
};


function loadData(){
    d3.json("/static/data/top_pageviews.json")
        .then(function(rawdata){
            // store data as constant
            ctx.data = rawdata;
            initSVGcanvas();
        })
        .catch(function(error){console.log(error)});
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    var rootG = svgEl.append("g").attr("id", "rootG");

    // group for background elements (axes, labels)
    rootG.append("g").attr("id", "bkgG");
    loadData();



};