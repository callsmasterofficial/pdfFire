"use client";

import React, { useState, useEffect } from "react";
import { SignaturePlacement } from "@/lib/pdf/operations/sign";
import { SignPreviewCanvas } from "./sign-preview-canvas";
import { SignPlacementControls } from "./sign-placement-controls";

interface SignPreviewPlacementProps {
  pdfFile: File;
  signatureDataUrl: string;
  onPlacementReady: (
    placements: SignaturePlacement[],
    signerName: string,
    signDate: string
  ) => void;
}

export function SignPreviewPlacement({
  pdfFile,
  signatureDataUrl,
  onPlacementReady,
}: SignPreviewPlacementProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applyToAll, setApplyToAll] = useState(false);
  const [posX, setPosX] = useState(25);
  const [posY, setPosY] = useState(70);
  const [sigWidth, setSigWidth] = useState(160);
  const [signerName, setSignerName] = useState("");
  const [signDate, setSignDate] = useState(new Date().toISOString().split("T")[0]);
  const [includeCaption, setIncludeCaption] = useState(false);

  useEffect(() => {
    let active = true;
    const loadPdfMeta = async () => {
      try {
        const { getDocument } = await import("pdfjs-dist");
        const arrayBuffer = await pdfFile.arrayBuffer();
        const doc = await getDocument({ data: arrayBuffer }).promise;
        if (active) setTotalPages(doc.numPages);
      } catch (err) {
        console.warn("Could not read PDF page count:", err);
      }
    };
    loadPdfMeta();
    return () => {
      active = false;
    };
  }, [pdfFile]);

  useEffect(() => {
    const pdfPageWidth = 612;
    const pdfPageHeight = 792;
    const normX = (posX / 100) * pdfPageWidth;
    const normWidth = (sigWidth / 360) * pdfPageWidth;
    const normHeight = ((sigWidth * 0.4) / 480) * pdfPageHeight;
    const normY = pdfPageHeight - (posY / 100) * pdfPageHeight - normHeight;

    const pages = applyToAll
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : [currentPage];

    const placements: SignaturePlacement[] = pages.map((p) => ({
      pageNumber: p,
      x: Math.round(normX),
      y: Math.max(10, Math.round(normY)),
      width: Math.round(normWidth),
      height: Math.round(normHeight),
    }));

    onPlacementReady(
      placements,
      includeCaption ? signerName : "",
      includeCaption ? signDate : ""
    );
  }, [posX, posY, sigWidth, currentPage, applyToAll, totalPages, signerName, signDate, includeCaption, onPlacementReady]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <SignPreviewCanvas
        signatureDataUrl={signatureDataUrl}
        posX={posX}
        posY={posY}
        sigWidth={sigWidth}
        onPositionChange={(x, y) => {
          setPosX(x);
          setPosY(y);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        signerName={includeCaption ? signerName : undefined}
        signDate={includeCaption ? signDate : undefined}
      />

      <SignPlacementControls
        sigWidth={sigWidth}
        onSigWidthChange={setSigWidth}
        totalPages={totalPages}
        applyToAll={applyToAll}
        onApplyToAllChange={setApplyToAll}
        includeCaption={includeCaption}
        onIncludeCaptionChange={setIncludeCaption}
        signerName={signerName}
        onSignerNameChange={setSignerName}
        signDate={signDate}
        onSignDateChange={setSignDate}
      />
    </div>
  );
}
