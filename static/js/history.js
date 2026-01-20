document.addEventListener('DOMContentLoaded', () => {
  const historyContainer = document.getElementById('history-container');
  const loadingHistory = document.getElementById('loading-history');
  const noHistory = document.getElementById('no-history');

  // Read from localStorage
  const history =
    JSON.parse(localStorage.getItem('predictionHistory')) || [];

  loadingHistory.classList.add('hidden');

  if (history.length === 0) {
    noHistory.classList.remove('hidden');
    return;
  }

  historyContainer.innerHTML = '';

  history.forEach(item => {
    const card = document.createElement('div');
    card.className =
      'bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 flex flex-col items-center text-center';

    card.innerHTML = `
      <img src="${item.image}"
           class="w-48 h-48 object-cover rounded-lg mb-4 border" />

      <h3 class="text-xl font-semibold text-green-700 mb-1">
        ${item.disease}
      </h3>

      <p class="text-gray-600 text-sm">
        Confidence: ${item.confidence}%
      </p>

      <p class="text-gray-500 text-xs mt-1">
        ${item.time}
      </p>
    `;

    historyContainer.appendChild(card);
  });
});
