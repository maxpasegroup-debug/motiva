import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_FORMAT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 },
    );
  }

  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 5MB)" },
      { status: 400 },
    );
  }

  const type = file.type || "application/octet-stream";
  const ext = MIME_TO_FORMAT[type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported image type" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${type};base64,${buffer.toString("base64")}`;

  const folder = "motiva/courses";
  const upload = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: "image",
  });

  if (!upload?.secure_url) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: upload.secure_url });
}
