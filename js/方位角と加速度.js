var max = 0;
var direction;  //方位角

// 現在位置の取得
navigator.geolocation.getCurrentPosition(function(pos) {
  var crd = pos.coords;
  console.log('Latitude : ' + crd.latitude);
  console.log('Longitude: ' + crd.longitude);
};, geoError);


window.addEventListener('deviceorientation', function(event){ //デバイスの傾きや方角の値が変化したときに発火
  direction = event.alpha;  // event.alphaで方角の値を取得
});

window.addEventListener("touchstart",function(){
  console.log("start");
  window.addEventListener('devicemotion', function(event){ //デバイスが動いたときに発火
    acceleration_x = event.acceleration.x; // event.accelerationIncludingGravity.xで上下方向の加速度取得
    acceleration_y = event.acceleration.y; // event.accelerationIncludingGravity.yで左右方向の加速度取得
    acceleration_z = event.acceleration.z; // event.accelerationIncludingGravity.zで前後方向の加速度取得

    if(max < Math.sqrt(acceleration_x*acceleration_x + acceleration_y*acceleration_y + acceleration_z*acceleration_z))
      max = Math.sqrt(acceleration_x*acceleration_x + acceleration_y*acceleration_y + acceleration_z*acceleration_z)
    console.log(max,direction);
  });
});

window.addEventListener("touchend",function(){
  console.log("end");
  max = 0;
  //POSTしてリロードする
});