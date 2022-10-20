const ctx = {
    GLYPH_SIZE: 16,
    w: 820,
    h: 720,
    graph_h: 700, 
    graph_w: 800,
    timeAxisHeight: 20,
    hmargin: 10,
    data: [],
    timeParser: d3.timeParse("%m%d"),
    top_pages_count: 20,
};

function initMainView(svgEl){
    
    //console.log(ctx.data);

    var topPages = {};
    var maxViews = 0;
    var minViews = 0;

    //transform data

    //TODO : not the best way to filter the data
    
    Object.entries(ctx.data).forEach(function(day,i){
        let rankDate = day[0];
        day[1].forEach(function(page,j){
            if(page.rank < ctx.top_pages_count ){
                if (!topPages.hasOwnProperty(page.article)){
                    topPages[page.article] = [];
                }
                if(page.views > maxViews)maxViews = page.views;
                if(page.views < minViews)minViews = page.views;

                topPages[page.article].push({"date":rankDate, "views": page.views, "rank":page.rank});
            }
        });    
    });
    
    console.log(topPages);
    
    //set views scale
    ctx.viewsScale = d3.scaleLog()
                  .domain([10000+ minViews,maxViews])
                  .range([1,ctx.graph_h]);
    
                  
    console.log(ctx.viewsScale(maxViews));

    //create graph
    var rootG = svgEl.append("g").attr("id", "rootG");
    
    rootG.append("g").attr("id", "bkgG");
    
    //y axis
    svgEl.append("g")
      .call(d3.axisLeft(ctx.viewsScale).ticks(10));

    // time axis
    let timeScale = d3.scaleTime()
                      .domain(d3.extent(Object.keys(ctx.data), (d) => ctx.timeParser(d)))
                      .rangeRound([0,ctx.graph_w]);

    svgEl.append("g")
         .attr("id", "timeAxis")
         .attr("transform",
               `translate(${ctx.hmargin},${ctx.graph_h-ctx.timeAxisHeight})`)
         .call(d3.axisBottom(timeScale).ticks(d3.timeMonth.every(1)));
                      
    let num_graph = 35;

    //draw first viZ
    Object.entries(topPages).forEach(function(page,i){
        
        if(i >= num_graph)return;
        

        let name = page[0];
        let days = page[1];
        console.log(name,days)
     
        if(name=="Main_Page" || name=="Special:Search")return;
        //draw simple graph
        svgEl.append("path")
            .datum(days)
            .attr("fill", "none")
            .attr("stroke", "#69b3a2")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
              .x(function(d) { return timeScale(ctx.timeParser(d.date)) })
              .y(function(d) { return (ctx.graph_h - ctx.viewsScale(d.views)) })
            );

        rootG.selectAll("line")
            .data(days)
            .enter()
            .append("line")
            .attr("x1", (d) => timeScale(ctx.timeParser(d.date)))
            .attr("y1", (d) => ctx.graph_h - ctx.viewsScale(d.views))
            .attr("x2", (d) => timeScale(ctx.timeParser(d.date)))
            .attr("y2", (d) => ctx.graph_h - ctx.viewsScale(d.views)+1)
            .style("stroke", "black")
            .style("stroke-width", 4);
    }

    )
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

    // group for background elements (axes, labels)
    loadData(svgEl);



};