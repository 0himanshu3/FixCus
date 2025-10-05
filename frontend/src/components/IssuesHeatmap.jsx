// IssuesHeatmap.jsx
import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';

const HeatmapLayer = ({ points, styleConfig }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (layerRef.current) {
      try { map.removeLayer(layerRef.current); } catch (e) { /* ignore */ }
      layerRef.current = null;
    }

    if (points && points.length > 0) {
      const heatLayer = L.heatLayer(points, {
        radius: styleConfig.radius,
        blur: styleConfig.blur,
        maxZoom: styleConfig.maxZoom,
        max: styleConfig.max,
        minOpacity: styleConfig.minOpacity,
        gradient: styleConfig.gradient,
      }).addTo(map);

      layerRef.current = heatLayer;
    }

    return () => {
      if (layerRef.current) {
        try { map.removeLayer(layerRef.current); } catch (e) { /* ignore */ }
        layerRef.current = null;
      }
    };
  }, [points, map, styleConfig]);

  useEffect(() => {
    if (!map) return;
    setTimeout(() => {
      try { map.invalidateSize(); } catch (e) { /* ignore */ }
    }, 0);
  }, [map]);

  return null;
};

const IssuesHeatmap = ({ issues }) => {
  // style config — tweak these numbers to taste
  const styleConfig = useMemo(() => ({
    radius: 40,
    blur: 30,
    maxZoom: 18,
    max: 3.0,
    minOpacity: 0.25,
    gradient: {
      0.0: 'navy',
      0.2: 'blue',
      0.4: 'cyan',
      0.6: 'lime',
      0.8: 'yellow',
      1.0: 'red'
    }
  }), []);

  // Build heat points. We'll boost weights so single points show stronger.
  const heatPoints = useMemo(() => {
    if (!issues) return [];

    const scale = 2.0;

    return issues
      .map(issue => {
        try {
          if (!issue.issueLocation || typeof issue.issueLocation !== 'string' || !issue.issueLocation.includes(',')) return null;
          const [lat, lng] = issue.issueLocation.split(',').map(c => parseFloat(c.trim()));
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const weight = (issue.severity && !isNaN(issue.severity)) ? Math.min(styleConfig.max, issue.severity * scale) : 1.0 * scale;
            return [lat, lng, weight];
          }
        } catch (err) {
          console.error('Parsing coords error for issue', issue._id, err);
        }
        return null;
      })
      .filter(Boolean);
  }, [issues, styleConfig.max]);

  // IMPORTANT: compute bounds with useMemo BEFORE any early return so hooks order stays stable
  const bounds = useMemo(() => {
    if (!heatPoints || heatPoints.length === 0) return null;
    const latlngs = heatPoints.map(p => [p[0], p[1]]);
    try {
      return L.latLngBounds(latlngs);
    } catch {
      return null;
    }
  }, [heatPoints]);

  // Early return if no points (hooks above have already run)
  if (!heatPoints || heatPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-100 border-gray-300 rounded-lg">
        <p className="text-gray-600">No issues with valid coordinates to display on the heatmap.</p>
      </div>
    );
  }

  return (
    <div className="map-host" style={{ width: "100%", height: "80vh", borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer
        center={[23.2599, 77.4126]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        minZoom={3}
        maxZoom={18}
        whenCreated={(map) => {
          setTimeout(() => {
            try {
              map.invalidateSize();
              if (bounds && bounds.isValid()) {
                map.fitBounds(bounds.pad(0.2), { maxZoom: 12, animate: true });
              }
            } catch (e) { /* ignore */ }
          }, 0);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <HeatmapLayer points={heatPoints} styleConfig={styleConfig} />
      </MapContainer>
    </div>
  );
};

export default IssuesHeatmap;



// import React, { useEffect, useRef, useState } from "react";
// import ReactDOM from "react-dom";

// const useLoadGoogleMapsAPI = () => {
//   const [loaded, setLoaded] = useState(false);

//   useEffect(() => {
//     if (window.google && window.google.maps) {
//       setLoaded(true);
//       return;
//     }
//     const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
//     if (existingScript) {
//       existingScript.addEventListener("load", () => setLoaded(true));
//       return;
//     }
//     const script = document.createElement("script");
//     script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`;
//     script.async = true;
//     script.defer = true;
//     script.onload = () => setLoaded(true);
//     document.head.appendChild(script);
//   }, []);

//   return loaded;
// };

// const OverlayView = ({ position, pane = "overlayMouseTarget", map, children, zIndex = 100 }) => {
//   const containerRef = useRef(document.createElement("div"));
//   const overlayRef = useRef(null);

//   useEffect(() => {
//     if (!map || !window.google || !window.google.maps) return;

//     class Overlay extends window.google.maps.OverlayView {
//       constructor(container, pane, position) {
//         super();
//         this.container = container;
//         this.pane = pane;
//         this.position = position;
//       }

//       onAdd() {
//         const panes = this.getPanes();
//         if (panes && panes[this.pane]) {
//           panes[this.pane].appendChild(this.container);
//         }
//       }

//       draw() {
//         const projection = this.getProjection();
//         if (!projection) return;

//         const point = projection.fromLatLngToDivPixel(
//           new window.google.maps.LatLng(this.position.lat, this.position.lng)
//         );
//         if (!point) return;

//         this.container.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
//         this.container.style.position = "absolute";
//       }

//       onRemove() {
//         if (this.container.parentNode) {
//           this.container.parentNode.removeChild(this.container);
//         }
//       }

//       setPosition(position) {
//         this.position = position;
//         this.draw();
//       }
//     }

//     if (overlayRef.current) {
//       overlayRef.current.setMap(null);
//       overlayRef.current = null;
//     }

//     overlayRef.current = new Overlay(containerRef.current, pane, position);
//     overlayRef.current.setMap(map);

//     return () => {
//       if (overlayRef.current) {
//         overlayRef.current.setMap(null);
//         overlayRef.current = null;
//       }
//     };
//   }, [map, position, pane]);

//   useEffect(() => {
//     containerRef.current.style.zIndex = zIndex.toString();
//   }, [zIndex]);

//   return ReactDOM.createPortal(children, containerRef.current);
// };

// const IssuesHeatmap = ({ location }) => {
//   const mapRef = useRef(null);
//   const apiLoaded = useLoadGoogleMapsAPI();

//   useEffect(() => {
//     if (!apiLoaded) return;
//     if (mapRef.current) return;

//     if (!location || !location.lat || !location.lng) return;

//     const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
//       center: location,
//       zoom: 12,
//       mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
//     });

//     mapRef.current = mapInstance;
//   }, [apiLoaded, location]);

//   if (!location) return <div>Please provide location</div>;

//   return (
//     <>
//       <div id="map" style={{ width: "100%", height: "100%" }} />
//       {apiLoaded && mapRef.current && (
//         <OverlayView position={location} map={mapRef.current} pane="overlayMouseTarget" zIndex={100}>
//           <div
//             style={{
//               backgroundColor: "red",
//               borderRadius: "50%",
//               width: 30,
//               height: 30,
//               boxShadow: "0 0 5px rgba(0,0,0,0.5)",
//               color: "white",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               fontWeight: "bold",
//             }}
//           >
//             M
//           </div>
//         </OverlayView>
//       )}
//     </>
//   );
// };

// export default IssuesHeatmap;