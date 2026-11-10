/* 공용: 하단 메뉴 바 / 위로 올라가기 버튼 동작 (nav_peek.css 와 짝) */
(function () {
    var wrap = document.querySelector('.bottom-nav-wrapper');
    var nav = document.getElementById('main-nav');

    // 하단 메뉴: 마우스가 화면 아래쪽에 오면 올라오고, 벗어나면 내려간다.
    // 메뉴가 열려 있는 동안에는 올라온 상태를 유지한다.
    if (wrap && nav) {
        var hovering = false;

        var sync = function () {
            var open = nav.classList.contains('active');
            var raised = hovering || open;
            wrap.classList.toggle('raised', raised);
            // 올라가기 버튼이 하단 메뉴와 함께 움직이도록 body 에도 상태를 남긴다
            document.body.classList.toggle('nav-raised', raised);
            document.body.classList.toggle('nav-open', open);
        };

        document.addEventListener('mousemove', function (event) {
            hovering = event.clientY > window.innerHeight - 90 || wrap.contains(event.target);
            sync();
        }, { passive: true });

        document.addEventListener('mouseleave', function () {
            hovering = false;
            sync();
        });

        new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ['class'] });
        sync();
    }

    // 위로 올라가기 버튼: 조금 내려야 나타난다
    var updateScrolled = function () {
        document.body.classList.toggle('scrolled', window.scrollY > 300);
    };
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
})();
