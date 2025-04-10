function saveToCache() {
  const vuag = parseInt(document.getElementById('vuagValue').value) || 0;
  const vucp = parseInt(document.getElementById('vucpValue').value) || 0;
  const vuty = parseInt(document.getElementById('vutyValue').value) || 0;
  const digigold = parseInt(document.getElementById('digigoldValue').value) || 0;
  const cash = parseInt(document.getElementById('cashValue').value) || 0;

  const cachedValues = { vuag, vucp, vuty, digigold, cash };
  localStorage.setItem('portfolioValues', JSON.stringify(cachedValues));
}

function loadFromCache() {
  const cachedValues = JSON.parse(localStorage.getItem('portfolioValues'));

  if (cachedValues) {
    document.getElementById('vuagValue').value = cachedValues.vuag;
    document.getElementById('vuagSlider').value = cachedValues.vuag;
    document.getElementById('vucpValue').value = cachedValues.vucp;
    document.getElementById('vucpSlider').value = cachedValues.vucp;
    document.getElementById('vutyValue').value = cachedValues.vuty;
    document.getElementById('vutySlider').value = cachedValues.vuty;
    document.getElementById('digigoldValue').value = cachedValues.digigold;
    document.getElementById('digigoldSlider').value = cachedValues.digigold;
    document.getElementById('cashValue').value = cachedValues.cash;
    document.getElementById('cashSlider').value = cachedValues.cash;

    updateTotalAmount();
  }
}