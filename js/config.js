// 앱 전체에서 쓰는 이름표, 장르 연결표, 꽃 테마 색을 한곳에 모아 둔 파일.
// 문구나 색을 바꾸고 싶으면 이 파일만 고치면 된다.

export const APP_NAME = '봄볼래';

export const KINDS = { drama: '드라마', movie: '영화', anime: '애니' };
export const KIND_HINT = { drama: '시리즈로 쭉 보는 재미', movie: '두 시간 안에 끝나는 한 편', anime: '극장판도, 시리즈도' };

// 설문 2번: 볼 때 중요한 것 = 취향 꼬리표
export const TAGS = { twist: '반전·떡밥', chem: '캐릭터 케미', fast: '빠른 전개', fun: '웃음 포인트', real: '현실 공감', mood: '영상미·분위기' };
export const TAG_HINT = { twist: '끝까지 못 놓는 전개', chem: '둘이 붙으면 설렘', fast: '고구마 없는 사이다', fun: '보다가 빵 터지는', real: '내 얘기 같은', mood: '장면마다 예쁜' };

// 설문 3번: 피하고 싶은 것
export const DIS = { violent: '잔인한 장면', long: '너무 긴 시리즈', scary: '무서운 장면', slowburn: '잔잔한 이야기' };
export const DIS_HINT = { violent: '전쟁·폭력이 많은', long: '시즌 3개 이상, 50화 넘는', scary: '공포·호러 장르', slowburn: '사건보다 일상 위주' };

// 설문 4번: 보는 습관
export const HABITS = [
  { id: 'binge', label: '몰아보기', hint: '주말에 한 번에 쭉 달려요' },
  { id: 'daily', label: '하루 한두 편', hint: '자기 전에 조금씩 봐요' },
  { id: 'light', label: '틀어놓고 가볍게', hint: '밥 먹으면서, 딴짓하면서' }
];

// 추천 이유 문장
export const REASON = {
  twist: '반전과 떡밥이 있는 장르라 다음 내용이 궁금해져요',
  chem: '인물들 사이 관계와 케미가 중심인 작품이에요',
  fast: '사건이 계속 터지는 장르라 지루할 틈이 없어요',
  fun: '가볍게 웃으면서 보기 좋은 장르예요',
  real: '사람 사는 이야기라 공감되는 장면이 많아요',
  mood: '세계관과 분위기를 즐기기 좋은 작품이에요'
};
// 추천 화면의 가로 줄 제목 (설문에서 고른 '중요한 것'마다 한 줄)
export const ROW_TITLE = {
  twist: '반전이 끝까지 이어지는 작품',
  chem: '케미에 설레는 작품',
  fast: '전개가 시원시원한 작품',
  fun: '웃으면서 가볍게 보기 좋은 작품',
  real: '내 얘기 같아 공감되는 작품',
  mood: '분위기에 푹 빠지는 작품'
};
export const WARN = {
  violent: '전쟁·폭력 장면이 나올 수 있어요',
  scary: '공포 장르라 무서운 장면이 있어요',
  long: '시즌·회차가 많은 긴 작품이에요',
  slowburn: '사건보다 잔잔한 이야기 위주예요'
};

// TMDB 장르 번호 → 우리 앱의 취향 꼬리표
export const GENRE_TAGS = {
  28: ['fast'], 12: ['fast', 'mood'], 35: ['fun'], 80: ['twist'], 99: ['real'], 18: ['real'], 10751: ['fun'],
  14: ['mood'], 36: ['real', 'mood'], 27: ['twist'], 10402: ['mood'], 9648: ['twist'], 10749: ['chem'],
  878: ['twist', 'mood'], 53: ['twist', 'fast'], 10752: ['real'], 37: ['fast'],
  10759: ['fast'], 10765: ['mood', 'twist'], 10766: ['chem'], 10768: ['real']
};
export const GENRE_NAME = {
  28: '액션', 12: '모험', 16: '애니메이션', 35: '코미디', 80: '범죄', 99: '다큐', 18: '드라마', 10751: '가족',
  14: '판타지', 36: '역사', 27: '공포', 10402: '음악', 9648: '미스터리', 10749: '로맨스', 878: 'SF', 53: '스릴러',
  10752: '전쟁', 37: '서부', 10759: '액션·모험', 10765: 'SF·판타지', 10766: '연속극', 10768: '전쟁·정치'
};
// 찾기 화면의 장르 버튼: TMDB 장르 번호를 사람이 알기 쉬운 묶음으로 (드라마용·영화용 번호가 달라서 함께 묶음)
export const GENRE_GROUPS = [
  { id: 'romance', name: '로맨스', ids: [10749] },
  { id: 'comedy', name: '코미디', ids: [35] },
  { id: 'thriller', name: '스릴러·미스터리', ids: [53, 9648] },
  { id: 'action', name: '액션', ids: [28, 10759, 12] },
  { id: 'fantasy', name: '판타지·SF', ids: [14, 878, 10765] },
  { id: 'crime', name: '범죄', ids: [80] },
  { id: 'drama', name: '드라마', ids: [18] },
  { id: 'horror', name: '공포', ids: [27] },
  { id: 'family', name: '가족', ids: [10751] },
  { id: 'docu', name: '다큐', ids: [99] }
];

// 찾기 화면의 정렬
export const SORTS = [
  { id: 'rec', name: '추천순' },
  { id: 'new', name: '최신순' },
  { id: 'rating', name: '평점순' },
  { id: 'popular', name: '인기순' }
];

// 뉴스·예능·토크쇼·키즈는 추천 대상에서 뺀다
export const EXCLUDE_GENRES = [10763, 10764, 10767, 10762];

export const IMG_BASE = 'https://image.tmdb.org/t/p/';
export const POSTER_COLORS = ['#F7C9D4', '#E9D6F2', '#FBE3C8', '#D7ECEA', '#F3D9E6', '#DCE4F7', '#FBE7D9', '#E4ECF5', '#FDE9C9'];

// 꽃 테마: 고르면 css 변수 값이 통째로 바뀐다
export const THEMES = {
  sakura:    { name: '벚꽃', sub: '딸기우유 핑크', bg: '#FFF6F8', soft: '#FCE8ED', accent: '#E89AAE', deep: '#A8425F', ink: '#3D2B33', muted: '#7A5A66', line: '#F3DDE3' },
  lavender:  { name: '라벤더', sub: '연보라', bg: '#F8F5FD', soft: '#EEE6FA', accent: '#C3ADE8', deep: '#6C4BA6', ink: '#33294A', muted: '#665A80', line: '#E3D9F4' },
  hydrangea: { name: '수국', sub: '하늘빛', bg: '#F3F8FE', soft: '#E3EEFB', accent: '#9FC2EF', deep: '#2F5E9E', ink: '#233449', muted: '#53657D', line: '#D6E4F5' },
  sunflower: { name: '해바라기', sub: '레몬 노랑', bg: '#FFFBEF', soft: '#FBF0CC', accent: '#F2CF5B', deep: '#8A6410', ink: '#3A3018', muted: '#6E6243', line: '#F2E5BA' },
  tulip:     { name: '튤립', sub: '살구 코랄', bg: '#FFF6F1', soft: '#FCE5DC', accent: '#F3A08C', deep: '#A4472F', ink: '#40281F', muted: '#7A5B50', line: '#F4DCD2' }
};
