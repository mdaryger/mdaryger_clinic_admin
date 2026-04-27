import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '../firebase/firebase';

function getContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, {
    contentType: getContentType(path),
  });

  return getDownloadURL(fileRef);
}

export async function deleteFileByPath(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}

export async function getFileDownloadUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}
