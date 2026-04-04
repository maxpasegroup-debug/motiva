import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import {
  getConfiguredCloudinary,
  isCloudinaryConfigured,
} from "@/server/cloudinary/config";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Long-running uploads (e.g. Vercel / serverless). */
export const maxDuration = 300;

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB — align with Cloudinary plan limits

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 },
    );
  }

  const cloudinary = getConfiguredCloudinary();
  if (!cloudinary) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const secureUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "motiva/lessons",
          use_filename: true,
          unique_filename: true,
        },
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          const url = result?.secure_url;
          if (!url) {
            reject(new Error("No secure_url in response"));
            return;
          }
          resolve(url);
        },
      );

      Readable.from([bytes]).pipe(uploadStream).on("error", reject);
    });

    return NextResponse.json({ secure_url: secureUrl });
  } catch (e) {
    console.error("[cloudinary upload]", e);
    const message =
      e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
