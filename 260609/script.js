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
