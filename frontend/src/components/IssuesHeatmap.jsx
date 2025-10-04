import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Marker, Pin, CollisionBehavior } from "@vis.gl/react-google-maps";

const IssuesHeatmap = ({ issues }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Filter valid coordinates
  const validIssues = issues.filter(issue => 
    issue.issueLocation && 
    typeof issue.issueLocation === 'string' && 
    issue.issueLocation.includes(',')
  );

  // Parse coordinates
  const issueLocations = validIssues.map((issue) => {
    try {
      const [lat, lng] = issue.issueLocation.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, issue };
      }
    } catch (error) {
      console.error("Error parsing coordinates for issue:", issue._id, error);
    }
    return null;
  }).filter(Boolean);

  console.log("=== DEBUG INFO ===");
  console.log("Total issues:", issues.length);
  console.log("Valid issues:", validIssues.length);
  console.log("Issue locations:", issueLocations);
  console.log("Map loaded:", mapLoaded);
  console.log("Google Maps available:", !!window.google);
  console.log("==================");

  useEffect(() => {
    setDebugInfo(`
      Total Issues: ${issues.length}
      Valid Issues: ${validIssues.length}
      Parsed Locations: ${issueLocations.length}
      Map Loaded: ${mapLoaded}
      Google Maps: ${!!window.google}
    `);
  }, [issues.length, validIssues.length, issueLocations.length, mapLoaded]);

  // Fallback to set map as loaded after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapLoaded && window.google) {
        console.log("Map load timeout - setting as loaded");
        setMapLoaded(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [mapLoaded]);

  if (!validIssues.length) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-100 border border-gray-300 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No issues with valid coordinates found</p>
          <div className="text-xs text-gray-500 whitespace-pre-line">{debugInfo}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Debug Info */}
      <div className="absolute top-4 left-4 bg-yellow-100 p-3 rounded-lg shadow-md z-20 text-xs max-w-xs">
        <div className="font-semibold mb-2">Debug Info</div>
        <div className="whitespace-pre-line">{debugInfo}</div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md z-20 text-sm">
        <div className="font-semibold mb-2">Priority Legend</div>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white mr-2"></div>
            Critical
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white mr-2"></div>
            High
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white mr-2"></div>
            Medium
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white mr-2"></div>
            Low
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 border-2 border-white mr-2"></div>
            Very Low
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Showing {validIssues.length} issues
        </div>
      </div>

      {/* Map Container */}
      <div style={{ className:"map-host", width: "100%", height: "80vh", borderRadius: "8px" }}>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
            libraries={['marker', 'visualization']}>
           <Map
             defaultZoom={6}
             defaultCenter={{ lat: 23.2599, lng: 77.4126 }}
             mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
             gestureHandling="greedy"
             minZoom={3}
             maxZoom={18}
             mapTypeControl={true}
             zoomControl={true}
             streetViewControl={false}
             fullscreenControl={true}
             onLoad={() => {
               console.log("Map loaded successfully!");
               setMapLoaded(true);
             }}
             
           >
            {/* Test with simple markers first */}
             {issueLocations.map(({ lat, lng, issue }, index) => {
               console.log(`Rendering marker ${index}:`, { lat, lng, title: issue.title });
               
               const getPriorityColor = (priority) => {
                 switch (priority?.toLowerCase()) {
                   case 'critical': return '#ef4444';
                   case 'high': return '#f59e0b';
                   case 'medium': return '#eab308';
                   case 'low': return '#22c55e';
                   case 'very low': return '#6b7280';
                   default: return '#3b82f6';
                 }
               };

               return (
                 <AdvancedMarker 
                   key={issue._id || index} 
                   position={{ lat: Number(lat), lng: Number(lng) }}
                       title={issue.title}
                    //    collisionBehavior={CollisionBehavior.REQUIRED}
                 >
                   <Pin background="#ef4444" borderColor="#ffffff" glyphColor="#ffffff" />

                 </AdvancedMarker>
               );
             })}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
};

export default IssuesHeatmap;