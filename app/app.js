// Declare app level module which depends on views, and components
angular.module('myApp', ['ngWebSocket', 'ui-notification', 'ngAudio'])
  .config(function(NotificationProvider) {
    NotificationProvider.setOptions({
      positionX: 'right',
      positionY: 'bottom'
    });
  })
  .factory('ws', function($websocket, Notification, ngAudio) {
    // Open a WebSocket connection

    var dataStream = $websocket('wss://api2.bitfinex.com:3000/ws');
    dataStream.send(JSON.stringify({"event":"subscribe","channel":"trades","pair":"BTCUSD"}));

    var collection = [];

    dataStream.onMessage(function(message) {
      var d = JSON.parse(message.data);
      if(d[1] === 'te') {
        collection.push(d);
        if(d[5] >= 2) {
          Notification.success("BTC bought : " + d[5] + " BTC@" + d[4]);
          if(d[5] >= 5){
            var sound = ngAudio.load("plucky.mp3");
            sound.play();
          }
        }else if(d[5] <= -2) {
          Notification.error("BTC sold : " + (d[5] * -1) + " BTC@" + d[4]);
          if(d[5] <= -5) {
            var sound = ngAudio.load("to-the-point.mp3");
            sound.play();
          }
        }

        if(collection.length > 2000)
          collection = collection.slice(1, 2001);

      }
    });

    return {
      getCollection: function () {
        return collection;
      },
      getBuy: function () {
        var buy = {
          "vol": 0,
          "avg": 0
        };
        var buy_total = 0;
        var buy_trades = 0;
        for (var i = 0; i < collection.length; i++){
          if(collection[i][5] > 0){
            buy["vol"] += (collection[i][5]);
            buy_total += collection[i][4];
            buy_trades++;
          }
        }
        buy["avg"] = (buy_total / buy_trades).toFixed(2);
        buy["vol"] = buy["vol"].toFixed(2);
        return buy;
      },
      getSell: function () {
        var sell = {
          "vol": 0,
          "avg": 0
        };
        var sell_total = 0;
        var sell_trades = 0;
        for (var i = 0; i < collection.length; i++){
          if(collection[i][5] < 0){
            sell["vol"] += (collection[i][5] * -1);
            sell_total += collection[i][4];
            sell_trades++;
          }
        }
        sell["avg"] = (sell_total / sell_trades).toFixed(2);
        sell["vol"] = sell["vol"].toFixed(2);
        return sell;
      }
    };

  }).
controller('mycontroller', ['$scope', 'ws', 'Notification', '$interval', function($scope, ws, Notification, $interval) {
  $interval(function () {
    $scope.buy = ws.getBuy();
    $scope.sell = ws.getSell();
    $scope.data = ws.getCollection();
  }, 500);
}]);
