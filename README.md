# 영상편집 걱정마 (Easy Video)

초등학생부터 일반 사용자까지 브라우저에서 전 과정을 처리하는 **무료 영상 편집 웹앱**입니다.
오픈소스 [OpenCut](https://github.com/OpenCut-app/OpenCut)(MIT)의 구조를 참고하여
**CapCut 수준의 핵심 편집 기능**을 가능한 범위까지 옮겨 담았습니다. (AI 기능은 API 없이 제공 불가하므로 제외)

> 모든 처리는 **브라우저 안**에서 이루어집니다. 서버로 영상이 업로드되지 않으며,
> FFmpeg.wasm + IndexedDB/OPFS로 동작합니다.

---

## 핵심 기능

### 🎬 편집 (OpenCut 호환)
- 다중 비디오 트랙 + 3채널 오디오(M1 BGM / M2 효과음 / M3 보이스오버)
- 클립 **분할 / 트림(in·out 지점) / 복제 / 순서 드래그**
- 클립별 **속도(0.25× ~ 4×)**, **볼륨(0~200%)**, **페이드 인/아웃**
- 5종 트랜지션: 없음 / 페이드 / 디졸브 / 슬라이드 / 와이프
- 8종 비디오 효과: 빈티지 / 화사 / 흑백 / 따뜻 / 차가움 / 블러 / 비네트
- 종횡비 프리셋: **16:9 가로 / 9:16 쇼츠 / 1:1 / 4:5 / 원본**
- 마커(북마크): `M` 키로 즉시 추가, 더블클릭으로 삭제
- 재생헤드·클립 경계·마커 **스냅** (자석)
- 클립 좌/우 핸들 드래그로 양쪽 트림

### 📝 자막 (캡컷 수준 고도화)
- **Google Fonts 102종** 자동 로드 (한글 24종 + 라틴 78종)
- 폰트 **굵기(300~900) / 기울임 / 밑줄 / 취소선**
- **자간 / 줄간격** 슬라이더
- **외곽선 색·굵기**, **그림자 색·번짐·오프셋 X/Y**
- 텍스트 **정렬(좌·중·우)**, **회전**
- 배경 박스 색·여백·둥근 모서리
- **11종 등장/퇴장 애니메이션**: fade / slide-up·down·left·right / zoom-in·out / bounce / pop / typewriter
- 7종 빠른 텍스트 프리셋(기본/팝/네온/노란상자/유튜브/외곽선/그림자)
- **SRT/VTT 자막 가져오기 + SRT 내보내기**
- 자막 복제, 자막 스타일을 **전체 자막에 일괄 적용**

### 🎨 미리보기
- 종횡비 프레임 (실제 출력 영역 표시)
- 자막/스티커/이미지 **드래그 이동**
- 전체화면 모드 (F)
- 효과는 실시간 프리뷰 (CSS 필터)

### 💾 프로젝트
- JSON 저장 / 불러오기 (드래그·드롭이 아닌 명시적 파일)
- 8초마다 **localStorage 자동 저장** (블롭 URL 제외)
- Undo/Redo 100단계 + 삭제 시 토스트 **"되돌리기" CTA**

### 🎤 보이스 오버
- 브라우저 마이크로 직접 녹음 → M3 오디오 트랙에 자동 배치

### 📦 내보내기
- 해상도 프리셋: **프리뷰 360p / 720p / 1080p / 원본**
- FFmpeg.wasm로 자막의 외곽선·그림자·배경·정렬을 그대로 굽기
- 클립 속도/볼륨/페이드, 오디오 페이드, 종횡비 스케일링까지 반영

---

## 키보드 단축키

| 키 | 동작 |
|---|---|
| `Space` / `K` | 재생 / 일시정지 |
| `J` / `L` | 5초 뒤로 / 5초 앞으로 |
| `← / →` | 1초 뒤·앞 (Shift+ = 5초) |
| `S` | 현재 위치에서 분할 |
| `M` | 현재 위치에 마커 |
| `F` | 전체화면 |
| `Delete` | 선택 항목 삭제 (토스트로 되돌리기 가능) |
| `Ctrl/⌘+Z` / `Shift+Z` | 되돌리기 / 다시 실행 |
| `Ctrl/⌘+D` | 선택 항목 복제 |
| `+` / `-` | 타임라인 확대 / 축소 |
| `?` | 단축키 도움말 |

---

## 기술 스택

- Next.js 14 (App Router) + React 18 + TypeScript
- Zustand (상태 관리, 100단계 Undo/Redo)
- @ffmpeg/ffmpeg (ffmpeg.wasm) — 클라이언트 영상 처리
- IndexedDB + OPFS — 영상 로컬 저장
- Google Fonts CSS API — 폰트 동적 로드

## 폴더 구조

```
apps/web/src/
├── app/                         # Next.js App Router
├── components/
│   ├── EasyVideoEditor.tsx      # 4-패널 그리드 + 단축키
│   ├── Toolbar.tsx              # 상단 도구바 (Undo/저장/종횡비/내보내기)
│   ├── MediaPanel.tsx           # 좌측 패널 (미디어/오디오/텍스트/스티커/이미지/마커)
│   ├── ProPreviewPanel.tsx      # 중앙 미리보기 (종횡비 프레임 + 오버레이)
│   ├── PropertiesPanel.tsx      # 우측 속성 패널 (섹션형 자막 편집기)
│   ├── ProTimeline.tsx          # 멀티트랙 타임라인 + 마커 + 스냅
│   ├── ExportModal.tsx          # 해상도 선택 내보내기
│   ├── ShortcutsModal.tsx       # ? 도움말
│   └── ToastContainer.tsx       # 되돌리기 토스트
├── store/editorStore.ts         # Zustand 전역 상태 + 히스토리
├── lib/
│   ├── ffmpeg.ts                # FFmpeg.wasm 래퍼 (concat/transition/drawtext/scale)
│   ├── storage.ts               # IndexedDB + OPFS 하이브리드 저장
│   ├── project.ts               # JSON 저장/불러오기 + localStorage 자동 저장
│   ├── srt.ts                   # SRT/VTT 가져오기·내보내기
│   ├── fonts.ts                 # 102종 Google Fonts 카탈로그
│   └── notifications.ts         # 토스트 시스템
└── types/index.ts               # 공통 타입
```

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

> FFmpeg.wasm은 `SharedArrayBuffer`를 사용하므로 응답 헤더에
> `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` 가 필요합니다.
> GitHub Pages 배포 시 `public/coi-serviceworker.js`가 이 헤더를 자동으로 부여합니다.

## 빌드

```bash
npm run build      # 정적 export (out/)
npm run start      # 프로덕션 서버
```

---

## 자세한 UX 개선 보고서

[`UI_UX_REPORT_KO.md`](./UI_UX_REPORT_KO.md)에 검토 항목, OpenCut/CapCut 비교, 실행한 개선 내역을 정리했습니다.

## 라이선스

MIT. OpenCut 프로젝트의 MIT 라이선스 고지를 `LICENSE` 파일에 포함했습니다.
