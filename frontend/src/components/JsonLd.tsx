// FILE: frontend/src/components/JsonLd.tsx
import React from "react";

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: "Manchester United Football Club",
    alternateName: ["Man United", "Man Utd", "The Red Devils"],
    sport: "Soccer",
    url: "https://the-united-data.com",
    foundingDate: "1878",
    homeLocation: {
      "@type": "StadiumOrArena",
      name: "Old Trafford",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Sir Matt Busby Way",
        addressLocality: "Stretford, Manchester",
        postalCode: "M16 0RA",
        addressCountry: "GB",
      },
    },
    description:
      "Independent real-time statistics hub, matchday analytics, and 100-year historical database for Manchester United Football Club.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}