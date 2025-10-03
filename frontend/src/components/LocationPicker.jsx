//!uses gmp-map instead of classic google maps. places api working fine and map is visible but not clickable
import React, { useState, useRef, useEffect } from "react";
import MapPickerModal from "./MapPickerModal"; // separate modal component

const LocationPicker = ({ location, setLocation }) => {
  const [inputValue, setInputValue] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  //Places Autocomplete
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places && !autocompleteRef.current) {
        const input = document.getElementById("location-input");
        if (input) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
            fields: ["geometry", "formatted_address"],
          });

          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              setLocation({ lat, lng });
              setInputValue(place.formatted_address || "");
            }
          });

          clearInterval(interval);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [setLocation]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <input
          id="location-input"
          type="text"
          placeholder="Enter your native location"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShowMapModal(true)}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          🗺️
        </button>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <MapPickerModal
          show={showMapModal}
          onClose={() => setShowMapModal(false)}
          location={location}
          onSelectLocation={(pos, address) => {
            setLocation(pos);
            if (address) setInputValue(address);
          }}
        />

      )}
    </div>
  );
};

export default LocationPicker;