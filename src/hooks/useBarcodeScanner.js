import { useRef, useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException, DecodeHintType, BarcodeFormat } from "@zxing/library";

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
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF, BarcodeFormat.CODABAR,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      setScanning(true);
      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (result, err) => {
          if (result) {
            const value = result.getText();
            stop();
            onDetected(value);
          } else if (err && !(err instanceof NotFoundException)) {
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
