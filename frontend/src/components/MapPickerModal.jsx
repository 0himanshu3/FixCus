import React, { useRef, useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

const MapPickerModal = ({ show, onClose, location, onSelectLocation }) => {
  const modalRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  const [initialPos, setInitialPos] = useState(
    location || { lat: 20.5937, lng: 78.9629 }
  );

  useEffect(() => {
    if (show && mapContainerRef.current && window.google) {
      // Initialize map if it doesn't exist
      if (!mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(
          mapContainerRef.current,
          {
            center: initialPos,
            zoom: location ? 15 : 5,
            mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
            disableDefaultUI: true,
            gestureHandling: "greedy",
          }
        );

        // Initialize marker
        markerInstance.current = new window.google.maps.Marker({
          position: initialPos,
          map: mapInstance.current,
        });

        // Add click listener to the map
        mapInstance.current.addListener("click", (e) => {
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          processLocation(pos);
        });
      }
    }
  }, [show, initialPos, location]); 

  // Close modal when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (show && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [show, onClose]);

  const extractAddressComponents = (components = []) => {
    let district = "",
      state = "",
      country = "";
    components.forEach((c) => {
      if (c.types.includes("administrative_area_level_2"))
        district = c.long_name;
      if (c.types.includes("administrative_area_level_1")) state = c.long_name;
      if (c.types.includes("country")) country = c.long_name;
    });
    return { district, state, country };
  };

  const processLocation = (pos) => {
    if (markerInstance.current) {
      markerInstance.current.setPosition(pos);
    }

    if (!window.google || !window.google.maps) {
      onSelectLocation({ ...pos, formattedAddress: `${pos.lat}, ${pos.lng}` });
      onClose();
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      let locationData;
      if (status === "OK" && results[0]) {
        const formattedAddress = results[0].formatted_address;
        const { district, state, country } = extractAddressComponents(
          results[0].address_components
        );
        locationData = { ...pos, formattedAddress, district, state, country };
      } else {
        locationData = { ...pos, formattedAddress: `${pos.lat}, ${pos.lng}` };
      }
      onSelectLocation(locationData);
      onClose();
    });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (mapInstance.current) {
            mapInstance.current.panTo(pos);
            mapInstance.current.setZoom(15);
          }

          processLocation(pos);
        },
        () => {
          toast.error("Could not get your location. Please enable location services.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white w-[90%] md:w-2/3 h-[70%] rounded-lg shadow-2xl relative border-4 border-purple-500 overflow-hidden">
        {/* Map container*/}
        <div ref={mapContainerRef} className="w-full h-full" />
        <button
          onClick={handleGetCurrentLocation}
          className="absolute bottom-4 right-4 z-10 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-2 border border-purple-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          Current Location
        </button>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white w-8 h-8 flex items-center justify-center rounded-full shadow-lg text-lg font-bold text-purple-700 hover:bg-gray-100">
          &times;
        </button>
      </div>
    </div>
  );
};

export default MapPickerModal;
