/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { YouTubeV } from "./components/YouTubeV";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message === "Script error.") {
        e.preventDefault();
      }
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  return (
    <YouTubeV />
  );
}
