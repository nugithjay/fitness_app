import { useRef, useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

// Live camera barcode scanning that works across Chrome/Android AND Safari/iOS,
// because it decodes frames itself instead of relying on the browser's native
// (Chrome-only) BarcodeDetector API.
export function useBarcodeScanner(onDetected) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const stop = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setScanning(false);
  };

  const start = async () => {
    setError("");
    try {
      const reader = new BrowserMultiFormatReader();
      setScanning(true);
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result, err) => {
          if (result) {
            const value = result.getText();
            stop();
            onDetected(value);
          }
          // NotFoundException fires continuously between frames with no barcode
          // in view — that's normal and expected, not a real error.
          else if (err && !(err instanceof NotFoundException)) {
            console.warn("Scan frame error", err);
          }
        }
      );
      controlsRef.current = controls;
    } catch (e) {
      setError("Camera access was blocked or unavailable. Enter the barcode number instead.");
      setScanning(false);
    }
  };

  useEffect(() => () => stop(), []);
  return { videoRef, scanning, error, start, stop, supported: true };
}
