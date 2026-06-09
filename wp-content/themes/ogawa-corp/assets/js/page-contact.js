// Contact Form 7の送信後イベントに対応するより強固な処理
(function () {
    function setupCF7Redirect() {
        const steps = document.querySelectorAll('.p-contact-step');
        if (steps.length < 2) return;

        const stepInput = steps[0];
        const stepComplete = steps[1];

        function redirectSuccess(event) {
            // ステップを「送信完了」にする（一瞬だけ見えます）
            stepInput.classList.remove('is-active');
            stepComplete.classList.add('is-active');

            // 確実なリダイレクト処理（親URLに基づく絶対パス指定）
            setTimeout(function () {
                var redirectUrl = window.location.origin + '/contact/thanks/';
                window.location.href = redirectUrl;
            }, 500);
        }

        // 過去・現在のCF7の両方のイベント形式に対応
        document.addEventListener('wpcf7mailsent', redirectSuccess, false);
        // ローカルでのテスト確認用
        document.addEventListener('wpcf7mailfailed', redirectSuccess, false);
    }

    // DOM構築完了後に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupCF7Redirect);
    } else {
        setupCF7Redirect();
    }
})();

