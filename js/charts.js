// Create and update pie chart
function createPieChart() {
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
    { label: "S&P 500 UCITS ETF - Accumulating (VUAG)", value: vuag, color: "#dc3912" },
    { label: "USD Corporate Bond UCITS ETF - Distributing (VUCP)", value: vucp, color: "#ff9900" },
    { label: "USD Treasury Bond UCITS ETF - Distributing (VUTY)", value: vuty, color: "#109618" },
    { label: "DigiGold", value: digigold, color: "#0099c6" },
    { label: "Cash", value: cash, color: "#990099" }
  ];

  // Set up SVG
  const width = 1000;
  const height = 250;
  const radius = Math.min(width, height) / 2;

  const svg = d3.select("#allocationChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
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
    .attr("fill", d => d.data.color);

  // Add labels
  const labelArc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius * 0.6);

  arcs.append("text")
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
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
        .text(`${d.label} (£${d.value.toLocaleString()})`);
    }
  });
}