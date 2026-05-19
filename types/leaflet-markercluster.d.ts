import "leaflet";

declare module "leaflet" {
  interface MarkerClusterGroupOptions {
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    disableClusteringAtZoom?: number;
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    spiderfyOnEveryZoom?: boolean;
    animateAddingMarkers?: boolean;
  }

  interface MarkerClusterGroup extends LayerGroup {
    addLayer(layer: Layer): this;
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}
