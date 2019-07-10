// 定数宣言

const dateFormat = {
    _fmt: {
        "yyyy": function (date) {
            return date.getFullYear() + '';
        },
        "MM": function (date) {
            return ('0' + (date.getMonth() + 1)).slice(-2);
        },
        "dd": function (date) {
            return ('0' + date.getDate()).slice(-2);
        },
        "hh": function (date) {
            return ('0' + date.getHours()).slice(-2);
        },
        "mm": function (date) {
            return ('0' + date.getMinutes()).slice(-2);
        },
        "ss": function (date) {
            return ('0' + date.getSeconds()).slice(-2);
        }
    },
    _priority: ["yyyy", "MM", "dd", "hh", "mm", "ss"],
    format: function (date, format) {
        return this._priority.reduce((res, fmt) => res.replace(fmt, this._fmt[fmt](date)), format)
    }
};


// 変数宣言

// フレームを間引くための変数
var frameCount = 0;

// getDisplayMedia()関数の引数
var displayMediaStreamConstraints = {
    video: {
        width: screen.width,
        height: screen.height,
        // displaySurface: 'monitor', // monitor or window or application or browser
        // logicalSurface: true,
        frameRate: 30,
        // aspectRatio: 1.77,
        cursor: 'never', // always or never or motion
    }
};


// 関数宣言

// 画素を編集
function retouch(data) {
    for (let i = 0; i < data.length; i += 4) {
        const color = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = color;
    }
}

async function main() {
    // ブラウザ上に表示されるcanvas要素(可視canvas)
    const vcanvas = document.getElementById("vcanvas");
    const vcontext = vcanvas.getContext("2d");

    // 画像比較用に非表示状態で用意するcanvas要素(不可視canvas)
    const hcanvas = document.createElement("canvas");
    const hcontext = hcanvas.getContext("2d");

    // 画面キャプチャの読み込み先となるvideo要素
    const video = document.createElement("video");

    // 画面キャプチャを読み込む
    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints);
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();

        // 可視canvas・不可視canvasのサイズを設定
        vcanvas.width = hcanvas.width = video.videoWidth;
        vcanvas.height = hcanvas.height = video.videoHeight;

        tick();
    };

    function tick() {
        // ここから フレームごとに実行する処理
        {
            // カメラの映像を不可視canvasに描画
            hcontext.drawImage(video, 0, 0);

            const imageData = hcontext.getImageData(0, 0, hcanvas.width, hcanvas.height);
            var data = imageData.data; // 画素値を持つUint8ClampedArray型配列
            // console.log(data); // 画素値を持つUint8ClampedArray型配列
            // console.log(imageData.height); // 高さ
            // console.log(imageData.width); // 幅

            // // 画素を編集
            // retouch(data);

            // 編集した画像を不可視canvasに描画
            hcontext.putImageData(imageData, 0, 0);

            // フレームを間引く(30fpsで30枚に1枚　→　1秒に1回)
            frameCount++;
            if (frameCount >= 30) {
                frameCount = 0; // 30枚毎にリセット

                // 不可視canvasの画像を可視canvasに描画
                vcontext.drawImage(hcanvas, 0, 0);

                // downloadImage('png');
            }
        }
        // ここまで フレームごとに実行する処理

        // 次フレームを処理する
        window.requestAnimationFrame(tick);
    }
}

// canvas要素の内容を画像として保存
function downloadImage(saveType) {
    // 処理開始時点の日時文字列を取得
    nowstr = dateFormat.format(new Date(), 'yyyyMMddhhmmss');

    // パラメータから保存形式を決定
    var imageType = "image/png";
    var fileName = nowstr + ".png";
    if (saveType === "jpeg") {
        imageType = "image/jpeg";
        fileName = nowstr + ".jpg";
    }

    // 可視canvasの画像をDataUrlとして取得
    var dataUrl = document.getElementById("vcanvas").toDataURL(imageType);

    // DataUrlをBlobに変換して保存(ダウンロード)
    var blob = dataurl2Blob(dataUrl);
    download(blob, fileName);

    function dataurl2Blob(dataUrl) {
        var dataUrlarr = dataUrl.split(',');
        var data = atob(dataUrlarr[1]);
        var buf = new Uint8Array(data.length);
        for (var i = 0; i < data.length; i++) {
            buf[i] = data.charCodeAt(i);
        }
        var blob = new Blob([buf], {
            type: (dataUrlarr[0].split(':')[1].split(';')[0])
        });
        return blob;
    }

    function download(blob, fileName) {
        // クリックイベントを設定
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

        // a要素を生成し、イベント発火
        var a = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
        a.href = (window.URL || window.webkitURL).createObjectURL(blob);
        a.download = fileName;
        a.dispatchEvent(event);
    }
}

window.onload = function () {
    // 動作環境チェック
    if (typeof navigator.mediaDevices.getUserMedia !== 'undefined') {
        document.getElementById("download_image").addEventListener("click", function () {
            downloadImage('png');
        }, false);

        main();
    }
};