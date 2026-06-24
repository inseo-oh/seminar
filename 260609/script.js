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

// 1. 전체 열기 기능
const btnAllOpen = document.querySelector('#btn-all-open');
btnAllOpen.addEventListener('click', () => {
    // 모든 토글 버튼 열기 상태로 변경
    document.querySelectorAll('.toggle').forEach((button) => {
        setToggleState(button, true);
    });
    // 모든 브랜치 및 카드 레이어 보여주기
    document.querySelectorAll('.branch-layer, .cards-layer').forEach((layer) => {
        setLayerVisible(layer, true);
    });
    // 모든 개념 카드 내용 공개
    document.querySelectorAll('.concept-card').forEach((card) => {
        card.classList.add('is-revealed');
    });
});

// 2. 배율(Zoom) 제어 기능 (기존 scaleStage 함수와 결합하기 위해 변수 도입)
let currentZoom = 100; // 기본 100%
const zoomIndicator = document.querySelector('#zoom-indicator');

function updateZoom() {
    zoomIndicator.textContent = `${currentZoom} %`;
    // 기존 자동 스케일 값에 사용자가 임의로 조절한 배율(currentZoom / 100)을 곱해 적용합니다.
    const baseScale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
    const finalScale = baseScale * (currentZoom / 100);
    stage.style.setProperty('--stage-scale', finalScale);
}

// 기존 scaleStage 함수가 있다면 내부 로직을 updateZoom 호출로 동기화해주면 좋습니다.
// 함수 덮어쓰기 또는 수정:
window.removeEventListener('resize', scaleStage);
window.addEventListener('resize', () => {
    updateZoom();
});

document.querySelector('#btn-zoom-in').addEventListener('click', () => {
    if (currentZoom < 200) {
        // 최대 200% 제한
        currentZoom += 10;
        updateZoom();
    }
});

document.querySelector('#btn-zoom-out').addEventListener('click', () => {
    if (currentZoom > 50) {
        // 최소 50% 제한
        currentZoom -= 10;
        updateZoom();
    }
});

// 3. 캡처 및 재생 버튼 (기능 프로토타입 연결용 알림)
document.querySelector('#btn-capture').addEventListener('click', () => {
    alert('현재 화면을 캡처하여 저장합니다. (기능 준비 중)');
});

document.querySelector('#btn-play').addEventListener('click', () => {
    alert('개념 가이드 애니메이션을 시작합니다. (기능 준비 중)');
});

// 초기 실행 시 줌 적용
updateZoom();
