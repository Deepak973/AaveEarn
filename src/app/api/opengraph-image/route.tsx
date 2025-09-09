import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center relative bg-primary">
        <img src="/splash.png" alt="Profile" tw="w-full h-full object-cover" />
        <h1 tw="text-white text-center text-4xl font-bold">EOA</h1>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
