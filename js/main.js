document.addEventListener('DOMContentLoaded', () => {
  loadFromCache();
  createPieChart();
  generateSimulation();

  document.getElementById('updateAllocation').addEventListener('click', createPieChart);
  document.getElementById('runSimulation').addEventListener('click', generateSimulation);
});