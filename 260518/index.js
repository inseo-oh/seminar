// ==========================================
// ES5 형태의 숨은 단어 찾기 게임 로직 클래스
// ==========================================
function WordSearchGame(elementId, gameConfig) {
    this.$el = $(elementId);
    this.gridConfig = {
        size: gameConfig.gridSize,
        letters: gameConfig.gridLetters,
    };
    this.questions = gameConfig.questions;

    this.currentIdx = 0;
    this.currentQuestion = null;
    this.isTestMode = false;

    this.init();
}

WordSearchGame.prototype.init = function () {
    var self = this;
    this.renderStaticGrid();

    this.$el.find('.js-reset-btn').on('click', function () {
        self.loadQuestion(self.currentIdx);
    });

    this.loadQuestion(this.currentIdx);

    // 화면 해상도 변화에 대응하는 반응형 스케일 기능 연결
    this.initResponsiveScale();
};

WordSearchGame.prototype.initResponsiveScale = function () {
    var self = this;
    var targetW = 1920;
    var targetH = 1020;

    function resizeGame() {
        var windowW = $(window).width();
        var windowH = $(window).height();

        var scaleW = windowW / targetW;
        var scaleH = windowH / targetH;
        var scale = Math.min(scaleW, scaleH);

        self.$el.css({
            transform: 'scale(' + scale + ')',
        });
    }

    $(window).on('resize', resizeGame);
    resizeGame();
};

WordSearchGame.prototype.renderStaticGrid = function () {
    var self = this;
    var $tbody = this.$el.find('.js-grid-body').empty();

    for (var r = 0; r < this.gridConfig.size.rows; r++) {
        var $tr = $('<tr></tr>');
        for (var c = 0; c < this.gridConfig.size.cols; c++) {
            var letter = this.gridConfig.letters[r][c] || '';
            var $td = $('<td></td>').text(letter).attr('data-row', r).attr('data-col', c);

            $td.on('click', function () {
                self.handleCellClick($(this));
            });

            $tr.append($td);
        }
        $tbody.append($tr);
    }
};

WordSearchGame.prototype.loadQuestion = function (index) {
    if (index >= this.questions.length) {
        this.currentIdx = 0;
        index = 0;
    }

    this.currentIdx = index;
    this.currentQuestion = $.extend(true, {}, this.questions[index]);

    this.currentQuestion.words.forEach(function (word) {
        word.found = false;
        word.clickedIndices = [];
    });

    this.$el.find('.js-grid-body td').removeClass('is-lit');
    this.$el.find('.js-hint-group').empty();
    this.$el.find('.js-found-group').empty();

    this.$el.find('.js-q-num').text(this.currentQuestion.questionNum);
    this.$el.find('.js-q-text').html(this.currentQuestion.questionText);

    if (this.isTestMode) {
        this.showTestHints();
    }
};

WordSearchGame.prototype.handleCellClick = function ($cell) {
    var self = this;

    if ($cell.hasClass('is-lit')) {
        return;
    }

    var row = parseInt($cell.attr('data-row'), 10);
    var col = parseInt($cell.attr('data-col'), 10);
    var matched = false;
    var completedWords = [];

    this.currentQuestion.words.forEach(function (word) {
        if (word.found) return;

        var idx = -1;
        for (var i = 0; i < word.cells.length; i++) {
            if (word.cells[i].r === row && word.cells[i].c === col) {
                idx = i;
                break;
            }
        }

        if (idx !== -1) {
            matched = true;
            if (word.clickedIndices.indexOf(idx) === -1) {
                word.clickedIndices.push(idx);
            }
            if (word.clickedIndices.length === word.cells.length) {
                completedWords.push(word);
            }
        }
    });

    if (matched) {
        $cell.addClass('is-lit');

        completedWords.forEach(function (word) {
            word.found = true;
            self.drawEllipseForWord(word);

            word.cells.forEach(function (cell) {
                var $c = self.getCellElement(cell.r, cell.c);
                $c.removeClass('is-lit');
            });
        });

        if (this.isTestMode) {
            this.showTestHints();
        }

        var isAllCleared = this.currentQuestion.words.every(function (w) {
            return w.found;
        });
        if (isAllCleared) {
            this.playSuccessSound();
            setTimeout(function () {
                self.loadQuestion(self.currentIdx + 1);
            }, 600);
        }
    } else {
        this.playFailureSound();
    }
};

WordSearchGame.prototype.getCellElement = function (row, col) {
    return this.$el.find('.js-grid-body tr').eq(row).find('td').eq(col);
};

// 공통 타원 드로잉 메소드
WordSearchGame.prototype.drawBaseEllipse = function (word, targetContainer, styleAttrs) {
    var $targetLayer = this.$el.find('.js-svg-overlay').find(targetContainer);

    var startCell = this.getCellElement(word.cells[0].r, word.cells[0].c);
    var endCell = this.getCellElement(
        word.cells[word.cells.length - 1].r,
        word.cells[word.cells.length - 1].c
    );

    var pos1 = startCell.position();
    var pos2 = endCell.position();

    var w1 = startCell.outerWidth();
    var h1 = startCell.outerHeight();

    var x1 = pos1.left + w1 / 2;
    var y1 = pos1.top + h1 / 2;
    var x2 = pos2.left + w1 / 2;
    var y2 = pos2.top + h1 / 2;

    var cx = (x1 + x2) / 2;
    var cy = (y1 + y2) / 2;

    var dx = x2 - x1;
    var dy = y2 - y1;
    var distance = Math.sqrt(dx * dx + dy * dy);

    var rx = (distance + w1 * 0.78) / 2;
    var ry = h1 * 0.44;
    var angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    var ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', cx);
    ellipse.setAttribute('cy', cy);
    ellipse.setAttribute('rx', rx);
    ellipse.setAttribute('ry', ry);
    ellipse.setAttribute('transform', 'rotate(' + angle + ' ' + cx + ' ' + cy + ')');

    Object.keys(styleAttrs).forEach(function (key) {
        ellipse.setAttribute(key, styleAttrs[key]);
    });

    $targetLayer.append(ellipse);
};

// 정답 타원 스타일
WordSearchGame.prototype.drawEllipseForWord = function (word) {
    var successStyles = {
        stroke: '#ff007f',
        'stroke-width': '6',
        fill: 'rgba(255, 0, 127, 0.08)',
    };
    this.drawBaseEllipse(word, '.js-found-group', successStyles);
};

// 콘솔용 테스트 모드
WordSearchGame.prototype.showTestHints = function () {
    var self = this;
    this.$el.find('.js-hint-group').empty();

    var hintStyles = {
        stroke: '#3182ce',
        'stroke-width': '4',
        'stroke-dasharray': '8,5',
        fill: 'none',
    };

    this.currentQuestion.words.forEach(function (word) {
        if (!word.found) {
            self.drawBaseEllipse(word, '.js-hint-group', hintStyles);
        }
    });
};

WordSearchGame.prototype.clearTestHints = function () {
    this.$el.find('.js-hint-group').empty();
};

WordSearchGame.prototype.toggleTestMode = function () {
    this.isTestMode = !this.isTestMode;
    if (this.isTestMode) {
        console.log('%c[WordGame] 테스트 힌트가 켜졌습니다.', 'color: #3182ce; font-weight: bold;');
        this.showTestHints();
    } else {
        console.log('%c[WordGame] 테스트 힌트가 꺼졌습니다.', 'color: #ef4444; font-weight: bold;');
        this.clearTestHints();
    }
};

// 오디오 재생 효과음 (성공)
WordSearchGame.prototype.playSuccessSound = function () {
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        var ctx = new AudioContext(),
            now = ctx.currentTime,
            osc = ctx.createOscillator(),
            gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.1);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    } catch (e) {}
};

// 오디오 재생 효과음 (실패)
WordSearchGame.prototype.playFailureSound = function () {
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        var ctx = new AudioContext(),
            now = ctx.currentTime,
            osc = ctx.createOscillator(),
            gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    } catch (e) {}
};

// 고정 데이터셋
var globalGameConfig = {
    gridSize: { rows: 8, cols: 8 },
    gridLetters: [
        ['자', '규', '국', '민', '건', '강', '보', '험'],
        ['원', '범', '의', '료', '강', '실', '호', '우'],
        ['비', '대', '면', '최', '도', '천', '기', '상'],
        ['연', '옹', '호', '고', '시', '후', '관', '행'],
        ['관', '련', '성', '복', '시', '민', '활', '동'],
        ['민', '주', '시', '민', '대', '수', '용', '감'],
        ['원', '생', '태', '양', '응', '문', '광', '수'],
        ['격', '탄', '소', '중', '립', '화', '로', '성'],
    ],
    questions: [
        {
            questionNum: 3,
            questionText:
                '건강권 구현을 위한 건강자원의 평가 기준에는 이용 가능성, 접근 가능성, □□ 가능성, 질적 우수성이 있다.',
            words: [
                {
                    text: '수용',
                    cells: [
                        { r: 5, c: 5 },
                        { r: 5, c: 6 },
                    ],
                },
                {
                    text: '관련성',
                    cells: [
                        { r: 4, c: 0 },
                        { r: 4, c: 1 },
                        { r: 4, c: 2 },
                    ],
                },
                {
                    text: '최고',
                    cells: [
                        { r: 2, c: 3 },
                        { r: 3, c: 3 },
                    ],
                },
            ],
        },
    ],
};

$(document).ready(function () {
    var wordGameInstance = new WordSearchGame('#wordGame', globalGameConfig);
    window.toggleTestMode = function () {
        if (wordGameInstance) wordGameInstance.toggleTestMode();
    };
});
