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

navigator.geolocation.getCurrentPosition(function(position) {
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    console.log("lat,lng", lat, lng);
}, function() {
    alert("Geolocation Error")
});

$(document).ready(function() {

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
                                shakeCount = 0;
                                return;
                            } else {
                                distance = shakeCount * 50;
                                alert(shakeCount);
                                if (shakeCount > 50) distance = 10000;
                                location.href = URL + "?latitude=" + lat + "&longitude=" + lng + "&distance=" + distance + "&azimuth=" + direction + "&category=" + category;
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
    } else if (frequency2[21] >= 160 && frequency2[107] <= 160) {
        category = "すし";
        document.getElementById("module").innerText = "モジュール:" + category;
    } else if (frequency2[21] >= 160 && frequency2[107] >= 160) {
        category = "🍺";
        document.getElementById("module").innerText = "モジュール:" + category;
    } else {
        category = "";
        document.getElementById("module").innerText = "モジュール:なし";
    }
    window.requestAnimationFrame(anime);
}
