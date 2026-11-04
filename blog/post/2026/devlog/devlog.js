/* 개발 일지 - 노드 핀 사이 와이어 그리기 */
(function () {
    var COLORS = {
        exec: '#e8e8e8', object: '#4e9de8', int: '#4ec4d0', int64: '#4ec4d0', bool: '#d04e4e',
        float: '#7dd47a', name: '#c0c0c0', text: '#f5844e', str: '#c9a75a', struct: '#c9a75a',
        self: '#4e9de8', tex: '#e896e8', deleg: '#d04e4e', enum: '#4ec4d0', soft: '#4e9de8',
        reply: '#c0c0c0', key: '#c0c0c0', empty: '#777'
    };

    function center(el, base) {
        var r = el.getBoundingClientRect();
        return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    }

    function draw(canvas) {
        var svg = canvas.querySelector('svg.wires');
        if (!svg) return;
        var wires = [];
        try { wires = JSON.parse(canvas.getAttribute('data-w') || '[]'); } catch (e) { return; }
        var base = canvas.getBoundingClientRect();
        svg.setAttribute('width', canvas.scrollWidth);
        svg.setAttribute('height', canvas.scrollHeight);
        var out = '';
        wires.forEach(function (w) {
            var a = document.getElementById(w[0]), b = document.getElementById(w[1]);
            if (!a || !b) return;
            var p = center(a, base), q = center(b, base);
            var dx = Math.max(Math.abs(q.x - p.x) * 0.5, 40);
            var d = 'M' + p.x + ',' + p.y + ' C' + (p.x + dx) + ',' + p.y + ' ' + (q.x - dx) + ',' + q.y + ' ' + q.x + ',' + q.y;
            var c = COLORS[w[2]] || COLORS.empty;
            var exec = w[2] === 'exec';
            out += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (exec ? 2.6 : 1.8) +
                '" stroke-linecap="round"' + (exec ? '' : ' stroke-dasharray="6,4"') + '/>';
        });
        svg.innerHTML = out;
    }

    function drawAll() {
        [].forEach.call(document.querySelectorAll('.canvas'), draw);
    }

    window.addEventListener('load', drawAll);
    window.addEventListener('resize', drawAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();
