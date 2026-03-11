// frontend/src/services/uploadService.js

import api from "./api";

const uploadService = {
  // Upload a file — returns { fileId, filename, url, mimeType, size }
  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress) {
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  // Get the full URL to view a file
  getUrl: (fileId) => `http://localhost:5000/api/upload/${fileId}`,

  // Get the download URL for a file
  getDownloadUrl: (fileId) => `http://localhost:5000/api/upload/${fileId}/download`,

  // Check if a mimeType is a video
  isVideo: (mimeType) => mimeType?.startsWith("video/"),

  // Check if a mimeType is an image
  isImage: (mimeType) => mimeType?.startsWith("image/"),
};

export default uploadService;