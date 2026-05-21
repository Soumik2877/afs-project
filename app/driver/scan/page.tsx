"use client";

import jsQR from "jsqr";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function DriverScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const processingRef = useRef(false);
  const animationRef = useRef<number | undefined>(undefined);
  const scanLoopRef = useRef<() => void>(() => {});
  const [scanningUi, setScanningUi] = useState(false);

  const teardown = useCallback(() => {
    scanningRef.current = false;
    processingRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    streamRef.current?.getTracks().forEach((track) => track.stop());
    setScanningUi(false);
  }, []);

  const handleCode = useCallback(
    async (code: string) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const response = await fetch("/api/qr-redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(typeof body.error === "string" ? body.error : "Redeem failed");
        processingRef.current = false;
        scanningRef.current = true;
        animationRef.current = requestAnimationFrame(() => scanLoopRef.current());

        return;
      }

      toast.success(`${body.citizenName} · +${body.points} eco points`);
      teardown();
    },

    [teardown],
  );

  function scanLoop() {
    if (!scanningRef.current || processingRef.current) return;

    const videoEl = videoRef.current;

    if (!videoEl || videoEl.readyState < videoEl.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(() => scanLoopRef.current());

      return;
    }

    const canvasElement = document.createElement("canvas");

    canvasElement.width = videoEl.videoWidth;

    canvasElement.height = videoEl.videoHeight;

    const context = canvasElement.getContext("2d");

    if (!context) return;

    context.drawImage(videoEl, 0, 0);

    const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);

    const detection = jsQR(imageData.data, imageData.width, imageData.height);

    if (detection?.data) {
      scanningRef.current = false;
      void handleCode(detection.data);

      return;
    }

    if (scanningRef.current) animationRef.current = requestAnimationFrame(() => scanLoopRef.current());
  }

  scanLoopRef.current = scanLoop;

  async function begin() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "environment" },
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    scanningRef.current = true;
    setScanningUi(true);
    animationRef.current = requestAnimationFrame(() => scanLoopRef.current());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">QR rewards</h1>
        <p className="text-[#94A3B8]">Scan citizen bag codes to credit eco-points.</p>
      </div>
      <video ref={videoRef} className="w-full rounded-3xl border border-[#142033]" playsInline muted />
      <div className="flex gap-4">
        {scanningUi ? (
          <Button type="button" variant="outline" className="w-full" onClick={teardown}>
            Stop scanning
          </Button>
        ) : (
          <Button type="button" className="w-full py-8 text-xl" onClick={() => begin().catch(console.error)}>
            Start camera
          </Button>
        )}
      </div>
    </div>
  );
}
