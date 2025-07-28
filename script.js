
let map;
let helpMarkers = [];
let userMarker;
let selectedHelpCenter = null;
let watchID;
let directionsService;
let directionsRenderer;

// ✅ Initialize Firebase (ADD YOUR OWN CONFIG BELOW)
const firebaseConfig = {
  apiKey: "AIzaSyAJ0uIB6F8XqcEAgfzNElBYC6v2vgTP_4o",
  authDomain: "emergency-tracker-d63a4.firebaseapp.com",
  projectId: "emergency-tracker-d63a4",
  storageBucket: "emergency-tracker-d63a4.firebasestorage.app",
  messagingSenderId: "560432362765",
  appId: "1:560432362765:web:e2863c5c527d7f40f56c44",
  measurementId: "G-SY5DMPYKNX"
};
firebase.initializeApp(firebaseConfig);

function updateOnlineStatus() {
  const statusBox = document.getElementById("statusBox");
  if (statusBox) {
    const statusText = statusBox.querySelector('span');
    const statusIcon = statusBox.querySelector('i');
    
    if (navigator.onLine) {
      statusText.textContent = "Online";
      statusIcon.style.color = "var(--accent-success)";
      statusBox.classList.remove('offline');
    } else {
      statusText.textContent = "Offline";
      statusIcon.style.color = "var(--accent-danger)";
      statusBox.classList.add('offline');
    }
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
window.onload = function() {
  if (window.initMap) window.initMap();
  updateOnlineStatus();
};

window.initMap = function() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20, lng: 0 },
    zoom: 2,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: "#00d4aa",
      strokeWeight: 4,
      strokeOpacity: 0.8,
    },
  });
  directionsRenderer.setMap(map);
};

window.sendAlert = function() {
  if (!navigator.geolocation) {
    showNotification("Geolocation not supported!", "error");
    return;
  }

  if (!navigator.onLine) {
    showNotification("⚠️ You're offline. Emergency alert could not be sent.", "warning");

    const lastKnown = localStorage.getItem("lastKnownLocation");
    if (lastKnown) {
      const { lat, lng } = JSON.parse(lastKnown);
      const offlineLocation = { lat, lng };

      map.setCenter(offlineLocation);
      map.setZoom(15);
      new google.maps.Marker({
        position: offlineLocation,
        map: map,
        title: "Last Known Location (Offline)",
        icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
      });
    }

    return;
  }

  // Show loading state
  const ctaButton = document.querySelector('.cta-button');
  const primaryButton = document.querySelector('.primary-button');
  
  if (ctaButton) {
    ctaButton.disabled = true;
    ctaButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending...</span>';
  }
  
  if (primaryButton) {
    primaryButton.disabled = true;
    primaryButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending...</span>';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const userLocation = { lat, lng };

      localStorage.setItem("lastKnownLocation", JSON.stringify({ lat, lng }));

      map.setCenter(userLocation);
      map.setZoom(15);

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "You are here",
          icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      startLiveTracking();

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDhMsCZTDAIMllWRzYRss00-z1h1UDnWwI`;

      fetch(geocodeUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data.status !== "OK" || !data.results.length) {
            throw new Error("Geocoding failed.");
          }

          const address = data.results[0].formatted_address;
          const components = data.results[0].address_components;
          let streetNumber = "";
          let route = "";
          let locality = "";
          let place = "";

          components.forEach((comp) => {
            if (comp.types.includes("street_number")) streetNumber = comp.long_name;
            if (comp.types.includes("route")) route = comp.long_name;
            if (comp.types.includes("locality")) locality = comp.long_name;
            if (comp.types.includes("point_of_interest") || comp.types.includes("premise")) place = comp.long_name;
          });
          if (!place) place = locality;

          // Save to Firebase with address details
          firebase.database().ref("liveLocations/saad").set({
            lat: lat,
            lng: lng,
            address: address,
            street: streetNumber + " " + route,
            place: place,
            timestamp: Date.now(),
          }).then(() => {
            showNotification("✅ Emergency alert sent successfully!", "success");
            
            // Reset button states
            if (ctaButton) {
              ctaButton.disabled = false;
              ctaButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send Alert</span>';
            }
            
            if (primaryButton) {
              primaryButton.disabled = false;
              primaryButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send My Location</span>';
            }
          }).catch((error) => {
            console.error("Error saving to Firebase:", error);
            showNotification("❌ Failed to send alert. Please try again.", "error");
            
            // Reset button states
            if (ctaButton) {
              ctaButton.disabled = false;
              ctaButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send Alert</span>';
            }
            
            if (primaryButton) {
              primaryButton.disabled = false;
              primaryButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send My Location</span>';
            }
          });
        })
        .catch((error) => {
          console.error("Geocoding error:", error);
          showNotification("❌ Failed to get location details.", "error");
          
          // Reset button states
          if (ctaButton) {
            ctaButton.disabled = false;
            ctaButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send Alert</span>';
          }
          
          if (primaryButton) {
            primaryButton.disabled = false;
            primaryButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send My Location</span>';
          }
        });
    },
    (error) => {
      console.error("Geolocation error:", error);
      showNotification("❌ Failed to get your location. Please check permissions.", "error");
      
      // Reset button states
      if (ctaButton) {
        ctaButton.disabled = false;
        ctaButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send Alert</span>';
      }
      
      if (primaryButton) {
        primaryButton.disabled = false;
        primaryButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>Send My Location</span>';
      }
    }
  );
};

function startLiveTracking() {
  if (!navigator.geolocation) return;

  if (watchID) {
    navigator.geolocation.clearWatch(watchID);
  }

  watchID = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const newLocation = { lat, lng };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: newLocation,
          map: map,
          title: "You are here",
          icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });
        map.setCenter(newLocation);
        map.setZoom(15);
      } else {
        userMarker.setPosition(newLocation);
      }

      // Firebase push removed from here

      if (selectedHelpCenter) {
        directionsService.route(
          {
            origin: newLocation,
            destination: selectedHelpCenter.geometry.location,
            travelMode: google.maps.TravelMode.WALKING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(result);

              const leg = result.routes[0].legs[0];
              const distance = leg.distance.text;
              const duration = leg.duration.text;

              document.getElementById("infoBox").innerText =
                `Distance: ${distance} | ETA: ${duration}`;
            } else {
              document.getElementById("infoBox").innerText =
                "Unable to get updated route.";
            }
          }
        );
      }
    },
    (error) => {
      console.error("Tracking error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );
}

window.showNearbyHelpCenters = function() {
  if (!map || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition((position) => {
    const userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    const service = new google.maps.places.PlacesService(map);
    const infoWindow = new google.maps.InfoWindow();

    const types = [
      { type: "hospital", icon: "https://maps.google.com/mapfiles/ms/icons/hospitals.png" },
      { type: "police", icon: "https://maps.google.com/mapfiles/ms/icons/police.png" },
      { type: "embassy", icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
    ];

    helpMarkers.forEach((marker) => marker.setMap(null));
    helpMarkers = [];

    types.forEach(({ type, icon }) => {
      const request = {
        location: userLocation,
        radius: 5000,
        type: type,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          results.forEach((place) => {
            const marker = new google.maps.Marker({
              map: map,
              position: place.geometry.location,
              icon: icon,
              title: place.name,
            });

            marker.addListener("click", () => {
              const rating = place.rating ? `Rating: ${place.rating}` : "No rating";
              const vicinity = place.vicinity || "";
              infoWindow.setContent(`
                <div style="padding: 12px; max-width: 250px; background: #1e293b; border-radius: 8px; color: #f8fafc;">
                  <strong style="color: #00d4aa; font-size: 14px; display: block; margin-bottom: 4px;">${place.name}</strong>
                  <span style="color: #cbd5e1; font-size: 12px; display: block; margin-bottom: 2px;">${rating}</span>
                  <span style="color: #cbd5e1; font-size: 12px; display: block;">${vicinity}</span>
                </div>
              `);
              infoWindow.open(map, marker);

              selectedHelpCenter = place;

              if (userMarker) {
                directionsService.route(
                  {
                    origin: userMarker.getPosition(),
                    destination: place.geometry.location,
                    travelMode: google.maps.TravelMode.WALKING,
                  },
                  (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                      directionsRenderer.setDirections(result);

                      const leg = result.routes[0].legs[0];
                      const distance = leg.distance.text;
                      const duration = leg.duration.text;

                      document.getElementById("infoBox").innerText =
                        `🚶 Distance: ${distance} | 🕒 ETA: ${duration}`;
                      
                      // Adjust map bounds to show both user and destination
                      const bounds = new google.maps.LatLngBounds();
                      bounds.extend(userMarker.getPosition());
                      bounds.extend(place.geometry.location);
                      map.fitBounds(bounds);
                      
                      // Add some padding to the bounds
                      map.setZoom(Math.min(map.getZoom(), 15));
                    } else {
                      document.getElementById("infoBox").innerText =
                        "Unable to get route.";
                      console.error("Initial direction load failed:", status);
                      
                      // If directions fail, just center on the clicked location
                      map.setCenter(place.geometry.location);
                      map.setZoom(16);
                    }
                  }
                );
              } else {
                // If no user marker, just center on the clicked location
                map.setCenter(place.geometry.location);
                map.setZoom(16);
              }
            });

            helpMarkers.push(marker);
          });
        }
      });
    });
  });
};

let panicCountdown;
let panicSeconds = 5;

window.startPanicCountdown = function() {
  panicSeconds = 5;
  document.getElementById("countdown").textContent = panicSeconds;
  document.getElementById("countdownModal").style.display = "flex";

  panicCountdown = setInterval(() => {
    panicSeconds--;
    document.getElementById("countdown").textContent = panicSeconds;

    if (panicSeconds <= 0) {
      clearInterval(panicCountdown);
      document.getElementById("countdownModal").style.display = "none";
      document.getElementById("alarmSound").play();
      sendAlert();
    }
  }, 1000);
};

window.cancelPanic = function() {
  clearInterval(panicCountdown);
  document.getElementById("countdownModal").style.display = "none";
  panicSeconds = 5;
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("/sw.js").then(
      function(registration) {
        console.log("Service Worker registered with scope:", registration.scope);
      },
      function(err) {
        console.log("Service Worker registration failed:", err);
      }
    );
  });
}

// Notification function
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} fade-in`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

// Add this function after the showNearbyHelpCenters function
window.clearDirections = function() {
  directionsRenderer.setDirections({routes: []});
  document.getElementById("infoBox").innerText = "";
  selectedHelpCenter = null;
  
  // Reset map to show all markers
  if (helpMarkers.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    helpMarkers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    if (userMarker) {
      bounds.extend(userMarker.getPosition());
    }
    map.fitBounds(bounds);
    map.setZoom(Math.min(map.getZoom(), 14));
  }
};
