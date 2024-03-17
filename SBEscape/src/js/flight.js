const headers = {
    'X-RapidAPI-Key': 'cb8d37ceddmsh92232755cee698bp1bd4c2jsn1b6c50b12d32',
    'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
}

const fromInput = document.querySelector('.from_input');
const toInput = document.querySelector('.to_input');
const returnDate = document.querySelector('.return_input');
const departureDate = document.querySelector('.departure_input');
const exploreBtn = document.querySelector('.explore')
const flightsContainer = document.querySelector('.flights_container');
const flightsSection = document.querySelector('#searched_flights');
const defaultFlights = document.querySelector('.default_flights');
const resultInfo = document.querySelector('.result_info');
const classSelect = document.querySelector('.class_select');
const tripType = document.querySelector('.trip_type');
const autoCompleteContainer = document.querySelector('.autocomplete_cities');
const autoCompleteContainer2 = document.querySelector('.autocomplete_cities2');
const airlinesContainer = document.querySelector('.airlines');
const chooseFlightDetails = document.querySelector('.change_count');

let airlineFilterCheckboxes = [];
let stopFilters = [];
let srcAirportCode;
let destAirportCode;
let srcCityName;

let adultNum = 1;
let childrenNum = 0;

let airlines = [];
let availableStops = [0, 1, 2];

let allFlights = [];
let allRawFlightData = [];


const adultsSpan = document.querySelector('.adults .num span');
const childrenSpan = document.querySelector('.children .num span');
const adultsMinusButton = document.querySelector('.adults .minus');
const adultsPlusButton = document.querySelector('.adults .plus');
const childrenMinusButton = document.querySelector('.children .minus');
const childrenPlusButton = document.querySelector('.children .plus');
const economyText = document.querySelector('.text h2');
const flightDetails = document.querySelector('.down .text');

adultsMinusButton.addEventListener('click', updateNumbers);
adultsPlusButton.addEventListener('click', updateNumbers);
childrenMinusButton.addEventListener('click', updateNumbers);
childrenPlusButton.addEventListener('click', updateNumbers);

flightDetails.addEventListener("click", () => {
    chooseFlightDetails.classList.toggle('dblock');
});

chooseFlightDetails.addEventListener('click', (e) => e.stopPropagation())

function updateNumbers() {
    if (this === adultsMinusButton && adultNum - 1 > 0) {
        adultNum--;
        adultsSpan.textContent = adultNum;
    } else if (this === adultsPlusButton) {
        adultNum++;
        adultsSpan.textContent = adultNum;
    } else if (this === childrenMinusButton && childrenNum > 0) {
        childrenNum--;
        childrenSpan.textContent = childrenNum;
    } else if (this === childrenPlusButton) {
        childrenNum++;
        childrenSpan.textContent = childrenNum;
    }

    updateText();
}

function updateText() {

    if (childrenNum === 0) {
        economyText.textContent = `${adultNum} adults . ${classSelect.value}`;
    }
    else {
        economyText.textContent = `${adultNum} adults, ${childrenNum} children, ${classSelect.value}`;
    }
}

classSelect.addEventListener('change', updateText)


const formatTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error(`Invalid date format: ${dateString}`);
        return null;
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

const convertDuration = (durationInMinutes) => {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours}h ${minutes}m`;
};

const getCurrentCurrency = () => {
    return localStorage.getItem('selectedCurrency');
}

exploreBtn.addEventListener('click', async () => {
    const retDate = returnDate.value;
    const depDate = departureDate.value;

    let children = '';
    Array.from(childrenNum).fill(5).forEach((age, idx) => children += `&childAges[${idx}]=${age}`)

    if (depDate.length > 0 && srcAirportCode?.length > 0 && destAirportCode?.length > 0) {
        try {
            defaultFlights.style.display = 'none';
            flightsSection.style.display = 'flex';
            flightsSection.scrollIntoView({ behavior: 'smooth' })
            flightsContainer.innerHTML = `<img src="/src/assets/loading.gif" class="loading_gif" alt="">`;
            const currency = getCurrentCurrency();
            let url = `https://tripadvisor16.p.rapidapi.com/api/v1/flights/searchFlights?sortOrder=PRICE&destinationAirportCode=${destAirportCode}&sourceAirportCode=${srcAirportCode}&date=${depDate}&itineraryType=${retDate?.length > 0 ? 'ROUND_TRIP' : 'ONE_WAY'}&numAdults=${adultNum}&numSeniors=0&classOfService=${classSelect.value}${children}&pageNumber=1&currencyCode=${currency}`;
            if (retDate.length > 0) {
                url += `&returnDate=${retDate}`
            }

            const res = await fetch(url, {
                headers
            });

            const data = await res.json();
            allRawFlightData = data;

            resultInfo.innerHTML = `${srcCityName.toUpperCase()}: ${data.data.flights.length} flights found`;

            flightsContainer.innerHTML = '';

            displayFlights(data.data.flights);


            airlines.forEach((airl) => {
                airlinesContainer.innerHTML += `
                <div class="checkbox">
                    <input name="check" value="${airl}" checked="true" type="checkbox">
                    <label for="check">${airl}</label>
                </div>
                `
            });

            airlineFilterCheckboxes = [...document.querySelectorAll('.checkbox input')];
            stopFilters = [...document.querySelectorAll('.stop_option input')];

            airlineFilterCheckboxes?.map((afc) => {
                afc.addEventListener("change", () => filterAirlines(afc));
            });

            stopFilters?.map((sf) => {
                sf.addEventListener("change", () => filterStops(sf))
            })


        } catch (error) {
            console.log(error)
            flightsContainer.innerHTML = "<h1>Not found!</h1>"
        }


    } else {
        return alert("Fill the required inputs");
    }
})


function filterAirlines(checkbox) {
    if (checkbox.checked) {
        airlines.push(checkbox.value)
    } else {
        airlines = airlines.filter((air) => air !== checkbox.value)
    }

    filterFlights();
}

const filterFlights = () => {
    const filteredFlights = allRawFlightData.data.flights.filter((flight) => {
        let stopCount = flight.segments[0].legs.length - 1;
        let operatingCarrier = flight.segments[0].legs[0].operatingCarrier.displayName;
        if (availableStops.includes(2)) {
            return (stopCount >= 2 || availableStops.includes(stopCount)) && airlines.includes(operatingCarrier);
        } else {
            return availableStops.includes(stopCount) && airlines.includes(operatingCarrier);
        }
    });

    displayFlights(filteredFlights);
}

function filterStops(checkbox) {
    if (checkbox.checked && !availableStops.includes(Number(checkbox.value))) {
        availableStops.push(Number(checkbox.value))
    } else {
        availableStops = availableStops.filter((as) => as != checkbox.value)
    }

    filterFlights()

}

const changeInputValue = (val, code, city) => {
    srcCityName = city;
    srcAirportCode = code;
    fromInput.value = val;
}
const changeInputValue2 = (val, code) => {
    destAirportCode = code;
    toInput.value = val;
}

fromInput.addEventListener('keyup', async () => {
    if (!fromInput.value.trim().length > 0) {
        autoCompleteContainer.classList.remove('dblock');
        return;
    }
    const res = await fetch(`https://autocomplete.travelpayouts.com/places2?locale=en&types[]=city&term=${fromInput.value}`);
    const data = await res.json();
    if (data.length === 0) {
        autoCompleteContainer.innerHTML = "NOT FOUND";
        return;
    }
    autoCompleteContainer.classList.add('dblock');
    let cities = ''
    data.map((city) => {
        let val = `${city.name} (${city.code})`
        cities += `
            <div class="ac" onmousedown="changeInputValue('${val}', '${city.code}', '${city.name}')">
                <div class="autocomplete_info">
                    <img src="../src/assets/plane.png" alt="">
                    <h3>${city.name} (${city.code})</h3>
                </div>
                <span>${city.country_name}</span>
            </div>
        `
    });

    autoCompleteContainer.innerHTML = cities
});

toInput.addEventListener('keyup', async () => {
    if (!toInput.value.trim().length > 0) {
        autoCompleteContainer2.classList.remove('dblock');
        return;
    }
    const res = await fetch(`https://autocomplete.travelpayouts.com/places2?locale=en&types[]=city&term=${toInput.value}`);
    const data = await res.json();
    if (data.length === 0) {
        autoCompleteContainer2.innerHTML = "NOT FOUND";
        return;
    }
    autoCompleteContainer2.classList.add('dblock');
    let cities = ''
    data.map((city) => {
        let val = `${city.name} (${city.code})`
        cities += `
        <div class="ac" onmousedown="changeInputValue2('${val}', '${city.code}', '${city.name}')">
            <div class="autocomplete_info">
                <img src="../src/assets/plane.png" alt="">
                <h3>${city.name} (${city.code})</h3>
            </div>
            <span>${city.country_name}</span>
        </div>
        `
    });

    autoCompleteContainer2.innerHTML = cities
});

fromInput.addEventListener('focusout', () => {
    setTimeout(() => {
        autoCompleteContainer.classList.remove('dblock');
    }, 200);
})

toInput.addEventListener('focusout', () => {
    setTimeout(() => {
        autoCompleteContainer2.classList.remove('dblock');
    }, 200);
})


const displayFlights = (flights) => {
    allFlights = [];
    flights.map((flight) => {
        let legsIdx = flight.segments[0].legs.length - 1;
        let depTime1 = formatTime(flight.segments[0]?.legs[0]?.departureDateTime);
        let arrivalTime1 = formatTime(flight.segments[0]?.legs[legsIdx]?.arrivalDateTime);
        let depTime2 = formatTime(flight.segments[1]?.legs[0]?.departureDateTime);
        let arrivalTime2 = formatTime(flight.segments[1]?.legs[legsIdx]?.arrivalDateTime);

        let duration1 = convertDuration(flight.segments[0]?.layovers[0]?.durationInMinutes);
        let duration2 = convertDuration(flight.segments[1]?.layovers[0]?.durationInMinutes);

        let operatingCarrier = flight.segments[0].legs[0].operatingCarrier.displayName;
        if (!airlines.includes(operatingCarrier)) {
            airlines.push(operatingCarrier)
        }

        const currency = getCurrentCurrency();

        let singleFlight = `
        <div class="flight_card">
        <div class="flight_info">
            <div class="departure">
                <img src="${flight.purchaseLinks[0]?.partnerSuppliedProvider?.logoUrl}" alt="">
                <div class="time_and_airports">
                    <div class="time">${depTime1} - ${arrivalTime1}</div>
                    <div class="airports">${flight.segments[0].legs[0].originStationCode} - ${flight.segments[0].legs[legsIdx].destinationStationCode}</div>
                </div>
                <div class="divider"></div>
                <div class="duration_and_stops">
                    <h5>${duration1}</h5>
                    <h5>${legsIdx == 0 ? 'No stop' : `${legsIdx} stops`}</h5>
                </div>
            </div>
            <div class="return">
                <img src="${flight.purchaseLinks[0]?.partnerSuppliedProvider?.logoUrl}" alt="">
                <div class="time_and_airports">
                    <div class="time">${depTime2} - ${arrivalTime2}</div>
                    <div class="airports">${flight.segments[1]?.legs[0]?.originStationCode} - ${flight.segments[1]?.legs[legsIdx]?.destinationStationCode}</div>
                </div>
                <div class="divider"></div>
                <div class="duration_and_stops">
                    <h5>${duration2}</h5>
                    <h5>${legsIdx == 0 ? 'No stop' : `${legsIdx} stops`}</h5>
                </div>
            </div>
        </div>
        <div class="booking_info">
            <div class="price">${currency === 'EUR' ? '€' : '$'}${flight.purchaseLinks[0].totalPrice}</div>
            <span>Round trip</span>
            <a href="${flight.purchaseLinks[0].url}" target="_blank">Book now</a>
        </div>
    </div>
        `

        allFlights.push(singleFlight)
    });

    flightsContainer.innerHTML = '';

    allFlights.forEach((flg) => {
        flightsContainer.innerHTML += flg;
    })
}