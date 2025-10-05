// OverlayView.jsx (adjusted)
import React, { useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

const OverlayView = ({ position, pane = "overlayMouseTarget", map, zIndex = 100, children }) => {
  const container = useMemo(() => {
    const div = document.createElement("div");
    div.style.position = "absolute";
    return div;
  }, []);

  // Hold overlay instance in ref to keep stable across renders
  const overlayRef = React.useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps) return;
    if (!map) return;

    // Define Overlay class here -- after google maps is ready
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

    overlayRef.current = new Overlay(container, pane, position);
    overlayRef.current.setMap(map);

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [container, pane, position, map]);

  useEffect(() => {
    container.style.zIndex = zIndex.toString();
  }, [container, zIndex]);

  return createPortal(children, container);
};

export default OverlayView;
