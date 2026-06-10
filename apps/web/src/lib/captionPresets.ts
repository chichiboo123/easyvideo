import type { Caption } from "@/types";

// Purpose-based caption presets (CapCut/KineMaster style).
// Each preset is a complete look: typography + outline/shadow + box +
// position + entrance/exit animation, grouped by what you're making.
export interface CaptionPreset {
  name: string;
  sample: string;                 // default text when added from the panel
  patch: Partial<Caption>;
}

export interface CaptionPresetGroup {
  group: string;
  emoji: string;
  presets: CaptionPreset[];
}

export const CAPTION_PRESET_GROUPS: CaptionPresetGroup[] = [
  {
    group: "제목 / 타이틀",
    emoji: "🎬",
    presets: [
      {
        name: "유튜브 제목",
        sample: "오늘의 브이로그",
        patch: {
          fontFamily: "Black Han Sans", fontSize: 64, fontWeight: 700,
          color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 5,
          shadowColor: "rgba(0,0,0,0.8)", shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 4,
          backgroundColor: "transparent", x: 50, y: 50, align: "center",
          animationIn: "zoom-in", animationOut: "fade", animationDuration: 0.4,
        },
      },
      {
        name: "시네마틱",
        sample: "어느 여름날",
        patch: {
          fontFamily: "Nanum Myeongjo", fontSize: 52, fontWeight: 700,
          color: "#F4EFE6", strokeWidth: 0, letterSpacing: 8, lineHeight: 1.4,
          shadowColor: "rgba(0,0,0,0.6)", shadowBlur: 14, shadowOffsetX: 0, shadowOffsetY: 2,
          backgroundColor: "transparent", x: 50, y: 50, align: "center",
          animationIn: "fade", animationOut: "fade", animationDuration: 1.2,
        },
      },
      {
        name: "임팩트",
        sample: "충격 반전",
        patch: {
          fontFamily: "Jua", fontSize: 72, fontWeight: 700,
          color: "#FFD93D", strokeColor: "#1A1A1A", strokeWidth: 6,
          shadowColor: "rgba(0,0,0,0.9)", shadowBlur: 4, shadowOffsetX: 4, shadowOffsetY: 4,
          backgroundColor: "transparent", x: 50, y: 45, align: "center",
          animationIn: "bounce", animationOut: "zoom-out", animationDuration: 0.5,
        },
      },
    ],
  },
  {
    group: "예능 자막",
    emoji: "🤣",
    presets: [
      {
        name: "예능 노랑",
        sample: "이게 되네?!",
        patch: {
          fontFamily: "Jua", fontSize: 54, fontWeight: 700,
          color: "#FFE94A", strokeColor: "#000000", strokeWidth: 6,
          shadowColor: "rgba(0,0,0,0.85)", shadowBlur: 2, shadowOffsetX: 3, shadowOffsetY: 3,
          backgroundColor: "transparent", x: 50, y: 80, align: "center",
          animationIn: "pop", animationOut: "fade", animationDuration: 0.3,
        },
      },
      {
        name: "충격 강조",
        sample: "뭐?!",
        patch: {
          fontFamily: "Black Han Sans", fontSize: 76, fontWeight: 700,
          color: "#FF4D4D", strokeColor: "#FFFFFF", strokeWidth: 4,
          shadowColor: "rgba(0,0,0,0.8)", shadowBlur: 8, shadowOffsetX: 0, shadowOffsetY: 4,
          backgroundColor: "transparent", x: 50, y: 45, align: "center",
          animationIn: "shake", animationOut: "fade", animationDuration: 0.6,
        },
      },
      {
        name: "깨알 코멘트",
        sample: "(사실 좀 떨림)",
        patch: {
          fontFamily: "Gaegu", fontSize: 34, fontWeight: 700,
          color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 3,
          shadowBlur: 0, backgroundColor: "transparent",
          x: 50, y: 72, align: "center",
          animationIn: "slide-up", animationOut: "fade", animationDuration: 0.3,
        },
      },
    ],
  },
  {
    group: "뉴스 / 정보",
    emoji: "📰",
    presets: [
      {
        name: "뉴스 속보",
        sample: "속보: 오늘 점심 메뉴 확정",
        patch: {
          fontFamily: "Noto Sans KR", fontSize: 38, fontWeight: 900,
          color: "#FFFFFF", strokeWidth: 0, shadowBlur: 0,
          backgroundColor: "#C0392B", bgPadding: 14, bgBorderRadius: 0,
          x: 50, y: 88, align: "center",
          animationIn: "slide-left", animationOut: "none", animationDuration: 0.4,
        },
      },
      {
        name: "정보 자막바",
        sample: "꿀팁: 저장은 자주, 후회는 없게",
        patch: {
          fontFamily: "Noto Sans KR", fontSize: 34, fontWeight: 700,
          color: "#FFFFFF", strokeWidth: 0, shadowBlur: 0,
          backgroundColor: "#111111", bgPadding: 12, bgBorderRadius: 6,
          x: 50, y: 88, align: "center",
          animationIn: "fade", animationOut: "fade", animationDuration: 0.3,
        },
      },
      {
        name: "인터뷰 이름표",
        sample: "김철수 / 6학년",
        patch: {
          fontFamily: "Do Hyeon", fontSize: 30, fontWeight: 400,
          color: "#FFFFFF", strokeWidth: 0, shadowBlur: 0,
          backgroundColor: "#2C5FB8", bgPadding: 10, bgBorderRadius: 4,
          x: 20, y: 82, align: "left",
          animationIn: "slide-right", animationOut: "fade", animationDuration: 0.35,
        },
      },
    ],
  },
  {
    group: "대사 / 내레이션",
    emoji: "💬",
    presets: [
      {
        name: "영화 자막",
        sample: "그날, 모든 게 시작됐다.",
        patch: {
          fontFamily: "Nanum Gothic", fontSize: 34, fontWeight: 700,
          color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 1.5,
          shadowColor: "rgba(0,0,0,0.8)", shadowBlur: 4, shadowOffsetX: 0, shadowOffsetY: 1,
          backgroundColor: "transparent", x: 50, y: 90, align: "center",
          animationIn: "fade", animationOut: "fade", animationDuration: 0.25,
        },
      },
      {
        name: "내레이션",
        sample: "그렇게 우리는 떠났다",
        patch: {
          fontFamily: "Gowun Batang", fontSize: 38, fontWeight: 400, italic: true,
          color: "#F5F0E8", strokeWidth: 0,
          shadowColor: "rgba(0,0,0,0.6)", shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 2,
          backgroundColor: "transparent", x: 50, y: 85, align: "center",
          animationIn: "fade", animationOut: "fade", animationDuration: 1.0,
        },
      },
      {
        name: "말풍선",
        sample: "안녕!",
        patch: {
          fontFamily: "Hi Melody", fontSize: 42, fontWeight: 400,
          color: "#222222", strokeWidth: 0, shadowBlur: 0,
          backgroundColor: "#FFFFFF", bgPadding: 16, bgBorderRadius: 20,
          x: 50, y: 30, align: "center",
          animationIn: "pop", animationOut: "zoom-out", animationDuration: 0.35,
        },
      },
    ],
  },
  {
    group: "감성 / 브이로그",
    emoji: "🌿",
    presets: [
      {
        name: "브이로그 감성",
        sample: "오후 세 시의 햇살",
        patch: {
          fontFamily: "Gowun Dodum", fontSize: 38, fontWeight: 400,
          color: "#FFF8E7", strokeWidth: 0, letterSpacing: 2,
          shadowColor: "rgba(0,0,0,0.45)", shadowBlur: 8, shadowOffsetX: 0, shadowOffsetY: 2,
          backgroundColor: "transparent", x: 50, y: 82, align: "center",
          animationIn: "fade", animationOut: "fade", animationDuration: 0.8,
        },
      },
      {
        name: "손글씨 메모",
        sample: "오늘도 수고했어",
        patch: {
          fontFamily: "Nanum Pen Script", fontSize: 56, fontWeight: 400,
          color: "#FFFFFF", strokeWidth: 0,
          shadowColor: "rgba(0,0,0,0.5)", shadowBlur: 6, shadowOffsetX: 1, shadowOffsetY: 2,
          backgroundColor: "transparent", x: 50, y: 50, align: "center",
          animationIn: "slide-up", animationOut: "fade", animationDuration: 0.6,
        },
      },
      {
        name: "여행 캡션",
        sample: "DAY 1 · 제주",
        patch: {
          fontFamily: "Sunflower", fontSize: 36, fontWeight: 700,
          color: "#FFFFFF", strokeWidth: 0, letterSpacing: 4,
          shadowColor: "rgba(0,0,0,0.55)", shadowBlur: 6, shadowOffsetX: 0, shadowOffsetY: 2,
          backgroundColor: "rgba(0,0,0,0.0)" as string, x: 14, y: 12, align: "left",
          animationIn: "slide-right", animationOut: "fade", animationDuration: 0.5,
        },
      },
    ],
  },
  {
    group: "쇼츠 / SNS",
    emoji: "📱",
    presets: [
      {
        name: "쇼츠 캡션",
        sample: "3초 만에 끝내는 꿀팁",
        patch: {
          fontFamily: "Black Han Sans", fontSize: 56, fontWeight: 700,
          color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 4,
          shadowBlur: 0, backgroundColor: "transparent",
          x: 50, y: 70, align: "center", lineHeight: 1.25,
          animationIn: "pop", animationOut: "fade", animationDuration: 0.25,
        },
      },
      {
        name: "틱톡 박스",
        sample: "팔로우 必",
        patch: {
          fontFamily: "Jua", fontSize: 46, fontWeight: 700,
          color: "#FFFFFF", strokeWidth: 0, shadowBlur: 0,
          backgroundColor: "#FE2C55", bgPadding: 10, bgBorderRadius: 8,
          x: 50, y: 60, align: "center",
          animationIn: "zoom-in", animationOut: "zoom-out", animationDuration: 0.3,
        },
      },
      {
        name: "네온 해시태그",
        sample: "#오늘의기록",
        patch: {
          fontFamily: "Do Hyeon", fontSize: 38, fontWeight: 400,
          color: "#3DF0FF", strokeWidth: 0,
          shadowColor: "#3DF0FF", shadowBlur: 16, shadowOffsetX: 0, shadowOffsetY: 0,
          backgroundColor: "transparent", x: 50, y: 12, align: "center",
          animationIn: "blink", animationOut: "fade", animationDuration: 0.6,
        },
      },
    ],
  },
];
