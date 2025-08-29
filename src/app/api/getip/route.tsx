import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.IPINFO_TOKEN; // Store your token in .env.local
  const url = `https://ipinfo.io?token=${token}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('Fetched IP info:', data);

    return NextResponse.json({
      ip: data.ip,
      isp: data.org, // This contains ISP info
      city: data.city,
      region: data.region,
      country: data.country,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ISP info' }, { status: 500 });
  }
}
