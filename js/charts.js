// Create and update pie chart
function createPieChart() {
  refreshTheme();   // resolve the tokens for the scheme that is live right now
  // Clear existing chart
  d3.select("#allocationChart").selectAll("*").remove();

  // Get values
  const vuag = parseInt(document.getElementById('vuagValue').value) || 0;
  const vucp = parseInt(document.getElementById('vucpValue').value) || 0;
  const vuty = parseInt(document.getElementById('vutyValue').value) || 0;
  const digigold = parseInt(document.getElementById('digigoldValue').value) || 0; // Include DigiGold
  const cash = parseInt(document.getElementById('cashValue').value) || 0;

  const total = vuag + vucp + vuty + digigold + cash; // Add DigiGold to total

  // Data for pie chart
  const data = [
    // Colour follows the holding, never its size. A slider that
    // drops a holding to zero must not repaint the survivors, so
    // these are indexed by position in the fixed series order.
    { label: "S&P 500 UCITS ETF - Accumulating (VUAG)", value: vuag, color: THEME.series[0] },
    { label: "USD Corporate Bond UCITS ETF - Distributing (VUCP)", value: vucp, color: THEME.series[1] },
    { label: "USD Treasury Bond UCITS ETF - Distributing (VUTY)", value: vuty, color: THEME.series[2] },
    { label: "DigiGold", value: digigold, color: THEME.series[3] },
    { label: "Cash", value: cash, color: THEME.series[4] }
  ];

  // Set up SVG
  const width = 1000;
  const height = 250;
  const radius = Math.min(width, height) / 2;

  const svgRoot = d3.select("#allocationChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  svgRoot.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", THEME.panel);

  const svg = svgRoot.append("g")
    .attr("transform", `translate(${width / 4},${height / 2})`);

  // Set up pie generator
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  // Set up arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius - 10);

  // Create pie chart
  const arcs = svg.selectAll("arc")
    .data(pie(data))
    .enter()
    .append("g");

  // Add slices
  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => d.data.color)
    // A 2px gap in the surface colour, so adjacent slices read as
    // two marks rather than one shape with a seam.
    .attr("stroke", THEME.panel)
    .attr("stroke-width", 2);

  // Add labels
  const labelArc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius * 0.6);

  arcs.append("text")
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    // The percentage sits ON the slice, so its ink comes from the
    // slice, not from the scheme. See inkOn() in theme.js.
    .attr("fill", d => inkOn(d.data.color))
    .style("font-family", "var(--mono)")
    .style("font-size", "12px")
    .text(d => d.data.value > 0 ? `${(d.data.value / total * 100).toFixed(1)}%` : "");

  // Add legend
  const legend = d3.select("#allocationChart svg")
    .append("g")
    .attr("transform", `translate(${width * 0.5}, 20)`);

  data.forEach((d, i) => {
    if (d.value > 0) {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendRow.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d.color);

      legendRow.append("text")
        .attr("x", 30)
        .attr("y", 15)
        // Legend text wears an ink token. The swatch beside it
        // carries the identity — never both.
        .attr("fill", THEME.g2)
        .style("font-family", "var(--mono)")
        .style("font-size", "12px")
        .text(`${d.label} (£${d.value.toLocaleString()})`);
    }
  });
}