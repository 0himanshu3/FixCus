import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const useLoadGoogleMapsAPI = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => setLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  return loaded;
};

const OverlayView = ({ position, pane = "overlayMouseTarget", map, children, zIndex = 100 }) => {
  const containerRef = useRef(document.createElement("div"));
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    class Overlay extends window.google.maps.OverlayView {
      constructor(container, pane, position) {
        super();
        this.container = container;
        this.pane = pane;
        this.position = position;
      }

      onAdd() {
        const panes = this.getPanes();
        if (panes && panes[this.pane]) {
          panes[this.pane].appendChild(this.container);
        }
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;

        const point = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(this.position.lat, this.position.lng)
        );
        if (!point) return;

        this.container.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
        this.container.style.position = "absolute";
      }

      onRemove() {
        if (this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
      }

      setPosition(position) {
        this.position = position;
        this.draw();
      }
    }

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    overlayRef.current = new Overlay(containerRef.current, pane, position);
    overlayRef.current.setMap(map);

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, position, pane]);

  useEffect(() => {
    containerRef.current.style.zIndex = zIndex.toString();
  }, [zIndex]);

  return ReactDOM.createPortal(children, containerRef.current);
};

const IssuesHeatmap = ({ location }) => {
  const mapRef = useRef(null);
  const apiLoaded = useLoadGoogleMapsAPI();

  useEffect(() => {
    if (!apiLoaded) return;
    if (mapRef.current) return;

    if (!location || !location.lat || !location.lng) return;

    const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
      center: location,
      zoom: 12,
      mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
    });

    mapRef.current = mapInstance;
  }, [apiLoaded, location]);

  if (!location) return <div>Please provide location</div>;

  return (
    <>
      <div id="map" style={{ width: "100%", height: "100%" }} />
      {apiLoaded && mapRef.current && (
        <OverlayView position={location} map={mapRef.current} pane="overlayMouseTarget" zIndex={100}>
          <div
            style={{
              backgroundColor: "red",
              borderRadius: "50%",
              width: 30,
              height: 30,
              boxShadow: "0 0 5px rgba(0,0,0,0.5)",
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
            }}
          >
            M
          </div>
        </OverlayView>
      )}
    </>
  );
};

export default IssuesHeatmap;
