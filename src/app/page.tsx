'use client';

import { useCallback, useState } from "react";
import { DualFullGauges } from "./components/speedGauges";
import SpeedTestLocationDetails from "./components/speedTestLocationDetails";
import SpeedTestMeasureDetails from "./components/speedTestMeasureDetails";

export default function Home() {
  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);

  const meterDownload = useCallback((downloadspeed: number) => {
    setDownload(downloadspeed);
  }, []);

  const meterUpload = useCallback((uploadspeed: number) => {
    setUpload(uploadspeed);
  }, []);

  return (
    <>
      <div className="flex min-h-dvh flex-row items-center justify-center py-4">
        <SpeedTestMeasureDetails meterDownload={meterDownload} meterUpload={meterUpload} />
        <div className="basis-md text-center">
          <div className="basis-4xl m-4">
            <DualFullGauges download={download} upload={upload} maxDown={100} maxUp={100} />
          </div>
        </div>
        <SpeedTestLocationDetails />
      </div>
    </>
  );
}