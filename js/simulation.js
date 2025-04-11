// Generate investment simulation
function generateSimulation() {
  // Clear existing chart
  d3.select("#simulationChart").selectAll("*").remove();

  // Get values for simulation
  const vuag = parseInt(document.getElementById('vuagValue').value) || 0;
  const vucp = parseInt(document.getElementById('vucpValue').value) || 0;
  const vuty = parseInt(document.getElementById('vutyValue').value) || 0;
  const digigold = parseInt(document.getElementById('digigoldValue').value) || 0; // Include DigiGold
  const cash = parseInt(document.getElementById('cashValue').value) || 0;

  const startValue = vuag + vucp + vuty + digigold + cash; // Add DigiGold to start value
  const years = parseInt(document.getElementById('yearsInput').value) || 20;
  const monthlyContribution = parseInt(document.getElementById('contributionsInput').value) || 300;
  const numSimulations = parseInt(document.getElementById('simulationsInput').value) || 200;

  // Calculate weights
  const totalInvested = vuag + vucp + vuty + digigold + cash; // Add DigiGold to total invested
  const vuagWeight = vuag / totalInvested;
  const vucpWeight = vucp / totalInvested;
  const vutyWeight = vuty / totalInvested;
  const digigoldWeight = digigold / totalInvested; // Add DigiGold weight
  const cashWeight = cash / totalInvested;

  // Expected returns and volatility for each asset class
  const vuagReturn = 0.09;  // 8.5% for S&P 500
  const vucpReturn = 0.06;  // 4.5% for USD Corporate Bonds
  const vutyReturn = 0.05;  // 3.5% for US Treasury Bonds
  const digigoldReturn = 0.10; // 5% for DigiGold
  const cashReturn = 0.02;  // 1.5% for Cash

  const vuagVol = 0.18;  // 18% volatility for S&P 500
  const vucpVol = 0.08;  // 7% volatility for USD Corporate Bonds
  const vutyVol = 0.07;  // 5% volatility for US Treasury Bonds
  const digigoldVol = 0.30; // 10% volatility for DigiGold
  const cashVol = 0.01; // 0.5% volatility for Cash

  // Calculate portfolio expected return and volatility
  const portfolioReturn = vuagWeight * vuagReturn + vucpWeight * vucpReturn +
    vutyWeight * vutyReturn + digigoldWeight * digigoldReturn + cashWeight * cashReturn; // Add DigiGold return
  const portfolioVol = Math.sqrt(
    Math.pow(vuagWeight * vuagVol, 2) +
    Math.pow(vucpWeight * vucpVol, 2) +
    Math.pow(vutyWeight * vutyVol, 2) +
    Math.pow(digigoldWeight * digigoldVol, 2) + // Add DigiGold volatility
    Math.pow(cashWeight * cashVol, 2)
  );

  // Set up simulation chart
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#simulationChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add X axis
  const x = d3.scaleLinear()
    .domain([0, years])
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(Math.min(years, 10)))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", "#000")
    .style("text-anchor", "middle")
    .text("Years");

  // Generate paths for simulation
  const paths = [];
  const finalValues = [];

  for (let i = 0; i < numSimulations; i++) {
    const path = [{ x: 0, y: startValue }];
    let currentValue = startValue;

    for (let year = 1; year <= years; year++) {
      // Generate random return using portfolio parameters
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const annualReturn = portfolioReturn + portfolioVol * z;

      // Apply return and add contributions
      currentValue = currentValue * (1 + annualReturn) + (monthlyContribution * 12);
      path.push({ x: year, y: currentValue });
    }

    paths.push(path);
    finalValues.push(path[path.length - 1].y);
  }

  // Sort final values for percentiles
  finalValues.sort((a, b) => a - b);

  // Calculate percentiles
  const p05 = finalValues[Math.floor(0.05 * finalValues.length)];
  const p25 = finalValues[Math.floor(0.25 * finalValues.length)];
  const p50 = finalValues[Math.floor(0.5 * finalValues.length)];
  const p75 = finalValues[Math.floor(0.75 * finalValues.length)];
  const p95 = finalValues[Math.floor(0.95 * finalValues.length)];

  // Set Y axis based on max value with some padding
  const maxY = Math.max(...finalValues) * 1.1;
  const y = d3.scaleLinear()
    .domain([0, maxY])
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d => `£${d / 1000}k`))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -45)
    .attr("x", -height / 2)
    .attr("fill", "#000")
    .style("text-anchor", "middle")
    .text("Portfolio Value (£)");

  // Add the paths
  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .curve(d3.curveBasis);

  paths.forEach(path => {
    svg.append("path")
      .datum(path)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.4)
      .attr("d", line);
  });

  // Add median line
  const medianPath = [];
  for (let i = 0; i <= years; i += Math.max(1, Math.floor(years / 5))) {
    const medianValue = startValue * Math.pow(1 + portfolioReturn, i) +
      (monthlyContribution * 12 * ((Math.pow(1 + portfolioReturn, i) - 1) / portfolioReturn));
    medianPath.push({ x: i, y: medianValue });
  }

  svg.append("path")
    .datum(medianPath)
    .attr("fill", "none")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "5,5")
    .attr("d", line);

  svg.append("text")
    .attr("x", x(years) - 100)
    .attr("y", y(medianPath[medianPath.length - 1].y) - 10)
    .attr("fill", "darkgreen")
    .text("Median Outcome");

  // Add 95th percentile line
  const p95Path = [];
  const p95Return = portfolioReturn + 1.645 * portfolioVol / Math.sqrt(years);
  for (let i = 0; i <= years; i += Math.max(1, Math.floor(years / 5))) {
    const p95Value = startValue * Math.pow(1 + p95Return, i) +
      (monthlyContribution * 12 * ((Math.pow(1 + p95Return, i) - 1) / p95Return));
    p95Path.push({ x: i, y: p95Value });
  }

  svg.append("path")
    .datum(p95Path)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("d", line);

  svg.append("text")
    .attr("x", x(years) - 100)
    .attr("y", y(p95Path[p95Path.length - 1].y) - 10)
    .attr("fill", "blue")
    .text("Optimistic (95th percentile)");

  // Add 5th percentile line
  const p05Path = [];
  const p05Return = portfolioReturn - 1.645 * portfolioVol / Math.sqrt(years);
  for (let i = 0; i <= years; i += Math.max(1, Math.floor(years / 5))) {
    const p05Value = startValue * Math.pow(1 + p05Return, i) +
      (monthlyContribution * 12 * ((Math.pow(1 + p05Return, i) - 1) / (p05Return || 0.001)));
    p05Path.push({ x: i, y: p05Value });
  }

  svg.append("path")
    .datum(p05Path)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", line);

  svg.append("text")
    .attr("x", x(years) - 100)
    .attr("y", y(p05Path[p05Path.length - 1].y) + 20)
    .attr("fill", "red")
    .text("Pessimistic (5th percentile)");

  // Update results table
  document.getElementById('p95Value').textContent = `£${Math.round(p95).toLocaleString()}`;
  document.getElementById('p75Value').textContent = `£${Math.round(p75).toLocaleString()}`;
  document.getElementById('p50Value').textContent = `£${Math.round(p50).toLocaleString()}`;
  document.getElementById('p25Value').textContent = `£${Math.round(p25).toLocaleString()}`;
  document.getElementById('p05Value').textContent = `£${Math.round(p05).toLocaleString()}`;

  // Get the inflation rate from the input
  const inflationRate = parseFloat(document.getElementById('inflationRateInput').value) / 100 || 0;

  // Calculate annualized returns for each percentile (adjusted for inflation)
  function calculateAnnualizedReturn(finalValue, years, startValue, monthlyContribution, inflationRate) {
    const totalContributions = startValue + (monthlyContribution * 12 * years);
    const nominalReturn = Math.pow(finalValue / totalContributions, 1 / years) - 1;
    const realReturn = (1 + nominalReturn) / (1 + inflationRate) - 1; // Adjust for inflation
    return realReturn;
  }

  const p95AnnReturn = calculateAnnualizedReturn(p95, years, startValue, monthlyContribution, inflationRate);
  const p75AnnReturn = calculateAnnualizedReturn(p75, years, startValue, monthlyContribution, inflationRate);
  const p50AnnReturn = calculateAnnualizedReturn(p50, years, startValue, monthlyContribution, inflationRate);
  const p25AnnReturn = calculateAnnualizedReturn(p25, years, startValue, monthlyContribution, inflationRate);
  const p05AnnReturn = calculateAnnualizedReturn(p05, years, startValue, monthlyContribution, inflationRate);

  // Update the results table with real returns
  document.getElementById('p95Return').textContent = `${(p95AnnReturn * 100).toFixed(1)}% (real)`;
  document.getElementById('p75Return').textContent = `${(p75AnnReturn * 100).toFixed(1)}% (real)`;
  document.getElementById('p50Return').textContent = `${(p50AnnReturn * 100).toFixed(1)}% (real)`;
  document.getElementById('p25Return').textContent = `${(p25AnnReturn * 100).toFixed(1)}% (real)`;
  document.getElementById('p05Return').textContent = `${(p05AnnReturn * 100).toFixed(1)}% (real)`;

  // Example: Calculate Capital Gains Tax for the portfolio
  const taxableIncome = 20000; // Example taxable income
  const taxableGains = Math.max(0, p50 - totalContributions); // Gains are final value minus contributions
  const capitalGainsTax = calculateCapitalGainsTax(taxableIncome, taxableGains);

  // Display the Capital Gains Tax in the summary
  document.getElementById('summaryText').innerHTML = `
    <h3>Capital Gains Tax</h3>
    <p>Taxable Gains: <strong>£${taxableGains.toLocaleString()}</strong></p>
    <p>Capital Gains Tax: <strong>£${capitalGainsTax.toLocaleString()}</strong></p>
  `;

  // Example: Calculate Income and Dividend Tax
  const wages = 29570; // Example wages
  const dividends = 3000; // Example dividends
  const taxResults = calculateIncomeAndDividendTax(wages, dividends);

  // Display the Income and Dividend Tax in the summary
  document.getElementById('summaryText').innerHTML = `
    <h3>Income and Dividend Tax</h3>
    <p>Wage Tax: <strong>£${taxResults.wageTax}</strong></p>
    <p>Dividend Tax: <strong>£${taxResults.dividendTax}</strong></p>
    <p>Total Tax: <strong>£${taxResults.totalTax}</strong></p>
  `;

  // Update summary text
  const riskProfile = portfolioVol <= 0.06 ? "Conservative" :
    portfolioVol <= 0.12 ? "Moderate" : "Aggressive";

  document.getElementById('summaryText').innerHTML += `
    <h3>Current Asset Allocation</h3>
    <ul>
      <li>S&P 500 UCITS ETF - Accumulating (VUAG): <strong>${(vuagWeight * 100).toFixed(1)}%</strong> - US Large Cap Equities</li>
      <li>USD Corporate Bond UCITS ETF - Distributing (VUCP): <strong>${(vucpWeight * 100).toFixed(1)}%</strong> - Fixed Income Corporate</li>
      <li>USD Treasury Bond UCITS ETF - Distributing (VUTY): <strong>${(vutyWeight * 100).toFixed(1)}%</strong> - Fixed Income Government</li>
      <li>DigiGold: <strong>${(digigoldWeight * 100).toFixed(1)}%</strong> - Digital Gold</li>
      <li>Cash: <strong>${(cashWeight * 100).toFixed(1)}%</strong> - Liquid Assets</li>
    </ul>
    
    <h3>Risk and Return Profile</h3>
    <p>Based on historical data and forward-looking estimates:</p>
    <ul>
      <li>Expected Annual Return: <strong>5.7%</strong></li>
      <li>Expected Volatility: <strong>8.4%</strong></li>
      <li>Risk Profile: <strong>Moderate</strong></li>
    </ul>
    
    <h3>Recommendations</h3>
    <p>Consider the following allocation adjustments based on your risk tolerance:</p>
    <ul>
      <li><strong>Conservative:</strong> VUAG 30%, VUCP 30%, VUTY 20%, DigiGold 10%, Cash 10%</li>
      <li><strong>Moderate:</strong> VUAG 50%, VUCP 25%, VUTY 15%, DigiGold 5%, Cash 5%</li>
      <li><strong>Aggressive:</strong> VUAG 70%, VUCP 15%, VUTY 5%, DigiGold 5%, Cash 5%</li>
    </ul>
  `;

  document.getElementById('summaryText').innerHTML += `
    <h3>Inflation Adjustment</h3>
    <p>The results are adjusted for an annual inflation rate of <strong>${(inflationRate * 100).toFixed(1)}%</strong>, 
    providing a more realistic view of real returns over time.</p>
  `;
}

// Set up event listeners
document.getElementById('updateAllocation').addEventListener('click', () => {
  createPieChart();
});

document.getElementById('runSimulation').addEventListener('click', () => {
  generateSimulation();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadFromCache(); // Load cached values on page load
  createPieChart(); // Initialize the pie chart
  generateSimulation(); // Run the simulation
});

// // Initialize
// createPieChart();
// generateSimulation();

document.getElementById('toggleMethodology').addEventListener('click', () => {
  const details = document.getElementById('methodologyDetails');
  if (details.style.display === 'none') {
    details.style.display = 'block';
  } else {
    details.style.display = 'none';
  }
});

function calculateCapitalGainsTax(taxableIncome, taxableGains) {
  const taxFreeAllowance = 3000; // Tax-free allowance for 2025-2026
  const basicRateBand = 37700; // Basic rate band for 2025-2026
  const basicRateTax = 0.18; // 18% for basic rate
  const higherRateTax = 0.28; // 28% for higher rate

  // Deduct the tax-free allowance from taxable gains
  const gainsAfterAllowance = Math.max(0, taxableGains - taxFreeAllowance);

  // Add taxable gains to taxable income
  const combinedIncome = taxableIncome + gainsAfterAllowance;

  // Calculate tax
  let tax = 0;
  if (combinedIncome <= basicRateBand) {
    // All gains are taxed at the basic rate
    tax = gainsAfterAllowance * basicRateTax;
  } else {
    // Split gains between basic and higher rate bands
    const basicRateGains = Math.max(0, basicRateBand - taxableIncome);
    const higherRateGains = gainsAfterAllowance - basicRateGains;

    tax = (basicRateGains * basicRateTax) + (higherRateGains * higherRateTax);
  }

  return tax;
}

function calculateIncomeAndDividendTax(wages, dividends) {
  const personalAllowance = 12570; // Personal Allowance for 2024-2025
  const basicRateBand = 50270; // Upper limit of the basic rate band for 2024-2025
  const basicRateTax = 0.20; // 20% for basic rate
  const dividendAllowance = 500; // Tax-free dividend allowance for 2024-2025
  const dividendBasicRateTax = 0.0875; // 8.75% for dividends in the basic rate band

  // Calculate taxable income after personal allowance
  const totalIncome = wages + dividends;
  const taxableIncome = Math.max(0, totalIncome - personalAllowance);

  // Calculate tax on wages
  const taxableWages = Math.min(taxableIncome, wages);
  const wageTax = taxableWages * basicRateTax;

  // Calculate tax on dividends
  const taxableDividends = Math.max(0, taxableIncome - taxableWages);
  const dividendsAfterAllowance = Math.max(0, taxableDividends - dividendAllowance);
  const dividendTax = dividendsAfterAllowance * dividendBasicRateTax;

  // Total tax
  const totalTax = wageTax + dividendTax;

  return {
    wageTax: wageTax.toFixed(2),
    dividendTax: dividendTax.toFixed(2),
    totalTax: totalTax.toFixed(2),
  };
}