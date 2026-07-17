(function() {
    function j(H, M, V) {
        function Q(F, L) {
            if (!M[F]) {
                if (!H[F]) {
                    var e = "function" == typeof require && require;
                    if (!L && e) return e(F, !0);
                    if (C) return C(F, !0);
                    var I = new Error("Cannot find module '" + F + "'");
                    throw I.code = "MODULE_NOT_FOUND", I;
                }
                var W = M[F] = {
                    exports: {}
                };
                H[F][0].call(W.exports, (function(j) {
                    var M = H[F][1][j];
                    return Q(M || j);
                }), W, W.exports, j, H, M, V);
            }
            return M[F].exports;
        }
        for (var C = "function" == typeof require && require, F = 0; F < V.length; F++) Q(V[F]);
        return Q;
    }
    return j;
})()({
    1: [ function(j, H, M) {
        "use strict";
        (function() {
            chrome.runtime.sendMessage({
                action: "trackPageview",
                page: location.pathname + location.hash
            });
            var j = document.querySelector("p");
            switch (location.hash) {
              case "#local":
                j.innerText = chrome.i18n.getMessage("errorLocal");
                break;

              case "#webstore":
                j.innerText = chrome.i18n.getMessage("errorWebStore");
                break;
            }
        })();
    }, {} ]
}, {}, [ 1 ]);