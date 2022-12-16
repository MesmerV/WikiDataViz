const ctx = {
    GLYPH_SIZE: 16,
    w: 1000,
    h: 900,
    hmargin: 10,
    data: [],
    timeParser: d3.timeParse("%m%d"),
    top_pages_count: 20,
    selected_nodes: {},
    nb_selected_nodes:0
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
    .addTo( controller );

  // Bubble chart
  var bubbleScene = new ScrollMagic.Scene({
      triggerElement: "#trigger2",
      triggerHook: 0.1, // show, when scrolled 10% into view
      duration: "60%", // hide 10% before exiting view (80% + 10% from bottom)
      offset: 10 // move trigger to center of element
    })
    .setClassToggle("#reveal1", "visible") // add class to reveal
    .setPin("#pin2")
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
      $("#reveal2").addClass("visible"); // add class to reveal
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
      .on("dblclick", selectnode)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

      simulation.force("link")
                .links(ctx.data.links);


      bubbleScene.duration("150%");

      if (ctx.showLinks) {
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
  });

  ctx.showLinks = false;

  $('#toggleLinks').on("click", function (e) {
    if (ctx.showLinks){
      ctx.showLinks = false;
      document.getElementById("toggleLinksText").innerHTML = "show links";
    } else {
      ctx.showLinks = true;
      document.getElementById("toggleLinksText").innerHTML = "hide links";
    }
    console.log(e)
    if (ctx.showLinks) {
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
      .attr("r", (d)=>(d.Views<30000000 ? ctx.radiusScale(30000000) : ctx.radiusScale(d.Views)))
      .style("opacity", 1)
      .style("fill-opacity", 1);

    if (!ctx.selected_nodes[d.target.__data__.id]){
        d3.select(this)
        .style("stroke", "black")
      }
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
      .attr("r", (d)=>(ctx.radiusScale(d.Views)))
      .style("fill-opacity", 0.3);

    if (!ctx.selected_nodes[d.target.__data__.id]){
      d3.select(this)
      .style("stroke", "grey")
    }
    // node.style("fill-opacity", function(o) {
    //     return 0.6;})
  }
  

  function selectnode(d) {
    if (ctx.selected_nodes[d.target.__data__.id]) {
      ctx.selected_nodes[d.target.__data__.id]=false;
      ctx.nb_selected_nodes -= 1;
      // remove advice
      d3.select("#advice").transition(1000).style("visibility", "hidden")
      
      d3.select(this)
        .transition()		
        .duration(200)
        .style("stroke", "black")
        .style("stroke-width", 4)
    } 
    else {
      ctx.selected_nodes[d.target.__data__.id]=true;
      ctx.nb_selected_nodes += 1;
      d3.select(this)
        .transition()		
        .duration(200)
        .style("stroke", "#c40000")
        .style("stroke-width", 8)
    }
    if(ctx.nb_selected_nodes == 0)d3.select("#advice").transition(1000).style("visibility", "visible");
    //update TS
    ctxTS.svg_TS.update();
    ctxTS.svg_TS.animate(2000);
  }

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



//sidebar
var mini = true;

function toggleSidebar() {
  if (mini) {
    document.getElementById("mySidebar").style.width = "300px";
    this.mini = false;
} else {
    document.getElementById("mySidebar").style.width = "85px";
    this.mini = true;
 }
}

ctx.showCharts = false;

function showChart(){
  if (ctx.showCharts){
    ctx.showCharts = false;
    document.getElementById("toggleChartText").innerHTML = "show chart";
  } else {
    ctx.showCharts = true;
    document.getElementById("toggleChartText").innerHTML = "hide chart";
  }
  $('#mySidebar-right').toggleClass('visible'); 
  $('#reveal1').toggleClass('chartVisible');
  if (ctx.nb_selected_nodes==0){
    $('#advice').text('Please select articles by double clicking on nodes to see the evolution of the number of views over the year.');
  } else {
    $('#advice').text('')
  }
  
}

ctx.showMap = false;

function showMap(){
  if (ctx.showMap){
    ctx.showMap = false;
    document.getElementById("toggleMapText").innerHTML = "daily top 10";
  } else {
    ctx.showMap = true;
    document.getElementById("toggleMapText").innerHTML = "hide";
  }
  $('#mySidebar-map').toggleClass('visible'); 
  $('#reveal1').toggleClass("chartVisible");
}