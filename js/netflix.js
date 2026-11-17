// 넷플릭스 시청 기록 파일(NetflixViewingHistory.csv)로 본 작품을 한 번에 체크한다.
// 파일은 휴대폰·컴퓨터 안에서만 읽고, 작품 이름만 TMDB 검색에 쓴다 (파일 자체는 어디에도 보내지 않는다).
//
// 파일 모양:  Title,Date
//            "오징어 게임: 시즌 1: 1화","21. 10. 3."
//            "기생충","20. 2. 1."
// 드라마는 "작품 이름: 시즌: 회차" 처럼 쌍점(:)으로 이어져 있어서, 앞부분만 떼어 작품 이름으로 쓴다.

const MAX_TITLES = 150;   // 너무 오래 걸리지 않도록 최근 작품 150개까지만
const AT_ONCE = 4;        // TMDB에 동시에 4개씩만 물어본다

// "시즌 2", "Season 1", "파트 1", "1화", "에피소드 3", "리미티드 시리즈", "Chapter 1" 같은 회차 표시
const EPISODE_PART = /(시즌|season|파트|part|에피소드|episode|리미티드|limited|챕터|chapter|볼륨|volume|시리즈|series|\d+\s*화|제\s*\d+\s*화|\d+\s*회)/i;

/** CSV 한 줄을 칸으로 나눈다 (따옴표 안의 쉼표는 나누지 않음) */
function splitLine(line) {
  const cells = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { cells.push(cur); cur = ''; }
    else cur += ch;
  }
  cells.push(cur);
  return cells;
}

/** 시청 기록 한 줄의 제목 → 작품 이름 */
export function showName(title) {
  const parts = title.split(': ').map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[0];
  if (parts.length === 2 && EPISODE_PART.test(parts[1])) return parts[0];
  return title.trim();
}

/** 파일 내용 → 겹치지 않는 작품 이름 목록 (최근에 본 순서) */
export function parseViewingHistory(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = splitLine(lines[0]).map((x) => x.trim().toLowerCase());
  const col = Math.max(0, head.indexOf('title'));
  const start = head.includes('title') ? 1 : 0;
  const names = [];
  const seen = new Set();
  for (const line of lines.slice(start)) {
    const title = splitLine(line)[col];
    if (!title) continue;
    const name = showName(title);
    const k = simple(name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    names.push(name);
    if (names.length >= MAX_TITLES) break;
  }
  return names;
}

/** 비교용: 띄어쓰기·기호를 빼고 소문자로 */
export function simple(s) {
  return (s || '').toLowerCase().replace(/[\s\-–—:·.,!?'"’()[\]~]/g, '');
}

/** 검색 결과 중에서 이름이 같은(또는 거의 같은) 작품 하나 고르기. 확실하지 않으면 고르지 않는다. */
export function bestMatch(name, results) {
  const want = simple(name);
  if (!want) return null;
  const exact = results.find((it) => simple(it.title) === want);
  if (exact) return exact;
  const first = results[0];
  if (!first) return null;
  const got = simple(first.title);
  // 한쪽 이름이 다른 쪽에 통째로 들어 있으면 같은 작품으로 본다 (예: "더 글로리" ↔ "더 글로리 파트2")
  if (want.length >= 2 && got.length >= 2 && (got.includes(want) || want.includes(got))) return first;
  return null;
}

/**
 * 작품 이름들을 TMDB에서 찾아서 본 작품으로 체크한다.
 * onProgress(done, total)로 진행 상황을 알려 주고, 결과로 { found: [작품], missed: [이름] }을 돌려준다.
 */
export async function importNames(names, search, onProgress) {
  const found = [];
  const missed = [];
  let next = 0;
  let done = 0;
  const keys = new Set();
  async function worker() {
    while (next < names.length) {
      const name = names[next++];
      try {
        const hit = bestMatch(name, await search(name));
        if (hit && !keys.has(hit.key)) { keys.add(hit.key); found.push(hit); }
        else if (!hit) missed.push(name);
      } catch {
        missed.push(name);
      }
      done++;
      onProgress(done, names.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(AT_ONCE, names.length) }, worker));
  return { found, missed };
}
