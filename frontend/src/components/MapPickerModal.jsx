//! this is gmp map extension not classic google map
//!TODO: fix this back to classic map
import React, { useEffect, useRef } from "react";

const MapPickerModal = ({ show, onClose, location, onSelectLocation }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("gmp-script")) {
      const script = document.createElement("script");
      script.id = "gmp-script";
      script.type = "module";
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=" +
        import.meta.env.VITE_GOOGLE_PLACES_API_KEY +
        "&libraries=maps,marker&v=beta&callback=console.debug";
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (show && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [show, onClose]);

  // Map click handler
  const handleMapClick = (event) => {
  if (!event?.detail?.position) return;

  const { lat, lng } = event.detail.position;
  const pos = { lat, lng };

  // Reverse geocode
  if (window.google && window.google.maps) {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === "OK" && results[0]) {
        onSelectLocation(pos, results[0].formatted_address);
      } else {
        onSelectLocation(pos, `${lat}, ${lng}`);
      }
      onClose();
    });
  } else {
    onSelectLocation(pos, `${lat}, ${lng}`);
    onClose();
  }
};

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white w-[90%] md:w-2/3 h-[70%] rounded shadow-lg relative"
      >

        <gmp-map
          center={location || { lat: 20.5937, lng: 68.9629 }}
          zoom={location ? 12 : 5}
          style={{ width: "100%", height: "100%" }}
          map-id="DEMO_MAP_ID"
          onClick={handleMapClick}
        ></gmp-map>
      </div>
    </div>
  );
};

export default MapPickerModal;
