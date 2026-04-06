import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onUploaded: (filename: string) => void;
}

export default function FileUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState("");

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files[0]) return;
      setStatus("uploading");
      setProgress("Reading document...");

      const form = new FormData();
      form.append("pdf", files[0]);

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

      try {
        setProgress("Generating embeddings...");

        // Use fetch instead of axios — more reliable for FormData on deployed environments
        const res = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: form,
          // DO NOT set Content-Type header — browser sets it automatically
          // with the correct multipart boundary when using FormData
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Upload failed: ${res.status}`);
        }

        const data = await res.json();
        setProgress(`Indexed ${data.chunks} chunks`);
        setStatus("done");
        setTimeout(() => onUploaded(files[0].name), 800);
      } catch (err: any) {
        console.error("Upload error:", err);
        setStatus("error");
        setProgress(err.message || "Upload failed. Try again.");
      }
    },
    [onUploaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: status === "uploading",
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${isDragActive ? "drag-active" : ""} ${status}`}
    >
      <input {...getInputProps()} />

      {status === "idle" && (
        <>
          <div className="drop-icon">⬆</div>
          <p className="drop-main">
            {isDragActive ? "Drop it here" : "Drag & drop your PDF"}
          </p>
          <p className="drop-sub">or click to browse files</p>
        </>
      )}

      {status === "uploading" && (
        <>
          <div className="spinner" />
          <p className="drop-main">{progress}</p>
        </>
      )}

      {status === "done" && (
        <>
          <div className="drop-icon">✓</div>
          <p className="drop-main">Ready to chat</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="drop-icon">✕</div>
          <p className="drop-main">{progress}</p>
          <p className="drop-sub">Click to try again</p>
        </>
      )}
    </div>
  );
}
