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

// Temporary way to get data

function getTopPages(data){

    //topPages element that we can feed into the time Series
    var topPages = {};
    topPages.maxViews = 0;
    topPages.minViews = 0;
    
    //transform data
    //TODO : not the best way to filter the data
    Object.entries(ctx.data).forEach(function(day,i){
        let rankDate = day[0];
        day[1].forEach(function(page,j){
            if(page.rank < ctx.top_pages_count ){
                if (!topPages.hasOwnProperty(page.article)){
                    topPages[page.article] = [];
                }
                if(page.views > topPages.maxViews)topPages.maxViews = page.views;
                if(page.views < topPages.minViews)topPages.minViews = page.views;

                topPages[page.article].push({"date":rankDate, "views": page.views, "rank":page.rank});
            }
        });    
    });
    
    console.log(topPages);
    return topPages
    
}

//change to cleaner one 
function initMainView(svgEl, topPages){
    
    //console.log(ctx.data);

    
    //set views scale
    ctx.viewsScale = d3.scaleLog()
                  .domain([10000+ topPages.minViews,topPages.maxViews])
                  .range([1,ctx.graph_h]);
    
                  
    console.log(ctx.viewsScale(topPages.maxViews));

    
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
    
        

        // add tooltip, see https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
        var Tooltip = d3.select("#main")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
          // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(d) {
            Tooltip
            .style("opacity", 1)
            d3.select(this)
            .style("stroke", "red")
            .style("stroke-width", 3)
        }
        var mousemove = function(d) {
            Tooltip
            // place the name of the line in the tooltip
            // where the mouse is ---> TODO it doesn't work
            .html("The exact value of<br>this cell is: " + name)
            .style("left", (d3.mouse(this)[0]+70) + "px")
            .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave = function(d) {
            Tooltip
            d3.select(this)
            .style("stroke", "#69b3a2")
            .style("stroke-width", 1.5)
        }

        //draw simple graph
        svgEl.append("path")
            .datum(days)
            .attr("fill", "none")
            .attr("stroke", "#69b3a2")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
              .x(function(d) { return timeScale(ctx.timeParser(d.date)) })
              .y(function(d) { return (ctx.graph_h - ctx.viewsScale(d.views)) })
            )
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

    }

    )
};

//better structured TimeSeries with animation flexibility
function AnimatedTimeSeries(){
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    const zx = x.copy(); // x, but with a new domain.
  
    const line = d3.line()
        .x(d => zx(d.date))
        .y(d => y(d.close));
  
    const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-miterlimit", 1)
        .attr("d", line(data));
  
    const gx = svg.append("g")
        .call(xAxis, zx);
  
    const gy = svg.append("g")
        .call(yAxis, y);
  
    return Object.assign(svg.node(), {
      update(domain) {
        const t = svg.transition().duration(750);
        zx.domain(domain);
        gx.transition(t).call(xAxis, zx);
        path.transition(t).attr("d", line(data));
      }
    });
  }

function loadData(svgEl){
    d3.json("/static/data/top_pageviews.json")
        .then(function(rawdata){
            // store data as constant
            ctx.data = rawdata;
            topPages = getTopPages(ctx.data);
            initMainView(svgEl,topPages);
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