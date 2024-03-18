const locationInput = document.querySelector('.location_input');
const checkIn = document.querySelector('.check_in');
const checkOut = document.querySelector('.check_out');
const guests = document.querySelector('.guests');
const exploreBtn = document.querySelector('.explore');
const hotelsContainer = document.querySelector('.hotel_cards');
const resultInfo = document.querySelector('.result_info');
const defaultCards = document.querySelector('.hotel');
const hotelBookingSection = document.querySelector('.hotelbooking');
const iframe = document.querySelector('iframe');
const ratingInput = document.querySelector('.rating-input');
const currentRating = document.querySelector('#currentRating');

const headers = {
    'X-RapidAPI-Key': 'cb8d37ceddmsh92232755cee698bp1bd4c2jsn1b6c50b12d32',
    'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
}


const adultsSpan = document.querySelector('.adults .num span');
const childrenSpan = document.querySelector('.children .num span');
const adultsMinusButton = document.querySelector('.adults .minus');
const adultsPlusButton = document.querySelector('.adults .plus');
const childrenMinusButton = document.querySelector('.children .minus');
const childrenPlusButton = document.querySelector('.children .plus');
const guestCount = document.querySelector('.text h2');
const hotelDetails = document.querySelector('.filter_bottom .text');
const chooseHotelDetails = document.querySelector('.change_count');

let searchedHotels = [];
let adultNum = 1;
let childrenNum = 0;

let rating = 3;

adultsMinusButton.addEventListener('click', updateNumbers);
adultsPlusButton.addEventListener('click', updateNumbers);
childrenMinusButton.addEventListener('click', updateNumbers);
childrenPlusButton.addEventListener('click', updateNumbers);

hotelDetails.addEventListener("click", () => {
    chooseHotelDetails.classList.toggle('dblock');
});

chooseHotelDetails.addEventListener('click', (e) => e.stopPropagation())


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
        guestCount.textContent = `${adultNum} adult`;
    }
    else {
        guestCount.textContent = `${adultNum} adults, ${childrenNum} children`;
    }
}

function updateRating() {
    if (searchedHotels.length > 0) {
        rating = parseFloat(this.value);
        currentRating.textContent = rating;

        const filteredHotels = searchedHotels.filter((sh) => {
            return sh.bubbleRating.rating >= rating;
        });

        resultInfo.innerHTML = `${locationInput.value.toUpperCase()}: ${filteredHotels.length} properties found`;
        displayCards(filteredHotels)
    }
}


ratingInput.addEventListener("input", updateRating)

const searchHotels = async (checkin, checkout, geoId) => {
    let url = `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels?geoId=${geoId}&checkIn=${checkin}&checkOut=${checkout}&adults=${adultNum}`;
    let children = '';
    if (childrenNum > 0) {
        Array.from(childrenNum).fill(5).forEach((age, idx) => children += `&childAges[${idx}]=${age}`);
        url += children;
    }
    try {
        const res = await fetch(url, {
            headers
        });

        const data = await res.json();
        return data.data.data;
    } catch (error) {
        console.log(error)
    }
}

exploreBtn.addEventListener('click', async () => {
    let location = locationInput.value;
    let checkIN = checkIn.value;
    let checkOUT = checkOut.value;
    if (checkIN.length > 0 && checkOUT.length > 0 && location.length > 0) {
        iframe.src = `https://www.google.com/maps/embed/v1/place?q=${location}&zoom=12&key=AIzaSyDfBh6-RM7h2_Lqvv778tWaXZNIh9XznRk`;
        defaultCards.style.display = 'none';
        hotelBookingSection.style.display = 'flex';
        hotelBookingSection.scrollIntoView({ behavior: "smooth" });
        hotelsContainer.innerHTML = `<img src="../src/assets/loading.gif" class="loading_gif" alt="">`;
        try {
            const res = await fetch(`https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation?query=${location}`, {
                headers
            });

            const data = await res.json();

            if (res.ok && data.data.length > 0) {
                let geoId = data.data[0].geoId;
                searchedHotels = await searchHotels(checkIN, checkOUT, geoId);
                resultInfo.innerHTML = `${location.toUpperCase()}: ${searchedHotels.length} properties found`;
                displayCards(searchedHotels);
            } else {
                hotelsContainer.innerHTML = 'Not found!'
            }

        } catch (error) {
            hotelsContainer.innerHTML = 'Not found!'
        }

    } else {
        return alert("Please fill the all required inputs!")
    }
});


const suggestionsDiv = document.getElementById('suggestions');

let placesAutocomplete = new google.maps.places.Autocomplete(locationInput);

placesAutocomplete.setFields(['address_components', 'formatted_address', 'geometry']);

placesAutocomplete.addListener('place_changed', () => {
    const place = placesAutocomplete.getPlace();
    const city = getCityFromPlace(place);
    if (city) {
        fetchHotels(city);
    }
});

const getCurrentCurrency = () => {
    return localStorage.getItem('selectedCurrency');
}

const displayCards = (h) => {
    let hotels = '';
    const currency = getCurrentCurrency();
    h.map((hotel) => {
        let imgUrl = hotel?.cardPhotos[0]?.sizes.urlTemplate.split('?')[0];
        hotels += `
                    <div class="hotel_card">
                    <div class="left">
                        <img src="${imgUrl}"
                            alt="">
                    </div>
                    <div class="text">
                        <div class="title">
                       <span>${hotel.title}</span>
                        <h4>${hotel.title}</h4>
                    </div>
                    <div class="right">
                        <span>${currency === 'EUR' ? '€' : '$'}${hotel.priceForDisplay.slice(1)}</span>
                        <h2>per night</h2>
                        <a href="${hotel.commerceInfo.externalUrl}" target="_blank">Book now</a>
                    </div>
                </div>
                </div>
                    `
    });

    hotelsContainer.innerHTML = hotels;
}

function getCityFromPlace(place) {
    for (const component of place.address_components) {
        if (component.types.includes('locality')) {
            return component.long_name;
        }
    }
    return null;
}

async function fetchHotels(city) {
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=hotels+in+${city}&key=AIzaSyDfBh6-RM7h2_Lqvv778tWaXZNIh9XznRk`);
        const data = await response.json();
        displaySuggestions(data.results);
    } catch (error) {
        console.error('Error fetching hotel data:', error);
    }
}

function displaySuggestions(results) {
    suggestionsDiv.innerHTML = '';
    results.forEach(result => {
        const hotelDiv = document.createElement('div');
        hotelDiv.textContent = result.name;
        suggestionsDiv.appendChild(hotelDiv);
    });
}