var templateUrl = require('./switch.html');

module.exports = {
  url: '^/switch',
  // abstract: true,
  templateUrl: templateUrl,
  controller: 'SwitchCtrl',
  controllerAs: 'vm',
  data: {
    breadcrumbProxy: 'components.switch',
    displayName: '开关'
  },
  resolve: {
    /*@ngInject*/
    loadCtrl: function($q) {
      var defer = $q.defer();
      require.ensure([], function(require) {
        defer.resolve(require('./switch.controller.js'));
      }, 'switch');
      return defer.promise;
    }
  }
};
