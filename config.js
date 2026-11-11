// Firebase 프로젝트 연결값 (공개용 값 · 보안은 Firestore 보안 규칙이 담당)
// 입고도우미 · 재고조사 전용 새 프로젝트 (기존 공사 · 오픈지원 = daiso-contract 와 따로)
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDn_BZWdcuxnySjUVDq-6NMWzi7u8sbZF8",
  authDomain: "daiso-store-safety.firebaseapp.com",
  projectId: "daiso-store-safety",
  storageBucket: "daiso-store-safety.firebasestorage.app",
  messagingSenderId: "492876050013",
  appId: "1:492876050013:web:aaae9285913628da4167b4"
};
// 사진·서류·메일·PDF 담당 중계 Apps Script 주소 (프로젝트 "☆입고재고 중계(firebase)")
window.APP_CONFIG = { APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzaEIgF0mvDQbcsAECW21FZHd6Nl3ess_OPeIFWThUk7TXMb-UrOhvpsChzpbU3m0fc/exec' };

/* 휴대폰 저장값(localStorage) 따로 쓰기: 기존 앱(newjuna.github.io/Contract-Firebase)과 주소 앞부분이 같아서
 * 그대로 두면 로그인 구분 · 화면 저장값이 섞임 → 이 앱의 저장 이름 앞에 'SS:'를 붙여 따로 보관 (다른 파일은 고치지 않음) */
(function () {
  try {
    const P = 'SS:', S = window.localStorage, g = S.getItem.bind(S), s = S.setItem.bind(S), r = S.removeItem.bind(S), k = S.key.bind(S);
    const mine = () => { const a = []; for (let i = 0; i < S.length; i++) { const x = k(i); if (x && x.indexOf(P) === 0) a.push(x); } return a; };
    const W = { getItem: (x) => g(P + x), setItem: (x, v) => s(P + x, String(v)), removeItem: (x) => r(P + x),
      key: (i) => { const x = mine()[i]; return x == null ? null : x.slice(P.length); }, clear: () => mine().forEach(r), get length() { return mine().length; } };
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => W });
  } catch (e) { /* 저장소를 못 쓰는 브라우저면 그대로 */ }
})();
