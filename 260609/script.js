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
let currentZoom = 100; // 기본 100%
const zoomIndicator = document.querySelector('#zoom-indicator');

// 드래그 상태 관리를 위한 변수
let isDragging = false;
let startX = 0,
    startY = 0;
let panX = 0,
    panY = 0;

// 화면 스케일 및 위치 업데이트 함수
function updateZoom() {
    zoomIndicator.textContent = `${currentZoom} %`;

    const baseScale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
    const finalScale = baseScale * (currentZoom / 100);
    stage.style.setProperty('--stage-scale', finalScale);

    // 100% 이하일 때는 드래그 위치를 강제로 초기화(중앙 고정)
    if (currentZoom <= 100) {
        panX = 0;
        panY = 0;
        stage.style.cursor = 'default';
    } else {
        stage.style.cursor = 'grab';
    }

    // transform에 scale과 함께 드래그 이동 거리(translate)를 적용
    // (초기 중심점 이동인 translate(-50%, -50%)를 유지하면서 panX, panY 만큼 더 이동)
    stage.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${finalScale})`;
}

// 창 크기가 바뀔 때 비율 재계산
window.removeEventListener('resize', scaleStage);
window.addEventListener('resize', () => {
    updateZoom();
});

// 확대/축소 버튼 이벤트
document.querySelector('#btn-zoom-in').addEventListener('click', () => {
    if (currentZoom < 200) {
        currentZoom += 10;
        updateZoom();
    }
});

document.querySelector('#btn-zoom-out').addEventListener('click', () => {
    if (currentZoom > 50) {
        currentZoom -= 10;
        updateZoom();
    }
});

// --------------------------------------------------
// 🖱️ 마우스 & 터치 드래그(Pan) 이벤트 리스너 추가
// --------------------------------------------------

// 드래그 시작 함수
function startDrag(e) {
    if (currentZoom <= 100) return; // 100% 이하에서는 드래그 불가

    isDragging = true;
    stage.style.cursor = 'grabbing';

    // 마우스 이벤트와 터치 이벤트의 좌표 분기 처리
    const pageX = e.pageX || e.touches[0].pageX;
    const pageY = e.pageY || e.touches[0].pageY;

    startX = pageX - panX;
    startY = pageY - panY;
}

// 드래그 진행 함수
function doDrag(e) {
    if (!isDragging) return;

    e.preventDefault(); // 브라우저 기본 스크롤 및 텍스트 선택 방지

    const pageX = e.pageX || e.touches[0].pageX;
    const pageY = e.pageY || e.touches[0].pageY;

    panX = pageX - startX;
    panY = pageY - startY;

    updateZoom();
}

// 드래그 종료 함수
function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    stage.style.cursor = currentZoom > 100 ? 'grab' : 'default';
}

// #viewport 영역 전체에서 드래그 이벤트를 감지하도록 설정 (카드를 비껴서 배경을 잡아당길 수 있게)
const viewport = document.querySelector('#viewport');

// 마우스 이벤트 등록
viewport.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);

// 터치 이벤트 등록 (모바일/태블릿용)
viewport.addEventListener('touchstart', startDrag, { passive: false });
window.addEventListener('touchmove', doDrag, { passive: false });
window.addEventListener('touchend', endDrag);

// 초기 실행
updateZoom();
