(function (_app) {
    var _app = _app || angular.module('_main');

    _app.directive('iDataInit', ['$iDataLite', function ($iDataLite) {
        var defaultTemplate = '../app/templates/default_data_init.html';
        return {
            restrict: 'E',
            scope: {
                key: '>',
                config: '>',
                scope: '=',
                ngModel: '=ngModel',
                styles: '>',
                template: '='
            },
            require: '?ngModel',
            link: function (scope, elem, attr, ngModel, transclude) {
                scope.scoper = $iDataLite.createTo(scope.key, scope.config, scope.scope);
                scope.inline = styles.inline;
                scope.class = styles.class;
            },
            controller: function ($scope) { },
            templateUrl: scope.template || defaultTemplate
        }

    }]);
    _app.directive('iGroupInit', ['$iDataLite', function ($iDataLite) {
        var defaultGroupTemplate = '../app/templates/default_group_init.html';
        return {
            restrict: 'E',
            scope: {
                //Each configuration is an object containing all the necessary single init attribute
                //names/values
                configurations: '>'
            }
        }

    }]);

})(_app);