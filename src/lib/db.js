import { supabase } from "../supabaseClient";

// Mirrors the original app's get/set-by-key storage model, backed by a real
// per-user table with row-level security instead of browser-local storage.

export async function getUserData(key) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;
  const { data, error } = await supabase
    .from("user_data")
    .select("value")
    .eq("user_id", user.id)
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error("getUserData failed", key, error);
    return null;
  }
  return data ? data.value : null;
}

export async function setUserData(key, value) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;
  const { error } = await supabase
    .from("user_data")
    .upsert(
      { user_id: user.id, key, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  if (error) console.error("setUserData failed", key, error);
}

// ---- Progress photos: file bytes live in Supabase Storage, a small index
// (id/date/path) is kept in user_data under the 'progress-photos' key.

function resizeImageToBlob(file, maxDim = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadProgressPhoto(file, dateISO, id) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not signed in");
  const blob = await resizeImageToBlob(file);
  const path = `${user.id}/${id}.jpg`;
  const { error } = await supabase.storage
    .from("progress-photos")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return path;
}

export async function getPhotoSignedUrl(path) {
  const { data, error } = await supabase.storage
    .from("progress-photos")
    .createSignedUrl(path, 3600);
  if (error) {
    console.error("getPhotoSignedUrl failed", path, error);
    return null;
  }
  return data.signedUrl;
}

export async function deleteProgressPhotoFile(path) {
  const { error } = await supabase.storage.from("progress-photos").remove([path]);
  if (error) console.error("deleteProgressPhotoFile failed", path, error);
}
