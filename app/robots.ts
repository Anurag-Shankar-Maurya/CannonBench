import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://cannonbench.dev';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/benchmark'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
