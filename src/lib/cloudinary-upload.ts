import { getAuthToken } from "@/lib/session";

/**
 * Upload a lesson video to Cloudinary via the admin API (secrets stay server-side).
 * Uses XHR for upload progress (fetch has limited progress support).
 */
export function uploadLessonVideoToCloudinary(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  const token = getAuthToken();
  if (!token) {
    return Promise.reject(new Error("Unauthorized"));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);

    xhr.open("POST", "/api/admin/cloudinary/upload-video");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      }
    };

    xhr.onload = () => {
      let body: { secure_url?: string; error?: string };
      try {
        body = JSON.parse(xhr.responseText) as {
          secure_url?: string;
          error?: string;
        };
      } catch {
        reject(new Error("Invalid server response"));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
        onProgress(100);
        resolve(body.secure_url);
        return;
      }

      reject(
        new Error(
          body.error ??
            (xhr.status === 503
              ? "Cloudinary is not configured"
              : "Upload failed"),
        ),
      );
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}
