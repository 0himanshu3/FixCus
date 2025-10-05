// Overlay.js
export class Overlay extends window.google.maps.OverlayView {
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
    this.container.style.position = 'absolute';
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
