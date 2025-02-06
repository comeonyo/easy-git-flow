# Easy Git Flow

Easy Git Flow는 JIRA 티켓 번호를 기반으로 release candidate 브랜치를 자동으로 생성해주는 CLI 도구입니다. Git 작업 프로세스를 간소화하고 실수를 줄이는 것을 목표로 합니다.

## 주요 기능

Easy Git Flow는 다음과 같은 작업을 자동화합니다:

- develop 브랜치에서 특정 JIRA 티켓 번호가 포함된 커밋들을 검색
- 검색된 커밋들을 새로운 release candidate 브랜치에 자동으로 cherry-pick
- 작업 진행 상황을 실시간으로 표시
- 문제 발생 시 자동 롤백

## 설치 방법

npm을 통해 전역으로 설치할 수 있습니다:

```bash
npm install -g easy-git-flow
```

## 사용 방법

기본적인 사용법은 다음과 같습니다:

```bash
easy-git-flow -t TICKET-123
```

### 사용 가능한 옵션들

```bash
Options:
  -V, --version                  버전 정보 출력
  -t, --ticket <ticketId>       JIRA 티켓 번호 (필수)
  -r, --release <releaseName>   Release candidate 브랜치 이름 (기본: release/<오늘날짜>)
  -p, --prod <prodBranch>       운영 베이스 브랜치 (기본: master)
  -d, --develop <developBranch> 개발 브랜치 (기본: develop)
  -h, --help                    도움말 출력
```

### 사용 예시

1. 기본 사용법 (티켓 번호만 지정):
```bash
easy-git-flow -t PROJ-123
```

2. 커스텀 릴리스 브랜치 이름 지정:
```bash
easy-git-flow -t PROJ-123 -r release/feature-login
```

3. 다른 브랜치 이름 사용:
```bash
easy-git-flow -t PROJ-123 -p main -d development
```

## 동작 방식

1. 지정된 티켓 번호로 develop 브랜치에서 관련 커밋들을 검색합니다.
2. 검색된 커밋 목록을 표시합니다.
3. production 브랜치(기본값: master)에서 새로운 release 브랜치를 생성합니다.
4. 찾은 커밋들을 순서대로 cherry-pick 합니다.
5. 모든 과정이 완료되면 성공 메시지를 표시합니다.

## 에러 처리

- cherry-pick 충돌 발생 시 자동으로 abort하고 에러 메시지를 표시합니다.
- 티켓 번호가 포함된 커밋을 찾지 못한 경우 적절한 메시지를 표시합니다.
- git 명령어 실행 중 발생하는 모든 에러를 포착하고 사용자에게 알립니다.

## 개발 환경 설정

소스 코드를 직접 실행하거나 수정하고 싶은 경우:

```bash
# 저장소 클론
git clone https://github.com/your-username/easy-git-flow.git

# 디렉토리 이동
cd easy-git-flow

# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 로컬에서 실행
npm start -- -t TICKET-123
```

## 기여하기

버그를 발견하셨거나 새로운 기능을 제안하고 싶으시다면 GitHub Issue를 생성해주세요. Pull Request도 환영합니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 LICENSE 파일을 참조하세요.