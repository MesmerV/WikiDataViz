const ctx = {
    GLYPH_SIZE: 16,
    w: 1020,
    h: 1280,
    graph_h: 700, 
    graph_w: 800,
    timeAxisHeight: 20,
    hmargin: 10,
    data: [],
    timeParser: d3.timeParse("%m%d"),
    top_pages_count: 20,
};

function initMainView(svgEl){
    var controller = new ScrollMagic.Controller();

    // Title & Subtitle
    var myText = "                       How did the world use Wikipedia in 2022?";
    let myTextLength = myText.length;
    
    function typing( displayedLength ) {
      if( displayedLength <= myTextLength ) {
        $( "#subtitle" ).text( myText.substring( 0, displayedLength ) );
        }
      }

    var typewritingScene = new ScrollMagic.Scene({ 
      triggerElement: "#trigger1",
      triggerHook: 0.5, // show, when scrolled 10% into view
      duration: "100%", // hide 10% before exiting view (80% + 10% from bottom)
      offset: 150 // move trigger to center of element
        })
      .on('progress',  function () {
      let scrollProgress = Math.ceil( typewritingScene.progress() * myTextLength );
      typing( scrollProgress );
      })
      .setPin('#pin1')
      .addIndicators({ name: 'typewriting' })
      .addTo( controller );

    // Bubble chart
    var scene2 = new ScrollMagic.Scene({
        triggerElement: "#trigger3",
        triggerHook: 0.1, // show, when scrolled 10% into view
        duration: "80%", // hide 10% before exiting view (80% + 10% from bottom)
        offset: 10 // move trigger to center of element
    })
    .setClassToggle("#reveal1", "visible") // add class to reveal
    .addIndicators() // add indicators (requires plugin)
    .addTo(controller);

    let data = d3.extent(ctx.data, ((d) => parseFloat(d.Views)));

    ctx.radiusScale = d3.scaleLinear().domain([0,d3.max(data)])
                        .range([0, 90]);

    // Initialize the circle: all located at the center of the svg area
    const node = svgEl.append("g")
        .selectAll("circle")
        .data(ctx.data)
        .join("circle")
        .attr("r", (d=>ctx.radiusScale(d.Views)))
        .attr("cx", ctx.w / 2)
        .attr("cy", ctx.h / 2)
        .style("fill", "#69b3a2")
        .style("fill-opacity", 0.3)
        .style("z-index", -1)
        .attr("stroke", "none")
        .style("stroke-width", 4)
        .style("cursor","pointer")
        .call(d3.drag() // call specific function when circle is dragged
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Features of the forces applied to the nodes:
    const simulation = d3.forceSimulation()
        .force("center", d3.forceCenter().x(ctx.w / 2).y(ctx.h / 2)) // Attraction to the center of the svg area
        .force("charge", d3.forceManyBody().strength(0.01)) // Nodes are attracted one each other of value is > 0
        .force("collide", d3.forceCollide().strength(.07).radius((d=>ctx.radiusScale(d.Views)+20)).iterations(2)) // Force that avoids circle overlapping

    // Apply these forces to the nodes and update their positions.
    // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.

    $('circle').on("click", function (e) {
        $('#caption').hide();
        simulation
        .nodes(ctx.data)
        .on("tick", function(d){
          node
              .attr("cx", d => d.x)
              .attr("cy", d => d.y)
        });
        node
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
    });

    //drag events
    function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(.03).restart();
     d.fx = d.x;
     d.fy = d.y;
   }
   function dragged(event, d) {
     d.fx = event.x;
     d.fy = event.y;
   }
   function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(.03);
     d.fx = null;
     d.fy = null;
   }


   //tooltip events
   var Tooltip = d3.select("#reveal1")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "0.5px")
    .style("border-radius", "5px")
    .style("border-color", "grey")
    .style("padding", "5px");

   function mouseover(d) {
    Tooltip
    .style("opacity", 1);
    d3.select(this)
      .transition()
      .duration(500)
      .style("stroke", "black")
      .style("opacity", 1)
    }
    function mousemove(d) {
        Tooltip
          .html(d.target.__data__.Article+" : "+d.target.__data__.Views)
          .style("left", (d3.pointer(event,this)[0]) + "px")
          .style("top", (d3.pointer(event,this)[1]) + "px")
          .style("position", "fixed")
        console.log(d)
    }
    function mouseleave(d) {
    Tooltip
        .style("opacity", 0);
    d3.select(this)
      .transition()		
      .duration(500)
      .style("stroke", "none")
      .style("opacity", 0.8)
    }
}

function loadData(svgEl){
    d3.json("/static/data/aggregated_views.json")
        .then(function(rawdata){
            // store data as constant
            ctx.data = rawdata;
            initMainView(svgEl);
        })
        .catch(function(error){console.log(error)});
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#reveal1").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    svgEl.style("z-index", -1);

    // group for background elements (axes, labels)
    loadData(svgEl);
};