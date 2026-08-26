document.addEventListener('DOMContentLoaded', () => {
  // The sliders must exist before the cache can write into them.
  renderSliders();
  renderAssumptionsTable();
  loadFromCache();
  updateTotalAmount();

  createPieChart();
  generateSimulation();

  document.getElementById('updateAllocation').addEventListener('click', createPieChart);
  document.getElementById('runSimulation').addEventListener('click', generateSimulation);
  document.getElementById('toggleMethodology').addEventListener('click', () => {
    const details = document.getElementById('methodologyDetails');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  });
});
