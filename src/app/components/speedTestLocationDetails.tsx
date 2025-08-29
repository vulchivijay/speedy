'use client';

import { useEffect, useState } from 'react';

interface IPInfo {
  ip: string;
  org: string;
  city: string;
  region: string;
  country: string;
}

export default function SpeedTestLocationDetails() {
  const [data, setData] = useState<IPInfo | null>(null);;
  const token = process.env.IPINFO_TOKEN; // Store your token in .env.local
  const url = `https://ipinfo.io?token=${token}`;
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => setData(data))
      .catch((err) => setData(err));
  }, [data]);

  return (
    <div className="basis-3xs">
      <div className="my-3 p-4 shadow-md rounded-md border border-gray-200">
        <div className="text-md font-semibold text-gray-900">Client</div>
        <div className="flex flex-row align-items-start">
          <div className="text-sm text-gray-600">{data?.org}</div>
        </div>
      </div>
      <div className="my-3 p-4 shadow-md rounded-md border border-gray-200">
        <div className="text-md font-semibold text-gray-900">IP address</div>
        <div className="flex flex-row align-items-start">
          <div className="text-sm text-gray-600">{data?.ip}</div>
        </div>
      </div>
      <div className="my-3 p-4 shadow-md rounded-md border border-gray-200">
        <div className="text-md font-semibold text-gray-900">Server</div>
        <div className="flex flex-row align-items-start">
          <div className="text-sm text-gray-600">{data?.region}</div>
        </div>
      </div>
      <div className="my-3 p-4 shadow-md rounded-md border border-gray-200">
        <div className="text-md font-semibold text-gray-900">Location</div>
        <div className="flex flex-row align-items-start">
          <div className="text-sm text-gray-600">{data?.city}</div>
        </div>
      </div>
    </div>
  );
}  