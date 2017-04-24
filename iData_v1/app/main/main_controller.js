(function (_app) { 
var _app = _app || angular.module('_main');

_app.controller('MainController', ['$scope', '$iDataLite', function ($scope, $iDataLite) {
    $scope.test = 'main test';
    var $data = $iDataLite;

    var config = $data.defaultConfig;
    var watch = $data.defaultWatchProp;
    watch.key = 'TestWatch';
    watch.watchHandler = {
        fn: function (s, w, otherArgs) {
            var val = s[w.key];
            val++;
            console.log(val);
        },
        stopProp: true
    }
    watch.fnCollection = { add: function (s, w, num) { s[w.key] += num; return s[w.key]; }, subtract: function (num) { s[w.key] -= num; return s[w.key]; } };
    watch.setVal = 2;
    config.watchProps.push(watch);
    var starter = $data.createTo('starterPack', config);
    var scoper = starter.scope;
    scoper.test = 'Hello from starterPack';
    


}]);

})(_app);