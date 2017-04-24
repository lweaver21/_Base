var _app = _app || angular.module('_main');

_app.controller('HomeController', ['$scope', '$iDataLite', function ($scope, $iDataLite) {
    var $data = $iDataLite;
    var starter = $data.findByName('starterPack');
    var scoper = starter.scope;
    console.log(scoper);
    console.log(starter);
    $scope.test = 'Hello World';

}]);