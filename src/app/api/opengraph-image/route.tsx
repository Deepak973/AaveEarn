import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center relative bg-primary">
        {/* Background image */}
        <div
          tw="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: "url(https://aave-earn.vercel.app/splash.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Overlay text */}
        <h1 tw="text-white text-center text-4xl font-bold relative z-10">
          EOA
        </h1>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
