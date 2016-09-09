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

function aziCalc(userLat, userLng, shopLat, shopLng, userAzi) {
    return userAzi - geoDirection(userLat, userLng, shopLat, shopLng);
}

//ユーザの方位角はdeviceorientationのevent.alphaで取得できる
/*
  navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
  window.addEventListener('deviceorientation', function(event){ //デバイスの傾きや方角の値が変化したときに発火
    console.log(event.alpha);  // 方位角出力
  });
*/
