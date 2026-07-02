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
    // 전체 2분 34초(154초) 기준 계산 처리
    const totalSeconds = 154;
    const currentSeconds = Math.floor((value / 100) * totalSeconds);

    const min = String(Math.floor(currentSeconds / 60)).padStart(2, '0');
    const sec = String(currentSeconds % 60).padStart(2, '0');

    currentTimeIndicator.textContent = `${min}:${sec}`;
});

// ==================================================
// 🎵 오디오 미디어 재생 제어 및 전개 엔진 데이터셋
// ==================================================

// 총 37개 파일 목록 생성 및 대본 번호별 트리거 매핑 타임 데이터 구조화
// (시간은 각 한 문장씩 약 4초 간격 자동 배정, 총 154초 구성)
const PLAYLIST_SIZE = 37;
const audioTimelineMap = [];
let accumulatedTime = 0;

for (let i = 1; i <= PLAYLIST_SIZE; i++) {
    const duration = 4; // 각 클립당 가상 재생 지속시간 (초)
    audioTimelineMap.push({
        index: i,
        filename: `6-1_2_ (${i}).mp3`,
        startTime: accumulatedTime,
        endTime: accumulatedTime + duration,
    });
    accumulatedTime += duration;
}

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

// ==================================================
// ⏱️ 타임라인 및 마인드맵 상태 연동 코어 엔진
// ==================================================
function syncMindmapState(seconds) {
    // 지정 초가 속한 오디오 인덱스 파악
    const activeClip =
        audioTimelineMap.find((item) => seconds >= item.startTime && seconds < item.endTime) ||
        audioTimelineMap[audioTimelineMap.length - 1];
    const idx = activeClip.index;

    // 단계별 UI 노출 누적 상태 자동 렌더링
    // [1단계: 인트로그룹] 1번부터 바로 중앙 노드는 오픈 상태

    // [2단계: 각기둥 대주제] idx >= 19 일 때 'prism' 분기 오픈
    const topicsLayer = document.querySelector('#topics');
    const prismCardsLayer = document.querySelector('#prism-cards');
    const pyramidCardsLayer = document.querySelector('#pyramid-cards');

    if (idx >= 19) {
        topicsLayer.classList.add('is-visible');
        document.querySelector('.center-topic .toggle').setAttribute('aria-expanded', 'true');
    } else {
        topicsLayer.classList.remove('is-visible');
        document.querySelector('.center-topic .toggle').setAttribute('aria-expanded', 'false');
    }

    // [각기둥 상세 카드 및 물음표 자동 오픈 연동]
    const prismDefCard = document.querySelector('.prism-def');
    const prismCompCard = document.querySelector('.prism-components');
    const prismNamesCard = document.querySelector('.prism-names-dev');

    if (idx >= 19) {
        prismCardsLayer.classList.add('is-visible');
        document.querySelector('[aria-controls="prism-cards"]').setAttribute('aria-expanded', 'true');
    } else {
        prismCardsLayer.classList.remove('is-visible');
    }
    if (idx >= 19) prismDefCard.classList.add('is-revealed');
    else prismDefCard.classList.remove('is-revealed');
    if (idx >= 20) prismCompCard.classList.add('is-revealed');
    else prismCompCard.classList.remove('is-revealed');
    if (idx >= 22) prismNamesCard.classList.add('is-revealed');
    else prismNamesCard.classList.remove('is-revealed');

    // 각기둥 내부 미니 말풍선 단서(퀴즈) 연동 (20, 21번 클립)
    document.querySelectorAll('.pq-prism').forEach((btn, bIdx) => {
        if (idx >= 21) btn.classList.add('is-hidden');
        else btn.classList.remove('is-hidden');
    });

    // [3단계: 각뿔 대주제 오디오 돌입] idx >= 26 일 때 'pyramid' 분기 집중 전개
    const pyramidDefCard = document.querySelector('.pyramid-def');
    const pyramidCompCard = document.querySelector('.pyramid-components');
    const pyramidNamesCard = document.querySelector('.pyramid-names');

    if (idx >= 26) {
        pyramidCardsLayer.classList.add('is-visible');
        document.querySelector('[aria-controls="pyramid-cards"]').setAttribute('aria-expanded', 'true');
    } else {
        pyramidCardsLayer.classList.remove('is-visible');
    }
    if (idx >= 26) pyramidDefCard.classList.add('is-revealed');
    else pyramidDefCard.classList.remove('is-revealed');
    if (idx >= 27) pyramidCompCard.classList.add('is-revealed');
    else pyramidCompCard.classList.remove('is-revealed');
    if (idx >= 30) pyramidNamesCard.classList.add('is-revealed');
    else pyramidNamesCard.classList.remove('is-revealed');

    // 각뿔 내부 미니 퀴즈 해제 (27, 28, 29번 클립 진행 과정 완료)
    document.querySelectorAll('.pq-pyramid').forEach((btn) => {
        if (idx >= 29) btn.classList.add('is-hidden');
        else btn.classList.remove('is-hidden');
    });

    // ==================================================
    // 🔄 [핵심] 31번 클립 이후: 전체 복습 및 리마인드 하이라이팅 연동
    // ==================================================
    // 모든 카드 포커스 이펙트 초기화
    document.querySelectorAll('.concept-card').forEach((c) => (c.style.outline = 'none'));

    if (idx === 32) {
        // 각기둥 전체 구역 되돌아보기 포커싱
        prismDefCard.style.outline = '5px solid var(--orange)';
        prismCompCard.style.outline = '5px solid var(--orange)';
        prismNamesCard.style.outline = '5px solid var(--orange)';
    } else if (idx === 33) {
        // 각뿔 전체 구역 되돌아보기 포커싱
        pyramidDefCard.style.outline = '5px solid var(--green)';
        pyramidCompCard.style.outline = '5px solid var(--green)';
        pyramidNamesCard.style.outline = '5px solid var(--green)';
    }
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
