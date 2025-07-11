let map;
let markers = [];
const mapElement = document.getElementById("google_map");

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const cards = document.querySelectorAll(".store-locator-card" );

  const storeLongitude = Array.from(document.querySelectorAll(".store-locator-card__longitude")).map(item => item.textContent);
  const storeLatitude = Array.from(document.querySelectorAll(".store-locator-card__latitude")).map(item => item.textContent);
  const coordinateTitle = Array.from(document.querySelectorAll(".store-locator-card__coordinate-title"))
    .map(item => item.textContent)
    .map(item => item.replace(/([A-Z])/g, ' $1').trim());

  const coordinateAddress = Array.from(document.querySelectorAll(".store-locator-card__address")).map(item => item.textContent);
  const coordinateHours = Array.from(document.querySelectorAll(".store-locator-card__opening-hour")).map(item => item.innerHTML);
  const coordinateButtons = Array.from(document.querySelectorAll(".store-locator-card__actions")).map(item => item.innerHTML);

  const mapZoomLevel = Number(document.getElementById("google_map").dataset.mapZoomLevel) || 4;
  const mapZoomLevelUnit = mapZoomLevel <= 18 ? 3 : 0;

  const locations = [];

  for (let i = 0; i < storeLongitude.length; i++) {
    const coordinateIndex = i;
    const coordinatLatitude = Number(storeLatitude[coordinateIndex]);
    const coordinateT = coordinateTitle[coordinateIndex];
    const coordinateA = coordinateAddress[coordinateIndex];
    const tooltipContent =
      coordinateA && !coordinateT ? coordinateA : coordinateT;

    if (coordinatLatitude && (tooltipContent || "n/a")) {
      locations.push([
        `<b>${tooltipContent}</b><br/><a href="https://maps.google.com/?q=${coordinatLatitude},${Number(
          storeLongitude[i]
        )}" target="_blank" style="text-decoration: underline;">Location</a>`,
        coordinatLatitude,
        Number(storeLongitude[i])
      ]);
    }
  }

  const minLongitude = Math.min(...storeLongitude);
  const minLatitude = Math.min(...storeLatitude);
  const maxLongitude = Math.max(...storeLongitude);
  const maxLatitude = Math.max(...storeLatitude);

  const centerLatitude = (minLatitude + maxLatitude) / 2;
  const centerLongitude = (minLongitude + maxLongitude) / 2;

  if (
    typeof google === "undefined" ||
    typeof google.maps === "undefined"
  ) {
    return;
  }

  map = new Map(mapElement, {
    zoom: mapZoomLevel,
    center: { lat: centerLatitude, lng: centerLongitude },
    scrollwheel: true,
    gestureHandling: "greedy",
    disableDefaultUI: true,
    backgroundColor: "#89b4f8",
    mapId: "4504f8b37365c3d0"
  });

  const pinIcon = {
    url: mapElement.dataset.mapPinIcon
  };

  const infowindow = new google.maps.InfoWindow({
    maxWidth: 200
  });

  const setMapClickHandler = (item, i) => {
    item.addEventListener("click", function () {
      map.panTo(
        new google.maps.LatLng(locations[i][1], locations[i][2])
      );
      map.setZoom(mapZoomLevel + mapZoomLevelUnit);
    });
  };

  for (let i = 0; i < locations.length; i++) {
    setMapClickHandler(cards[i], i);

    const customMarker = document.createElement("div");
    const customMarkerLabel = document.createElement("div");
    const customMarkerPoint = document.createElement("div");
    const openingHoursLabel = document.createElement("div");
    const buttonsLabel = document.createElement("div");

    customMarker.className = "store-locator__map--custom-marker";
    customMarker.setAttribute(
      "id",
      `store-locator__map--custom-marker--${i}`
    );

    customMarkerLabel.className = "store-locator__map--custom-marker--label";
    customMarkerLabel.textContent = coordinateTitle[i];

    customMarkerPoint.className = "store-locator__map--custom-marker--point";

    openingHoursLabel.className = "store-locator__map--custom-marker--hours";
    openingHoursLabel.innerHTML = coordinateHours[i];

    buttonsLabel.className = "store-locator__map--custom-marker--buttons";
    buttonsLabel.innerHTML = coordinateButtons[i];

    customMarker.appendChild(customMarkerLabel);
    customMarker.appendChild(customMarkerPoint);
    customMarkerLabel.appendChild(openingHoursLabel);
    customMarkerLabel.appendChild(buttonsLabel);

    const marker = new AdvancedMarkerElement({
      position: new google.maps.LatLng(
        locations[i][1],
        locations[i][2]
      ),
      map,
      content: customMarker
    });

    markers = [...markers, marker];

    google.maps.event.addListener(
      marker,
      "click",
      (function (marker, count) {
        return function () {
          let newLatLng;
          if (window.innerWidth <= 750) {
            newLatLng = new google.maps.LatLng(
              locations[i][1] - 5, // Adjust the latitude offset as needed
              locations[i][2]
            );
          } else {
            newLatLng = new google.maps.LatLng(
              locations[i][1], // Adjust the latitude offset as needed
              locations[i][2]
            );
          }
          map.panTo(newLatLng);

          /** display active marker styles */
          document.querySelectorAll(".store-locator__map--custom-marker")
            .forEach(item => item.classList.remove("store-locator__map--custom-marker--active"));
          document.getElementById(`store-locator__map--custom-marker--${count}`)
            .classList.add("store-locator__map--custom-marker--active");

          /** display selected marker's pin card */
          const mapWithSearch = document
            .querySelector(".store-locator__map-layout")
            .classList.contains(
              "store-locator__map-layout--with-search"
            );
          if (!mapWithSearch || (window.innerWidth < 750)) {
            document
              .querySelectorAll(".store-locator-card")
              .forEach(card => (card.style.display = "none"));
            document.querySelector(
              `[data-marker-index="${count}"]`
            ).style.display = "block";
          }
        };
      })(marker, i)
    );

    function removeMarkers () {
      /** remove active from all markers */
      document
        .querySelectorAll(".store-locator__map--custom-marker")
        .forEach(item =>
          item.classList.remove(
            "store-locator__map--custom-marker--active"
          )
        );

      /** remove selected marker's pin card */
      document
        .querySelectorAll(".store-locator-card")
        .forEach(card => card.removeAttribute("style"));
    }

    map.addListener("click", () => {
      removeMarkers();
    });

    const crossButtons = document.querySelectorAll(
      ".store-locator-card__cross"
    );

    crossButtons.forEach(button => {
      button.addEventListener("click", () => {
        removeMarkers();
      });
    });

  }
}

initMap();

