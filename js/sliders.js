// Builds one .slider-group per holding from ASSETS, so index.html carries no
// copy of the asset list. Runs before loadFromCache() — the cache writes into
// these inputs, which do not exist until this has run.
function renderSliders() {
  const container = document.getElementById('allocationSliders');

  container.innerHTML = ASSETS.map(asset => {
    const slider = sliderId(asset.key);
    const value = valueId(asset.key);
    const note = asset.note ? `\n        <small>${asset.note}</small>` : '';

    return `
      <div class="slider-group">
        <label for="${slider}">${asset.label}</label>
        <div class="slider-container">
          <input type="range" id="${slider}" min="0" max="100000" step="100" value="${asset.defaultValue}">
          <input type="number" id="${value}" class="slider-value" min="0" max="100000" value="${asset.defaultValue}">
        </div>${note}
      </div>`;
  }).join('');

  ASSETS.forEach(asset => connectSliderToValue(sliderId(asset.key), valueId(asset.key)));
}

// The methodology table reads the same numbers the simulation blends, so the
// two can never drift apart.
function renderAssumptionsTable() {
  const tbody = document.getElementById('assumptionsTable');

  tbody.innerHTML = ASSETS.map(asset => {
    const expense = asset.expenseRatio > 0
      ? `${(asset.expenseRatio * 100).toFixed(2)}%`
      : '—';

    return `<tr>
        <td>${asset.label}</td>
        <td>${(asset.expectedReturn * 100).toFixed(1)}%</td>
        <td>${(asset.volatility * 100).toFixed(0)}%</td>
        <td>${expense}</td>
        <td>${asset.type}</td>
      </tr>`;
  }).join('');
}

// Params are named for the elements, not sliderId/valueId — those are the
// key-to-id helpers in assets.js, and shadowing them here would be a trap.
function connectSliderToValue(sliderElementId, valueElementId) {
  const slider = document.getElementById(sliderElementId);
  const value = document.getElementById(valueElementId);

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
  const total = totalAllocation(readAllocations());
  document.getElementById('totalAmount').textContent = formatMoney(total);
}
