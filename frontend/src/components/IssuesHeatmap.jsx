import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";

const IssuesHeatmap = ({ show = false, onClose = () => {} }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef(null);
  const hoverTimeout = useRef(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/v1/issues/all", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch issues");
        const data = await res.json();
        setIssues(Array.isArray(data.issues) ? data.issues : []);
      } catch (e) {
        console.error(e);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const markers = useMemo(
    () =>
      issues
        .map((issue) => {
          try {
            if (
              !issue.issueLocation ||
              typeof issue.issueLocation !== "string" ||
              !issue.issueLocation.includes(",")
            )
              return null;
            const [lat, lng] = issue.issueLocation
              .split(",")
              .map((v) => parseFloat(v.trim()));
            if (
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              lat >= -90 &&
              lat <= 90 &&
              lng >= -180 &&
              lng <= 180
            ) {
              return {
                lat,
                lng,
                title: issue.title || "Issue",
                priority: issue.priority || "Low",
                status: issue.status || "Open",
                id: issue._id,
              };
            }
          } catch (_) {}
          return null;
        })
        .filter(Boolean),
    [issues]
  );

  const defaultCenter = useMemo(() => {
    if (markers.length > 0)
      return { lat: markers[0].lat, lng: markers[0].lng };
    return { lat: 20.5937, lng: 78.9629 };
  }, [markers]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#f97316";
      case "medium":
        return "#eab308";
      case "low":
        return "#22c55e";
      case "very low":
        return "#6b7280";
      default:
        return "#3b82f6";
    }
  };

  // --- FIX 1: stable hover without flicker
  const handleMouseEnter = (marker) => {
    clearTimeout(hoverTimeout.current);
    setHoveredMarker(marker);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoveredMarker(null);
    }, 200);
  };

  // --- FIX 2: heatmap that waits for map to load
  useEffect(() => {
    if (!mapReady || markers.length === 0) return;
    let heatmapLayer;

    const initHeatmap = async () => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;

      // dynamically import the visualization library
      const { HeatmapLayer } = await google.maps.importLibrary("visualization");

      const data = markers.map(
        (m) => new google.maps.LatLng(m.lat, m.lng)
      );

      heatmapLayer = new HeatmapLayer({
        data,
        dissipating: true,
        radius: 25,
        opacity: 0.6,
      });

      heatmapLayer.setMap(map);
    };

    initHeatmap();

    return () => {
      if (heatmapLayer) heatmapLayer.setMap(null);
    };
  }, [mapReady, markers]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="relative bg-white rounded-lg shadow-2xl w-[92%] md:w-[85%] lg:w-[80%] h-[85vh] border-4 border-purple-600 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 shadow"
        >
          Close
        </button>

        <APIProvider
          apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
          libraries={["visualization"]}
        >
          <Map
            ref={mapRef}
            defaultZoom={markers.length > 1 ? 5 : 12}
            defaultCenter={defaultCenter}
            mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
            style={{ width: "100%", height: "100%" }}
            onLoad={() => setMapReady(true)}
          >
            {markers.map((m) => (
              <AdvancedMarker
                key={m.id}
                position={{ lat: m.lat, lng: m.lng }}
                onMouseEnter={() => {
                  clearTimeout(window._hoverTimeout);
                  window._hoverTimeout = setTimeout(() => setHoveredMarker(m), 500);
                }}
                onMouseLeave={() => {
                  clearTimeout(window._hoverTimeout);
                  window._hoverTimeout = setTimeout(() => setHoveredMarker(null), 500);
                }}
              >
                <Pin
                  background={getPriorityColor(m.priority)}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                />
              </AdvancedMarker>
            ))}

            {hoveredMarker && (
              <InfoWindow
                position={{
                  lat: hoveredMarker.lat,
                  lng: hoveredMarker.lng,
                }}
              >
                <div style={{ minWidth: 80 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    {hoveredMarker.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#4B5563" }}>
                      Status:
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 9999,
                        backgroundColor:
                          hoveredMarker.status === "Resolved"
                            ? "#DCFCE7"
                            : hoveredMarker.status === "In Progress"
                            ? "#DBEAFE"
                            : "#F3F4F6",
                        color:
                          hoveredMarker.status === "Resolved"
                            ? "#166534"
                            : hoveredMarker.status === "In Progress"
                            ? "#1D4ED8"
                            : "#374151",
                      }}
                    >
                      {hoveredMarker.status}
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Legend */}
        <div className="absolute top-3 right-24 bg-white/90 backdrop-blur rounded-lg shadow p-3 z-20">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            Priority Legend
          </div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { color: "#dc2626", label: "Critical" },
              { color: "#f97316", label: "High" },
              { color: "#eab308", label: "Medium" },
              { color: "#22c55e", label: "Low" },
              { color: "#6b7280", label: "Very Low" },
            ].map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-2"
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: p.color,
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                ></span>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuesHeatmap;
