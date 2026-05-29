document.addEventListener('DOMContentLoaded', () => {
  loadFromCache();

  connectSliderToValue('vuagSlider', 'vuagValue');
  connectSliderToValue('vucpSlider', 'vucpValue');
  connectSliderToValue('vutySlider', 'vutyValue');
  connectSliderToValue('digigoldSlider', 'digigoldValue');
  connectSliderToValue('cashSlider', 'cashValue');

  createPieChart();
  generateSimulation();

  document.getElementById('updateAllocation').addEventListener('click', createPieChart);
  document.getElementById('runSimulation').addEventListener('click', generateSimulation);
  document.getElementById('toggleMethodology').addEventListener('click', () => {
    const details = document.getElementById('methodologyDetails');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  });
});
