var CAPTURE_FILE_NAME = '화면 저장.png';
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1020;
const stage = document.querySelector('#stage');

function scaleStage() {
    const scale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
    stage.style.setProperty('--stage-scale', scale);
}

function setLayerVisible(layer, visible) {
    layer.classList.toggle('is-visible', visible);
    layer.setAttribute('aria-hidden', String(!visible));
}

function setToggleState(button, expanded) {
    button.setAttribute('aria-expanded', String(expanded));
    const label = button.getAttribute('aria-label') || '';
    button.setAttribute(
        'aria-label',
        expanded ? label.replace('펼치기', '접기') : label.replace('접기', '펼치기')
    );
}

// 카드가 닫힐 때 카드 열림 상태 및 내부 말풍선 퀴즈 상태 일괄 초기화
function resetCards(layer) {
    layer.querySelectorAll('.concept-card').forEach((card) => {
        card.classList.remove('is-revealed');
        card.querySelectorAll('.mini-question').forEach((button) => {
            button.classList.remove('is-hidden');
        });
    });
}

function closeCardLayer(layer) {
    setLayerVisible(layer, false);
    resetCards(layer);
}

function closeAllCardLayers() {
    document.querySelectorAll('.cards-layer').forEach(closeCardLayer);
}

function closeTopics() {
    setLayerVisible(document.querySelector('#topics'), false);
    document.querySelectorAll('.toggle').forEach((button) => setToggleState(button, false));
    closeAllCardLayers();
}

function closeToggleTarget(button, target) {
    if (target.id === 'topics') {
        closeTopics();
        return;
    }
    setToggleState(button, false);
    closeCardLayer(target);
}

function openToggleTarget(button, target) {
    setToggleState(button, true);
    setLayerVisible(target, true);
}

window.addEventListener('resize', scaleStage);
scaleStage();

// 1단계 & 2단계 토글 버튼 이벤트
document.querySelectorAll('.toggle').forEach((button) => {
    button.addEventListener('click', () => {
        const target = document.getElementById(button.getAttribute('aria-controls'));
        const expanded = button.getAttribute('aria-expanded') === 'true';

        if (expanded) {
            closeToggleTarget(button, target);
            return;
        }
        openToggleTarget(button, target);
    });
});

// 대문짝 물음표 클릭 시 카드 내용 오픈
document.querySelectorAll('.question').forEach((button) => {
    button.addEventListener('click', () => {
        button.closest('.concept-card').classList.add('is-revealed');
    });
});

// 미니 물음표(?) 누르면 정답 토글 (사라지는 게 아니라 클래스만 토글)
document.querySelectorAll('.mini-question').forEach((button) => {
    button.addEventListener('click', (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        button.classList.toggle('is-hidden');
    });
});

// script.js 하단에 추가

// [수정] 1. 전체 열기 / 전체 닫기 토글 기능 (말풍선 퀴즈 연동)
const btnAllOpen = document.querySelector('#btn-all-open');
btnAllOpen.addEventListener('click', () => {
    // 현재 버튼이 '전체 열기' 상태인지 확인 (텍스트 기준)
    const isOpening = btnAllOpen.textContent === '전체 열기';

    if (isOpening) {
        // --------------------------------------------------
        // [전체 열기 로직]
        // --------------------------------------------------
        btnAllOpen.textContent = '전체 닫기';
        btnAllOpen.style.background = '#1c2438'; // 닫기 상태일 때 버튼 색상 변경 (선택 사항)

        // 1단계 & 2단계 모든 토글 버튼 활성화
        document.querySelectorAll('.toggle').forEach((button) => {
            setToggleState(button, true);
        });

        // 모든 브랜치 및 카드 레이어 표시
        document.querySelectorAll('.branch-layer, .cards-layer').forEach((layer) => {
            setLayerVisible(layer, true);
        });

        // 모든 개념 카드 내용 공개 (대형 물음표 숨기기)
        document.querySelectorAll('.concept-card').forEach((card) => {
            card.classList.add('is-revealed');
        });

        // ★ [추가] 모든 말풍선 퀴즈(quiz-balloon)의 미니 물음표 숨겨서 정답 공개
        document.querySelectorAll('.mini-question').forEach((button) => {
            button.classList.add('is-hidden');
        });
    } else {
        // --------------------------------------------------
        // [전체 닫기 로직]
        // --------------------------------------------------
        btnAllOpen.textContent = '전체 열기';
        btnAllOpen.style.background = '#e6683b'; // 원래 주황색으로 복구

        // 모든 토글 버튼 비활성화
        document.querySelectorAll('.toggle').forEach((button) => {
            setToggleState(button, false);
        });

        // 모든 레이어 숨기기
        document.querySelectorAll('.branch-layer, .cards-layer').forEach((layer) => {
            setLayerVisible(layer, false);
        });

        // 모든 개념 카드 및 미니 퀴즈 상태 초기화 (기존 resetCards 함수 활용 가능)
        document.querySelectorAll('.concept-card').forEach((card) => {
            card.classList.remove('is-revealed');
        });
        document.querySelectorAll('.mini-question').forEach((button) => {
            button.classList.remove('is-hidden');
        });
    }
});

// 2. 배율(Zoom) 제어 기능 (기존 scaleStage 함수와 결합하기 위해 변수 도입)
let currentZoom = 100;
let currentMode = 'pointer'; // 'draw', 'erase', 'pointer'
const zoomIndicator = document.querySelector('#zoom-indicator');

// 드래그 상태 관리
let isDragging = false;
let startX = 0,
    startY = 0;
let panX = 0,
    panY = 0;

// 🎨 캔버스 및 필기 드로잉 환경 설정
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==================================================
// 🔄 모드 전환 스위칭 제어 로직
// ==================================================
function switchMode(mode) {
    currentMode = mode;

    // 1. 모든 모드 버튼 클래스 초기화
    document.querySelectorAll('.btn-mode').forEach((btn) => btn.classList.remove('is-active'));
    // 2. body에 걸려있던 커서 관련 모드 클래스 초기화
    document.body.classList.remove('mode-draw', 'mode-erase', 'mode-pointer');

    // 3. 선택한 모드 활성화 활성화
    if (mode === 'draw') {
        document.getElementById('btn-mode-draw').classList.add('is-active');
        document.body.classList.add('mode-draw');
    } else if (mode === 'erase') {
        document.getElementById('btn-mode-erase').classList.add('is-active');
        document.body.classList.add('mode-erase');
    } else {
        document.getElementById('btn-mode-pointer').classList.add('is-active');
        document.body.classList.add('mode-pointer');
    }
}

// 모드 버튼 이벤트 바인딩
document.getElementById('btn-mode-draw').addEventListener('click', () => switchMode('draw'));
document.getElementById('btn-mode-erase').addEventListener('click', () => switchMode('erase'));
document.getElementById('btn-mode-pointer').addEventListener('click', () => switchMode('pointer'));

// ==================================================
// 📐 [수정] 화면 배율(Zoom) 및 드래그 제어 (모든 모드에서 버튼 작동 가능)
// ==================================================
function updateZoom() {
    zoomIndicator.textContent = `${currentZoom} %`;

    const baseScale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
    const finalScale = baseScale * (currentZoom / 100);
    stage.style.setProperty('--stage-scale', finalScale);

    if (currentZoom <= 100) {
        panX = 0;
        panY = 0;
    }
    stage.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${finalScale})`;
}

// 확대 버튼: 이제 그리기/지우개 모드에서도 제한 없이 작동합니다.
document.querySelector('#btn-zoom-in').addEventListener('click', () => {
    if (currentZoom < 200) {
        currentZoom += 10;
        updateZoom();
    }
});

// 축소 버튼: 이제 그리기/지우개 모드에서도 제한 없이 작동합니다.
document.querySelector('#btn-zoom-out').addEventListener('click', () => {
    if (currentZoom > 50) {
        currentZoom -= 10;
        updateZoom();
    }
});

// ==================================================
// 🖱️ 배경 마우스 드래그 이동 (포인터 모드일 때만 동작)
// ==================================================
const viewport = document.querySelector('#viewport');

viewport.addEventListener('mousedown', (e) => {
    if (currentMode !== 'pointer' || currentZoom <= 100) return;
    isDragging = true;
    stage.style.cursor = 'grabbing';
    startX = e.pageX - panX;
    startY = e.pageY - panY;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.pageX - startX;
    panY = e.pageY - startY;
    updateZoom();
});

window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    stage.style.cursor = currentZoom > 100 ? 'grab' : 'default';
});

// ==================================================
// 🖋️ HTML5 Canvas 실제 드로잉 / 지우개 로직 구현
// ==================================================
canvas.addEventListener('mousedown', (e) => {
    if (currentMode === 'pointer') return;
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || currentMode === 'pointer') return;

    if (currentMode === 'draw') {
        ctx.lineTo(e.clientX, e.clientY);
        ctx.strokeStyle = '#e6683b'; // 주황색 펜
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    } else if (currentMode === 'erase') {
        // 지우개 모드: 투명하게 지우는 브러시 효과
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(e.clientX, e.clientY, 20, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.restore();
    }
});

window.addEventListener('mouseup', () => {
    isDrawing = false;
});

// ==================================================
// 📸 [수정] 캡처 기능 (흰 배경 처리 + 필기 레이어 병합 기능)
// ==================================================
document.querySelector('#btn-capture').addEventListener('click', () => {
    const targetElement = document.querySelector('#viewport');
    const toolbar = document.querySelector('#top-toolbar');

    const originalBgColor = targetElement.style.backgroundColor;
    const originalBgImage = targetElement.style.backgroundImage;

    if (toolbar) toolbar.style.visibility = 'hidden';
    targetElement.style.backgroundColor = '#ffffff';
    targetElement.style.backgroundImage = 'none';

    html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
    })
        .then((mapCanvas) => {
            // 원상 복구
            if (toolbar) toolbar.style.visibility = 'visible';
            targetElement.style.backgroundColor = originalBgColor;
            targetElement.style.backgroundImage = originalBgImage;

            // ★ 필기 레이어(Drawing Canvas)와 맵 캡처본을 하나로 합성하기
            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = mapCanvas.width;
            combinedCanvas.height = mapCanvas.height;
            const combinedCtx = combinedCanvas.getContext('2d');

            // 1단계: 흰색 바탕 배경 및 마인드맵 그리기
            combinedCtx.drawImage(mapCanvas, 0, 0);
            // 2단계: 그 위에 필기했던 내용 레이어 그대로 얹기
            combinedCtx.drawImage(canvas, 0, 0);

            const imageData = combinedCanvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.href = imageData;
            downloadLink.download = CAPTURE_FILE_NAME;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        })
        .catch((error) => {
            console.error('캡처 오류:', error);
            if (toolbar) toolbar.style.visibility = 'visible';
            targetElement.style.backgroundColor = originalBgColor;
            targetElement.style.backgroundImage = originalBgImage;
        });
});

// 초기화 호출
updateZoom();

// ==================================================
// 🎵 플레이어 UI 활성화 및 토글 제어 시스템
// ==================================================
const btnPlay = document.querySelector('#btn-play');
const defaultView = document.querySelector('.toolbar-default-view');
const playerLayer = document.querySelector('#player-toolbar-layer');

btnPlay.addEventListener('click', () => {
    // 현재 버튼 상태 체크
    const isPlayingMode = btnPlay.textContent === '▶';

    if (isPlayingMode) {
        // --------------------------------------------------
        // [플레이어 화면 진입 및 버튼을 X로 변경]
        // --------------------------------------------------
        btnPlay.textContent = '❌';
        btnPlay.classList.add('is-close-state');
        btnPlay.setAttribute('aria-label', '플레이어 닫기');

        // 기본 도구모음 밀어내며 페이드아웃 후 플레이어 레이어 등판
        defaultView.classList.add('default-view-fadeout');
        playerLayer.classList.remove('player-view-hidden');
        playerLayer.classList.add('player-view-active');
    } else {
        // --------------------------------------------------
        // [플레이어 종료 및 버튼 복구]
        // --------------------------------------------------
        btnPlay.textContent = '▶';
        btnPlay.classList.remove('is-close-state');
        btnPlay.setAttribute('aria-label', '재생');

        // 플레이어 레이어 숨기고 원래 메뉴 복구
        playerLayer.classList.remove('player-view-active');
        playerLayer.classList.add('player-view-hidden');
        defaultView.classList.remove('default-view-fadeout');
    }
});

// --------------------------------------------------
// 🎛️ 플레이어 내부 요소 이벤트 (프로토타입 기능 확장용)
// --------------------------------------------------
const playPauseBtn = document.getElementById('player-play-pause');
playPauseBtn.addEventListener('click', () => {
    if (playPauseBtn.textContent === '⏸️') {
        playPauseBtn.textContent = '▶️';
    } else {
        playPauseBtn.textContent = '⏸️';
    }
});

const timelineSlider = document.getElementById('player-slider');
const currentTimeIndicator = document.querySelector('.current-time');

// 슬라이더 바를 조작하면 타임 분초 코드가 실시간으로 연동되는 목업 효과
timelineSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    const totalSeconds = TOTAL_PLAYBACK_SECONDS;
    const currentSeconds = Math.floor((value / 100) * totalSeconds);

    const min = String(Math.floor(currentSeconds / 60)).padStart(2, '0');
    const sec = String(currentSeconds % 60).padStart(2, '0');

    currentTimeIndicator.textContent = `${min}:${sec}`;
});

// ==================================================
// 🎵 [전역 설정] 오디오 플레이리스트 및 화면 연동 트리거 정의
// ==================================================
// 파일명, 개수, 내용이 바뀌면 이 테이블(배열)만 수정하면 됩니다.
// - index: 오디오 파일 번호 (6-1_2_ (번호).mp3)
// - duration: 해당 오디오가 재생되는 가상 시간(초)
// - action: 이 오디오 단계에서 실행할 화면 제어 키워드 (switch-case와 연동)
var AUDIO_PLAYLIST_CONFIG = [
    { index: 1, duration: 4, action: 'INTRO' },
    { index: 2, duration: 4, action: 'INTRO' },
    { index: 3, duration: 4, action: 'INTRO' },
    { index: 4, duration: 4, action: 'INTRO' },
    { index: 5, duration: 4, action: 'INTRO' },
    { index: 6, duration: 4, action: 'INTRO' },
    { index: 7, duration: 4, action: 'INTRO' },
    { index: 8, duration: 4, action: 'INTRO' },
    { index: 9, duration: 4, action: 'INTRO' },
    { index: 10, duration: 4, action: 'INTRO' },
    { index: 11, duration: 4, action: 'INTRO' },
    { index: 12, duration: 4, action: 'INTRO' },
    { index: 13, duration: 4, action: 'INTRO' },
    { index: 14, duration: 4, action: 'INTRO' },
    { index: 15, duration: 4, action: 'INTRO' },
    { index: 16, duration: 4, action: 'INTRO' },
    { index: 17, duration: 4, action: 'INTRO' },
    { index: 18, duration: 4, action: 'INTRO' },

    // 19번부터 각기둥 본격 전개
    { index: 19, duration: 4, action: 'PRISM_OPEN' },
    { index: 20, duration: 4, action: 'PRISM_COMPONENTS' },
    { index: 21, duration: 4, action: 'PRISM_QUIZ_SOLVED' },
    { index: 22, duration: 4, action: 'PRISM_NAMES' },
    { index: 23, duration: 4, action: 'PRISM_NAMES' },
    { index: 24, duration: 4, action: 'PRISM_NAMES' },
    { index: 25, duration: 4, action: 'PRISM_NAMES' },

    // 26번부터 각뿔 본격 전개
    { index: 26, duration: 4, action: 'PYRAMID_OPEN' },
    { index: 27, duration: 4, action: 'PYRAMID_COMPONENTS' },
    { index: 28, duration: 4, action: 'PYRAMID_COMPONENTS' },
    { index: 29, duration: 4, action: 'PYRAMID_QUIZ_SOLVED' },
    { index: 30, duration: 4, action: 'PYRAMID_NAMES' },

    // 31번부터 복습 및 하이라이팅 연동
    { index: 31, duration: 4, action: 'REVIEW_START' },
    { index: 32, duration: 4, action: 'REVIEW_PRISM' },
    { index: 33, duration: 4, action: 'REVIEW_PYRAMID' },
    { index: 34, duration: 4, action: 'REVIEW_END' },
    { index: 35, duration: 4, action: 'REVIEW_END' },
    { index: 36, duration: 4, action: 'REVIEW_END' },
    { index: 37, duration: 4, action: 'REVIEW_END' },
];

const audioTimelineMap = [];

let currentAudioElement = null;
let playbackSpeed = 1.0;
let isPlaying = false;
let isRepeatMode = false;
let currentTimelineSeconds = 0;
let playbackTimerInterval = null;

const playerSlider = document.getElementById('player-slider');
const currentTimeText = document.querySelector('.current-time');
const speedBadge = document.getElementById('player-speed');
const speedMenu = document.getElementById('speed-picker-menu');
const volumeSlider = document.getElementById('volume-range-slider');

// ==================================================
// 🎚️ [구현] 볼륨 및 배속 제어 바인딩
// ==================================================
// 1. 볼륨 드래그 연동
volumeSlider.addEventListener('input', (e) => {
    const vol = e.target.value;
    if (currentAudioElement) currentAudioElement.volume = vol;
    document.getElementById('player-volume').textContent = vol == 0 ? '🔇' : vol < 0.5 ? '🔉' : '🔊';
});

// 2. 배속 팝업 선택 제어
speedBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    speedMenu.classList.toggle('speed-menu-hidden');
});
document.addEventListener('click', () => speedMenu.classList.add('speed-menu-hidden'));

speedMenu.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
        speedMenu.querySelectorAll('button').forEach((b) => b.classList.remove('active-speed'));
        btn.classList.add('active-speed');
        playbackSpeed = parseFloat(btn.dataset.speed);
        speedBadge.textContent = `× ${btn.dataset.speed}`;
        if (currentAudioElement) currentAudioElement.defaultPlaybackRate = playbackSpeed;
        if (currentAudioElement) currentAudioElement.playbackRate = playbackSpeed;
    });
});

// 반복 토글
document.getElementById('player-repeat').addEventListener('click', function () {
    isRepeatMode = !isRepeatMode;
    this.style.background = isRepeatMode ? 'rgba(255,255,255,0.4)' : 'transparent';
});

// 전역 설정을 바탕으로 실제 타임라인 초(seconds)를 동적 계산하여 빌드
let TOTAL_PLAYBACK_SECONDS = 0;

AUDIO_PLAYLIST_CONFIG.forEach((item) => {
    audioTimelineMap.push({
        index: item.index,
        filename: `6-1_2_ (${item.index}).mp3`,
        startTime: TOTAL_PLAYBACK_SECONDS,
        endTime: TOTAL_PLAYBACK_SECONDS + item.duration,
        action: item.action,
    });
    TOTAL_PLAYBACK_SECONDS += item.duration;
});

// HTML 인풋 맥스값 동적 셋팅 (전체 시간이 늘어나거나 줄어들어도 슬라이더가 자동 적응합니다)
document.getElementById('player-slider').max = TOTAL_PLAYBACK_SECONDS;
document.querySelector('.total-time').textContent = formatTimeDisplay(TOTAL_PLAYBACK_SECONDS);

// ==================================================
// ⏱️ [리팩토링] 타임라인 및 마인드맵 상태 연동 코어 엔진 (Switch-Case 구조)
// ==================================================
function syncMindmapState(seconds) {
    // 1. 현재 초(seconds)가 속한 타겟 오디오 블록 검출
    const activeClip =
        audioTimelineMap.find((item) => seconds >= item.startTime && seconds < item.endTime) ||
        audioTimelineMap[audioTimelineMap.length - 1];

    // 전역변수 목록에서 추출한 고유 동작 액션 키워드
    const currentAction = activeClip.action;

    // DOM 요소 캐싱
    const topicsLayer = document.querySelector('#topics');
    const prismCardsLayer = document.querySelector('#prism-cards');
    const pyramidCardsLayer = document.querySelector('#pyramid-cards');

    const prismDefCard = document.querySelector('.prism-def');
    const prismCompCard = document.querySelector('.prism-components');
    const prismNamesCard = document.querySelector('.prism-names-dev');

    const pyramidDefCard = document.querySelector('.pyramid-def');
    const pyramidCompCard = document.querySelector('.pyramid-components');
    const pyramidNamesCard = document.querySelector('.pyramid-names');

    // 하이라이팅 아웃라인 이펙트 초기화 리셋
    document.querySelectorAll('.concept-card').forEach((c) => (c.style.outline = 'none'));

    // 2. [Switch-Case] 기반의 가독성 높은 인터랙션 분기 처리
    switch (currentAction) {
        case 'INTRO':
            // 대주제 및 모든 하위 레이어 은닉 (기본 도입부 상태)
            topicsLayer.classList.remove('is-visible');
            prismCardsLayer.classList.remove('is-visible');
            pyramidCardsLayer.classList.remove('is-visible');
            document.querySelector('.center-topic .toggle').setAttribute('aria-expanded', 'false');

            // 모든 내부 카드 숨김
            [
                prismDefCard,
                prismCompCard,
                prismNamesCard,
                pyramidDefCard,
                pyramidCompCard,
                pyramidNamesCard,
            ].forEach((card) => card.classList.remove('is-revealed'));
            // 모든 물음표 퀴즈 복구
            document.querySelectorAll('.mini-question').forEach((btn) => btn.classList.remove('is-hidden'));
            break;

        case 'PRISM_OPEN':
            // 대주제 오픈 및 각기둥 첫 카드 노출
            topicsLayer.classList.add('is-visible');
            document.querySelector('.center-topic .toggle').setAttribute('aria-expanded', 'true');

            prismCardsLayer.classList.add('is-visible');
            document.querySelector('[aria-controls="prism-cards"]').setAttribute('aria-expanded', 'true');

            prismDefCard.classList.add('is-revealed');
            prismCompCard.classList.remove('is-revealed');
            prismNamesCard.classList.remove('is-revealed');

            // 각뿔 및 퀴즈 초기화 보장
            pyramidCardsLayer.classList.remove('is-visible');
            document.querySelectorAll('.mini-question').forEach((btn) => btn.classList.remove('is-hidden'));
            break;

        case 'PRISM_COMPONENTS':
            // 각기둥 구성요소 오픈 (미니 물음표 퀴즈 대기 상태)
            topicsLayer.classList.add('is-visible');
            prismCardsLayer.classList.add('is-visible');
            prismDefCard.classList.add('is-revealed');
            prismCompCard.classList.add('is-revealed');
            prismNamesCard.classList.remove('is-revealed');

            // 아직 퀴즈가 해결되기 전이므로 미니 물음표 보여주기
            document.querySelectorAll('.pq-prism').forEach((btn) => btn.classList.remove('is-hidden'));
            break;

        case 'PRISM_QUIZ_SOLVED':
            // 각기둥 내부 미니 말풍선 퀴즈 오픈(물음표 숨김 처리)
            topicsLayer.classList.add('is-visible');
            prismCardsLayer.classList.add('is-visible');
            prismDefCard.classList.add('is-revealed');
            prismCompCard.classList.add('is-revealed');
            prismNamesCard.classList.remove('is-revealed');

            // 각기둥 미니 퀴즈 정답 강제 공개
            document.querySelectorAll('.pq-prism').forEach((btn) => btn.classList.add('is-hidden'));
            break;

        case 'PRISM_NAMES':
            // 각기둥 명칭 정의 카드 전개 완료 및 퀴즈 정답 유지
            topicsLayer.classList.add('is-visible');
            prismCardsLayer.classList.add('is-visible');
            prismDefCard.classList.add('is-revealed');
            prismCompCard.classList.add('is-revealed');
            prismNamesCard.classList.add('is-revealed');
            document.querySelectorAll('.pq-prism').forEach((btn) => btn.classList.add('is-hidden'));

            // 각뿔 레이어 진입 대기화 처리
            pyramidCardsLayer.classList.remove('is-visible');
            break;

        case 'PYRAMID_OPEN':
            // 각기둥 정보 유지 + 각뿔 대주제 레이어 및 첫 정의 카드 공개
            topicsLayer.classList.add('is-visible');
            prismCardsLayer.classList.add('is-visible');

            pyramidCardsLayer.classList.add('is-visible');
            document.querySelector('[aria-controls="pyramid-cards"]').setAttribute('aria-expanded', 'true');

            pyramidDefCard.classList.add('is-revealed');
            pyramidCompCard.classList.remove('is-revealed');
            pyramidNamesCard.classList.remove('is-revealed');
            document.querySelectorAll('.pq-pyramid').forEach((btn) => btn.classList.remove('is-hidden'));
            break;

        case 'PYRAMID_COMPONENTS':
            // 각뿔 구성요소 카드 오픈
            topicsLayer.classList.add('is-visible');
            pyramidCardsLayer.classList.add('is-visible');
            pyramidDefCard.classList.add('is-revealed');
            pyramidCompCard.classList.add('is-revealed');
            pyramidNamesCard.classList.remove('is-revealed');
            document.querySelectorAll('.pq-pyramid').forEach((btn) => btn.classList.remove('is-hidden'));
            break;

        case 'PYRAMID_QUIZ_SOLVED':
            // 각뿔 미니 퀴즈 말풍선 정답 오픈
            topicsLayer.classList.add('is-visible');
            pyramidCardsLayer.classList.add('is-visible');
            pyramidDefCard.classList.add('is-revealed');
            pyramidCompCard.classList.add('is-revealed');
            pyramidNamesCard.classList.remove('is-revealed');

            document.querySelectorAll('.pq-pyramid').forEach((btn) => btn.classList.add('is-hidden'));
            break;

        case 'PYRAMID_NAMES':
        case 'REVIEW_START':
            // 모든 맵 요소 전개 완료 상태
            topicsLayer.classList.add('is-visible');
            prismCardsLayer.classList.add('is-visible');
            pyramidCardsLayer.classList.add('is-visible');
            [
                prismDefCard,
                prismCompCard,
                prismNamesCard,
                pyramidDefCard,
                pyramidCompCard,
                pyramidNamesCard,
            ].forEach((card) => card.classList.add('is-revealed'));
            document.querySelectorAll('.mini-question').forEach((btn) => btn.classList.add('is-hidden'));
            break;

        case 'REVIEW_PRISM':
            // 전체 다 보인 상태에서 [각기둥 카드 영역] 그룹 주황색 강조 집중 피드백
            this.toggleAllElementsActive(); // 복제 상태 활성화 기본 헬퍼 호출 대체 가능
            [prismDefCard, prismCompCard, prismNamesCard].forEach((card) => {
                card.classList.add('is-revealed');
                card.style.outline = '5px solid var(--orange)';
            });
            break;

        case 'REVIEW_PYRAMID':
            // 전체 다 보인 상태에서 [각뿔 카드 영역] 그룹 초록색 강조 집중 피드백
            [pyramidDefCard, pyramidCompCard, pyramidNamesCard].forEach((card) => {
                card.classList.add('is-revealed');
                card.style.outline = '5px solid var(--green)';
            });
            break;

        case 'REVIEW_END':
            // 하이라이팅이 끝나고 최종 전체 화면 유지 완료 단계
            topicsLayer.classList.add('is-visible');
            prismCardsLayer.classList.add('is-visible');
            pyramidCardsLayer.classList.add('is-visible');
            [
                prismDefCard,
                prismCompCard,
                prismNamesCard,
                pyramidDefCard,
                pyramidCompCard,
                pyramidNamesCard,
            ].forEach((card) => card.classList.add('is-revealed'));
            break;

        default:
            console.warn('정의되지 않은 재생 액션 코드명입니다:', currentAction);
    }
}

// 기존 분초 포맷 도우미 함수 보정
function formatTimeDisplay(sec) {
    const min = String(Math.floor(sec / 60)).padStart(2, '0');
    const remainingSec = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${min}:${remainingSec}`;
}

function updateTimeDisplay(sec) {
    currentTimeText.textContent = formatTimeDisplay(sec);
}

// ==================================================
// 🎮 재생 오디오 실발화 바인딩 컨트롤 엔진
// ==================================================
function playCurrentSegment() {
    if (!isPlaying) return;

    const currentClip = audioTimelineMap.find(
        (item) => currentTimelineSeconds >= item.startTime && currentTimelineSeconds < item.endTime
    );
    if (!currentClip) {
        handlePlaybackEnd();
        return;
    }

    // 만약 이미 오디오 객체가 있고 현재 재생할 파일과 동일하다면 새로 생성 안 함
    const srcPath = `audio/6-1_2_ (${currentClip.index}).mp3`;

    if (!currentAudioElement || currentAudioElement.src.indexOf(encodeURI(srcPath)) === -1) {
        if (currentAudioElement) {
            currentAudioElement.pause();
            currentAudioElement = null;
        }

        currentAudioElement = new Audio(srcPath);
        currentAudioElement.volume = volumeSlider.value;
        currentAudioElement.playbackRate = playbackSpeed;

        // 해당 개별 오디오가 종료되면 다음 인덱스 계산으로 브릿지 연결
        currentAudioElement.addEventListener('ended', () => {
            if (isPlaying) {
                currentTimelineSeconds = currentClip.endTime;
                if (currentTimelineSeconds >= 154) {
                    handlePlaybackEnd();
                } else {
                    playerSlider.value = currentTimelineSeconds;
                    updateTimeDisplay(currentTimelineSeconds);
                    syncMindmapState(currentTimelineSeconds);
                    playCurrentSegment();
                }
            }
        });
        currentAudioElement.play().catch(() => {
            // 오디오 파일이 디렉토리에 배치 안 된 환경을 대비한 오토 세컨드 시뮬레이터 백업
            startFallbackTimer();
        });
    } else {
        currentAudioElement.play().catch(() => {});
    }
}

let fallbackInterval = null;
function startFallbackTimer() {
    if (fallbackInterval) return;
    fallbackInterval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
            return;
        }
        currentTimelineSeconds += 1 * playbackSpeed;
        if (currentTimelineSeconds >= 154) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
            handlePlaybackEnd();
        } else {
            playerSlider.value = currentTimelineSeconds;
            updateTimeDisplay(currentTimelineSeconds);
            syncMindmapState(currentTimelineSeconds);
        }
    }, 1000);
}

function handlePlaybackEnd() {
    if (isRepeatMode) {
        currentTimelineSeconds = 0;
        playerSlider.value = 0;
        syncMindmapState(0);
        playCurrentSegment();
    } else {
        stopPlayback();
    }
}

function pausePlayback() {
    isPlaying = false;
    playPauseBtn.textContent = '▶️';
    if (currentAudioElement) currentAudioElement.pause();
    if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
    }
}

function startPlayback() {
    isPlaying = true;
    playPauseBtn.textContent = '⏸️';
    playCurrentSegment();
}

function stopPlayback() {
    isPlaying = false;
    currentTimelineSeconds = 0;
    playerSlider.value = 0;
    updateTimeDisplay(0);
    playPauseBtn.textContent = '▶️';
    if (currentAudioElement) {
        currentAudioElement.pause();
        currentAudioElement = null;
    }
    if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
    }
    syncMindmapState(0);
}

function updateTimeDisplay(sec) {
    const min = String(Math.floor(sec / 60)).padStart(2, '0');
    const remainingSec = String(Math.floor(sec % 60)).padStart(2, '0');
    currentTimeText.textContent = `${min}:${remainingSec}`;
}

// ==================================================
// 🖱️ [구현] 타임라인 슬라이더 마우스 드래그 스크러빙 연동
// ==================================================
playerSlider.addEventListener('input', (e) => {
    const targetSeconds = parseInt(e.target.value);
    currentTimelineSeconds = targetSeconds;
    updateTimeDisplay(targetSeconds);
    syncMindmapState(targetSeconds);

    // 드래그 중인 위치의 오디오 싱크 맞추기
    if (currentAudioElement) {
        currentAudioElement.pause();
        currentAudioElement = null;
    }
    if (isPlaying) {
        playCurrentSegment();
    }
});

// 하단 플레이어 플레이 인터페이스 바인딩
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) pausePlayback();
    else startPlayback();
});
document.getElementById('player-stop').addEventListener('click', stopPlayback);

// 마스터 플레이바 레이어 온오프 토글 연동 보정
document.querySelector('#btn-play').addEventListener('click', () => {
    const isOpening = document.querySelector('#btn-play').textContent === '❌';
    if (!isOpening) {
        stopPlayback();
    }
});
