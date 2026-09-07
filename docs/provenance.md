# 자산 출처와 검증 범위

## 이 프로젝트의 새 자산

외부 이미지·스프라이트를 가져오거나 생성형 이미지 도구를 사용하지 않았습니다. 이 게임은 운영체제 UI와 선·다각형으로 표현되는 파손이 중심이라 원본 편집이 가능한 Canvas/DOM 그래픽을 선택했습니다. `imagegen`을 필요한 비트맵 대신 벡터로 우회한 것이 아니라, 처음부터 코드 네이티브로 적합한 아이콘·UI·효과를 직접 그린 작업입니다.

| 자산 | 소스 |
|---|---|
| 청록 바탕화면과 플라밍고 워터마크 | `src/render.js`의 `drawWallpaper` |
| 열대 바다 플라밍고 엽서 | `drawPostcard`, `flamingo` — 새 원화 |
| 컴퓨터·메모·폴더·사진·프롬프트·휴지통·로고 | `drawIcon` — 새 아이콘 |
| 6도구와 물리 커서 | `drawTool` — 새 그림 |
| 균열·절단·탄흔·그을음·인쇄·벌레 | `drawMark`, `renderEffects` — 새 효과 |
| 효과음 | `src/main.js`의 Web Audio oscillator — 새 합성음 |
| 글꼴 | npm `galmuri@2.40.3`, Galmuri11 WOFF2, SIL OFL 1.1 |

Galmuri: [공식 저장소](https://github.com/quiple/galmuri), [함께 배포하는 OFL 라이선스](../public/licenses/Galmuri-OFL.md). 저작권 고지와 라이선스 전문을 `public/licenses/Galmuri-OFL.md`에 보존하며 빌드 출력의 `licenses/`에도 포함합니다. 브라우저 빌드는 사용하는 WOFF2만 포함하고, CPU 효과 캡처는 동일 패키지의 TTF를 읽습니다.

## 참고 자료

- [MacUpdate Desktop Destroyer](https://desktop-destroyer.macupdate.com/): 6도구 목록과 Mac판 화면 관찰.
- [Casual Desktop Game](https://store.steampowered.com/app/1001860/Casual_Desktop_Game/): Daniel Brendel이 배포한 팬 부활판의 소개 및 조작 설명.

관찰 캡처와 원작 실행 파일은 이 저장소에 포함하지 않습니다. Mac판 화면을 정확한 Windows 원작이라고 소개하지 않습니다. Microsoft·Apple의 로고·바탕화면·아이콘 파일도 포함하지 않습니다. Flamingo 98은 실제 OS나 제휴 상품이 아닌 게임 속 허구의 OS입니다.

## 검증을 구분해서 보기

- 엔진 테스트: 도구별 효과, 지속성, 입력 큐, 취소·복구, 정지, 시간 초과, 3단계 성공. 성공은 공개된 도구 선택·클릭·드래그·시간 업데이트만으로 진행하며 목표값을 직접 쓰지 않습니다.
- 빌드: Vite 정적 번들 생성.
- `docs/previews/cpu-effects.png`: 동일 효과 렌더러의 CPU 전시. DOM 창과 실제 포인터는 포함하지 않으며 **브라우저 캡처가 아닙니다**.
- 실제 창 드래그, 최소화/복원, 여섯 도구, 세 단계 도전 완주, 정지와 수정 후 최종 HUD를 [별도 브라우저 검수](browser-qa.md)로 확인했습니다. 27개 CPU 테스트만으로 확인했다고 주장하지 않습니다. 모바일 실제 기기와 오디오 청취는 미검증입니다.
