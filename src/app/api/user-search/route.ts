import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limit = searchParams.get("limit") || "5";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Neynar API key is not configured. Please add NEYNAR_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    const url = `https://api.neynar.com/v2/farcaster/user/search/?limit=${encodeURIComponent(
      limit
    )}&q=${encodeURIComponent(q)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "x-neynar-experimental": "false",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Neynar API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as any;
    const users = ((data?.result?.users as any[]) || []).map((u) => {
      const primaryEth: string | undefined =
        u?.verified_addresses?.primary?.eth_address ||
        (Array.isArray(u?.verified_addresses?.eth_addresses)
          ? u.verified_addresses.eth_addresses[0]
          : undefined) ||
        u?.custody_address;

      return {
        fid: u?.fid as number | undefined,
        username: (u?.username as string | undefined) || "",
        display_name: (u?.display_name as string | undefined) || "",
        pfp_url: (u?.pfp_url as string | undefined) || "",
        address: primaryEth as `0x${string}` | undefined,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to search Neynar users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
