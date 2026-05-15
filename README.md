# 영상편집 걱정마 (Easy Video)

초등학교 3~6학년을 위한 어린이 친화적 브라우저 영상 편집 웹앱입니다.
오픈소스 프로젝트 [OpenCut](https://github.com/OpenCut-app/OpenCut)(MIT)의 아이디어와
구조를 참고하여, 아이가 혼자서도 다룰 수 있도록 기능을 단순화했습니다.

## 특징

- 모든 처리는 브라우저에서 (서버 업로드 없음, FFmpeg.wasm 사용)
- IndexedDB + OPFS로 영상 파일 로컬 저장
- 트랙 2개(영상 1 + 배경음악 1)로 단순화된 타임라인
- 자르기 / 자막 / 이모지 스티커 / 배경음악 / 미리보기 / mp4 내보내기
- 마스코트 캐릭터가 단계별 힌트 제공
- 한국어 UI, 768px 이상 2단 / 이하 1단 반응형
- 모든 버튼 aria-label, 키보드 포커스 링 지원

## 기술 스택

- Next.js 14 (App Router) + React 18 + TypeScript
- Zustand (상태 관리)
- @ffmpeg/ffmpeg (ffmpeg.wasm) — 클라이언트 영상 처리

## 폴더 구조

```
apps/web/src/
├── app/                 # Next.js App Router (layout, page, globals.css)
├── components/
│   ├── EasyVideoEditor.tsx    # 메인 에디터 컨테이너
│   ├── SimpleTimeline.tsx     # 어린이용 단순 타임라인
│   ├── StickerPicker.tsx      # 이모지 스티커 팔레트
│   ├── CaptionEditor.tsx      # 자막 입력 패널
│   ├── MascotHelper.tsx       # 마스코트 말풍선 힌트
│   ├── ExportButton.tsx       # FFmpeg.js 내보내기 버튼
│   ├── PreviewPanel.tsx       # 실시간 프리뷰
│   ├── VideoDropZone.tsx      # 드래그&드롭 영상 불러오기
│   └── StepBar.tsx            # 3단계 진행 표시바
├── store/editorStore.ts       # Zustand 전역 상태
├── lib/
│   ├── ffmpeg.ts              # FFmpeg.wasm 래퍼 (concat + drawtext)
│   └── storage.ts             # IndexedDB + OPFS 하이브리드 저장
└── types/index.ts             # 공통 타입
```

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

> FFmpeg.wasm은 `SharedArrayBuffer`를 사용하므로 응답 헤더에
> `Cross-Origin-Opener-Policy: same-origin`,
> `Cross-Origin-Embedder-Policy: require-corp` 가 필요합니다.
> 이미 `next.config.js`에 설정되어 있습니다.

## 라이선스

MIT. OpenCut 프로젝트의 MIT 라이선스 고지를 `LICENSE` 파일에 포함했습니다.
