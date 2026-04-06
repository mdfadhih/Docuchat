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
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        console.error("No file in acceptedFiles:", acceptedFiles);
        return;
      }

      console.log("File selected:", file.name, file.size, file.type);
      setStatus("uploading");
      setProgress("Reading document...");

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      console.log("API URL:", API_URL);

      try {
        setProgress("Uploading...");

        // Build FormData
        const formData = new FormData();
        formData.append("pdf", file, file.name);

        // Log what's in the FormData
        for (const [key, value] of formData.entries()) {
          console.log("FormData entry:", key, value);
        }

        const res = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: formData,
          // NO Content-Type header — let browser set multipart/form-data + boundary
        });

        console.log("Response status:", res.status);

        const text = await res.text();
        console.log("Response text:", text);

        if (!res.ok) {
          throw new Error(`Upload failed ${res.status}: ${text}`);
        }

        const data = JSON.parse(text);
        setProgress(`Indexed ${data.chunks} chunks`);
        setStatus("done");
        setTimeout(() => onUploaded(file.name), 800);
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
    noClick: false,
    noKeyboard: false,
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
