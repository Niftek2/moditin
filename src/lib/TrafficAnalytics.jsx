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

    // Only track if there's something meaningful to record
    const hasData = utm_source || utm_medium || utm_campaign || referrer;
    if (!hasData) return;

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
  }, []);

  return null;
}