// AdvancedMarker.jsx
import React, { useEffect, useRef } from "react";

export default function AdvancedMarker({ map, position, children }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google?.maps?.marker) return;

    // Create a container div for your custom marker
    const container = document.createElement("div");
    container.style.width = "28px";
    container.style.height = "40px";
    container.style.background = "red";
    container.style.border = "2px solid white";
    container.style.borderRadius = "50% 50% 50% 0";
    container.style.transform = "rotate(-45deg) translate(-50%, -100%)";
    container.style.transformOrigin = "center bottom";
    container.style.boxSizing = "border-box";

    // Render children if any
    if (children) {
      container.appendChild(document.createElement("div"));
    }

    // Create the advanced marker and attach to the map
    markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      content: container,
      title: "Custom Marker",
    });

    return () => {
      if (markerRef.current) markerRef.current.map = null;
    };
  }, [map, position, children]);

  return null;
}
