import { useState } from "react";
import FileUpload from "./components/FileUpload";
import ChatWindow from "./components/ChatWindow";
import "./App.css";

export default function App() {
  const [uploaded, setUploaded] = useState(false);
  const [filename, setFilename] = useState("");

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">DocuChat</span>
        </div>
        <p className="tagline">
          Ask questions. Get answers. From your documents.
        </p>
      </header>

      <main className="main">
        {!uploaded ? (
          <div className="upload-section">
            <div className="upload-hero">
              <h1>
                Drop your PDF.
                <br />
                Start asking.
              </h1>
              <p>
                Upload any document and ask questions about it in plain English.
              </p>
            </div>
            <FileUpload
              onUploaded={(name) => {
                setFilename(name);
                setUploaded(true);
              }}
            />
          </div>
        ) : (
          <div className="chat-section">
            <div className="chat-header">
              <span className="file-badge">◈ {filename}</span>
              <button className="new-doc" onClick={() => setUploaded(false)}>
                + New document
              </button>
            </div>
            <ChatWindow />
          </div>
        )}
      </main>
    </div>
  );
}
