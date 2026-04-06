import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onUploaded: (filename: string, suggestions: string[]) => void;
}

export default function FileUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      console.log("File selected:", file.name, file.size, "bytes");
      setStatus("uploading");
      setProgress("Uploading document...");

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

      const formData = new FormData();
      formData.append("pdf", file, file.name);

      try {
        setProgress("Generating embeddings...");

        const response = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const responseText = await response.text();
        if (!response.ok) {
          throw new Error(
            `Upload failed (${response.status}): ${responseText}`,
          );
        }

        const data = JSON.parse(responseText);
        console.log("Upload success:", data);

        setProgress(`Indexed ${data.chunks} chunks`);
        setStatus("done");

        // Pass both filename AND document-specific suggestions
        const suggestions = data.suggestions || [
          "Summarise this document",
          "What are the key points?",
          "What is this document about?",
        ];

        setTimeout(() => onUploaded(file.name, suggestions), 600);
      } catch (err: any) {
        console.error("Upload failed:", err.message);
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
