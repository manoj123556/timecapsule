import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase/config";

export function getFileType(file: File | Blob): "image" | "video" | "audio" | "other" {
  if (file.type.startsWith("image")) return "image";
  if (file.type.startsWith("video")) return "video";
  if (file.type.startsWith("audio")) return "audio";
  return "other";
}

export async function uploadFile(
  file: File | Blob,
  userId: string,
  originalName: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; type: string }> {

  const fileType = getFileType(file);

  const filePath = `users/${userId}/${Date.now()}-${originalName}`;
  const storageRef = ref(storage, filePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url: downloadURL, type: fileType });
      }
    );
  });
}

export async function deleteFileFromUrl(url: string): Promise<void> {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
}