/*global require, angular*/
require('./tooltip.scss');
// 文字提示
angular.module('jmui.tooltip', [])
  .directive('jmTooltip', function($http, $rootScope, $window, $document, $timeout, $templateCache, $compile, $sce, $q, $controller) {
    return {
      restrict: 'AE',
      require: '^jmTooltip',
      scope: {
        onShow: '&',
        onHide: '&',
        popperClass: '@',
        tooltipContent: '@',
        template: '@',
        resolve: '=',
        tooltipTitle: '@'
      },
      controller: function($scope, $element, $attrs) {
        var tpl = "<h4 ng-if='title' class='title' ng-bind-html='title'></h4><div class='tooltip-content' ng-bind-html='content'></div>",
          templateUrl = $scope.template,
          self = this,
          controllerName = $attrs.controllerName,
          documentClick = angular.noop,
          onHideFn = $scope.onHide || angular.noop,
          onShowFn = $scope.onShow || angular.noop;

        $scope.show = 0;
        $scope.timer1 = null;
        $scope.timer2 = null;

        this.events = {
          "mouseenter": "mouseleave",
          "click": "",
          "focus": "blur"
        };
        this.el = null;
        this.opened = false;
        this.locals = {};
        this.resolveKeys = [];
        this.resolve = function() {
          var resolves = $scope.resolve,
            arrResolves = [],
            attr;

          if (angular.isObject(resolves)) {
            for (attr in resolves) {
              if (resolves.hasOwnProperty(attr)) {
                self.resolveKeys.push(attr);
                arrResolves.push($scope.resolve[attr]());
              }
            }
          }
          return $q.all(arrResolves);
        };

        // 获取内容
        this.getTpl = function(templateUrl) {
          var defer = $q.defer();
          // 判断是否有`templateUrl`
          if (templateUrl) {
            $http.get(templateUrl, {
              cache: $templateCache
            }).then(function(response) {
              defer.resolve(response.data);
            });
          } else {
            return $q.when(tpl);
          }
          return defer.promise;
        };

        // 添加/显示元素
        this.create = function() {

          this.content = $scope.content = $scope.childScope.content = $sce.trustAsHtml($scope.tooltipContent);
          this.title = $scope.title = $scope.childScope.title = $sce.trustAsHtml($scope.tooltipTitle);

          // 判断这个 el 是否已经存在页面中
          if (this.el) {
            return $q.when(this.el);
          } else {
            return this.getTpl(templateUrl).then(function(data) {
              var ctrl;
              self.locals.tooltip = self;
              self.locals.$scope = $scope.childScope;
              var trigger = $attrs.trigger || "mouseenter";

              if (controllerName) {
                // $controller Angular 官方解释: https://docs.angularjs.org/api/ng/service/$controller
                // $controller 实例化控制器
                // 这里的第一个参数是 控制器名称
                // 第二个参数是依赖注入到控制器的对象
                // 返回的是控制器实例
                ctrl = $controller(controllerName, self.locals);
                if ($attrs.controllerAs) {
                  $scope.childScope[$attrs.controllerAs] = ctrl;
                }
              }

              this.el = $compile(angular.element("<div class='tooltip ng-hide'>" + data + "</div>"))(this.locals.$scope || $scope);
              this.el
                .addClass($scope.popperClass)
                .on('click', function($event) {
                  $event.stopPropagation();
                });

              if (trigger === 'mouseenter') {
                this.el
                  .on('mouseenter', function() {
                    $timeout.cancel($scope.timer1);
                  })
                  .on('mouseleave', function() {
                    $scope.timer2 = $timeout(function() {
                      $scope.$apply(function() {
                        self.hide();
                        console.log('mouseleave');
                      });
                    }, 60);
                  })
              }

              documentClick = $scope.$on('document.click', function() {
                $scope.$apply(function() {
                  self.hide();
                });
              });

              $document.find('body').append(this.el);
              return this.el;
            }.bind(this));
          }
        };

        // 显示`tooltip`
        this.show = function($event) {
          this.el.removeClass('ng-hide');
          this.opened = true;
          onShowFn({
            $event: $event,
            tooltip: self,
            scope: $scope
          });

          return this;
        };

        // 隐藏`tooltip`
        this.hide = function($event) {
          this.el.addClass('ng-hide');
          this.el.removeClass('in');
          this.opened = false;
          onHideFn({
            $event: $event,
            tooltip: self,
            scope: $scope
          });

          return this;
        };

        // 删除`tooltip`
        // 移除DOM、 作用域、重置`opened`状态、取消监听`body`点击事件
        this.destroy = function() {
          if (angular.isObject(this.el) && angular.isFunction(this.el.remove)) {
            this.el.remove();
            this.el = null;
            this.opened = false;
            $scope.$destroy();
            documentClick();
          }

          return this;
        };

        // 显示/隐藏切换
        this.toggleShow = function() {
          if (this.opened) {
            this.hide();
          } else {
            this.show();
          }
          return this;
        };

        // 作用域删除 删除DOM
        $scope.$on('$destroy', function() {
          this.destroy();
        }.bind(this));
      },
      link: function(scope, element, attrs, ngCtrl) {
        var trigger = attrs.trigger || 'mouseenter';
        scope.childScope = $rootScope.$new();

        element.on(trigger, function($event) {
          $event.stopPropagation();
          $event.preventDefault();

          // 获取依赖
          ngCtrl.resolve().then(function(data) {
            // 将依赖保存
            angular.forEach(data, function(item, index) {
              var key = ngCtrl.resolveKeys[index];
              var insideKey = key.charAt(0).toUpperCase() + key.substr(1);
              if (attrs.controllerName) {
                // 创建的控制器时候 依赖注入到创建的控制器中
                ngCtrl.locals[ngCtrl.resolveKeys[index]] = item;
              } else {
                // 当没有自定义控制器的时候 这个值是给自己的scope
                // 下面的表达式类似 scope.tooltipTitle = item;
                // 因为传入的 属性tooltip-title 可是html代码 ，
                // Angular 对html字符串插入需要使用 $sec.trustAsHtml()
                // 而且不能直接使用 scope.title = $sec.trustAsHtml(scope.title)
                // 使用在指令属性上 使用了 tooltip-title 而在指令模板上使用了 title
                scope['tooltip' + insideKey] = item;
              }
            });
            return data;
          }).then(function() {
            // 创建`tooltip`
            return ngCtrl.create();
          }).then(function(el) {

            // 延迟关闭 用于按钮和`tooltip`之间来回移入
            $timeout.cancel(scope.timer2);

            if (trigger === 'click') {
              ngCtrl.toggleShow();
            } else {
              ngCtrl.show($event);
            }

            // 计算位置
            $timeout(function() {
              var $elOffset = el.getOffset();
              var offset = element.getOffset();
              el.css({
                position: 'absolute',
                top: (offset.top - Math.max($elOffset.height, offset.height) - 10) + 'px',
                left: offset.left + 'px'
              });
              ngCtrl.el.addClass('in');
            }, 0);
          });
        });

        // 相对应需要隐藏的事件
        element.on(ngCtrl.events[trigger], function($event) {
          scope.timer1 = $timeout(function() {
            ngCtrl.hide($event);
          }, 60);
        });
      }
    };
  });
