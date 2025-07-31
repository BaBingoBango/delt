//
//  app.jsx
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import {SpeedInsights} from "@vercel/speed-insights/next";
import {Analytics} from '@vercel/analytics/react';

// All-Page App Wrapper
function MyApp({ Component, pageProps }) {
  return (
      <>
        <Component {...pageProps} />
        <Analytics />
        <SpeedInsights />
      </>
  );
}
export default MyApp;
