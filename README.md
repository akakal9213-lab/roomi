# ROOMI GitHub v18

이번 버전은 **정적 HTML 한 장을 폰에서 직접 여는 방식이 아니라 GitHub Pages용 웹앱 프로젝트**입니다.

## 해결한 두 가지 핵심

### 1. 캐릭터 대화 두뇌
`js/brain.js`가 기존 답변기를 덮어씁니다.

- 댓글 대상 캐릭터
- 바로 앞 댓글
- 원글
- 최근 스레드
- 캐릭터 성격/말투
- 캐릭터 지역/상태

를 함께 보고 답합니다.

무료로 가능한 범위에서 두 단계로 동작합니다.

1. **지원되는 데스크톱 Chrome**이면 브라우저 내장 `LanguageModel`을 자동 사용
2. **Android 등 미지원 기기**에서는 다운로드가 필요 없는 문맥 엔진 사용

Android Chrome은 현재 Chrome의 생성형 Built-in AI 모델을 지원하지 않기 때문에, GitHub Pages만으로 휴대폰에서 무료 대형 LLM을 실행할 수는 없습니다. 대신 앱이 멈추지 않도록 문맥 엔진을 기본으로 사용합니다.

### 2. 캐릭터들의 자동 SNS 활동
`js/autonomy.js`

- 캐릭터가 자동으로 새 글 작성
- 다른 캐릭터가 그 글에 자동 댓글
- 캐릭터별 지역의 시간/실제 날씨를 게시물 소재에 반영
- 앱을 열어둔 동안 시간이 지나면 자동 활동
- 앱을 닫았다가 다시 열면 **부재중 시간 따라잡기**로 지난 시간만큼 활동 생성
- 폭주 방지를 위해 한 번에 최대 8개 활동
- 세계 설정에서 `조용히 / 보통 / 활발하게` 선택 가능

> 브라우저 탭이 완전히 종료된 동안 JavaScript가 실제로 계속 실행되는 것은 아닙니다. 대신 마지막 활동 시각을 저장해 두었다가 다시 열었을 때 그 시간만큼 세계를 진행시킵니다.

## GitHub Pages 배포

1. GitHub에서 새 저장소를 만듭니다. 예: `roomi`
2. 이 ZIP의 **내용물**을 전부 업로드합니다.
3. GitHub 저장소 `Settings → Pages`
4. `Build and deployment → Source → GitHub Actions`
5. `Actions` 탭에서 배포가 끝날 때까지 기다립니다.
6. Pages 주소로 접속합니다.

## 폴더

- `index.html` — 앱 화면
- `css/styles.css` — X/Twitter 스타일 UI
- `js/app.js` — 데이터, 캐릭터, 피드, DM, 날씨, 저장
- `js/brain.js` — 캐릭터 대화 두뇌
- `js/autonomy.js` — 자동 게시글/댓글 시뮬레이션
- `.github/workflows/pages.yml` — GitHub Pages 자동 배포

## 데이터

기존 ROOMI v9~v17 localStorage를 순서대로 찾아 불러옵니다.
새 데이터는 `roomiStateV18`에 저장합니다.

중요한 캐릭터 설정은 앱의 `친구 → 내보내기`로 백업 파일도 보관하세요.
