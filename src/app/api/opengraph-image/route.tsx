import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

export const dynamic = "force-dynamic";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/splash.png"));
  const logoSrc = Uint8Array.from(logoData).buffer;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#111",
          flexDirection: "column",
        }}
      >
        <img
          src={logoSrc}
          width="600"
          height="400"
          style={{ objectFit: "cover" }}
        />
        <h1 style={{ color: "white", fontSize: 48, fontWeight: "bold" }}>
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
