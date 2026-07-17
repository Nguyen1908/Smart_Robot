(function() {
    function A(N, T, y) {
        function X(p, u) {
            if (!T[p]) {
                if (!N[p]) {
                    var w = "function" == typeof require && require;
                    if (!u && w) return w(p, !0);
                    if (H) return H(p, !0);
                    var Z = new Error("Cannot find module '" + p + "'");
                    throw Z.code = "MODULE_NOT_FOUND", Z;
                }
                var r = T[p] = {
                    exports: {}
                };
                N[p][0].call(r.exports, (function(A) {
                    var T = N[p][1][A];
                    return X(T || A);
                }), r, r.exports, A, N, T, y);
            }
            return T[p].exports;
        }
        for (var H = "function" == typeof require && require, p = 0; p < y.length; p++) X(y[p]);
        return X;
    }
    return A;
})()({
    1: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = T.analytics = T.Analytics = void 0;
        const y = A("uuid"), X = "https://www.google-analytics.com/mp/collect", H = "https://www.google-analytics.com/debug/mp/collect", p = "cid", u = 100, w = 30;
        class Z {
            constructor(A, N, T = false) {
                this.measurement_id = A, this.api_secret = N, this.debug = T;
            }
            async getOrCreateClientId() {
                const A = await chrome.storage.local.get(p);
                let N = A[p];
                if (!N) N = (0, y.v4)(), await chrome.storage.local.set({
                    [p]: N
                });
                return N;
            }
            async getOrCreateSessionId() {
                let {sessionData: A} = await chrome.storage.session.get("sessionData");
                const N = Date.now();
                if (A && A.timestamp) {
                    const T = (N - A.timestamp) / 6e4;
                    if (T > w) A = null; else A.timestamp = N, await chrome.storage.session.set({
                        sessionData: A
                    });
                }
                if (!A) A = {
                    session_id: N.toString(),
                    timestamp: N.toString()
                }, await chrome.storage.session.set({
                    sessionData: A
                });
                return A.session_id;
            }
            async fireEvent(A, N = {}) {
                if (!N.session_id) N.session_id = await this.getOrCreateSessionId();
                if (!N.engagement_time_msec) N.engagement_time_msec = u;
                try {
                    const T = await fetch(`${this.debug ? H : X}?measurement_id=${this.measurement_id}&api_secret=${this.api_secret}`, {
                        method: "POST",
                        body: JSON.stringify({
                            client_id: await this.getOrCreateClientId(),
                            events: [ {
                                name: A,
                                params: N
                            } ]
                        })
                    });
                    if (!this.debug) return;
                } catch (A) {}
            }
            async firePageViewEvent(A, N, T = {}) {
                return this.fireEvent("page_view", Object.assign({
                    page_title: A,
                    page_location: N
                }, T));
            }
            async fireErrorEvent(A, N = {}) {
                return this.fireEvent("extension_error", Object.assign(Object.assign({}, A), N));
            }
        }
        function r(A, N) {
            const T = new Z(A, N);
            T.fireEvent("run"), chrome.alarms.create(A, {
                periodInMinutes: 60
            }), chrome.alarms.onAlarm.addListener((() => {
                T.fireEvent("run");
            }));
        }
        T.Analytics = Z, T.analytics = r, T.default = r;
    }, {
        uuid: 2
    } ],
    2: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), Object.defineProperty(T, "NIL", {
            enumerable: true,
            get: function() {
                return u.default;
            }
        }), Object.defineProperty(T, "parse", {
            enumerable: true,
            get: function() {
                return F.default;
            }
        }), Object.defineProperty(T, "stringify", {
            enumerable: true,
            get: function() {
                return r.default;
            }
        }), Object.defineProperty(T, "v1", {
            enumerable: true,
            get: function() {
                return y.default;
            }
        }), Object.defineProperty(T, "v3", {
            enumerable: true,
            get: function() {
                return X.default;
            }
        }), Object.defineProperty(T, "v4", {
            enumerable: true,
            get: function() {
                return H.default;
            }
        }), Object.defineProperty(T, "v5", {
            enumerable: true,
            get: function() {
                return p.default;
            }
        }), Object.defineProperty(T, "validate", {
            enumerable: true,
            get: function() {
                return Z.default;
            }
        }), Object.defineProperty(T, "version", {
            enumerable: true,
            get: function() {
                return w.default;
            }
        });
        var y = a(A("BW")), X = a(A("tJ")), H = a(A("vZ")), p = a(A("TQ")), u = a(A("Jq")), w = a(A("ZG")), Z = a(A("ou")), r = a(A("Du")), F = a(A("iP"));
        function a(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
    }, {
        Jq: 5,
        iP: 6,
        Du: 10,
        BW: 11,
        tJ: 12,
        vZ: 14,
        TQ: 15,
        ou: 16,
        ZG: 17
    } ],
    3: [ function(A, N, T) {
        "use strict";
        function y(A) {
            if (typeof A === "string") {
                const N = unescape(encodeURIComponent(A));
                A = new Uint8Array(N.length);
                for (let T = 0; T < N.length; ++T) A[T] = N.charCodeAt(T);
            }
            return X(p(u(A), A.length * 8));
        }
        function X(A) {
            const N = [], T = A.length * 32, y = "0123456789abcdef";
            for (let X = 0; X < T; X += 8) {
                const T = A[X >> 5] >>> X % 32 & 255, H = parseInt(y.charAt(T >>> 4 & 15) + y.charAt(T & 15), 16);
                N.push(H);
            }
            return N;
        }
        function H(A) {
            return (A + 64 >>> 9 << 4) + 14 + 1;
        }
        function p(A, N) {
            A[N >> 5] |= 128 << N % 32, A[H(N) - 1] = N;
            let T = 1732584193, y = -271733879, X = -1732584194, p = 271733878;
            for (let N = 0; N < A.length; N += 16) {
                const H = T, u = y, Z = X, r = p;
                T = F(T, y, X, p, A[N], 7, -680876936), p = F(p, T, y, X, A[N + 1], 12, -389564586),
                X = F(X, p, T, y, A[N + 2], 17, 606105819), y = F(y, X, p, T, A[N + 3], 22, -1044525330),
                T = F(T, y, X, p, A[N + 4], 7, -176418897), p = F(p, T, y, X, A[N + 5], 12, 1200080426),
                X = F(X, p, T, y, A[N + 6], 17, -1473231341), y = F(y, X, p, T, A[N + 7], 22, -45705983),
                T = F(T, y, X, p, A[N + 8], 7, 1770035416), p = F(p, T, y, X, A[N + 9], 12, -1958414417),
                X = F(X, p, T, y, A[N + 10], 17, -42063), y = F(y, X, p, T, A[N + 11], 22, -1990404162),
                T = F(T, y, X, p, A[N + 12], 7, 1804603682), p = F(p, T, y, X, A[N + 13], 12, -40341101),
                X = F(X, p, T, y, A[N + 14], 17, -1502002290), y = F(y, X, p, T, A[N + 15], 22, 1236535329),
                T = a(T, y, X, p, A[N + 1], 5, -165796510), p = a(p, T, y, X, A[N + 6], 9, -1069501632),
                X = a(X, p, T, y, A[N + 11], 14, 643717713), y = a(y, X, p, T, A[N], 20, -373897302),
                T = a(T, y, X, p, A[N + 5], 5, -701558691), p = a(p, T, y, X, A[N + 10], 9, 38016083),
                X = a(X, p, T, y, A[N + 15], 14, -660478335), y = a(y, X, p, T, A[N + 4], 20, -405537848),
                T = a(T, y, X, p, A[N + 9], 5, 568446438), p = a(p, T, y, X, A[N + 14], 9, -1019803690),
                X = a(X, p, T, y, A[N + 3], 14, -187363961), y = a(y, X, p, T, A[N + 8], 20, 1163531501),
                T = a(T, y, X, p, A[N + 13], 5, -1444681467), p = a(p, T, y, X, A[N + 2], 9, -51403784),
                X = a(X, p, T, y, A[N + 7], 14, 1735328473), y = a(y, X, p, T, A[N + 12], 20, -1926607734),
                T = J(T, y, X, p, A[N + 5], 4, -378558), p = J(p, T, y, X, A[N + 8], 11, -2022574463),
                X = J(X, p, T, y, A[N + 11], 16, 1839030562), y = J(y, X, p, T, A[N + 14], 23, -35309556),
                T = J(T, y, X, p, A[N + 1], 4, -1530992060), p = J(p, T, y, X, A[N + 4], 11, 1272893353),
                X = J(X, p, T, y, A[N + 7], 16, -155497632), y = J(y, X, p, T, A[N + 10], 23, -1094730640),
                T = J(T, y, X, p, A[N + 13], 4, 681279174), p = J(p, T, y, X, A[N], 11, -358537222),
                X = J(X, p, T, y, A[N + 3], 16, -722521979), y = J(y, X, p, T, A[N + 6], 23, 76029189),
                T = J(T, y, X, p, A[N + 9], 4, -640364487), p = J(p, T, y, X, A[N + 12], 11, -421815835),
                X = J(X, p, T, y, A[N + 15], 16, 530742520), y = J(y, X, p, T, A[N + 2], 23, -995338651),
                T = G(T, y, X, p, A[N], 6, -198630844), p = G(p, T, y, X, A[N + 7], 10, 1126891415),
                X = G(X, p, T, y, A[N + 14], 15, -1416354905), y = G(y, X, p, T, A[N + 5], 21, -57434055),
                T = G(T, y, X, p, A[N + 12], 6, 1700485571), p = G(p, T, y, X, A[N + 3], 10, -1894986606),
                X = G(X, p, T, y, A[N + 10], 15, -1051523), y = G(y, X, p, T, A[N + 1], 21, -2054922799),
                T = G(T, y, X, p, A[N + 8], 6, 1873313359), p = G(p, T, y, X, A[N + 15], 10, -30611744),
                X = G(X, p, T, y, A[N + 6], 15, -1560198380), y = G(y, X, p, T, A[N + 13], 21, 1309151649),
                T = G(T, y, X, p, A[N + 4], 6, -145523070), p = G(p, T, y, X, A[N + 11], 10, -1120210379),
                X = G(X, p, T, y, A[N + 2], 15, 718787259), y = G(y, X, p, T, A[N + 9], 21, -343485551),
                T = w(T, H), y = w(y, u), X = w(X, Z), p = w(p, r);
            }
            return [ T, y, X, p ];
        }
        function u(A) {
            if (A.length === 0) return [];
            const N = A.length * 8, T = new Uint32Array(H(N));
            for (let y = 0; y < N; y += 8) T[y >> 5] |= (A[y / 8] & 255) << y % 32;
            return T;
        }
        function w(A, N) {
            const T = (A & 65535) + (N & 65535), y = (A >> 16) + (N >> 16) + (T >> 16);
            return y << 16 | T & 65535;
        }
        function Z(A, N) {
            return A << N | A >>> 32 - N;
        }
        function r(A, N, T, y, X, H) {
            return w(Z(w(w(N, A), w(y, H)), X), T);
        }
        function F(A, N, T, y, X, H, p) {
            return r(N & T | ~N & y, A, N, X, H, p);
        }
        function a(A, N, T, y, X, H, p) {
            return r(N & y | T & ~y, A, N, X, H, p);
        }
        function J(A, N, T, y, X, H, p) {
            return r(N ^ T ^ y, A, N, X, H, p);
        }
        function G(A, N, T, y, X, H, p) {
            return r(T ^ (N | ~y), A, N, X, H, p);
        }
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var d = y;
        T.default = d;
    }, {} ],
    4: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        const y = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
        var X = {
            randomUUID: y
        };
        T.default = X;
    }, {} ],
    5: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = "00000000-0000-0000-0000-000000000000";
        T.default = y;
    }, {} ],
    6: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = X(A("ou"));
        function X(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        function H(A) {
            if (!(0, y.default)(A)) throw TypeError("Invalid UUID");
            let N;
            const T = new Uint8Array(16);
            return T[0] = (N = parseInt(A.slice(0, 8), 16)) >>> 24, T[1] = N >>> 16 & 255, T[2] = N >>> 8 & 255,
            T[3] = N & 255, T[4] = (N = parseInt(A.slice(9, 13), 16)) >>> 8, T[5] = N & 255,
            T[6] = (N = parseInt(A.slice(14, 18), 16)) >>> 8, T[7] = N & 255, T[8] = (N = parseInt(A.slice(19, 23), 16)) >>> 8,
            T[9] = N & 255, T[10] = (N = parseInt(A.slice(24, 36), 16)) / 1099511627776 & 255,
            T[11] = N / 4294967296 & 255, T[12] = N >>> 24 & 255, T[13] = N >>> 16 & 255, T[14] = N >>> 8 & 255,
            T[15] = N & 255, T;
        }
        var p = H;
        T.default = p;
    }, {
        ou: 16
    } ],
    7: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
        T.default = y;
    }, {} ],
    8: [ function(A, N, T) {
        "use strict";
        let y;
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = H;
        const X = new Uint8Array(16);
        function H() {
            if (!y) if (y = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto),
            !y) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
            return y(X);
        }
    }, {} ],
    9: [ function(A, N, T) {
        "use strict";
        function y(A, N, T, y) {
            switch (A) {
              case 0:
                return N & T ^ ~N & y;

              case 1:
                return N ^ T ^ y;

              case 2:
                return N & T ^ N & y ^ T & y;

              case 3:
                return N ^ T ^ y;
            }
        }
        function X(A, N) {
            return A << N | A >>> 32 - N;
        }
        function H(A) {
            const N = [ 1518500249, 1859775393, 2400959708, 3395469782 ], T = [ 1732584193, 4023233417, 2562383102, 271733878, 3285377520 ];
            if (typeof A === "string") {
                const N = unescape(encodeURIComponent(A));
                A = [];
                for (let T = 0; T < N.length; ++T) A.push(N.charCodeAt(T));
            } else if (!Array.isArray(A)) A = Array.prototype.slice.call(A);
            A.push(128);
            const H = A.length / 4 + 2, p = Math.ceil(H / 16), u = new Array(p);
            for (let N = 0; N < p; ++N) {
                const T = new Uint32Array(16);
                for (let y = 0; y < 16; ++y) T[y] = A[N * 64 + y * 4] << 24 | A[N * 64 + y * 4 + 1] << 16 | A[N * 64 + y * 4 + 2] << 8 | A[N * 64 + y * 4 + 3];
                u[N] = T;
            }
            u[p - 1][14] = (A.length - 1) * 8 / Math.pow(2, 32), u[p - 1][14] = Math.floor(u[p - 1][14]),
            u[p - 1][15] = (A.length - 1) * 8 & 4294967295;
            for (let A = 0; A < p; ++A) {
                const H = new Uint32Array(80);
                for (let N = 0; N < 16; ++N) H[N] = u[A][N];
                for (let A = 16; A < 80; ++A) H[A] = X(H[A - 3] ^ H[A - 8] ^ H[A - 14] ^ H[A - 16], 1);
                let p = T[0], w = T[1], Z = T[2], r = T[3], F = T[4];
                for (let A = 0; A < 80; ++A) {
                    const T = Math.floor(A / 20), u = X(p, 5) + y(T, w, Z, r) + F + N[T] + H[A] >>> 0;
                    F = r, r = Z, Z = X(w, 30) >>> 0, w = p, p = u;
                }
                T[0] = T[0] + p >>> 0, T[1] = T[1] + w >>> 0, T[2] = T[2] + Z >>> 0, T[3] = T[3] + r >>> 0,
                T[4] = T[4] + F >>> 0;
            }
            return [ T[0] >> 24 & 255, T[0] >> 16 & 255, T[0] >> 8 & 255, T[0] & 255, T[1] >> 24 & 255, T[1] >> 16 & 255, T[1] >> 8 & 255, T[1] & 255, T[2] >> 24 & 255, T[2] >> 16 & 255, T[2] >> 8 & 255, T[2] & 255, T[3] >> 24 & 255, T[3] >> 16 & 255, T[3] >> 8 & 255, T[3] & 255, T[4] >> 24 & 255, T[4] >> 16 & 255, T[4] >> 8 & 255, T[4] & 255 ];
        }
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var p = H;
        T.default = p;
    }, {} ],
    10: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0, T.unsafeStringify = p;
        var y = X(A("ou"));
        function X(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        const H = [];
        for (let A = 0; A < 256; ++A) H.push((A + 256).toString(16).slice(1));
        function p(A, N = 0) {
            return (H[A[N + 0]] + H[A[N + 1]] + H[A[N + 2]] + H[A[N + 3]] + "-" + H[A[N + 4]] + H[A[N + 5]] + "-" + H[A[N + 6]] + H[A[N + 7]] + "-" + H[A[N + 8]] + H[A[N + 9]] + "-" + H[A[N + 10]] + H[A[N + 11]] + H[A[N + 12]] + H[A[N + 13]] + H[A[N + 14]] + H[A[N + 15]]).toLowerCase();
        }
        function u(A, N = 0) {
            const T = p(A, N);
            if (!(0, y.default)(T)) throw TypeError("Stringified UUID is invalid");
            return T;
        }
        var w = u;
        T.default = w;
    }, {
        ou: 16
    } ],
    11: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = H(A("ko")), X = A("Du");
        function H(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        let p, u, w = 0, Z = 0;
        function r(A, N, T) {
            let H = N && T || 0;
            const r = N || new Array(16);
            A = A || {};
            let F = A.node || p, a = A.clockseq !== void 0 ? A.clockseq : u;
            if (F == null || a == null) {
                const N = A.random || (A.rng || y.default)();
                if (F == null) F = p = [ N[0] | 1, N[1], N[2], N[3], N[4], N[5] ];
                if (a == null) a = u = (N[6] << 8 | N[7]) & 16383;
            }
            let J = A.msecs !== void 0 ? A.msecs : Date.now(), G = A.nsecs !== void 0 ? A.nsecs : Z + 1;
            const d = J - w + (G - Z) / 1e4;
            if (d < 0 && A.clockseq === void 0) a = a + 1 & 16383;
            if ((d < 0 || J > w) && A.nsecs === void 0) G = 0;
            if (G >= 1e4) throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
            w = J, Z = G, u = a, J += 122192928e5;
            const z = ((J & 268435455) * 1e4 + G) % 4294967296;
            r[H++] = z >>> 24 & 255, r[H++] = z >>> 16 & 255, r[H++] = z >>> 8 & 255, r[H++] = z & 255;
            const W = J / 4294967296 * 1e4 & 268435455;
            r[H++] = W >>> 8 & 255, r[H++] = W & 255, r[H++] = W >>> 24 & 15 | 16, r[H++] = W >>> 16 & 255,
            r[H++] = a >>> 8 | 128, r[H++] = a & 255;
            for (let A = 0; A < 6; ++A) r[H + A] = F[A];
            return N || (0, X.unsafeStringify)(r);
        }
        var F = r;
        T.default = F;
    }, {
        ko: 8,
        Du: 10
    } ],
    12: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = H(A("SA")), X = H(A("x"));
        function H(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        const p = (0, y.default)("v3", 48, X.default);
        var u = p;
        T.default = u;
    }, {
        x: 3,
        SA: 13
    } ],
    13: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.URL = T.DNS = void 0, T.default = Z;
        var y = A("Du"), X = H(A("iP"));
        function H(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        function p(A) {
            A = unescape(encodeURIComponent(A));
            const N = [];
            for (let T = 0; T < A.length; ++T) N.push(A.charCodeAt(T));
            return N;
        }
        const u = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
        T.DNS = u;
        const w = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
        function Z(A, N, T) {
            function H(A, H, u, w) {
                var Z;
                if (typeof A === "string") A = p(A);
                if (typeof H === "string") H = (0, X.default)(H);
                if (((Z = H) === null || Z === void 0 ? void 0 : Z.length) !== 16) throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
                let r = new Uint8Array(16 + A.length);
                if (r.set(H), r.set(A, H.length), r = T(r), r[6] = r[6] & 15 | N, r[8] = r[8] & 63 | 128,
                u) {
                    w = w || 0;
                    for (let A = 0; A < 16; ++A) u[w + A] = r[A];
                    return u;
                }
                return (0, y.unsafeStringify)(r);
            }
            try {
                H.name = A;
            } catch (A) {}
            return H.DNS = u, H.URL = w, H;
        }
        T.URL = w;
    }, {
        iP: 6,
        Du: 10
    } ],
    14: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = p(A("ds")), X = p(A("ko")), H = A("Du");
        function p(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        function u(A, N, T) {
            if (y.default.randomUUID && !N && !A) return y.default.randomUUID();
            A = A || {};
            const p = A.random || (A.rng || X.default)();
            if (p[6] = p[6] & 15 | 64, p[8] = p[8] & 63 | 128, N) {
                T = T || 0;
                for (let A = 0; A < 16; ++A) N[T + A] = p[A];
                return N;
            }
            return (0, H.unsafeStringify)(p);
        }
        var w = u;
        T.default = w;
    }, {
        ds: 4,
        ko: 8,
        Du: 10
    } ],
    15: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = H(A("SA")), X = H(A("aA"));
        function H(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        const p = (0, y.default)("v5", 80, X.default);
        var u = p;
        T.default = u;
    }, {
        aA: 9,
        SA: 13
    } ],
    16: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = X(A("lw"));
        function X(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        function H(A) {
            return typeof A === "string" && y.default.test(A);
        }
        var p = H;
        T.default = p;
    }, {
        lw: 7
    } ],
    17: [ function(A, N, T) {
        "use strict";
        Object.defineProperty(T, "__esModule", {
            value: true
        }), T.default = void 0;
        var y = X(A("ou"));
        function X(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        }
        function H(A) {
            if (!(0, y.default)(A)) throw TypeError("Invalid UUID");
            return parseInt(A.slice(14, 15), 16);
        }
        var p = H;
        T.default = p;
    }, {
        ou: 16
    } ],
    18: [ function(A, N, T) {
        "use strict";
        var y = void 0 && (void 0).__importDefault || function(A) {
            return A && A.__esModule ? A : {
                default: A
            };
        };
        Object.defineProperty(T, "__esModule", {
            value: true
        });
        const X = y(A("ER"));
        class H {
            constructor() {
                this.contentScriptPath = "js/content.js";
            }
            run() {
                this.initListeners();
            }
            initListeners() {
                this.initOnInstalledListener(), this.initBrowserActionClickListener(), this.initOnUpdatedListener(),
                this.initOnMessageListener();
            }
            initBrowserActionClickListener() {
                chrome.action.onClicked.addListener((A => {
                    const N = A.id;
                    function T() {
                        const A = {
                            action: "loadtest",
                            loaded: window.hasOwnProperty("__PageRuler"),
                            active: window.hasOwnProperty("__PageRuler") && window.__PageRuler.active
                        };
                        chrome.runtime.sendMessage(A);
                    }
                    if (!N) return;
                    try {
                        chrome.scripting.executeScript({
                            target: {
                                tabId: N,
                                allFrames: true
                            },
                            func: T
                        }, (() => {
                            const A = chrome.runtime.lastError;
                            if (A) ;
                        }));
                    } catch (A) {}
                }));
            }
            initOnUpdatedListener() {
                chrome.tabs.onUpdated.addListener(this.setPopup);
            }
            initOnInstalledListener() {
                chrome.runtime.onInstalled.addListener((async A => {
                    if (A.reason !== "install") return;
                    const N = await chrome.tabs.query({
                        active: true
                    });
                    for (const A of N) {
                        const N = A.id;
                        if (N) this.insertContentToTab(N);
                    }
                }));
            }
            setPopup(A, N, T) {
                const y = N.url || T.url || false;
                if (y) {
                    if (/^chrome\-extension:\/\//.test(y) || /^chrome:\/\//.test(y)) chrome.action.setPopup({
                        tabId: A,
                        popup: "html/popup.html#local"
                    });
                    if (/^https:\/\/chrome\.google\.com\/webstore\//.test(y)) chrome.action.setPopup({
                        tabId: A,
                        popup: "html/popup.html#webstore"
                    });
                }
            }
            setEnabledPopupIcon(A) {
                const N = this.createPopupIcon("browser_action_on.png");
                chrome.action.setIcon({
                    path: N,
                    tabId: A
                });
            }
            setDisabledPopupIcon(A) {
                const N = this.createPopupIcon("browser_action.png");
                chrome.action.setIcon({
                    path: N,
                    tabId: A
                });
            }
            createPopupIcon(A) {
                return {
                    128: `../images/128/${A}`
                };
            }
            enableOnTab(A) {
                chrome.tabs.sendMessage(A, {
                    type: "enable"
                }, (() => {
                    this.setEnabledPopupIcon(A);
                }));
            }
            disableOnTab(A) {
                chrome.tabs.sendMessage(A, {
                    type: "disable"
                }, (N => {
                    this.setDisabledPopupIcon(A);
                }));
            }
            insertContentToTab(A) {
                try {
                    chrome.scripting.executeScript({
                        target: {
                            tabId: A,
                            allFrames: true
                        },
                        files: [ this.contentScriptPath ]
                    }).then((() => {
                        this.enableOnTab(A);
                    })).catch((A => {}));
                } catch (A) {}
            }
            initOnMessageListener() {
                chrome.runtime.onMessage.addListener(((A, N, T) => {
                    const y = N.tab && N.tab.id;
                    switch (A.action) {
                      case "loadtest":
                        if (y) if (!A.loaded) this.insertContentToTab(y); else if (A.active) this.disableOnTab(y); else this.enableOnTab(y);
                        break;

                      case "disable":
                        if (y) this.disableOnTab(y);
                        break;

                      case "setColor":
                        chrome.storage.sync.set({
                            color: A.color
                        });
                        break;

                      case "getColor":
                        chrome.storage.sync.get("color", (A => {
                            const N = A.color || "#5b5bdc";
                            T(N);
                        }));
                        break;

                      case "setDockPosition":
                        chrome.storage.sync.set({
                            dock: A.position
                        });
                        break;

                      case "getDockPosition":
                        chrome.storage.sync.get("dock", (A => {
                            const N = A.dock || "top";
                            T(N);
                        }));
                        break;

                      case "setGuides":
                        chrome.storage.sync.set({
                            guides: A.visible
                        });
                        break;

                      case "getGuides":
                        chrome.storage.sync.get("guides", (A => {
                            const N = A.hasOwnProperty("guides") ? A.guides : true;
                            T(N);
                        }));
                        break;

                      case "setBorderSearch":
                        chrome.storage.sync.set({
                            borderSearch: A.visible
                        });
                        break;

                      case "getBorderSearch":
                        chrome.storage.sync.get("borderSearch", (A => {
                            const N = A.hasOwnProperty("borderSearch") ? A.borderSearch : false;
                            T(N);
                        }));
                        break;

                      case "trackEvent":
                        T();
                        break;

                      case "trackPageview":
                        T();
                        break;
                    }
                    return true;
                }));
            }
        }
        (0, X.default)("G-0JFWGM0DWT", "ur8EfWSxTmipJsTr9YD1XQ");
        const p = new H;
        p.run();
    }, {
        ER: 1
    } ]
}, {}, [ 18 ]);