// 브라우저 저장소(localStorage) 읽기/쓰기.
// 사생활 보호 모드처럼 저장소를 못 쓰는 환경에서도 앱이 멈추지 않도록 오류를 삼킨다.

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 실패해도 앱은 계속 동작 */
  }
}
