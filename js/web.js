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
        document.getElementById("distance").innerText = Math.floor(geom(lat, lng, parseFloat(JSON.parse(req.response)["data"]["latitude"]), parseFloat(JSON.parse(req.response)["data"]["longitude"])) * 1000) + "m";
        console.log(lat, lng, parseFloat(JSON.parse(req.response)["data"]["latitude"]), parseFloat(JSON.parse(req.response)["data"]["longitude"]));
    }
};


navigator.geolocation.getCurrentPosition(function(position) {
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    console.log("lat,lng", lat, lng);
}, function() {
    alert("Geolocation Error")
});

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
                                //alert("冒険心が足りません！！");
                                req.open('GET', url, true);
                                req.send('');
                                shakeCount = 0;
                            } else {
                                distance = shakeCount * 50;
                                alert(shakeCount);
                                if (shakeCount > 50) distance = 10000;
                                //location.href = URL + '/result.html' + "?latitude=" + lat + "&longitude=" + lng + "&distance=" + distance + "&azimuth=" + direction + "&category=" + category;
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

function geom(lat1, lng1, lat2, lng2) {
    function radians(deg) {
        return deg * Math.PI / 180;
    }
    return 6378.14 * Math.acos(Math.cos(radians(lat1)) *
        Math.cos(radians(lat2)) *
        Math.cos(radians(lng2) - radians(lng1)) +
        Math.sin(radians(lat1)) *
        Math.sin(radians(lat2)));
}
