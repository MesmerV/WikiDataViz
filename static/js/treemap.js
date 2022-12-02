const ctx = {
    GLYPH_SIZE: 16,
    w: 1520,
    h: 900,
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
  var bubbleScene = new ScrollMagic.Scene({
      triggerElement: "#trigger2",
      triggerHook: 0.1, // show, when scrolled 10% into view
      // duration: "80%", // hide 10% before exiting view (80% + 10% from bottom)
      offset: 10 // move trigger to center of element
    })
    .setClassToggle("#reveal1", "visible") // add class to reveal
    .setPin("#pin2")
    .addIndicators() // add indicators (requires plugin)
    .addTo(controller);

  let nodes = d3.extent(ctx.data.nodes, ((d) => parseFloat(d.Views)));

  ctx.radiusScale = d3.scaleLinear().domain([0,d3.max(nodes)])
                      .range([0, 90]);

  ctx.data.nodes.forEach(d => d['radius']=ctx.radiusScale(d.Views));
  console.log(ctx.data)

  // Initialize variables
  /// Initialize the links
  let showLink = false;
  const link = svgEl.append("g")
                    .attr("id", "links")
                    .selectAll("line")
                    .data(ctx.data.links)
                    .enter()
                    .append("line")
                    .style("stroke", "#aaa")
                    .style("stroke-width", "5px")
                    .style("opacity", 0);

  /// Initialize the circle: all located at the center of the svg area
  const node = svgEl.append("g")
                    .attr("id", "nodes")
                    .selectAll("circle")
                    .data(ctx.data.nodes)
                    .join("circle")
                    .attr("id", (d=> d.id))
                    .attr("r", (d=>ctx.radiusScale(d.Views)))
                    .attr("cx", ctx.w / 2)
                    .attr("cy", ctx.h / 2)
                    .style("fill", "grey")
                    .style("fill-opacity", 0.3)
                    .style("z-index", -1)
                    .attr("stroke", "none")
                    .style("stroke-width", 4)
                    .style("cursor","pointer")
                    .call(d3.drag() // call specific function when circle is dragged
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

  /// Initialise defs to fill nodes with images
  var defs = svgEl.append("defs")
                  .selectAll(".patterns")
                  .data(ctx.data.nodes)
                  .enter().append("pattern")
                  .attr("id", (d=> "article"+d.Rank))
                  .attr("width", 1)
                  .attr("height", 1)
                  .style("z-index", -2)
                  .append("svg:image")
                  .attr("xlink:href", (d=>d.Thumbnail))
                  .attr("width", (d=>3*ctx.radiusScale(d.Views)))
                  .attr("height", (d=>2*ctx.radiusScale(d.Views)));

  // Interact with the nodes
  /// Features of the forces applied to the nodes:
  const simulation = d3.forceSimulation()
      .force("center", d3.forceCenter().x(ctx.w / 2).y(ctx.h / 2)) // Attraction to the center of the svg area
      .force("charge", d3.forceManyBody().strength(0.01)) // Nodes are attracted one each other of value is > 0
      .force("collide", d3.forceCollide().strength(.3).radius((d=>ctx.radiusScale(d.Views)+20)).iterations(2)) // Force that avoids circle overlapping
      .force("link", d3.forceLink()
                        .id(function(d) { return d.id; })
                        .distance(.5).strength(0));

  /// Click on circle
  $('circle').on("click", function (e) {
      $('#caption').hide();
      simulation
        .nodes(ctx.data.nodes)
        .on("tick", function(d){
        node
              .attr("cx", d => d.x)
              .attr("cy", d => d.y)
              .style("fill", (d=> d.Thumbnail? "url(#article"+d.Rank+")": "#f5f5f5"))
              .attr("stroke", "grey")
              .style("object-position","50% 50%")
              .style('background-repeat','no-repeat');
      simStep();
      node.attr("cx", function(d) { return d.x = Math.max(d.radius+5, Math.min(ctx.w - d.radius-5, d.x)); }) 
          .attr("cy", function(d) { return d.y = Math.max(d.radius+5, Math.min(ctx.h - d.radius-5, d.y)); });
      });
      node
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

      simulation.force("link")
                .links(ctx.data.links);


      bubbleScene.duration("150%");
      linkScene.duration("0")
               .on('enter leave',  function (e) {
                  if (e.type == "enter") {
                    showLink = true; 
                    simulation.force("link", d3.forceLink()
                              .id(function(d) { return d.id; })
                              .distance(.5).strength(.5));

                    simulation.force("link")
                              .links(ctx.data.links);
                  } else {
                    showLink = false;
                    simulation.force("link", d3.forceLink()
                              .id(function(d) { return d.id; })
                              .distance(.5).strength(0));
                  }
               })

  });

  /// Drag nodes
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(.03).restart();
      d.fx = d.x;
      d.fy = d.y;

    node.style("fill-opacity", function(o) {
        thisOpacity = isConnected(d, o) ? 1 : 0.3;
        return thisOpacity;
    });

    if (showLink){
      link.style("opacity", function(o) {
        return o.source.id === d.id || o.target.id === d.id ? 1 : 0;
      });
    }
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(.03);
    d.fx = null;
    d.fy = null;

    node.style("fill-opacity", function(o) {
        return o.id == d.id ? 1 : 0.3;
    })

    if (showLink){
      link.style("opacity", function(o) {
        return 0;
      });
    }

  }

  // Show tooltip
  /// Tooltip events
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
      .duration(200)
      .style("stroke", "black")
      .style("opacity", 1)
      .style("fill-opacity", 1);
  }

  function mousemove(d) {
    Tooltip
      .html(d.target.__data__.Article+": "+d.target.__data__.Views + " views" + "<br>" + d.target.__data__.Description)
      .style("left", (d3.pointer(event,this)[0]) + 100 + "px")
      .style("top", (d3.pointer(event,this)[1]) - 70 + "px")
      .style("position", "fixed")
  }

  function mouseleave(d) {
    Tooltip
      .style("opacity", 0);
    d3.select(this)
      .transition()		
      .duration(200)
      .style("stroke", "grey")
      .style("fill-opacity", 0.3);
    // node.style("fill-opacity", function(o) {
    //     return 0.6;})
  }
  
  // 
  var linkScene = new ScrollMagic.Scene({
    triggerElement: "#trigger3",
    triggerHook: 0.6,
    duration: "80%", 
    offset: -750 // 
  })
  .addIndicators() // add indicators (requires plugin)
  .addTo(controller);


  function simStep(){
    // code run at each iteration of the simulation
    // updating the position of nodes and links 
    if (showLink){
      d3.selectAll("#links line").attr("x1", (d) => (d.source.x))
                              .attr("y1", (d) => (d.source.y))
                              .attr("x2", (d) => (d.target.x))
                              .attr("y2", (d) => (d.target.y));
    }
    d3.selectAll("#nodes circle").attr("cx", (d) => (d.x))
                                .attr("cy", (d) => (d.y));
  }

  var linkedByIndex = {};
  ctx.data.links.forEach(function(d) {
      linkedByIndex[d.source + "," + d.target] = 1;
  });
  
  function isConnected(a, b) {
    if (showLink){
      return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id] || a.id == b.id;
    } else {
      return false
    }
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