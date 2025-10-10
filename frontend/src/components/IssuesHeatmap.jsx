// import React, { useEffect, useMemo, useState, useRef } from "react";
// import {
//   APIProvider,
//   Map,
//   useMap,
//   AdvancedMarker,
//   Pin,
// } from "@vis.gl/react-google-maps";
// import { MarkerClusterer } from "@googlemaps/markerclusterer";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";

// // A separate component for the custom, flicker-free tooltip
// const CustomTooltip = ({ tooltipData }) => {
//   if (!tooltipData) return null;
//   const { title, status, x, y } = tooltipData;

//   return (
//     <div
//       className="absolute bg-white rounded-lg shadow-lg p-3 text-sm z-50 pointer-events-none transition-opacity duration-200"
//       style={{ top: y, left: x, transform: 'translate(10px, -100%)' }}
//     >
//       <div className="font-bold text-gray-800 mb-1">{title}</div>
//       <div className="flex items-center gap-2">
//         <span className="text-xs text-gray-600">Status:</span>
//         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
//           ${status === "Resolved" ? "bg-green-100 text-green-800" :
//           status === "In Progress" ? "bg-blue-100 text-blue-800" :
//           "bg-gray-100 text-gray-800"}`}>
//           {status}
//         </span>
//       </div>
//     </div>
//   );
// };

// // Component to handle the heatmap layer
// const Heatmap = ({ data }) => {
//   const map = useMap();
//   useEffect(() => {
//     if (!map) return;
//     const init = async () => {
//       const { HeatmapLayer } = await google.maps.importLibrary("visualization");
//       const heatmap = new HeatmapLayer({
//         data: data.map(item => ({ location: new google.maps.LatLng(item.lat, item.lng), weight: item.weight })),
//         map: map,
//         radius: 40,
//         opacity: 0.8,
//         gradient: ["rgba(107, 114, 128, 0)", "#6b7280", "#22c55e", "#eab308", "#f97316", "#dc2626"]
//       });
//       return () => heatmap.setMap(null);
//     };
//     init();
//   }, [map, data]);
//   return null;
// };

// // Component to handle Marker Clustering
// const Clusters = ({ markers, onMarkerEnter, onMarkerLeave }) => {
//   const map = useMap();
//   const clusterer = useRef(null);

//   useEffect(() => {
//     if (!map || !markers.length) return;
    
//     // Initialize clusterer
//     if (!clusterer.current) {
//         clusterer.current = new MarkerClusterer({ map });
//     }
    
//     // Create Google Maps markers from our data
//     const googleMarkers = markers.map(markerData => {
//         const marker = new google.maps.Marker({ position: { lat: markerData.lat, lng: markerData.lng }});
//         marker.addListener("mouseover", (e) => onMarkerEnter(markerData, e));
//         marker.addListener("mouseout", () => onMarkerLeave());
//         marker.addListener("click", () => onMarkerClick(markerData));
//         return marker;
//     });

//     clusterer.current.clearMarkers();
//     clusterer.current.addMarkers(googleMarkers);
    
//     return () => {
//         // Cleanup when component unmounts or markers change
//         if (clusterer.current) {
//             clusterer.current.clearMarkers();
//         }
//     };
//   }, [map, markers, onMarkerEnter, onMarkerLeave]);

//   return null;
// };


// const IssuesHeatmap = ({ show = false, onClose = () => {} }) => {
//   const [issues, setIssues] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [tooltip, setTooltip] = useState(null);
//   const [mapView, setMapView] = useState('heatmap');
//   const { user } = useSelector((state) => state.auth);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchIssues = async () => {
//       try {
//         const res = await fetch("http://localhost:3000/api/v1/issues/all", {
//           method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
//         });
//         if (!res.ok) throw new Error("Failed to fetch issues");
//         const data = await res.json();
//         setIssues(Array.isArray(data.issues) ? data.issues : []);
//       } catch (e) {
//         console.error(e);
//         setIssues([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (show) fetchIssues();
//   }, [show]);

//   const filteredIssues = useMemo(() => {
//     if (!user || !issues) return [];

//     if (user.role === 'Municipality Admin') {
//       return issues.filter(issue =>
//         issue.issueDistrict === user.district &&
//         issue.category === user.division
//       );
//     }
//     // For all other roles, show all issues
//     return issues;
//   }, [issues, user]);
  
//   const priorityWeights = { "Critical": 5, "High": 4, "Medium": 3, "Low": 2, "Very Low": 1 };

//   const markers = useMemo(() => filteredIssues.map(issue => {
//     try {
//       if (!issue.issueLocation || typeof issue.issueLocation !== "string" || !issue.issueLocation.includes(",")) return null;
//       const [lat, lng] = issue.issueLocation.split(",").map(v => parseFloat(v.trim()));
//       if (Number.isFinite(lat) && Number.isFinite(lng)) {
//         return {
//           lat, lng,
//           title: issue.title || "Issue",
//           priority: issue.priority || "Low",
//           status: issue.status || "Open",
//           id: issue._id,
//           slug: issue.slug,
//           weight: priorityWeights[issue.priority] || 1,
//         };
//       }
//     } catch (_) {}
//     return null;
//   }).filter(Boolean), [filteredIssues]);
  

//   // const markers = useMemo(() => issues.map(issue => {
//   //   try {
//   //     if (!issue.issueLocation || typeof issue.issueLocation !== "string" || !issue.issueLocation.includes(",")) return null;
//   //     const [lat, lng] = issue.issueLocation.split(",").map(v => parseFloat(v.trim()));
//   //     if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
//   //       return {
//   //         lat, lng,
//   //         title: issue.title || "Issue",
//   //         priority: issue.priority || "Low",
//   //         status: issue.status || "Open",
//   //         id: issue._id,
//   //         weight: priorityWeights[issue.priority] || 1,
//   //       };
//   //     }
//   //   } catch (_) {}
//   //   return null;
//   // }).filter(Boolean), [issues]);

//   const defaultCenter = useMemo(() => {
//     if (markers.length > 0) return { lat: markers[0].lat, lng: markers[0].lng };
//     return { lat: 20.5937, lng: 78.9629 };
//   }, [markers]);

//   const getPriorityColor = (priority) => {
//     switch (priority?.toLowerCase()) {
//       case "critical": return "#dc2626";
//       case "high": return "#f97316";
//       case "medium": return "#eab308";
//       case "low": return "#22c55e";
//       case "very low": return "#6b7280";
//       default: return "#3b82f6";
//     }
//   };

//   const handleMarkerEnter = (marker, event) => {
//     // For native google maps events (from clusterer), we use domEvent
//     const clientX = event?.domEvent?.clientX || event?.clientX || 0;
//     const clientY = event?.domEvent?.clientY || event?.clientY || 0;

//     setTooltip({
//       title: marker.title,
//       status: marker.status,
//       x: clientX,
//       y: clientY,
//     });
//   };

//   const handleMarkerLeave = () => {
//     setTooltip(null);
//   };

//   const handleMarkerClick = (marker) => {
//     if (marker.slug) {
//         console.log("marker clicked")
//         navigate(`/issue/${marker.slug}`);
//     }
//   };

//   if (!show) return null;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
//       onClick={onClose}>
//       <div
//         className="relative bg-white rounded-lg shadow-2xl w-[92%] md:w-[85%] lg:w-[80%] h-[85vh] border-4 border-purple-600 overflow-hidden"
//         onClick={(e) => e.stopPropagation()}>
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 shadow">
//           Close
//         </button>

//         <APIProvider
//           apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
//           libraries={["visualization", "marker"]}>
//           <Map
//             defaultZoom={markers.length > 1 ? 5 : 12}
//             defaultCenter={defaultCenter}
//             mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
//             style={{ width: "100%", height: "100%" }}
//             gestureHandling={"greedy"}
//             disableDefaultUI={true}>
//             {mapView === "heatmap" && <Heatmap data={markers} />}
//             {mapView === "cluster" && (
//               <Clusters
//                 markers={markers}
//                 onMarkerEnter={handleMarkerEnter}
//                 onMarkerLeave={handleMarkerLeave}
//               />
//             )}
//             {mapView === "markers" &&
//               markers.map((m) => (
//                 <AdvancedMarker
//                   key={m.id}
//                   position={m}
//                   onMouseEnter={(e) => handleMarkerEnter(m, e)}
//                   onMouseLeave={handleMarkerLeave}
//                   onClick={() => handleMarkerClick(m)}>
//                   <Pin
//                     background={getPriorityColor(m.priority)}
//                     borderColor="#ffffff"
//                     glyphColor="#ffffff"
//                   />
//                 </AdvancedMarker>
//               ))}
//           </Map>
//         </APIProvider>

//         <CustomTooltip tooltipData={tooltip} />

//         <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow p-1 z-20 flex items-center gap-1">
//           <button
//             onClick={() => setMapView("heatmap")}
//             className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
//               mapView === "heatmap"
//                 ? "bg-purple-600 text-white"
//                 : "bg-transparent text-gray-700 hover:bg-gray-100"
//             }`}>
//             Heatmap
//           </button>
//           <button
//             onClick={() => setMapView("markers")}
//             className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
//               mapView === "markers"
//                 ? "bg-purple-600 text-white"
//                 : "bg-transparent text-gray-700 hover:bg-gray-100"
//             }`}>
//             Markers
//           </button>
//           <button
//             onClick={() => setMapView("cluster")}
//             className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
//               mapView === "cluster"
//                 ? "bg-purple-600 text-white"
//                 : "bg-transparent text-gray-700 hover:bg-gray-100"
//             }`}>
//             Clusters
//           </button>
//         </div>

//         <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow p-3 z-20">
//           <div className="text-sm font-semibold text-gray-800 mb-2">
//             Priority Legend
//           </div>
//           <div className="flex flex-col gap-1 text-xs">
//             {[
//               { color: "#dc2626", label: "Critical" },
//               { color: "#f97316", label: "High" },
//               { color: "#eab308", label: "Medium" },
//               { color: "#22c55e", label: "Low" },
//               { color: "#6b7280", label: "Very Low" },
//             ].map((p) => (
//               <div key={p.label} className="flex items-center gap-2">
//                 <span
//                   style={{
//                     width: 10,
//                     height: 10,
//                     background: p.color,
//                     display: "inline-block",
//                     borderRadius: 2,
//                   }}></span>
//                 {p.label}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IssuesHeatmap;


import React, { useEffect, useMemo, useState, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Component to handle the heatmap layer
const Heatmap = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    let heatmap;
    const init = async () => {
      const { HeatmapLayer } = await window.google.maps.importLibrary("visualization");
      heatmap = new HeatmapLayer({
        data: data.map(item => ({ location: new window.google.maps.LatLng(item.lat, item.lng), weight: item.weight })),
        map: map,
        radius: 40,
        opacity: 0.8,
        gradient: ["rgba(107, 114, 128, 0)", "#6b7280", "#22c55e", "#eab308", "#f97316", "#dc2626"]
      });
    };
    init();
    return () => {
      if (heatmap) heatmap.setMap(null);
    };
  }, [map, data]);
  return null;
};

// Component for rendering individual markers using the native API to ensure clicks are reliable
const Markers = ({ markers, onMarkerClick, getPriorityColor }) => {
  const map = useMap();
  const [googleMarkers, setGoogleMarkers] = useState([]);

  useEffect(() => {
    if (!map) return;
    
    // Clean up old markers
    googleMarkers.forEach(marker => marker.setMap(null));

    // Create new Google Maps markers from our data
    const newMarkers = markers.map(markerData => {
        const marker = new window.google.maps.Marker({
            position: markerData.position,
            map: map,
            title: markerData.title,
            
            // Create a custom SVG icon for the pin and color it dynamically
            icon: {
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
              fillColor: getPriorityColor(markerData.priority), // Use the priority color
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#ffffff', // White border for contrast
              rotation: 0,
              scale: 1.5,
              anchor: new window.google.maps.Point(12, 24),
            },
        });
        marker.addListener("click", () => onMarkerClick(markerData));
        return marker;
    });
    
    setGoogleMarkers(newMarkers);

  }, [map, markers, onMarkerClick, getPriorityColor]);

  return null;
};

// Component to handle Marker Clustering
const Clusters = ({ markers, onMarkerClick }) => {
  const map = useMap();
  const clusterer = useRef(null);

  useEffect(() => {
    if (!map) return;
    
    if (!clusterer.current) {
        clusterer.current = new MarkerClusterer({ map });
    }
    
    const googleMarkers = markers.map(markerData => {
        const marker = new window.google.maps.Marker({ position: markerData.position });
        marker.addListener("click", () => onMarkerClick(markerData));
        return marker;
    });

    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(googleMarkers);
    
  }, [map, markers, onMarkerClick]);

  return null;
};

const IssuesHeatmap = ({ show = false, onClose = () => {} }) => {
  const [issues, setIssues] = useState([]);
  const [mapView, setMapView] = useState('heatmap');
  
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/v1/issues/all", {
          method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch issues");
        const data = await res.json();
        setIssues(Array.isArray(data.issues) ? data.issues : []);
      } catch (e) {
        console.error(e);
        setIssues([]);
      }
    };
    if (show) fetchIssues();
  }, [show]);
  
  const filteredIssues = useMemo(() => {
    if (!user || !issues) return [];

    if (user.role === 'Municipality Admin') {
      return issues.filter(issue => 
        issue.issueDistrict === user.district && 
        issue.category === user.division
      );
    }
    return issues;
  }, [issues, user]);

  const priorityWeights = { "Critical": 5, "High": 4, "Medium": 3, "Low": 2, "Very Low": 1 };

  const markers = useMemo(() => filteredIssues.map(issue => {
    try {
      if (!issue.issueLocation || typeof issue.issueLocation !== "string" || !issue.issueLocation.includes(",")) return null;
      const [lat, lng] = issue.issueLocation.split(",").map(v => parseFloat(v.trim()));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          position: { lat, lng }, // Use 'position' for consistency
          title: issue.title || "Issue",
          priority: issue.priority || "Low",
          status: issue.status || "Open",
          id: issue._id,
          slug: issue.slug,
          weight: priorityWeights[issue.priority] || 1,
        };
      }
    } catch (_) {}
    return null;
  }).filter(Boolean), [filteredIssues]);

  const defaultCenter = useMemo(() => {
    if (markers.length > 0) return markers[0].position;
    return { lat: 20.5937, lng: 78.9629 };
  }, [markers]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical": return "#dc2626";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#22c55e";
      case "very low": return "#6b7280";
      default: return "#3b82f6";
    }
  };

  const handleMarkerClick = (marker) => {
    if (marker.slug) {
        navigate(`/issue/${marker.slug}`);
        onClose(); // Close modal on navigation
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="relative bg-white rounded-lg shadow-2xl w-[92%] md:w-[85%] lg:w-[80%] h-[85vh] border-4 border-purple-600 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 shadow">
          Close
        </button>

        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY} libraries={["visualization", "marker"]}>
          <Map
            defaultZoom={markers.length > 1 ? 5 : 12}
            defaultCenter={defaultCenter}
            mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
            style={{ width: "100%", height: "100%" }}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
          >
            {mapView === 'heatmap' && <Heatmap data={markers.map(m => ({ ...m.position, weight: m.weight }))} />}
            {mapView === 'cluster' && <Clusters markers={markers} onMarkerClick={handleMarkerClick} />}
            {mapView === 'markers' && <Markers markers={markers} onMarkerClick={handleMarkerClick} getPriorityColor={getPriorityColor} />}
          </Map>
        </APIProvider>

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow p-1 z-20 flex items-center gap-1">
          <button onClick={() => setMapView('heatmap')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${mapView === 'heatmap' ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}>Heatmap</button>
          <button onClick={() => setMapView('markers')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${mapView === 'markers' ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}>Markers</button>
          <button onClick={() => setMapView('cluster')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${mapView === 'cluster' ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}>Clusters</button>
        </div>

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow p-3 z-20">
            <div className="text-sm font-semibold text-gray-800 mb-2">Priority Legend</div>
            <div className="flex flex-col gap-1 text-xs">
                {[{ color: "#dc2626", label: "Critical" }, { color: "#f97316", label: "High" }, { color: "#eab308", label: "Medium" }, { color: "#22c55e", label: "Low" }, { color: "#6b7280", label: "Very Low" }].map((p) => (<div key={p.label} className="flex items-center gap-2"><span style={{ width: 10, height: 10, background: p.color, display: 'inline-block', borderRadius: 2 }}></span>{p.label}</div>))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default IssuesHeatmap;