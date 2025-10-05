// TestAdvancedMarker.jsx
import React, { useEffect, useRef } from "react";

export default function TestAdvancedMarker() {
  const mapRef = useRef(null);

  useEffect(() => {
    let marker;
    (async () => {
      const KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "YOUR_API_KEY";
      if (!window.google) {
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&v=weekly`;
        s.async = true; s.defer = true;
        document.head.appendChild(s);
        await new Promise((r, e) => { s.onload = r; s.onerror = e; });
      }
      console.log("google loaded:", !!window.google, "marker lib present?", !!window.google.maps?.marker);

      const { Map } = await window.google.maps.importLibrary('maps');
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker');
      console.log("AdvancedMarkerElement:", !!AdvancedMarkerElement);

      const center = { lat: 28.9843847907343, lng: 77.70621702075009 };
      const map = new Map(mapRef.current, { center, zoom: 15, mapId: import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID" });

      // create container but also append a small visible copy to body so you can inspect styles
      const container = document.createElement('div');
      container.dataset.adv = "1";
      container.style.width = '28px'; container.style.height = '40px';
      container.style.background = 'red'; container.style.border = '2px solid white';
      container.style.borderRadius = '50% 50% 50% 0';
      container.style.transform = 'rotate(-45deg)';
      // append a **debug visual** copy to document for inspection (optional)
      const debugCopy = container.cloneNode(true);
      debugCopy.style.position = 'fixed'; debugCopy.style.left = '10px'; debugCopy.style.top = '10px'; document.body.appendChild(debugCopy);

      marker = new AdvancedMarkerElement({ map, position: center, content: container, title: "Test" });
      console.log("Advanced marker created:", marker, "marker.content:", marker.content);
    })().catch(console.error);

    return () => { if (marker) marker.map = null; };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "80vh" }} />;
}
