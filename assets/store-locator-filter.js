const cards = document.querySelectorAll(".store-locator-card");
const cardContent = document.querySelectorAll(".store-locator-card__content");
const searchInput = document.getElementById("search-store-locator");
const searchButton = document.querySelector(".store-locator__search-button");

const isPage = document.querySelector(".store-locator-page");
const isSection = document.querySelector(".store-locator");

function liveSearch() {
  let search_query = searchInput.value;
  for (let i = 0; i < cards.length; i++) {
    if (
      cardContent[i].textContent
        .toLowerCase()
        .includes(search_query.toLowerCase())
    ) {
      cards[i].classList.remove("hidden");
    } else {
      cards[i].classList.add("hidden");
    }
  }
}

function performSearch() {
  let search_query = searchInput.value.toLowerCase();
  for (let i = 0; i < cards.length; i++) {
    if (
      cardContent[i].textContent.toLowerCase().includes(search_query)
    ) {
      const markerIndex = cards[i].dataset.markerIndex || 0;
      google.maps.event.trigger(markers[markerIndex], "click");
    }
  }
}

if (isPage) {
  searchInput.addEventListener("keyup", event => {
    event.preventDefault();
    liveSearch();
  });

  searchInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });

  searchInput.addEventListener("search", () => {
    let search_query = searchInput.value;
    if (search_query === "") {
      for (let i = 0; i < cards.length; i++) {
        cards[i].classList.remove("hidden");
      }
    }
  });
}

if (isSection) {
  searchInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      performSearch();
    }
  });

  searchButton.addEventListener("click", event => {
    event.preventDefault();
    performSearch();
  });
}
