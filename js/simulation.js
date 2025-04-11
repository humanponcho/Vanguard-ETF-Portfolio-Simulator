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

  // Calculate total contributions
  const totalContributions = startValue + (monthlyContribution * 12 * years);

  // Calculate weights
  const totalInvested = vuag + vucp + vuty + digigold + cash;
  const vuagWeight = vuag / totalInvested;
  const vucpWeight = vucp / totalInvested;
  const vutyWeight = vuty / totalInvested;
  const digigoldWeight = digigold / totalInvested;
  const cashWeight = cash / totalInvested;

  // Determine the risk profile
  let riskProfile = '';
  if (vuagWeight >= 0.7) {
    riskProfile = 'Aggressive';
  } else if (vuagWeight >= 0.5) {
    riskProfile = 'Moderate';
  } else {
    riskProfile = 'Conservative';
  }

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

  // Expense ratios for ETFs (as percentages)
  const vuagExpenseRatio = 0.07 / 100; // 0.07%
  const vucpExpenseRatio = 0.10 / 100; // 0.10%
  const vutyExpenseRatio = 0.09 / 100; // 0.09%
  const digigoldExpenseRatio = 0.50 / 100; // 0.50% (storage fee)

  // Transaction costs (as percentages)
  const transactionCost = 0.10 / 100; // 0.10% per transaction

  // Platform fees (as percentages of total portfolio value)
  const platformFee = 0.25 / 100; // 0.25% annually

  // Calculate portfolio expected return (net of fees)
  const portfolioReturn = (
    vuagWeight * (vuagReturn - vuagExpenseRatio) +
    vucpWeight * (vucpReturn - vucpExpenseRatio) +
    vutyWeight * (vutyReturn - vutyExpenseRatio) +
    digigoldWeight * (digigoldReturn - digigoldExpenseRatio) +
    cashWeight * cashReturn
  );

  // Deduct platform fees from the portfolio return
  const netPortfolioReturn = portfolioReturn - platformFee;

  // Calculate portfolio expected return and volatility
  const portfolioVol = Math.sqrt(
    Math.pow(vuagWeight * vuagVol, 2) +
    Math.pow(vucpWeight * vucpVol, 2) +
    Math.pow(vutyWeight * vutyVol, 2) +
    Math.pow(digigoldWeight * digigoldVol, 2) + // Add DigiGold volatility
    Math.pow(cashWeight * cashVol, 2)
  );

  // Apply transaction costs to monthly contributions
  const netMonthlyContribution = monthlyContribution * (1 - transactionCost);

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
      const annualReturn = netPortfolioReturn + portfolioVol * z;

      // Apply return, deduct platform fees, and add net contributions
      currentValue = currentValue * (1 + annualReturn) + (netMonthlyContribution * 12);
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
    const medianValue = startValue * Math.pow(1 + netPortfolioReturn, i) +
      (netMonthlyContribution * 12 * ((Math.pow(1 + netPortfolioReturn, i) - 1) / netPortfolioReturn));
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
  const p95Return = netPortfolioReturn + 1.645 * portfolioVol / Math.sqrt(years);
  for (let i = 0; i <= years; i += Math.max(1, Math.floor(years / 5))) {
    const p95Value = startValue * Math.pow(1 + p95Return, i) +
      (netMonthlyContribution * 12 * ((Math.pow(1 + p95Return, i) - 1) / p95Return));
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
  const p05Return = netPortfolioReturn - 1.645 * portfolioVol / Math.sqrt(years);
  for (let i = 0; i <= years; i += Math.max(1, Math.floor(years / 5))) {
    const p05Value = startValue * Math.pow(1 + p05Return, i) +
      (netMonthlyContribution * 12 * ((Math.pow(1 + p05Return, i) - 1) / (p05Return || 0.001)));
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

  const p95AnnReturn = calculateAnnualizedReturn(p95, years, startValue, netMonthlyContribution, inflationRate);
  const p75AnnReturn = calculateAnnualizedReturn(p75, years, startValue, netMonthlyContribution, inflationRate);
  const p50AnnReturn = calculateAnnualizedReturn(p50, years, startValue, netMonthlyContribution, inflationRate);
  const p25AnnReturn = calculateAnnualizedReturn(p25, years, startValue, netMonthlyContribution, inflationRate);
  const p05AnnReturn = calculateAnnualizedReturn(p05, years, startValue, netMonthlyContribution, inflationRate);

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

  // Example: Calculate Income and Dividend Tax
  const wages = 29570; // Example wages
  const dividends = 3000; // Example dividends
  const taxResults = calculateIncomeAndDividendTax(wages, dividends);

  // Consolidate all updates to summaryText
  const summaryHTML = `
    <h3>Capital Gains Tax</h3>
    <p>Taxable Gains: <strong>£${taxableGains.toLocaleString()}</strong></p>
    <p>Capital Gains Tax: <strong>£${capitalGainsTax.toLocaleString()}</strong></p>

    <h3>Income and Dividend Tax</h3>
    <p>Wage Tax: <strong>£${taxResults.wageTax}</strong></p>
    <p>Dividend Tax: <strong>£${taxResults.dividendTax}</strong></p>
    <p>Total Tax: <strong>£${taxResults.totalTax}</strong></p>

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
      <li>Expected Annual Return: <strong>${(netPortfolioReturn * 100).toFixed(1)}%</strong></li>
      <li>Expected Volatility: <strong>${(portfolioVol * 100).toFixed(1)}%</strong></li>
      <li>Risk Profile: <strong>${riskProfile}</strong></li>
    </ul>

    <h3>Recommendations</h3>
    <p>Consider the following allocation adjustments based on your risk tolerance:</p>
    <ul>
      <li><strong>Conservative:</strong> VUAG 30%, VUCP 30%, VUTY 20%, DigiGold 10%, Cash 10%</li>
      <li><strong>Moderate:</strong> VUAG 50%, VUCP 25%, VUTY 15%, DigiGold 5%, Cash 5%</li>
      <li><strong>Aggressive:</strong> VUAG 70%, VUCP 15%, VUTY 5%, DigiGold 5%, Cash 5%</li>
    </ul>

    <h3>Inflation Adjustment</h3>
    <p>The results are adjusted for an annual inflation rate of <strong>${(inflationRate * 100).toFixed(1)}%</strong>, 
    providing a more realistic view of real returns over time.</p>

    <h3>Fee Impact</h3>
    <p>Expense Ratios:</p>
    <ul>
      <li>S&P 500 UCITS ETF (VUAG): <strong>${(vuagExpenseRatio * 100).toFixed(2)}%</strong></li>
      <li>USD Corporate Bond UCITS ETF (VUCP): <strong>${(vucpExpenseRatio * 100).toFixed(2)}%</strong></li>
      <li>USD Treasury Bond UCITS ETF (VUTY): <strong>${(vutyExpenseRatio * 100).toFixed(2)}%</strong></li>
      <li>DigiGold: <strong>${(digigoldExpenseRatio * 100).toFixed(2)}%</strong></li>
    </ul>
    <p>Transaction Costs: <strong>${(transactionCost * 100).toFixed(2)}%</strong> per transaction</p>
    <p>Platform Fees: <strong>${(platformFee * 100).toFixed(2)}%</strong> annually</p>
  `;

  // Update the summaryText element once
  document.getElementById('summaryText').innerHTML = summaryHTML;

  // Render Monte Carlo chart
  renderMonteCarloChart(finalValues);
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

function renderMonteCarloChart(finalValues) {
  // Clear existing chart
  d3.select("#monteCarloChart").selectAll("*").remove();

  // Set up dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#monteCarloChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up X axis (final portfolio values)
  const x = d3.scaleLinear()
    .domain([Math.min(...finalValues), Math.max(...finalValues)]) // Range of final values
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => `£${(d / 1000).toFixed(1)}k`))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", "#000")
    .style("text-anchor", "middle")
    .text("Final Portfolio Value (£)");

  // Create histogram bins
  const histogram = d3.histogram()
    .value(d => d) // Accessor function
    .domain(x.domain()) // Same domain as X axis
    .thresholds(x.ticks(20)); // Number of bins

  const bins = histogram(finalValues);

  // Set up Y axis (frequency)
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]) // Max frequency
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -45)
    .attr("x", -height / 2)
    .attr("fill", "#000")
    .style("text-anchor", "middle")
    .text("Frequency");

  // Draw bars
  svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0)) // Start of the bin
    .attr("y", d => y(d.length)) // Height of the bar
    .attr("width", d => x(d.x1) - x(d.x0) - 1) // Width of the bin
    .attr("height", d => height - y(d.length)) // Height of the bar
    .attr("fill", "steelblue")
    .attr("opacity", 0.7);

  // Add a title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Monte Carlo Simulation: Distribution of Final Portfolio Values");
}