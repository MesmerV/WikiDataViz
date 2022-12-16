const ctx_top10 = {
    GLYPH_SIZE: 16,
    w: 550,
    h: 200,
    hmargin: 100,
    data: [],
    timeParser: d3.timeParse("%m%d"),
    top_pages_count: 20,
    selected_nodes: {},
    nb_selected_nodes:0
};


function initMainView_Top10(svgEl){
    var margin = { top: 50, right: 50, bottom: 0, left: 50 },
    width = 700,
    height = ctx_top10.h;
    
    var moving = false;
    var targetValue = width;

    var formatDate = d3.timeFormat("%d%m");
    var formatTooltipDate = d3.timeFormat("%B %d, %Y");
    
    var startDate = new Date("2022-01-01");
    var endDate = new Date("2022-12-15");
    
    var playButton = d3.select("#play-button");

    var sliderTime = d3
        .sliderHorizontal()
        .min(startDate)
        .max(endDate)
        .step(1000 * 60 * 60 * 24)
        .width(ctx_top10.w-50)
        .tickFormat(d3.timeFormat("%b"))
        .fill('#2196f3')
        .default(startDate)
        .displayFormat(false)
        .displayValue(false)
        .handle(d3.symbol().type(d3.symbolCircle).size(200)())
        .on("drag", function (val) {
            resetTimer();
        }).on("onchange", function (val) { 
                d3.select("p#value-time").text(formatTooltipDate(val));
                console.log(formatDate(val))
                var toRemove = ['Main Page', 'Special:Search'];
                var filteredArray = ctx_top10.data[formatDate(val)].filter( function( el, i ) {
                    return !toRemove.includes( el.Article );
                } );
                var secondFilter = filteredArray.filter(function( el, i ) {
                    if(i<10) return el;
                } );
                console.log(secondFilter)
                update(secondFilter)
    });
    
    var timer;

    playButton.on("click", function () {
        var button = d3.select(this);
        if (button.text() == "Pause") {
            resetTimer();
        } else {
            moving = true;
            timer = setInterval(update_slider, 2000);
            button.text("Pause");
        }
    });

    var gTime = d3
        .select("div#slider-time")
        .append("svg")
        .attr("width", ctx_top10.w+10)
        .attr("height", 100)
        .append("g")
        .attr("transform", "translate(30,30)");
    
    gTime.call(sliderTime);
    
    d3.select("p#value-time").text(formatTooltipDate(sliderTime.value()));
    
    function update_slider() {
        var offset = sliderTime.value().valueOf() + 1000 * 60 * 60 * 24;
        sliderTime.value(offset);
        //pause, uncomment to restart
        if(offset >= endDate.valueOf()) {
            resetTimer();
        // sliderTime.value(startDate.valueOf());
        }
    }
    
    function resetTimer() {
        moving = false;
        clearInterval(timer);
        playButton.text("Play");
    }

    // Initialize the X axis
    const x = d3.scaleBand()
        .range([ 0, ctx_top10.w ])
        .padding(0.2);
    const xAxis = svgEl.append("g")
        .attr("transform", `translate(0,${ctx_top10.h})`);

    // Initialize the Y axis
    const y = d3.scaleLinear()
        .range([ ctx_top10.h, 0]);
    const yAxis = svgEl.append("g");


    var toRemove = ['Main Page', 'Special:Search'];
    update(ctx_top10.data['0101']
        .filter( function( el ) {
            return !toRemove.includes( el.Article );
        })
        .filter(function( el, i ) {
            if(i<10) return el;
        })
    );

    function update(data) {
        // Update the X axis

        x.domain(data.map(d => d.Article))
        xAxis.call(d3.axisBottom(x))
        .style("z-index", 3)
        .style("color", "white")
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        
        // Update the Y axis
        y.domain([0, data[0]["Views"]]);
        yAxis
            .call(d3.axisLeft(y))
            .transition()
            .duration(300)
            .style("z-index", 3)
            .style("color", "white");
    


        // Create the u variable
        var u = svgEl.selectAll("rect")
            .data(data)
        
        u
            .join("rect")
            .on('click', function(d) {
                console.log(d)
                createChart(d.target.__data__, processData(d.target.__data__))
            })
            .transition()
            .duration(800)
            .delay((d,i) => {return i*100})
            .attr("x", d => x(d.Article))
            .attr("y", d => y(d.Views))
            .attr("width", x.bandwidth())
            .attr("height", d => ctx_top10.h - y(d.Views))
            .attr("fill", "#a6dcd4")
            .style("cursor", "pointer")
    }


    function processData(d){
        var count = 0;
        var a = [];
        var b = [];
        for (day in ctx_top10.data) {
            var present = false;
            ctx_top10.data[day].forEach(article => {
                if (article.Article == d.Article) present = true
            })
            a.push({date :  d3.timeParse("%d%m")(day), value: present})
        }
        a.sort(function(b,c){return b.date - c.date}).forEach(day => {
            if (day.value) count += 1;
            b.push({date :  day.date.setYear(2022), value: count});
        })
        return b;
    }

    function createChart(metadata,data) {

        var margin = {top: 120, right: 30, bottom: 50, left: 60},
            width = 600 - margin.left - margin.right,
            height = 350 - margin.top - margin.bottom;

        $("#dailyCount").empty();
        
        var svg = d3.select("#dailyCount")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

        svg.append("text")
                .attr("x", (width / 2))             
                .attr("y", - (3*margin.top/4))
                .attr("text-anchor", "middle")  
                .style("font-size", "16px")
                .style('fill', 'white')
                .style('font-weight', "700")
                .text(metadata.Article);

        svg.append("text")
                .attr("x", (width / 2))             
                .attr("y", - (2*margin.top/4))
                .attr("text-anchor", "middle")  
                .style("font-size", "10px")
                .style('fill', 'white')
                .style('font-weight', "300")
                .text(metadata.Description);

        svg.append("text")
                .attr("x", (width / 2))             
                .attr("y", 0 - (margin.top / 4))
                .attr("text-anchor", "middle")  
                .style("font-size", "14px")
                .style('fill', 'white')
                .style('font-weight', "700")
                .text("Number of Top 10 Appearances");
                            
        // Add X axis --> it is a date format
        var x = d3.scaleTime()
          .domain(d3.extent(data, function(d) { return d.date; }))
          .range([ 0, width ]);
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .style("color", "white")
          .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end");

        // Add Y axis
        var y = d3.scaleLinear()
          .domain([0, d3.max(data, function(d) { return d.value > 10 ? d.value : 10; })])
          .range([ height, 0 ]);

        svg.append("g")
          .call(d3.axisLeft(y))
          .style("color", "white");
    
        // This allows to find the closest X index of the mouse:
        var bisect = d3.bisector(function(d) { return d.date; }).left;

        // Create the circle that travels along the curve of chart
        var focus = svg
            .append('g')
            .append('circle')
            .style("fill", "none")
            .attr("stroke", "white")
            .attr('r', 8.5)
            .style("opacity", 0)

        // Create the text that travels along the curve of chart
        var focusText = svg
            .append('g')
            .append('text')
            .style("opacity", 0)
            .attr("text-anchor", "top")
            .attr("alignment-baseline", "middle")
            .style("fill", "white")
            .style("font", "14px")


        // Add the line
        svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "#a6dcd4")
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(function(d) { return x(d.date) })
            .y(function(d) { return y(d.value) })
            )
    
        // Create a rect on top of the svg area: this rectangle recovers mouse position
        svg
            .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);


        // What happens when the mouse move -> show the annotations at the right positions.
        function mouseover() {
            focus.style("opacity", 1)
            focusText.style("opacity",1)
        }

        function mousemove() {
            // recover coordinate we need
            var x0 = x.invert(d3.pointer(event)[0]);
            var i = bisect(data, x0, 1);
            selectedData = data[i]
            focus
                .attr("cx", x(selectedData.date))
                .attr("cy", y(selectedData.value))
            focusText
                .html(new Date(selectedData.date).toLocaleDateString('en-US'))
                .attr("x", x(selectedData.date)-15)
                .attr("y", y(selectedData.value)-30)
                .style("font-size", "15px")
                
            }

        function mouseout() {
            focus.style("opacity", 0)
            focusText.style("opacity", 0)
        }


    }
    
    
}



function loadData_Top10(svgEl){
    d3.json("/static/data/top10.json")
        .then(function(rawdata){
            // store data as constant
            ctx_top10.data = rawdata;
            initMainView_Top10(svgEl);
        })
        .catch(function(error){console.log(error)});
};

function createTop10(){
    console.log("Using D3 v"+d3.version);
    $("#top10chart").empty();
    $("#slider-time").empty();
    $("#value-time").empty();
    $("#dailyCount").empty();
    var svgEl = d3.select("#top10chart")
                  .append("svg")
                    .attr("width", ctx_top10.w+2*ctx_top10.hmargin)
                    .attr("height", ctx_top10.h+2.5*ctx_top10.hmargin)
                    .style("z-index", 5)
                  .append("g")
                    .attr("transform",
                     "translate(" + ctx_top10.hmargin + "," + ctx_top10.hmargin + ")");

    // group for background elements (axes, labels)
    loadData_Top10(svgEl);
};


