const BASE_URL = "https://commonground-two.vercel.app";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CommonGround",
    url: BASE_URL,
    description:
      "AI-powered analysis of Congressional speeches, finding genuine common ground between parties.",
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

export function articleSchema({
  headline,
  datePublished,
  dateModified,
  description,
  url,
}: {
  headline: string;
  datePublished: string;
  dateModified: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    datePublished,
    dateModified,
    description,
    url: `${BASE_URL}${url}`,
    author: { "@type": "Organization", name: "CommonGround" },
    publisher: { "@type": "Organization", name: "CommonGround" },
  };
}
