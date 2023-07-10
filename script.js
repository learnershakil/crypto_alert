let symbol;
let threshold;
let apiKey;

let currentPrice = 0;
let socket;
let walletBalance = 0;

// Function to initialize the WebSocket connection
function initWebSocket() {
    socket = io('wss://stream.binance.com:9443/ws');

    socket.on('connect', () => {
        socket.emit('subscribe', symbol.toLowerCase() + '@ticker');
    });

    socket.on('ticker', (ticker) => {
        const parsedTicker = JSON.parse(ticker);
        if (parsedTicker.s === symbol) {
            currentPrice = parseFloat(parsedTicker.c);
            updatePrice();
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected.');
    });

    // Fetch initial wallet balance
    socket.emit('getBalance', apiKey);
}


// Function to update the displayed price
function updatePrice() {
    const priceElement = document.getElementById('price');
    const alarmStatusElement = document.getElementById('alarmStatus');

    priceElement.textContent = currentPrice.toFixed(2);

    if (currentPrice >= threshold) {
        alarmStatusElement.textContent = 'Triggered';
        alarmStatusElement.style.color = 'red';
        // Trigger your alarm or perform any other action here
    } else {
        alarmStatusElement.textContent = 'Not triggered';
        alarmStatusElement.style.color = 'green';
    }
}

// Function to update the displayed wallet balance
function updateBalance(balance) {
    const balanceElement = document.getElementById('balance');
    balanceElement.textContent = balance.toFixed(2);
}

// Function to start the price checking and real-time graph
function startPriceChecking() {
    symbol = document.getElementById('symbol').value.toUpperCase();
    threshold = parseFloat(document.getElementById('threshold').value);
    apiKey = document.getElementById('apiKey').value;

    if (!symbol || !threshold || isNaN(threshold) || !apiKey) {
        alert('Please enter valid symbol, threshold price, and API key.');
        return;
    }

    // Validate the API key here (basic validation example)
    if (apiKey.length !== 64) {
        alert('Invalid API key. Please enter a valid Binance API key.');
        return;
    }

    initWebSocket();
    updatePrice();
    intervalId = setInterval(updatePrice, 1000);

    // Create a real-time graph
    const ctx = document.getElementById('chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Price',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price'
                    }
                }
            }
        }
    });

    // Function to update the real-time graph
    function updateGraph() {
        chart.data.labels.push(new Date().toLocaleTimeString());
        chart.data.datasets[0].data.push(currentPrice.toFixed(2));
        chart.update();
    }

    // Update the graph every second
    setInterval(updateGraph, 1000);

    // Update UI
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
}

// Function to stop the price checking and graph updates
function stopPriceChecking() {
    clearInterval(intervalId);

    // Disconnect WebSocket
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    // Update UI
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('alarmStatus').textContent = 'Not triggered';
    document.getElementById('alarmStatus').style.color = 'green';
}

// Event listeners for buttons
document.getElementById('startBtn').addEventListener('click', startPriceChecking);
document.getElementById('stopBtn').addEventListener('click', stopPriceChecking);

// Toggle between light and dark mode
function toggleDarkMode() {
    const body = document.querySelector('body');
    body.classList.toggle('dark-mode');
}

// Event listener for dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('change', toggleDarkMode);
