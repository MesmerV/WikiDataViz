const ctx = {
    GLYPH_SIZE: 16,
    w: 820,
    h: 720,
    data: [],
    top_pages_count: 5,
};

function initMainView(svgEl){
    
    //console.log(ctx.data);

    topPages = {}

    //transform data

    Object.entries(ctx.data).forEach(function(day,i){
        let rankDate = day[0];
        day[1].forEach(function(page,j){
            if(page.rank < ctx.top_pages_count ){
                if (!topPages.hasOwnProperty(page.article)){
                    topPages[page.article] = [];
                }
                
                topPages[page.article].push({"date":rankDate, "views":page.views, "rank":page.rank});
            }
        });    
    });

    //console.log(topPages);
    
    //draw first viZ
};


function loadData(svgEl){
    d3.json("/static/data/top_pageviews.json")
        .then(function(rawdata){
            // store data as constant
            ctx.data = rawdata;
            initMainView(svgEl);
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
    loadData(svgEl);



};