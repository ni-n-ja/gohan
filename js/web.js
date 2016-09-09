'use strict'

var canvas;
var canvasContext;
var x, y;
var ratio;
var category;
var fftSize = 1024;
var audioContext = new AudioContext();
var AnaliserNode = audioContext.createAnalyser();
AnaliserNode.fftSize = fftSize;
var bufferLength = AnaliserNode.frequencyBinCount;
var frequency = new Uint8Array(bufferLength);
var AnaliserNode2 = audioContext.createAnalyser();
AnaliserNode2.fftSize = fftSize;
var bufferLength2 = AnaliserNode2.frequencyBinCount;
var frequency2 = new Uint8Array(bufferLength2);

var acceleration_x, acceleration_y, acceleration_z; //加速度
var shakeFlag_x = 0; //0でマイナスに降ってるとき，1でプラスに降っているとき
var shakeCount = 0;
var direction = 0; //方位角
var lat, lng = 0; //緯度経度
var distance = 0;
var touchNow = 0;
var targetLat;
var targetLng;

var req = new XMLHttpRequest();
req.responseType = 'text';
//var url = 'http://hacku.kinmemodoki.net'
var url = 'https://gnavi-rest-kinmemodoki.c9users.io/?_c9_id=livepreview0&_c9_host=https://ide.c9.io';
req.onreadystatechange = function() {
    if (req.readyState === 4 && req.status === 200) {
        $("#m1").css('display', 'none');
        $("#result").css('display', 'block');
        document.getElementById("name").innerText = JSON.parse(req.response)["data"]["name"];
        document.getElementById("at").innerText = JSON.parse(req.response)["data"]["address"];
        targetLat = JSON.parse(req.response)["data"]["latitude"];
        targetLng = JSON.parse(req.response)["data"]["longitude"];
        navigator.geolocation.getCurrentPosition(function(position) {
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                console.log("lat,lng", lat, lng);
                console.log("target lat,lng", targetLat, targetLng);
                document.getElementById("distance").innerText = mLatLon.get(
                    mLatLon.getLatM(lat), mLatLon.getLonM(lng),
                    mLatLon.getLatM(targetLat), mLatLon.getLonM(targetLng)) + "m";
            },
            function() {
                alert("Geolocation Error")
            });
        window.addEventListener('deviceorientation', function(event) {
            direction = event.alpha; // event.alphaで方角の値を取得
            //document.getElementById("connpas").innerText = aziCalc(lat, lng, targetLat, targetLng);
            $("#ga").css("transform", "rotate(" + aziCalc(lat, lng, targetLat, targetLng) + "deg)");
            aziCalc(lat, lng, targetLat, targetLng)
            navigator.geolocation.getCurrentPosition(function(position) {
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                    document.getElementById("distance").innerText = mLatLon.get(
                        mLatLon.getLatM(lat), mLatLon.getLonM(lng),
                        mLatLon.getLatM(targetLat), mLatLon.getLonM(targetLng)) + "m";
                },
                function() {
                    alert("Geolocation Error")
                });
        });
    }
};

$(document).ready(function() {
    navigator.getMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
    navigator.getMedia({
        audio: true
    }, function(stream) {
        audioContext.destination.channelCount = 2;
        var source = audioContext.createMediaStreamSource(stream);
        var oscillator5000 = audioContext.createOscillator();
        var oscillator10000 = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        var splitterR = audioContext.createChannelSplitter(2);
        var splitterL = audioContext.createChannelSplitter(2);
        var merger = audioContext.createChannelMerger(2);

        oscillator5000.type = 'sine';
        oscillator5000.frequency.value = 1000;
        oscillator10000.type = 'sine';
        oscillator10000.frequency.value = 5000;

        gainNode.gain.value = 1;

        oscillator5000.connect(splitterL);
        oscillator10000.connect(splitterR);
        splitterR.connect(merger, 0, 0);
        splitterL.connect(merger, 0, 1);
        merger.connect(gainNode);
        //oscillator.connect(gainNode);
        gainNode.connect(AnaliserNode);
        AnaliserNode.connect(audioContext.destination);
        source.connect(AnaliserNode2);
        oscillator5000.start();
        oscillator10000.start();
    }, function(err) {});

    $(".next").click(function(event) {
        console.log("!!!");
        $(this).parent("div").css('display', 'none');
        $(this).parent().next().css('display', 'block');
        if ($(this).parent().next().attr("id") === "m1") {
            window.addEventListener('touchstart', function() {
                if (touchNow == 0) { //event.preventDefault();
                    touchNow = 1;
                    console.log("start");
                    //ホールドしたら方角を取り始める
                    window.addEventListener('deviceorientation', function(event) {
                        direction = event.alpha; // event.alphaで方角の値を取得
                    });
                    //ホールドしたらシェイクを検知する．
                    window.addEventListener('devicemotion', function(event) { //デバイスが動いたときに発火
                        acceleration_x = event.acceleration.x; // event.accelerationIncludingGravity.xで上下方向の加速度取得
                        acceleration_y = event.acceleration.y; // event.accelerationIncludingGravity.yで左右方向の加速度取得
                        acceleration_z = event.acceleration.z; // event.accelerationIncludingGravity.zで前後方向の加速度取得

                        if (acceleration_x > 15 && shakeFlag_x != 1) { //シェイクしたときに実行
                            shakeFlag_x = 1;
                            shakeCount++;
                            console.log("shake!! at ", acceleration_x, shakeCount);
                        } else if (acceleration_x < -15 && shakeFlag_x != 0) { //シェイクして戻ったときの処理
                            shakeFlag_x = 0
                        }
                    });
                    window.addEventListener("touchend", function() {
                        if (touchNow == 1) {
                            touchNow = 0;
                            //リリースした時
                            console.log("POST!!!");
                            console.log("方位角：", direction);
                            if (shakeCount < 6) {
                                //5降り以下ならリセット．
                                alert("冒険心が足りません！！");
                                req.open('GET', url, true);
                                req.send('');
                                shakeCount = 0;
                            } else {
                                distance = shakeCount * 50;
                                alert(shakeCount);
                                if (shakeCount > 50) distance = 10000;
                                //location.href = URL + '/result.html' + "?latitude=" + lat + "&longitude=" + lng + "&distance=" + distance + "&azimuth=" + direction + "&category=" + category;
                                url = 'https://gnavi-rest-kinmemodoki.c9users.io/?_c9_id=livepreview0&_c9_host=https://ide.c9.io' +
                                    "&latitude=" + lat + "&longitude=" + lng + "&distance=" + distance +
                                    "&azimuth=" + direction + "&category=" + category;
                                shakeCount = 0;
                                req.open('GET', url, true);
                                req.send('');
                            }
                        }
                    });
                }

            });

        }
    });
    anime();
});

function anime() {
    AnaliserNode.getByteFrequencyData(frequency);
    AnaliserNode2.getByteFrequencyData(frequency2);
    if (frequency2[21] < 160 && frequency2[107] >= 160) {
        category = "ラーメン";
        document.getElementById("module").innerText = "モジュール:" + category;
        $("body").css("background-color", "#400000");
    } else if (frequency2[21] >= 160 && frequency2[107] <= 160) {
        category = "すし";
        $("body").css("background-color", "#0055d4");
        document.getElementById("module").innerText = "モジュール:" + category;
    } else if (frequency2[21] >= 160 && frequency2[107] >= 160) {
        category = "🍺";
        $("body").css("background-color", "#fcc900");
        document.getElementById("module").innerText = "モジュール:" + category;
    } else {
        category = "";
        $("body").css("background-color", "#a0a0a0");
        document.getElementById("module").innerText = "モジュール:なし";
    }
    window.requestAnimationFrame(anime);
}

function geoDirection(lat1, lng1, lat2, lng2) {
    // 緯度経度 lat1, lng1 の点を出発として、緯度経度 lat2, lng2 への方位
    // 北を０度で右回りの角度０～３６０度
    var Y = Math.cos(lng2 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180 - lat1 * Math.PI / 180);
    var X = Math.cos(lng1 * Math.PI / 180) * Math.sin(lng2 * Math.PI / 180) - Math.sin(lng1 * Math.PI / 180) * Math.cos(lng2 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180 - lat1 * Math.PI / 180);
    var dirE0 = 180 * Math.atan2(Y, X) / Math.PI; // 東向きが０度の方向
    if (dirE0 < 0) {
        dirE0 = dirE0 + 360; //0～360 にする。
    }
    var dirN0 = (dirE0 + 90) % 360; //(dirE0+90)÷360の余りを出力 北向きが０度の方向
    return dirN0;
}

function aziCalc(userLat, userLng, shopLat, shopLng) {
    return -geoDirection(userLat, userLng, shopLat, shopLng) + direction;
}

(function() {

    // 基本定義.
    var _u = undefined;
    var __u = "undefined";
    var global = (global == _u) ? window : global;
    var scope = {};
    global.mLatLon = scope;

    /** 緯度1メートル係数. **/
    var _latitudeM = 0.000009013374140874493

    /** 経度１メートル係数. **/
    var _longitudeM = 0.000011003298110363172;

    /**
     * 緯度をメートル計算.
     * @param lat 緯度を設定します.
     * @return int メートル単位に計算された情報が返却されます.
     */
    var _getLatM = function(lat) {
        return (lat / _latitudeM) | 0;
    }

    /**
     * 経度をメートル計算.
     * @param lon 経度を設定します.
     * @return int メートル単位に計算された情報が返却されます.
     */
    var _getLonM = function(lon) {
        return (lon / _longitudeM) | 0;
    }

    /**
     * メートル換算された緯度経度の直線距離を計算.
     * この処理は、厳密な２点間の緯度経度の距離を求めるものと比べて精度が劣りますが、
     * 計算速度はビット計算で求めているので、とても高速に動作します.
     * @param ax 中心位置の緯度(メートル変換されたもの)を設定します.
     * @param ay 中心位置の経度(メートル変換されたもの)を設定します.
     * @param bx 対象位置の緯度(メートル変換されたもの)を設定します.
     * @param by 対象位置の経度(メートル変換されたもの)を設定します.
     * @return 大まかな直線距離が返却されます.
     */
    var _get = function(ax, ay, bx, by) {
        ax = ax | 0;
        ay = ay | 0;
        bx = bx | 0;
        by = by | 0;

        // 精度はあまり高めでないが、高速で近似値を計算できる.
        var dx, dy;
        if ((dx = (ax > bx) ? ax - bx : bx - ax) < (dy = (ay > by) ? ay - by : by - ay)) {
            return (((dy << 8) + (dy << 3) - (dy << 4) - (dy << 1) +
                (dx << 7) - (dx << 5) + (dx << 3) - (dx << 1)) >> 8);
        } else {
            return (((dx << 8) + (dx << 3) - (dx << 4) - (dx << 1) +
                (dy << 7) - (dy << 5) + (dy << 3) - (dy << 1)) >> 8);
        }
    }

    /**
     * 緯度経度の直線距離を計算.
     * @param ax 中心位置の緯度を設定します.
     * @param ay 中心位置の経度を設定します.
     * @param bx 対象位置の緯度を設定します.
     * @param by 対象位置の経度を設定します.
     * @return 大まかな直線距離が返却されます.
     */
    var _getF = function(ax, ay, bx, by) {
        return _get(
            _getLatM(ax), _getLonM(ay),
            _getLatM(bx), _getLonM(by)
        );
    }

    scope.getLatM = _getLatM;
    scope.getLonM = _getLonM;
    scope.get = _get;
    scope.getF = _getF;

    /**
     * 使い方はこんな感じ.
      mLatLon.get(
          mLatLon.getLatM( 35.664609 ),mLatLon.getLonM( 139.730985 ), // 六本木駅
          mLatLon.getLatM( 35.66150837264277 ),mLatLon.getLonM( 139.7295069694519 ) // 六本木ヒルズ
      )
      六本木駅から、六本木ヒルズまでの距離
      384mと出ました.
      厳密に求める計算では
      369.13713158509944m
      多少の誤差はあるけど、大体どれくらい離れたとかを取得する場合は、それほど問題にならないかとｗ
      大体GPS自体、それほど精度が高くない（スマフォ搭載などは特に）なので。
     **/

})();
