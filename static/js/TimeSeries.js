const ctxTS = {
    GLYPH_SIZE: 16,

    //timeSeries constants
    graph_h: 800, 
    graph_w: 700,
    timeAxisHeight: 20,
    maxViews:0,
    minViews:0,
    hmargin: 10,
    margin: {
        top: 20,
        right: 30,
        bottom: 50,
        left: 70
        },
    data: [],
    timeParser: d3.timeParse("%m%d"),
    top_pages_count: 20,

};

// Temporary way to get data 

// TODO filter --> if(name=="Main_Page" || name=="Special:Search")return;
// TODO remove max_pages from page construction and make it draw page wi give (lot cleaner...) 

function getTopPages(data){

    //topPages element that we can feed into the time Series
    var topPages = {};
    
    //transform data
    //TODO : not the best way to filter the data
    Object.entries(data).forEach(function(day,i){
        let rankDate = day[0];
        day[1].forEach(function(page,j){
            if(page.rank < ctxTS.top_pages_count){
                if (!topPages.hasOwnProperty(page.article)){
                    topPages[page.article] = [];
                }
                if(page.views > ctxTS.maxViews)ctxTS.maxViews = page.views;
                if(page.views < ctxTS.minViews)ctxTS.minViews = page.views;

                topPages[page.article].push({"date":rankDate, "views": page.views, "rank":page.rank});
            }
        });    
    });
    
    console.log(topPages);
    return topPages
    
}

//TimeSeries with animation flexibility

function AnimatedTimeSeries(svg_TS, topPages){
    //creates graph on svg and assign an update method to it

    //scale the svg to shape
    svg_TS.attr("width", ctxTS.graph_w)
        .attr("height", ctxTS.graph_h)
        .attr("viewBox", [0, 0, ctxTS.graph_w, ctxTS.graph_h])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    
    // init scales
    const yScale = d3.scaleLog()
    .domain([200 + ctxTS.minViews,ctxTS.maxViews])
    .range([ctxTS.graph_h - ctxTS.margin.bottom, ctxTS.margin.top]);

    const timeScale = d3.scaleTime()
        .domain(d3.extent(Object.keys(ctxTS.data), (d) => ctxTS.timeParser(d)))
        .rangeRound([ctxTS.margin.left,ctxTS.graph_w - ctxTS.margin.right]);

    

    const colorScale = d3.scaleOrdinal().domain(Object.keys(ctxTS.data))
        .range(d3.schemeSet3);


    ////////////////////////////////////////////////  AXES  ////////////////////////////////////////////////

    //init axis 
    xAxis = (g, scale = timeScale) => g
    .attr("transform", `translate(0,${ctxTS.graph_h - ctxTS.margin.bottom})`)
    .call(d3.axisBottom(scale).ticks(ctxTS.graph_w / 80).tickSizeOuter(0))
    
    //Xlabel
    svg_TS.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", ctxTS.graph_w/2)
        .attr("y", ctxTS.graph_h - 5)
        .attr("font-family", "Saira")
        .attr("font-size", "2.5em")
        .attr("fill", "white")
        .text("Date");
        
    yAxis = (g, scale = yScale) => g
    .attr("transform", `translate(${ctxTS.margin.left},0)`)
    .call(d3.axisLeft(scale).ticks(ctxTS.graph_h / 40))
    .call(g => g.select(".domain").remove())

    svg_TS.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("y", 10)
        .attr("x", - ctxTS.graph_h/2)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .attr("font-family", "Saira")
        .attr("font-size", "2.5em")
        .attr("fill", "white")
        .text("Page views");
        
        
        // append axes to graph 
    const gx = svg_TS.append("g")
        .call(xAxis, timeScale);
        
    const gy = svg_TS.append("g")
        .call(yAxis, yScale);
    
        //recolor axes in white
    d3.selectAll(".tick,line,.domain")
        .attr("stroke", "white")
    

    
    
    //////////////////////////////////////////////// Tooltip ////////////////////////////////////////////////
        
    var TooltipTS = d3.select("#TimeSeries")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "0.5px")
        .style("border-radius", "5px")
        .style("border-color", "grey")
        .style("padding", "5px")
        .html("Article Name");


    function mouseoverTS(d) {
        TooltipTS
            .style("opacity", 1)
            .style("position", "fixed");
         d3.select(this)
           .transition()
           .duration(100)
           .attr("stroke", "black")
           .style("fill-opacity", 2)
           .attr("stroke-width", 6);
         }
    function mousemoveTS(d) {
             TooltipTS
             .html(d.target.id)
             .style("left", (d3.pointer(event,this)[0]) + 100 + "px")
             .style("top", (d3.pointer(event,this)[1]) + 70 + "px")
         }
    function mouseleaveTS(d) {
         TooltipTS
             .style("opacity", 0);
         d3.select(this)
           .transition()		
           .duration(200)
           .style("fill-opacity", 0.3)
           .attr("stroke",colorScale(d.target.id))
           .attr("stroke-width", 3)
          }
    
    ////////////////////////////////////////////////  Graphs  ////////////////////////////////////////////////

    //line function
    const line = d3.line()
    .x( d => timeScale(ctxTS.timeParser(d.date)) )
    .y( d =>  (yScale(d.views)) );

    // draw every paths
    const paths = []

    Object.entries(topPages).forEach(function(page,i){
        let name = page[0];
        let days = page[1];
        paths.push(
            svg_TS.append("path")
            .attr("fill", "none")
            .attr("stroke",colorScale(name))
            .attr("stroke-width", 3)
            .attr("stroke-miterlimit", 2)
            .attr("d", line(days))
            .attr("id",name)
            .on("mouseover", mouseoverTS)
            .on("mousemove", mousemoveTS)
            .on("mouseleave", mouseleaveTS)
            );
    })


    //return object assigned with a callback for update

    return Object.assign(svg_TS, {
        
        update(domain,duration) {
            // update the timeframe dynamicly
        const t = svg_TS.transition()
                .duration(duration);
                //.ease(d3.easeLinear); //make the transition linear
        timeScale.domain(domain);
        
        gx.transition(t).call(xAxis, timeScale);
        d3.selectAll(".tick,line,.domain").attr("stroke", "white")
        
        Object.entries(topPages).forEach(function(page,i){
            
            let days = page[1].filter(function(day){
                return (domain[0] < ctxTS.timeParser(day.date))&&(domain[1] > ctxTS.timeParser(day.date))
            });

            paths[i].attr("stroke-dashoffset", 0)
                    .attr("stroke-dasharray",0)
                    .transition(t).attr("d", line(days));
                    
        })
        },

        animate(duration){
        //animated drawing of graph
        console.log("redraw graph in " + String(duration)+" ms.");

        const transitionPath = d3
            .transition()
            .duration(duration)
            .ease(d3.easeLinear);
        
        Object.entries(topPages).forEach(function(page,i){
            //get path i
            let path = paths[i];
            const pathLength = path.node().getTotalLength();
            path.attr("stroke-dashoffset", pathLength)
                .attr("stroke-dasharray", pathLength)
                .transition(transitionPath)
                .attr("stroke-dashoffset", 0);

            
            })

        }
    });
  }



async function createTS(){
    console.log("Using D3 v"+d3.version);
    console.log("TS loaded");


    var div_TS = d3.select("#mySidebar-right")
                    .append("div")
                    .attr("id","TimeSeries")
                    .attr("width",ctxTS.graph_w+'px')
                    .attr("height",ctxTS.graph_h)
                    .style("display",'inline-block')

    //create and add svgElement to page
    var svg_TS = d3.select("#TimeSeries").append("svg").attr("id","svgTS");


    //Load TS Data and feed it to graphs
    d3.json("/static/data/top_15_articles_start_end.json") // returns a promise : asynchonous
        .then(function(rawdata){
            // store data as constant of the page
            ctxTS.data = rawdata;
            
            //get TopPages object needed for TimeSeries
            topPages = getTopPages(ctxTS.data);

            //create TS and affect it a timeFrame
            
            timeframe = [new Date("1900-01-01"), new Date("1900-08-01")];
            AnimatedTimeSeries(svg_TS,topPages)
            //svg_TS.update(timeframe,0);
            svg_TS.animate(3000);
            timeframe = [new Date("1900-04-01"), new Date("1900-06-30")];
            
            
        })
        .catch(function(error){console.log(error)});

        await new Promise(r => setTimeout(r, 5000));
        svg_TS.update(timeframe,2000);

        await new Promise(r => setTimeout(r, 3000));
        svg_TS.animate(3000);

};

