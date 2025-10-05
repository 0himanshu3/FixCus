import React from "react";
import { useLocation } from "react-router-dom";
import IssuesHeatmap from "../components/IssuesHeatmap";
import ErrorBoundary from "../components/ErrorBoundary";

export default function IssuesHeatmapPage() {
  const location = useLocation();
  const issueLocation = {
    lat: 28.9843847907343,
    lng: 77.70621702075009,
  };

  return (
    <ErrorBoundary>
      <div className="w-full h-screen">
        <IssuesHeatmap location={issueLocation} />
      </div>
    </ErrorBoundary>
  );
}
