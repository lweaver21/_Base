var _app = _app || angular.module('_main', ['ui.router']);

_app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');

    $stateProvider

    .state('home', {
        url: '/home',
        templateUrl: '../app/main/modules/home/home.html',
        controller: 'HomeController',
        controllerAs: 'hc'
    });
});