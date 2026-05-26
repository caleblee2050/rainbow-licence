# Rainbow Licence — Agent Instructions

## Project Overview
한국 국가기술자격증 학습 PWA. 다문화 학교(NEXT SCHOOL) 학생 + 공공사업 평가위원이 1차 사용자/의사결정자.
상세: `docs/superpowers/specs/2026-05-26-rainbow-licence-beta-design.md`

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing
When the user's request matches an available skill, invoke it via the Skill tool.
- 디자인 시스템/플랜 리뷰 → `/design-consultation` 또는 `/plan-design-review`
- 화면 변형 비교 → `/design-shotgun`
- 디자인 게이트형 검증 → `/design-review`
- 버그/에러 → `/investigate`
- QA/테스트 → `/qa` 또는 `/qa-only`
- 코드 리뷰 → `/review`
- 배포/PR → `/ship` 또는 `/land-and-deploy`
