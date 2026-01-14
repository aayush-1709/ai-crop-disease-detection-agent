document.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('history-list');
    const loadingHistory = document.getElementById('loading-history');
    const noHistory = document.getElementById('no-history');
    const historyError = document.getElementById('history-error');
    const historyErrorText = document.getElementById('history-error-text');

    function showHistoryError(message) {
        historyErrorText.textContent = message;
        historyError.classList.remove('hidden');
    }

    try {
        const response = await fetch('/history'); // Fetch history from Flask backend

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch history.');
        }

        const data = await response.json();
        const history = data.history;

        loadingHistory.classList.add('hidden');

        if (history.length === 0) {
            noHistory.classList.remove('hidden');
        } else {
            history.forEach(item => {
                const card = document.createElement('div');
                card.className = 'history-card';

                // Default image if base64 is missing or invalid
                const imgSrc = item.image_base64 ? `data:image/jpeg;base64,${item.image_base64}` : "{{ url_for('static', filename='images/placeholder.png') }}";

                let formattedTimestamp = 'N/A';
                if (item.timestamp) {
                    try {
                        // Parse the ISO string into a Date object
                        const date = new Date(item.timestamp);
                        // Format it to a user-friendly local string
                        formattedTimestamp = date.toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                    } catch (e) {
                        console.error("Error parsing timestamp:", item.timestamp, e);
                        formattedTimestamp = 'Invalid Date';
                    }
                }

                card.innerHTML = `
                    <img src="${imgSrc}" alt="Uploaded Plant Image" class="w-full h-40 object-cover rounded-lg mb-3 border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-1">${item.predicted_class_name.replace(/_/g, ' ')}</h3>
                    <p class="text-gray-600 text-sm mb-2">Confidence: <span class="font-bold">${item.confidence.toFixed(2)}%</span></p>
                    <p class="text-gray-500 text-xs">${formattedTimestamp}</p>
                `;
                historyList.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        loadingHistory.classList.add('hidden');
        showHistoryError(`Could not load history: ${error.message}`);
    }
});
