"use client";

import { useCallback, useRef, useState } from "react";
import { useEditorStore, generateId } from "@/store/editorStore";
import { saveFile } from "@/lib/storage";

const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm"];

export default function VideoDropZone() {
  const addVideoClip = useEditorStore((s) => s.addVideoClip);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      for (const file of Array.from(files)) {
        const isVideoExt = /\.(mp4|mov|webm)$/i.test(file.name);
        if (!ACCEPTED.includes(file.type) && !isVideoExt) {
          setError("mp4, mov, webm 파일만 가능해요.");
          continue;
        }
        try {
          const { id, url } = await saveFile(file);
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = url;
          await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => resolve();
          });
          addVideoClip({
            id: generateId(),
            name: file.name,
            url,
            duration: isFinite(video.duration) ? video.duration : 5,
            startTime: 0,
            fileId: id,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "파일을 불러오지 못했어요");
        }
      }
    },
    [addVideoClip],
  );

  return (
    <div
      className={`dropzone${dragOver ? " over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
      }}
      role="region"
      aria-label="영상 파일 드롭 영역"
    >
      <div className="dropzone-inner">
        <div className="dropzone-icon" aria-hidden="true">🎬</div>
        <h2>영상을 여기에 끌어다 놓으세요</h2>
        <p>또는 아래 큰 버튼을 눌러 영상을 골라요</p>
        <button
          type="button"
          className="big-btn btn-load"
          onClick={() => inputRef.current?.click()}
          aria-label="영상 파일 선택"
          title="내 컴퓨터에서 영상 파일을 골라요"
        >
          📂 영상 불러오기
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          aria-label="영상 파일 입력"
        />
        {error && (
          <p className="error" role="alert">
            ⚠ {error}
          </p>
        )}
        <p className="dropzone-hint">지원 형식: mp4, mov, webm</p>
      </div>
    </div>
  );
}
