import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function TrafficAnalytics() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const utm_source = params.get("utm_source") || null;
    const utm_medium = params.get("utm_medium") || null;
    const utm_campaign = params.get("utm_campaign") || null;
    const utm_content = params.get("utm_content") || null;
    const referrer = document.referrer || null;
    const landing_page = window.location.pathname;

    const hasData = utm_source || utm_medium || utm_campaign || referrer;
    if (!hasData) return;

    // Fetch geo data then track
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(geo => {
        base44.analytics.track({
          eventName: "traffic_source",
          properties: {
            ...(utm_source && { utm_source }),
            ...(utm_medium && { utm_medium }),
            ...(utm_campaign && { utm_campaign }),
            ...(utm_content && { utm_content }),
            ...(referrer && { referrer }),
            landing_page,
            ...(geo.country_name && { country: geo.country_name }),
            ...(geo.region && { state: geo.region }),
            ...(geo.city && { city: geo.city }),
          },
        });
      })
      .catch(() => {
        // Fall back to tracking without geo
        base44.analytics.track({
          eventName: "traffic_source",
          properties: {
            ...(utm_source && { utm_source }),
            ...(utm_medium && { utm_medium }),
            ...(utm_campaign && { utm_campaign }),
            ...(utm_content && { utm_content }),
            ...(referrer && { referrer }),
            landing_page,
          },
        });
      });
  }, []);

  return null;
}