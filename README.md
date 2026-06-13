# 영상편집 걱정마 (Easy Video)

초등학생부터 일반 사용자까지 브라우저에서 전 과정을 처리하는 **무료 영상 편집 웹앱**입니다.
오픈소스 [OpenCut](https://github.com/OpenCut-app/OpenCut)(MIT)의 구조를 참고하고
[FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)을 활용해
**CapCut / KineMaster 수준의 핵심 편집 기능**을 가능한 범위까지 옮겨 담았습니다.
(AI 기능은 API 없이 제공 불가하므로 제외)

> 모든 처리는 **브라우저 안**에서 이루어집니다. 서버로 영상이 업로드되지 않으며,
> FFmpeg.wasm + IndexedDB/OPFS로 동작합니다.

---

## 핵심 기능

### 🎬 컷 편집
- 다중 비디오 트랙 + 3채널 오디오(M1 BGM / M2 효과음 / M3 보이스오버)
- 클립 **분할(S) / 트림(in·out 핸들 드래그) / 복제 / 순서 드래그**
- **프레임 단위 이동**: `,` / `.` 키로 1/30초씩 정밀 시킹
- 클립별 **속도(0.25× ~ 4×)**, **볼륨(0~200%)**, **페이드 인/아웃**
- 클립별 **변형**: 확대(크롭)·가로/세로 위치·회전·**좌우/상하 반전**·**역재생**
- 클립별 **색 보정**: 밝기 · 대비 · 채도 (미리보기 = 내보내기 결과)
- 재생헤드·클립 경계·마커 **스냅(자석)** — 자막/스티커/이미지/도형/오디오 드래그에도 적용
- 자막·오디오 블록을 타임라인에서 **통째로 드래그해 이동**
- 마커(북마크): `M` 키로 즉시 추가, 더블클릭으로 삭제
- Undo/Redo 100단계 — 드래그·슬라이더 연속 조작은 **한 번의 실행 취소로 묶임**

### 🎞️ 장면 전환 (FFmpeg xfade 기반 18종)
- 페이드 / 검정·흰색 페이드 / 디졸브
- 슬라이드 4방향 / 부드러운 밀기
- 와이프 4방향
- 원형 열림·닫힘 / 시계 와이프
- 픽셀화 / 줌 인
- **기본 전환 + 구간별 전환**: 타임라인의 클립 사이 ◇ 배지를 클릭하거나
  클립 속성의 "다음 클립과의 전환"에서 구간마다 다른 효과 지정
- 전환 길이 0.2~2.0초 선택, 미리보기에서 실시간 근사 표시
- 내보내기 시 영상은 `xfade`, 오디오는 `acrossfade`로 A/V 싱크 유지

### 📝 자막 (캡컷 수준 고도화)
- **Google Fonts 102종** 자동 로드 (한글 24종 + 라틴 78종)
- 폰트 **굵기(300~900) / 기울임 / 밑줄 / 취소선**, 자간 / 줄간격
- **외곽선 색·굵기**, **그림자 색·번짐·오프셋**, 배경 박스(색·여백·둥근 모서리)
- 텍스트 정렬(좌·중·우), 회전, 위치 프리셋(9분할)
- **13종 등장/퇴장 애니메이션**: fade / slide 4방향 / zoom in·out / bounce / pop / typewriter / **shake / blink**
- **용도별 스타일 프리셋 18종 (6그룹)**:
  - 🎬 제목/타이틀 — 유튜브 제목 · 시네마틱 · 임팩트
  - 🤣 예능 자막 — 예능 노랑 · 충격 강조 · 깨알 코멘트
  - 📰 뉴스/정보 — 뉴스 속보 · 정보 자막바 · 인터뷰 이름표
  - 💬 대사/내레이션 — 영화 자막 · 내레이션 · 말풍선
  - 🌿 감성/브이로그 — 브이로그 감성 · 손글씨 메모 · 여행 캡션
  - 📱 쇼츠/SNS — 쇼츠 캡션 · 틱톡 박스 · 네온 해시태그
- **SRT/VTT 자막 가져오기 + SRT 내보내기**
- 자막 복제, 스타일 **전체 자막 일괄 적용**

### ▭ 도형 / 요소
- **사각형 · 원/타원 · 삼각형 · 선** 오버레이
- 채우기색 · 외곽선 색·굵기 · 투명도 · 크기 · 회전 · 등장/퇴장 애니메이션
- 미리보기에서 드래그 이동, 타임라인에서 길이 조절
- 반투명 박스로 자막 배경 강조, 선으로 밑줄·분할선 연출

### 🎨 미리보기
- 종횡비 프레임: **16:9 / 9:16 쇼츠 / 1:1 / 4:5 / 원본**
- **배경 채우기**: 여백(레터박스)을 **검정 · 블러 · 색상**으로 — 쇼츠 제작에 최적
- 8종 비디오 효과(빈티지/화사/흑백/따뜻/차가움/블러/비네트) 실시간 CSS 프리뷰
- 클립 **변형·색 보정** 실시간 반영 (확대·위치·회전·반전·밝기·대비·채도)
- 자막/스티커/이미지/도형 **드래그 이동**, 전체화면 모드 (F)
- 오디오가 타임라인과 **완전 동기화** — 시작 위치·페이드·스크럽 반영

### 🔊 오디오
- BGM(M1)/효과음(M2) 파일 업로드 + 🎤 보이스오버 녹음(M3)
- 타임라인 오디오 블록에 **파형(waveform) 표시**
- 타임라인에서 오디오 블록을 드래그해 **시작 위치 배치**
- 트랙별 볼륨·페이드 인/아웃
- 무료 음원 출처 안내(유튜브 오디오 라이브러리 · 공유마당 · Pixabay)

### 💾 프로젝트
- JSON 저장 / 불러오기
- 8초마다 localStorage 자동 저장 + **재접속 시 복원 제안 토스트**
  (블롭 영상은 복원 불가 → 자막·스티커·마커·설정 복원)
- 삭제 시 토스트 **"되돌리기" CTA** (버튼·키보드 모두)

### 📦 내보내기 (FFmpeg.wasm)
- 해상도 프리셋: 프리뷰 360p / 720p / 1080p / 원본
- 자막·스티커·이미지·**도형**을 **캔버스로 렌더링해 PNG 오버레이로 합성**
  → 한글 폰트·이모지·외곽선·그림자·배경 박스·회전이 **미리보기와 동일하게** 구워짐
- 클립별 **변형(crop·scale·rotate·flip)·색 보정(eq)·역재생(reverse)** 반영
- **배경 채우기**(블러/색상)를 클립마다 합성 — 모든 클립을 한 규격으로 정규화해 합치므로 크기가 달라도 안전
- 오버레이 등장/퇴장 페이드(알파) 반영
- 구간별 전환(xfade) + 오디오 크로스페이드(acrossfade)
- 오디오 시작 위치(adelay)·볼륨·페이드 반영
- 클립 속도(setpts/atempo), 종횡비 스케일링
- 진행 중 **내보내기 중단** 가능 (wasm 워커 즉시 종료)

---

## 키보드 단축키

| 키 | 동작 |
|---|---|
| `Space` / `K` | 재생 / 일시정지 |
| `J` / `L` | 5초 뒤로 / 5초 앞으로 |
| `← / →` | 1초 뒤·앞 (Shift+ = 5초) |
| `, / .` | **1프레임(1/30초) 뒤·앞 — 정밀 컷** |
| `S` | 현재 위치에서 분할 |
| `M` | 현재 위치에 마커 |
| `F` | 전체화면 |
| `Delete` | 선택 항목 삭제 (토스트로 되돌리기 가능) |
| `Ctrl/⌘+Z` / `+Shift+Z` | 되돌리기 / 다시 실행 |
| `Ctrl/⌘+D` | 선택 항목 복제 |
| `+` / `-` | 타임라인 확대 / 축소 |
| `?` | 도움말 |

---

## 기술 스택

- Next.js 14 (App Router) + React 18 + TypeScript
- Zustand (상태 관리, 100단계 Undo/Redo + 제스처 코얼레싱)
- @ffmpeg/ffmpeg (ffmpeg.wasm) — 클라이언트 영상 처리 (crop·scale·eq·reverse·xfade·acrossfade·overlay)
- Canvas API — 자막/스티커/이미지/도형 오버레이 렌더링 + 오디오 파형
- Web Audio API — 오디오 파형(peaks) 디코딩
- IndexedDB + OPFS — 영상 로컬 저장
- Google Fonts CSS API — 폰트 동적 로드

## 폴더 구조

```
apps/web/src/
├── app/                         # Next.js App Router
├── components/
│   ├── EasyVideoEditor.tsx      # 4-패널 그리드 + 단축키 + 자동저장/복원
│   ├── Toolbar.tsx              # 상단 도구바 (Undo/저장/종횡비/배경 채우기/내보내기)
│   ├── MediaPanel.tsx           # 좌측 패널 (미디어/오디오/텍스트/스티커/이미지/도형/마커)
│   ├── ProPreviewPanel.tsx      # 중앙 미리보기 (변형·색보정·배경블러 + 오디오 동기화)
│   ├── PropertiesPanel.tsx      # 우측 속성 패널 (변형·색보정·도형·자막 프리셋·전환)
│   ├── ProTimeline.tsx          # 멀티트랙 타임라인 + 전환 배지 + 파형 + 스냅
│   ├── Waveform.tsx             # 타임라인 오디오 파형 캔버스
│   ├── ExportModal.tsx          # 해상도 선택 + 중단 가능한 내보내기
│   ├── ShortcutsModal.tsx       # ? 도움말 + 오픈소스 크레딧
│   └── ToastContainer.tsx       # 되돌리기 토스트
├── store/editorStore.ts         # Zustand 전역 상태 + 코얼레싱 히스토리
├── lib/
│   ├── ffmpeg.ts                # FFmpeg.wasm 래퍼 (변형·색보정·배경·xfade/overlay/adelay)
│   ├── overlayRender.ts         # 자막·스티커·이미지·도형 → PNG 캔버스 렌더러
│   ├── waveform.ts              # Web Audio 기반 오디오 파형 peaks (URL 캐시)
│   ├── transitions.ts           # 전환 효과 18종 카탈로그 (xfade 매핑)
│   ├── captionPresets.ts        # 용도별 자막 프리셋 18종 (6그룹)
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

## 참고한 오픈소스

| 프로젝트 | 라이선스 | 활용 |
|---|---|---|
| [OpenCut](https://github.com/OpenCut-app/OpenCut) | MIT | 트랙·트림·트랜지션 구조 참고 |
| [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) | MIT | 브라우저 내 영상 처리 (xfade/overlay/amix) |
| [Next.js](https://github.com/vercel/next.js) | MIT | 앱 프레임워크 |
| [Zustand](https://github.com/pmndrs/zustand) | MIT | 상태 관리 + Undo/Redo |
| [Google Fonts](https://fonts.google.com/) | OFL/Apache | 자막용 102종 웹폰트 |

## 자세한 UX 개선 보고서

[`UI_UX_REPORT_KO.md`](./UI_UX_REPORT_KO.md)에 검토 항목, CapCut/KineMaster 비교, 실행한 개선 내역을 정리했습니다.

## 라이선스

MIT. OpenCut 프로젝트의 MIT 라이선스 고지를 `LICENSE` 파일에 포함했습니다.
