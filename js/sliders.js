function connectSliderToValue(sliderId, valueId) {
  const slider = document.getElementById(sliderId);
  const value = document.getElementById(valueId);

  slider.addEventListener('input', () => {
    value.value = slider.value;
    updateTotalAmount();
    saveToCache();
  });

  value.addEventListener('input', () => {
    slider.value = value.value;
    updateTotalAmount();
    saveToCache();
  });
}

function updateTotalAmount() {
  const vuag = parseInt(document.getElementById('vuagValue').value) || 0;
  const vucp = parseInt(document.getElementById('vucpValue').value) || 0;
  const vuty = parseInt(document.getElementById('vutyValue').value) || 0;
  const digigold = parseInt(document.getElementById('digigoldValue').value) || 0;
  const cash = parseInt(document.getElementById('cashValue').value) || 0;

  const total = vuag + vucp + vuty + digigold + cash;
  document.getElementById('totalAmount').textContent = `£${total.toLocaleString()}`;
}