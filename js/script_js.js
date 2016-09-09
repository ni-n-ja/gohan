var acceleration_x,acceleration_y,acceleration_z;//加速度
var shakeFlag_x = 0; //0でマイナスに降ってるとき，1でプラスに降っているとき
var shakeCount = 0;
var direction = 0;  //方位角
var lat,lng = 0;//緯度経度
var distance = 0;
var category = "";

var URL = "localhost";


// 現在位置の取得
navigator.geolocation.getCurrentPosition(function(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  console.log("lat,lng",lat,lng);
}, function() {
  alert("Geolocation Error")
});

window.addEventListener("touchstart",function(){
//ボタンのイベントに修正
  console.log("start");
  
  //ホールドしたら方角を取り始める
  window.addEventListener('deviceorientation', function(event){
    direction = event.alpha;  // event.alphaで方角の値を取得
  });
  
  //ホールドしたらシェイクを検知する．
  window.addEventListener('devicemotion', function(event){ //デバイスが動いたときに発火
    acceleration_x = event.acceleration.x; // event.accelerationIncludingGravity.xで上下方向の加速度取得
    acceleration_y = event.acceleration.y; // event.accelerationIncludingGravity.yで左右方向の加速度取得
    acceleration_z = event.acceleration.z; // event.accelerationIncludingGravity.zで前後方向の加速度取得
    
    if(acceleration_x > 15 && shakeFlag_x != 1){//シェイクしたときに実行
      shakeFlag_x = 1;
      shakeCount++;
      console.log("shake!! at ",acceleration_x,shakeCount);
    }else if(acceleration_x < -15 && shakeFlag_x != 0){//シェイクして戻ったときの処理
      shakeFlag_x = 0
    }
  });
  
  window.addEventListener("touchend",function(){
    //リリースした時
    console.log("POST!!!");
    console.log("方位角：",direction);
    if(shakeCount<6){
      //5降り以下ならリセット．
      alert("冒険心が足りません！！");
      shakeCount = 0;
      return;
    }else{
      distance = shakeCount*50;
      if(shakeCount > 50) distance = 10000;
      location.href = URL + "?latitude=" + lat + "&longitude=" + lng +"&distance="+ distance +"&azimuth="+ direction +"&category="+ category;
    }
  });
});

//latitude=35.652414&longitude=139.545242&distance=10000&azimuth=90.000000&category=カレー

