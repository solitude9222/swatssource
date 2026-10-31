import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { ImageIcon } from "./Icons";
import { imageFileToDataUrl } from "../lib/imageUpload";
import "../imageUpload.css";

type ImageUploadVariant = "compact" | "wide" | "banner" | "cursor";

export function ImageUpload({
  label,
  value,
  onChange,
  hint,
  recommended,
  variant = "wide",
  maxWidth = 1600,
  maxHeight = 1200,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
  recommended?: string;
  variant?: ImageUploadVariant;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const openPicker = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const dataUrl = await imageFileToDataUrl(file, { maxWidth, maxHeight });
      onChange(dataUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    void processFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void processFile(event.dataTransfer.files?.[0]);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPicker();
  };

  const remove = () => {
    setError("");
    onChange("");
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="image-upload-input"
      onChange={handleChange}
      tabIndex={-1}
    />
  );

  if (variant === "compact") {
    return (
      <div className="image-upload image-upload--compact">
        {input}
        <div className="image-upload-compact-actions">
          <button type="button" className="image-upload-button" onClick={openPicker} disabled={busy}>
            <ImageIcon size={12} />
            {busy ? "Processing…" : value ? "Replace image" : "Upload image"}
          </button>
          {value ? (
            <button type="button" className="image-upload-remove" onClick={remove} disabled={busy}>
              Remove
            </button>
          ) : null}
        </div>
        <p className="image-upload-hint">{busy ? "Compressing image…" : hint}</p>
        {error ? (
          <p className="image-upload-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`image-upload image-upload--${variant}${value ? " has-value" : ""}`}>
      {input}
      <div
        className={`image-upload-drop${dragging ? " is-dragging" : ""}${busy ? " is-busy" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`${value ? "Replace" : "Upload"} ${label}`}
        aria-busy={busy}
        onClick={openPicker}
        onKeyDown={handleKey}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setDragging(false);
        }}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img className="image-upload-preview" src={value} alt="" />
            <span className="image-upload-replace">
              <ImageIcon size={13} />
              Replace
            </span>
          </>
        ) : (
          <span className="image-upload-empty">
            <span className="image-upload-empty-icon">
              <ImageIcon size={16} />
            </span>
            <b>{`Upload ${label}`}</b>
            <small>{recommended ?? "Drag and drop or click to browse"}</small>
          </span>
        )}

        {busy ? <span className="image-upload-busy">Processing…</span> : null}
      </div>

      <div className="image-upload-foot">
        <span>{value ? hint : "PNG, JPG or WebP"}</span>
        {value ? (
          <button type="button" className="image-upload-remove" onClick={remove} disabled={busy}>
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="image-upload-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
