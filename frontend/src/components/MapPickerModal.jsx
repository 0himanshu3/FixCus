import React, { useRef, useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPinIcon } from "@heroicons/react/24/outline";

const MapPickerModal = ({ show, onClose, location, onSelectLocation }) => {
  const modalRef = useRef(null);
  const [markerPos, setMarkerPos] = useState(location || { lat: 20.5937, lng: 78.9629 });

  // close modal when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (show && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [show, onClose]);

  if (!show) return null;

  const handleMapClick = (event) => {
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    const pos = { lat, lng };
    setMarkerPos(pos);

    // reverse geocode to get human-readable address
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: pos }, (results, status) => {
        if (status === "OK" && results[0]) {
          onSelectLocation(pos, results[0].formatted_address);
        } else {
          onSelectLocation(pos, `${lat}, ${lng}`);
        }
      });
    } else {
      onSelectLocation(pos, `${lat}, ${lng}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white w-[90%] md:w-2/3 h-[70%] rounded shadow-lg relative"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-100 px-2 py-1 rounded"
        >
          ✖
        </button>

        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}>
          <div style={{ width: "100%", height: "100%" }}>
            <Map
              defaultZoom={location ? 12 : 5}
              defaultCenter={markerPos}
              onClick={handleMapClick}
              mapId={import.meta.env.VITE_GOOGLE_MAP_ID} // optional if you have map style
            >
              <AdvancedMarker position={markerPos} />
            </Map>
          </div>
        </APIProvider>
      </div>
    </div>
  );
};

export default MapPickerModal;
