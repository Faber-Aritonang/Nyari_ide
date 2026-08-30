"use client";

import { useState, useEffect } from "react";
import { downloadImage } from "@/lib/image-gen";

interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  conversationId: string;
  conversationTitle: string;
  createdAt: string;
}

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageGallery({ isOpen, onClose }: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  async function fetchImages() {
    setLoading(true);
    try {
      const res = await fetch("/api/images");
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-background rounded-xl z-50 flex flex-col overflow-hidden border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            <h2 className="text-lg font-semibold">Galeri Gambar</h2>
            <span className="text-xs text-muted bg-muted px-2 py-0.5 rounded-full">
              {images.length} gambar
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <span className="text-4xl mb-4">🎨</span>
              <p>Belum ada gambar yang di-generate</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs line-clamp-2">{img.prompt}</p>
                      <p className="text-white/60 text-xs mt-1">
                        {new Date(img.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-[60]"
            onClick={() => setSelectedImage(null)}
          />
          <div className="fixed inset-4 md:inset-12 lg:inset-20 z-[60] flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-white/80 z-10"
            >
              ✕
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.prompt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-4 text-white">
              <p className="text-sm mb-2">{selectedImage.prompt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">
                  {new Date(selectedImage.createdAt).toLocaleDateString("id-ID")} •{" "}
                  {selectedImage.conversationTitle}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(selectedImage.url, `nyari-ide-${selectedImage.id}.jpg`);
                  }}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
