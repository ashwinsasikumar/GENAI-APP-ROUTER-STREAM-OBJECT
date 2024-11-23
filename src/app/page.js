'use client';

import { useState } from "react";

export default function DocumentInfoGenerator() {
  const [documentInput, setDocumentInput] = useState("");
  const [documentInfo, setDocumentInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDocumentInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDocumentInfo([]); // Clear previous data
    setError(""); // Clear previous errors

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: documentInput }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        result += decoder.decode(value, { stream: true });

        const lines = result.split("\n");
        result = lines.pop(); // Keep the last incomplete line for the next loop

        for (const line of lines) {
          if (line.trim()) {
            try {
              const jsonChunk = JSON.parse(line);
              setDocumentInfo([jsonChunk]);
            } catch (parseError) {
              console.error("Error parsing JSON chunk:", line, parseError);
            }
          }
        }
      }

      if (result.trim()) {
        try {
          const finalChunk = JSON.parse(result);
          setDocumentInfo([finalChunk]);
        } catch (parseError) {
          console.error("Error parsing remaining JSON fragment:", result, parseError);
        }
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error("Error fetching document information:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Document Information Generator</h1>
      <form onSubmit={fetchDocumentInfo}>
        <div>
          <label htmlFor="documentInput">Enter a document name:</label>
          <input
            type="text"
            id="documentInput"
            value={documentInput}
            onChange={(e) => setDocumentInput(e.target.value)}
            placeholder="Enter a document name"
            required
          />
        </div>
        <button type="submit" disabled={loading || !documentInput}>
          {loading ? "Generating..." : "Generate Info"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading document information...</p>}
      <div className="chat-container">
        {documentInfo.length > 0 && (
          <div>
            <h2>Generated Document Information:</h2>
            {documentInfo.map((info, index) => (
              <div key={index}>
                <p><strong>Document Title:</strong> {info.documentTitle}</p>
                <p><strong>Needed Documents:</strong> {info.neededdocuments || "Not specified"}</p>
                <p><strong>Eligibility:</strong> {info.eligiblity || "Not specified"}</p>
                <p><strong>Destination:</strong> {info.destination || "Not specified"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
