var app = require('app');

app.directive('toggle', function() {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      var target = angular.$(attrs.toggle);
      element.on('click', function() {
        target.toggleClass('animate-hidden');
      });
    }
  };
});
