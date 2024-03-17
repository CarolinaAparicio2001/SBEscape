function changeCurrency(currency) {
    var button = document.querySelector('.action_btn');
    if (currency === 'EUR') {
        button.innerHTML = '€ (Euro)';
    } else if (currency === 'USD') {
        button.innerHTML = '$ (Dollar)';
    }
    saveCurrency(currency);
}

function saveCurrency(currency) {
    localStorage.setItem('selectedCurrency', currency);
}

function loadCurrency() {
    return localStorage.getItem('selectedCurrency');
}

window.onload = function () {
    var selectedCurrency = loadCurrency();
    if (selectedCurrency) {
        changeCurrency(selectedCurrency);
    }
};