import React from 'react';

export default function Head() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Standard favicons */}
      <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="48x48" href="/favicon/favicon-48x48.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/favicon/favicon-96x96.png" />

      {/* Apple Touch Icons */}
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon-180x180.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/favicon/apple-touch-icon-167x167.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/favicon/apple-touch-icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="144x144" href="/favicon/apple-touch-icon-144x144.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/favicon/apple-touch-icon-120x120.png" />
      <link rel="apple-touch-icon" sizes="114x114" href="/favicon/apple-touch-icon-114x114.png" />

      {/* PWA manifest */}
      <link rel="manifest" href="/favicon/site.webmanifest" />

      {/* Microsoft tiles */}
      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="msapplication-TileImage" content="/favicon/mstile-144x144.png" />

      {/* Theme */}
      <meta name="theme-color" content="#ffffff" />

      {/* Apple PWA */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Delícias Culinárias" />
      <meta name="application-name" content="Delícias Culinárias" />

      {/* Performance */}
      <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
    </>
  );
}
