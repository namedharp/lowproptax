"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface GlassFileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  docType?: string;
  className?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  webp: Image,
  docx: FileText,
};

export function GlassFileUpload({
  onUpload,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.docx",
  maxSize = 10,
  label = "Upload Document",
  className,
}: GlassFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > maxSize * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxSize}MB`);
        return;
      }

      setUploading(true);
      try {
        await onUpload(file);
        setUploadedFile({ name: file.name, size: file.size });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed"
        );
      } finally {
        setUploading(false);
      }
    },
    [maxSize, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const ext = uploadedFile?.name.split(".").pop()?.toLowerCase() || "";
  const Icon = FILE_ICONS[ext] || FileIcon;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-2">
          {label}
        </label>
      )}

      {uploadedFile ? (
        <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-xl px-4 py-3">
          <Icon className="h-5 w-5 text-teal-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{uploadedFile.name}</p>
            <p className="text-xs text-white/50">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setUploadedFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all",
            isDragging
              ? "border-teal-400 bg-teal-500/10"
              : "border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.3)]",
            uploading && "opacity-50 pointer-events-none"
          )}
        >
          {uploading ? (
            <div className="h-8 w-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-white/40" />
          )}
          <p className="text-sm text-white/60 text-center">
            {uploading
              ? "Uploading..."
              : "Drag and drop or click to upload"}
          </p>
          <p className="text-xs text-white/40">
            PDF, JPG, PNG, DOCX up to {maxSize}MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
