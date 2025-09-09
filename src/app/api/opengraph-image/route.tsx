import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center relative bg-primary">
        <div tw="flex w-96 h-96 rounded-full overflow-hidden mb-8 border-8 border-white">
          <img
            src={"https://aave-earn.vercel.app/splash.png"}
            alt="EOA"
            tw="w-full h-full object-cover"
          />
        </div>

        <h1 tw="text-white text-center text-4xl font-bold">EOA</h1>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
