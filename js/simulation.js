function generateSimulation() {
  refreshTheme();   // resolve the tokens for the scheme that is live right now
  d3.select("#simulationChart").selectAll("*").remove();

  const vuag = parseInt(document.getElementById('vuagValue').value) || 0;
  const vucp = parseInt(document.getElementById('vucpValue').value) || 0;
  const vuty = parseInt(document.getElementById('vutyValue').value) || 0;
  const digigold = parseInt(document.getElementById('digigoldValue').value) || 0;
  const cash = parseInt(document.getElementById('cashValue').value) || 0;

  const startValue = vuag + vucp + vuty + digigold + cash;
  const years = parseInt(document.getElementById('yearsInput').value) || 20;
  const monthlyContribution = parseInt(document.getElementById('contributionsInput').value) || 300;
  const numSimulations = parseInt(document.getElementById('simulationsInput').value) || 200;
  const cgtRate = parseFloat(document.getElementById('capitalGainsTaxInput').value) / 100 || 0;
  const dividendWithholdingRate = parseFloat(document.getElementById('dividendTaxInput').value) / 100 || 0;
  const inflationRate = parseFloat(document.getElementById('inflationRateInput').value) / 100 || 0;

  const totalContributions = startValue + (monthlyContribution * 12 * years);

  if (startValue === 0) {
    document.getElementById('summaryText').innerHTML = '<p>Please enter at least one allocation to run the simulation.</p>';
    return;
  }

  const vuagWeight = vuag / startValue;
  const vucpWeight = vucp / startValue;
  const vutyWeight = vuty / startValue;
  const digigoldWeight = digigold / startValue;
  const cashWeight = cash / startValue;

  let riskProfile;
  if (vuagWeight >= 0.7) {
    riskProfile = 'Aggressive';
  } else if (vuagWeight >= 0.5) {
    riskProfile = 'Moderate';
  } else {
    riskProfile = 'Conservative';
  }

  // VUCP and VUTY are distributing ETFs — dividend withholding tax reduces their effective return
  const vuagReturn = 0.09;
  const vucpReturn = 0.06 * (1 - dividendWithholdingRate);
  const vutyReturn = 0.05 * (1 - dividendWithholdingRate);
  const digigoldReturn = 0.10;
  const cashReturn = 0.02;

  const vuagVol = 0.18;
  const vucpVol = 0.08;
  const vutyVol = 0.07;
  const digigoldVol = 0.30;
  const cashVol = 0.01;

  const vuagExpenseRatio = 0.0007;
  const vucpExpenseRatio = 0.0010;
  const vutyExpenseRatio = 0.0009;
  const digigoldExpenseRatio = 0.0050;
  const transactionCost = 0.0010;
  const platformFee = 0.0025;

  const portfolioReturn = (
    vuagWeight * (vuagReturn - vuagExpenseRatio) +
    vucpWeight * (vucpReturn - vucpExpenseRatio) +
    vutyWeight * (vutyReturn - vutyExpenseRatio) +
    digigoldWeight * (digigoldReturn - digigoldExpenseRatio) +
    cashWeight * cashReturn
  );

  const netPortfolioReturn = portfolioReturn - platformFee;

  const portfolioVol = Math.sqrt(
    Math.pow(vuagWeight * vuagVol, 2) +
    Math.pow(vucpWeight * vucpVol, 2) +
    Math.pow(vutyWeight * vutyVol, 2) +
    Math.pow(digigoldWeight * digigoldVol, 2) +
    Math.pow(cashWeight * cashVol, 2)
  );

  const netMonthlyContribution = monthlyContribution * (1 - transactionCost);

  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const simSvgRoot = d3.select("#simulationChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("width", "100%");

  simSvgRoot.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("fill", THEME.panel);

  const svg = simSvgRoot.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, years]).range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(Math.min(years, 10)))
    .call(g => g.selectAll("text").attr("fill", THEME.g4).style("font-family", "var(--mono)"))
    .call(g => g.selectAll("line").attr("stroke", THEME.g5))
    .call(g => g.select(".domain").attr("stroke", THEME.g5))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", THEME.g3)
    .style("font-family", "var(--mono)")
    .style("text-anchor", "middle")
    .text("Years");

  const paths = [];
  const finalValues = [];

  for (let i = 0; i < numSimulations; i++) {
    const path = [{ x: 0, y: startValue }];
    let currentValue = startValue;

    for (let year = 1; year <= years; year++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const annualReturn = netPortfolioReturn + portfolioVol * z;
      currentValue = currentValue * (1 + annualReturn) + (netMonthlyContribution * 12);
      path.push({ x: year, y: currentValue });
    }

    paths.push(path);
    finalValues.push(path[path.length - 1].y);
  }

  finalValues.sort((a, b) => a - b);

  const p05 = finalValues[Math.floor(0.05 * finalValues.length)];
  const p25 = finalValues[Math.floor(0.25 * finalValues.length)];
  const p50 = finalValues[Math.floor(0.5 * finalValues.length)];
  const p75 = finalValues[Math.floor(0.75 * finalValues.length)];
  const p95 = finalValues[Math.floor(0.95 * finalValues.length)];

  const maxY = Math.max(...finalValues) * 1.1;
  const y = d3.scaleLinear().domain([0, maxY]).range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d => `£${d / 1000}k`))
    .call(g => g.selectAll("text").attr("fill", THEME.g4).style("font-family", "var(--mono)"))
    .call(g => g.selectAll("line").attr("stroke", THEME.g5))
    .call(g => g.select(".domain").attr("stroke", THEME.g5))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -45)
    .attr("x", -height / 2)
    .attr("fill", THEME.g3)
    .style("font-family", "var(--mono)")
    .style("text-anchor", "middle")
    .text("Portfolio Value (£)");

  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .curve(d3.curveBasis);

  paths.forEach(path => {
    svg.append("path")
      .datum(path)
      .attr("fill", "none")
      // The run cloud is context, not a series. Muted ink keeps the
      // three summary lines on top of it readable.
      .attr("stroke", THEME.g3)
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.15)
      .attr("d", line);
  });

  // Analytical median line (one point per year for a smooth curve)
  const medianPath = [];
  for (let i = 0; i <= years; i++) {
    const v = startValue * Math.pow(1 + netPortfolioReturn, i) +
      (netMonthlyContribution * 12 * ((Math.pow(1 + netPortfolioReturn, i) - 1) / netPortfolioReturn));
    medianPath.push({ x: i, y: v });
  }

  svg.append("path")
    .datum(medianPath)
    .attr("fill", "none")
    .attr("stroke", THEME.g1)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5")
    .attr("d", line);

  svg.append("text")
    .attr("x", x(years))
    .attr("text-anchor", "end")
    .attr("dy", "-0.4em")
    .attr("y", y(medianPath[medianPath.length - 1].y) - 10)
    .attr("fill", THEME.g2)
    .style("font-family", "var(--mono)")
    .text("Median Outcome");

  // Analytical 95th percentile line
  const p95LineReturn = netPortfolioReturn + 1.645 * portfolioVol / Math.sqrt(years);
  const p95LinePath = [];
  for (let i = 0; i <= years; i++) {
    const v = startValue * Math.pow(1 + p95LineReturn, i) +
      (netMonthlyContribution * 12 * ((Math.pow(1 + p95LineReturn, i) - 1) / p95LineReturn));
    p95LinePath.push({ x: i, y: v });
  }

  svg.append("path")
    .datum(p95LinePath)
    .attr("fill", "none")
    .attr("stroke", THEME.ok)
    .attr("stroke-width", 2)
    .attr("d", line);

  svg.append("text")
    .attr("x", x(years))
    .attr("text-anchor", "end")
    .attr("dy", "-0.4em")
    .attr("y", y(p95LinePath[p95LinePath.length - 1].y) - 10)
    .attr("fill", THEME.g2)
    .style("font-family", "var(--mono)")
    .text("Optimistic (95th percentile)");

  // Analytical 5th percentile line
  const p05LineReturn = netPortfolioReturn - 1.645 * portfolioVol / Math.sqrt(years);
  const safeP05Return = p05LineReturn || 0.001;
  const p05LinePath = [];
  for (let i = 0; i <= years; i++) {
    const v = startValue * Math.pow(1 + safeP05Return, i) +
      (netMonthlyContribution * 12 * ((Math.pow(1 + safeP05Return, i) - 1) / safeP05Return));
    p05LinePath.push({ x: i, y: v });
  }

  svg.append("path")
    .datum(p05LinePath)
    .attr("fill", "none")
    .attr("stroke", THEME.err)
    .attr("stroke-width", 2)
    .attr("d", line);

  svg.append("text")
    .attr("x", x(years))
    .attr("text-anchor", "end")
    .attr("dy", "-0.4em")
    .attr("y", y(p05LinePath[p05LinePath.length - 1].y) + 20)
    .attr("fill", THEME.g2)
    .style("font-family", "var(--mono)")
    .text("Pessimistic (5th percentile)");

  document.getElementById('p95Value').textContent = `£${Math.round(p95).toLocaleString()}`;
  document.getElementById('p75Value').textContent = `£${Math.round(p75).toLocaleString()}`;
  document.getElementById('p50Value').textContent = `£${Math.round(p50).toLocaleString()}`;
  document.getElementById('p25Value').textContent = `£${Math.round(p25).toLocaleString()}`;
  document.getElementById('p05Value').textContent = `£${Math.round(p05).toLocaleString()}`;

  function calcRealAnnReturn(finalValue, yrs, start, monthlyC, inflation) {
    const total = start + (monthlyC * 12 * yrs);
    const nominal = Math.pow(finalValue / total, 1 / yrs) - 1;
    return (1 + nominal) / (1 + inflation) - 1;
  }

  // A real annualised return is the one figure here that can be negative,
  // and the sign is the whole point. Green means a gain, red a loss — the
  // same meaning those tokens carry on the projection lines. The number
  // keeps its own sign, so colour is never the only cue.
  const setReturn = (id, value) => {
    const el = document.getElementById(id);
    el.textContent = `${(value * 100).toFixed(1)}% (real)`;
    el.className = value < 0 ? 'figure-loss' : 'figure-gain';
  };

  setReturn('p95Return', calcRealAnnReturn(p95, years, startValue, netMonthlyContribution, inflationRate));
  setReturn('p75Return', calcRealAnnReturn(p75, years, startValue, netMonthlyContribution, inflationRate));
  setReturn('p50Return', calcRealAnnReturn(p50, years, startValue, netMonthlyContribution, inflationRate));
  setReturn('p25Return', calcRealAnnReturn(p25, years, startValue, netMonthlyContribution, inflationRate));
  setReturn('p05Return', calcRealAnnReturn(p05, years, startValue, netMonthlyContribution, inflationRate));

  const taxableGains = Math.max(0, p50 - totalContributions);
  const capitalGainsTax = Math.round(taxableGains * cgtRate);

  document.getElementById('summaryText').innerHTML = `
    <h3>Capital Gains Tax Estimate</h3>
    <p>Based on median outcome at a <strong>${(cgtRate * 100).toFixed(0)}%</strong> CGT rate:</p>
    <p>Estimated gains: <strong>£${Math.round(taxableGains).toLocaleString()}</strong></p>
    <p>Estimated CGT: <strong>£${capitalGainsTax.toLocaleString()}</strong></p>

    <h3>Current Asset Allocation</h3>
    <ul>
      <li>S&P 500 UCITS ETF (VUAG): <strong>${(vuagWeight * 100).toFixed(1)}%</strong></li>
      <li>USD Corporate Bond UCITS ETF (VUCP): <strong>${(vucpWeight * 100).toFixed(1)}%</strong></li>
      <li>USD Treasury Bond UCITS ETF (VUTY): <strong>${(vutyWeight * 100).toFixed(1)}%</strong></li>
      <li>DigiGold: <strong>${(digigoldWeight * 100).toFixed(1)}%</strong></li>
      <li>Cash: <strong>${(cashWeight * 100).toFixed(1)}%</strong></li>
    </ul>

    <h3>Risk and Return Profile</h3>
    <ul>
      <li>Expected Annual Return (net of fees &amp; withholding): <strong>${(netPortfolioReturn * 100).toFixed(1)}%</strong></li>
      <li>Expected Volatility: <strong>${(portfolioVol * 100).toFixed(1)}%</strong></li>
      <li>Dividend Withholding Rate: <strong>${(dividendWithholdingRate * 100).toFixed(0)}%</strong></li>
      <li>Inflation Rate: <strong>${(inflationRate * 100).toFixed(1)}%</strong></li>
      <li>Risk Profile: <strong>${riskProfile}</strong></li>
    </ul>

    <h3>Recommendations</h3>
    <ul>
      <li><strong>Conservative:</strong> VUAG 30%, VUCP 30%, VUTY 20%, DigiGold 10%, Cash 10%</li>
      <li><strong>Moderate:</strong> VUAG 50%, VUCP 25%, VUTY 15%, DigiGold 5%, Cash 5%</li>
      <li><strong>Aggressive:</strong> VUAG 70%, VUCP 15%, VUTY 5%, DigiGold 5%, Cash 5%</li>
    </ul>

    <h3>Fee Impact</h3>
    <ul>
      <li>VUAG expense ratio: <strong>${(vuagExpenseRatio * 100).toFixed(2)}%</strong></li>
      <li>VUCP expense ratio: <strong>${(vucpExpenseRatio * 100).toFixed(2)}%</strong></li>
      <li>VUTY expense ratio: <strong>${(vutyExpenseRatio * 100).toFixed(2)}%</strong></li>
      <li>DigiGold storage fee: <strong>${(digigoldExpenseRatio * 100).toFixed(2)}%</strong></li>
      <li>Platform fee: <strong>${(platformFee * 100).toFixed(2)}%</strong> p.a.</li>
      <li>Transaction cost: <strong>${(transactionCost * 100).toFixed(2)}%</strong> per contribution</li>
    </ul>
  `;

  renderMonteCarloChart(finalValues);
}

function renderMonteCarloChart(finalValues) {
  d3.select("#monteCarloChart").selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const mcSvgRoot = d3.select("#monteCarloChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("width", "100%");

  mcSvgRoot.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("fill", THEME.panel);

  const svg = mcSvgRoot.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([Math.min(...finalValues), Math.max(...finalValues)])
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => `£${(d / 1000).toFixed(1)}k`))
    .call(g => g.selectAll("text").attr("fill", THEME.g4).style("font-family", "var(--mono)"))
    .call(g => g.selectAll("line").attr("stroke", THEME.g5))
    .call(g => g.select(".domain").attr("stroke", THEME.g5))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", THEME.g3)
    .style("font-family", "var(--mono)")
    .style("text-anchor", "middle")
    .text("Final Portfolio Value (£)");

  const histogram = d3.histogram()
    .value(d => d)
    .domain(x.domain())
    .thresholds(x.ticks(20));

  const bins = histogram(finalValues);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y))
    .call(g => g.selectAll("text").attr("fill", THEME.g4).style("font-family", "var(--mono)"))
    .call(g => g.selectAll("line").attr("stroke", THEME.g5))
    .call(g => g.select(".domain").attr("stroke", THEME.g5))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -45)
    .attr("x", -height / 2)
    .attr("fill", THEME.g3)
    .style("font-family", "var(--mono)")
    .style("text-anchor", "middle")
    .text("Frequency");

  svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr("height", d => height - y(d.length))
    // Single series, so one hue and no legend — the title names it.
    // The 2px surface stroke is the gap between adjacent bars.
    .attr("fill", THEME.accent)
    .attr("stroke", THEME.panel)
    .attr("stroke-width", 2);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("fill", THEME.g3)
    .style("font-family", "var(--mono)")
    .style("font-size", "14px")
    .text("Monte Carlo Simulation: Distribution of Final Portfolio Values");
}
