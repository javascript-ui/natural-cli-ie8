/**
 * yox.js v1.0.0-alpha.108
 * (c) 2017-2019 musicode
 * Released under the MIT License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Yox = factory());
}(this, function () { 'use strict';

  /**
   * 为了压缩，定义的常量
   */
  var TRUE = true;
  var FALSE = false;
  var NULL = null;
  var UNDEFINED = void 0;
  var MINUS_ONE = -1;
  var RAW_UNDEFINED = 'undefined';
  var RAW_VALUE = 'value';
  var RAW_LENGTH = 'length';
  var RAW_FUNCTION = 'function';
  var RAW_WILDCARD = '*';
  var RAW_DOT = '.';
  /**
   * Single instance for window in browser
   */
  var WINDOW = typeof window !== RAW_UNDEFINED ? window : UNDEFINED;
  /**
   * Single instance for global in nodejs or browser
   */
  var GLOBAL = typeof global !== RAW_UNDEFINED ? global : WINDOW;
  /**
   * Single instance for noop function
   */
  var EMPTY_FUNCTION = function () {
      /** yox */
  };
  /**
   * 空对象，很多地方会用到，比如 `a || EMPTY_OBJECT` 确保是个对象
   */
  var EMPTY_OBJECT = Object.freeze({});
  /**
   * 空数组
   */
  var EMPTY_ARRAY = Object.freeze([]);
  /**
   * 空字符串
   */
  var EMPTY_STRING = '';

  /**
   * Check if value is a function.
   *
   * @param value
   * @return
   */
  function func(value) {
      return typeof value === RAW_FUNCTION;
  }
  /**
   * Check if value is an array.
   *
   * @param value
   * @return
   */
  function array(value) {
      return Array.isArray(value);
  }
  /**
   * Check if value is an object.
   *
   * @param value
   * @return
   */
  function object(value) {
      // 低版本 IE 会把 null 当作 object
      return value !== NULL && typeof value === 'object';
  }
  /**
   * Check if value is a string.
   *
   * @param value
   * @return
   */
  function string(value) {
      return typeof value === 'string';
  }
  /**
   * Check if value is a number.
   *
   * @param value
   * @return
   */
  function number(value) {
      return typeof value === 'number' && !isNaN(value);
  }
  /**
   * Check if value is boolean.
   *
   * @param value
   * @return
   */
  function boolean(value) {
      return typeof value === 'boolean';
  }
  /**
   * Check if value is numeric.
   *
   * @param value
   * @return
   */
  function numeric(value) {
      return number(value)
          || (string(value) && !isNaN(parseFloat(value)) && isFinite(value));
  }

  var is = /*#__PURE__*/Object.freeze({
    func: func,
    array: array,
    object: object,
    string: string,
    number: number,
    boolean: boolean,
    numeric: numeric
  });

  /**
   * 任性地执行一个函数，不管它有没有、是不是
   *
   * @param fn 调用的函数
   * @param context 执行函数时的 this 指向
   * @param args 调用函数的参数，多参数时传入数组
   * @return 调用函数的返回值
   */
  function execute (fn, context, args) {
      if (func(fn)) {
          return array(args)
              ? fn.apply(context, args)
              : context !== UNDEFINED
                  ? fn.call(context, args)
                  : args !== UNDEFINED
                      ? fn(args)
                      : fn();
      }
  }

  var CustomEvent = /** @class */ (function () {
      /**
       * 构造函数
       *
       * 可以传事件名称，也可以传原生事件对象
       */
      function CustomEvent(type, originalEvent) {
          // 这里不设置命名空间
          // 因为有没有命名空间取决于 Emitter 的构造函数有没有传 true
          // CustomEvent 自己无法决定
          this.type = type;
          this.phase = CustomEvent.PHASE_CURRENT;
          if (originalEvent) {
              this.originalEvent = originalEvent;
          }
      }
      /**
       * 阻止事件的默认行为
       */
      CustomEvent.prototype.preventDefault = function () {
          var instance = this;
          if (!instance.isPrevented) {
              var originalEvent = instance.originalEvent;
              if (originalEvent) {
                  originalEvent.preventDefault();
              }
              instance.isPrevented = TRUE;
          }
          return instance;
      };
      /**
       * 停止事件广播
       */
      CustomEvent.prototype.stopPropagation = function () {
          var instance = this;
          if (!instance.isStoped) {
              var originalEvent = instance.originalEvent;
              if (originalEvent) {
                  originalEvent.stopPropagation();
              }
              instance.isStoped = TRUE;
          }
          return instance;
      };
      CustomEvent.prototype.prevent = function () {
          return this.preventDefault();
      };
      CustomEvent.prototype.stop = function () {
          return this.stopPropagation();
      };
      CustomEvent.PHASE_CURRENT = 0;
      CustomEvent.PHASE_UPWARD = 1;
      CustomEvent.PHASE_DOWNWARD = MINUS_ONE;
      return CustomEvent;
  }());

  /**
   * 遍历数组
   *
   * @param array
   * @param callback 返回 false 可停止遍历
   * @param reversed 是否逆序遍历
   */
  function each(array, callback, reversed) {
      var length = array.length;
      if (length) {
          if (reversed) {
              for (var i = length - 1; i >= 0; i--) {
                  if (callback(array[i], i) === FALSE) {
                      break;
                  }
              }
          }
          else {
              for (var i = 0; i < length; i++) {
                  if (callback(array[i], i) === FALSE) {
                      break;
                  }
              }
          }
      }
  }
  function nativePush(array, item) {
      array[array.length] = item;
  }
  function nativeUnshift(array, item) {
      array.unshift(item);
  }
  /**
   * 添加
   *
   * @param array
   * @param value
   * @param action
   */
  function addItem(array$1, value, action) {
      if (array(value)) {
          each(value, function (item) {
              action(array$1, item);
          });
      }
      else {
          action(array$1, value);
      }
  }
  /**
   * 往后加
   *
   * @param array
   * @param target
   */
  function push(array, target) {
      addItem(array, target, nativePush);
  }
  /**
   * 往前加
   *
   * @param array
   * @param target
   */
  function unshift(array, target) {
      addItem(array, target, nativeUnshift);
  }
  /**
   * 数组项在数组中的位置
   *
   * @param array 数组
   * @param target 数组项
   * @param strict 是否全等判断，默认是全等
   * @return 如果未找到，返回 -1
   */
  function indexOf(array, target, strict) {
      var result = MINUS_ONE;
      each(array, function (item, index) {
          if (strict === FALSE ? item == target : item === target) {
              result = index;
              return FALSE;
          }
      });
      return result;
  }
  /**
   * 获取数组最后一项
   *
   * @param array 数组
   * @return
   */
  function last(array) {
      var length = array.length;
      if (length > 0) {
          return array[length - 1];
      }
  }
  /**
   * 弹出数组最后一项
   *
   * 项目里用的太多，仅用于节省字符...
   *
   * @param array 数组
   * @return 弹出的数组项
   */
  function pop(array) {
      var length = array.length;
      if (length > 0) {
          return array.pop();
      }
  }
  /**
   * 删除数组项
   *
   * @param array 数组
   * @param item 待删除项
   * @param strict 是否全等判断，默认是全等
   * @return 删除的数量
   */
  function remove(array, target, strict) {
      var result = 0;
      each(array, function (item, index) {
          if (strict === FALSE ? item == target : item === target) {
              array.splice(index, 1);
              result++;
          }
      }, TRUE);
      return result;
  }
  /**
   * 数组是否包含 item
   *
   * @param array 数组
   * @param target 可能包含的数组项
   * @param strict 是否全等判断，默认是全等
   * @return
   */
  function has(array, target, strict) {
      return indexOf(array, target, strict) >= 0;
  }
  /**
   * 把类数组转成数组
   *
   * @param array 类数组
   * @return
   */
  function toArray(array$1) {
      return array(array$1)
          ? array$1
          : execute(EMPTY_ARRAY.slice, array$1);
  }
  /**
   * 把数组转成对象
   *
   * @param array 数组
   * @param key 数组项包含的字段名称，如果数组项是基本类型，可不传
   * @param value
   * @return
   */
  function toObject(array, key, value) {
      var result = {};
      each(array, function (item) {
          result[key ? item[key] : item] = value || item;
      });
      return result;
  }
  /**
   * 把数组合并成字符串
   *
   * @param array
   * @param separator
   * @return
   */
  function join(array, separator) {
      return array.join(separator);
  }
  /**
   * 用于判断长度大于 0 的数组
   *
   * @param array
   * @return
   */
  function falsy(array$1) {
      return !array(array$1) || !array$1.length;
  }

  var array$1 = /*#__PURE__*/Object.freeze({
    each: each,
    push: push,
    unshift: unshift,
    indexOf: indexOf,
    last: last,
    pop: pop,
    remove: remove,
    has: has,
    toArray: toArray,
    toObject: toObject,
    join: join,
    falsy: falsy
  });

  var camelizePattern = /-([a-z])/gi, hyphenatePattern = /\B([A-Z])/g, capitalizePattern = /^[a-z]/, camelizeCache = {}, hyphenateCache = {}, capitalizeCache = {};
  /**
   * 连字符转成驼峰
   *
   * @param str
   * @return 驼峰格式的字符串
   */
  function camelize(str) {
      if (!camelizeCache[str]) {
          camelizeCache[str] = str.replace(camelizePattern, function ($0, $1) {
              return upper($1);
          });
      }
      return camelizeCache[str];
  }
  /**
   * 驼峰转成连字符
   *
   * @param str
   * @return 连字符格式的字符串
   */
  function hyphenate(str) {
      if (!hyphenateCache[str]) {
          hyphenateCache[str] = str.replace(hyphenatePattern, function ($0, $1) {
              return '-' + lower($1);
          });
      }
      return hyphenateCache[str];
  }
  /**
   * 首字母大写
   *
   * @param str
   * @return
   */
  function capitalize(str) {
      if (!capitalizeCache[str]) {
          capitalizeCache[str] = str.replace(capitalizePattern, upper);
      }
      return capitalizeCache[str];
  }
  /**
   * 清除两侧空白符
   *
   * @param str
   * @return 清除两侧空白符的字符串
   */
  function trim(str) {
      return falsy$1(str)
          ? EMPTY_STRING
          : str.trim();
  }
  /**
   * 截取字符串
   *
   * @param str
   * @param start
   * @param end
   * @return
   */
  function slice(str, start, end) {
      return number(end)
          ? start === end
              ? EMPTY_STRING
              : str.slice(start, end)
          : str.slice(start);
  }
  /**
   * 获取子串的起始位置
   *
   * @param str
   * @param part
   * @param start
   * @return
   */
  function indexOf$1(str, part, start) {
      return str.indexOf(part, start !== UNDEFINED ? start : 0);
  }
  /**
   * 获取子串的起始位置
   *
   * @param str
   * @param part
   * @param end
   * @return
   */
  function lastIndexOf(str, part, end) {
      return str.lastIndexOf(part, end !== UNDEFINED ? end : str.length);
  }
  /**
   * str 是否以 part 开头
   *
   * @param str
   * @param part
   * @return
   */
  function startsWith(str, part) {
      return indexOf$1(str, part) === 0;
  }
  /**
   * str 是否以 part 结束
   *
   * @param str
   * @param part
   * @return
   */
  function endsWith(str, part) {
      var offset = str.length - part.length;
      return offset >= 0 && lastIndexOf(str, part) === offset;
  }
  /**
   * 获取某个位置的字符
   */
  function charAt(str, index) {
      return str.charAt(index || 0);
  }
  /**
   * 获取某个位置的字符编码
   */
  function codeAt(str, index) {
      return str.charCodeAt(index || 0);
  }
  /**
   * 大写格式
   */
  function upper(str) {
      return str.toUpperCase();
  }
  /**
   * 小写格式
   */
  function lower(str) {
      return str.toLowerCase();
  }
  /**
   * str 是否包含 part
   *
   * @param str
   * @param part
   * @return 是否包含
   */
  function has$1(str, part) {
      return indexOf$1(str, part) >= 0;
  }
  /**
   * 判断长度大于 0 的字符串
   *
   * @param str
   * @return
   */
  function falsy$1(str) {
      return !string(str) || !str.length;
  }

  var string$1 = /*#__PURE__*/Object.freeze({
    camelize: camelize,
    hyphenate: hyphenate,
    capitalize: capitalize,
    trim: trim,
    slice: slice,
    indexOf: indexOf$1,
    lastIndexOf: lastIndexOf,
    startsWith: startsWith,
    endsWith: endsWith,
    charAt: charAt,
    codeAt: codeAt,
    upper: upper,
    lower: lower,
    has: has$1,
    falsy: falsy$1
  });

  var dotPattern = /\./g, asteriskPattern = /\*/g, doubleAsteriskPattern = /\*\*/g, splitCache = {}, patternCache = {};
  /**
   * 判断 keypath 是否以 prefix 开头，如果是，返回匹配上的前缀长度，否则返回 -1
   *
   * @param keypath
   * @param prefix
   * @return
   */
  function match(keypath, prefix) {
      if (keypath === prefix) {
          return prefix.length;
      }
      prefix += RAW_DOT;
      return startsWith(keypath, prefix)
          ? prefix.length
          : MINUS_ONE;
  }
  /**
   * 遍历 keypath 的每个部分
   *
   * @param keypath
   * @param callback 返回 false 可中断遍历
   */
  function each$1(keypath, callback) {
      // 如果 keypath 是 toString 之类的原型字段
      // splitCache[keypath] 会取到原型链上的对象
      var list = splitCache.hasOwnProperty(keypath)
          ? splitCache[keypath]
          : (splitCache[keypath] = keypath.split(RAW_DOT));
      for (var i = 0, lastIndex = list.length - 1; i <= lastIndex; i++) {
          if (callback(list[i], i === lastIndex) === FALSE) {
              break;
          }
      }
  }
  /**
   * 遍历 keypath 的每个部分
   *
   * @param keypath1
   * @param keypath2
   */
  function join$1(keypath1, keypath2) {
      return keypath1 && keypath2
          ? keypath1 + RAW_DOT + keypath2
          : keypath1 || keypath2;
  }
  /**
   * 是否模糊匹配
   *
   * @param keypath
   */
  function isFuzzy(keypath) {
      return has$1(keypath, RAW_WILDCARD);
  }
  /**
   * 模糊匹配 keypath
   *
   * @param keypath
   * @param pattern
   */
  function matchFuzzy(keypath, pattern) {
      var cache = patternCache[pattern];
      if (!cache) {
          var str = pattern
              .replace(dotPattern, '\\.')
              .replace(asteriskPattern, '(\\w+)')
              .replace(doubleAsteriskPattern, '([\.\\w]+?)');
          cache = patternCache[pattern] = new RegExp("^" + str + "$");
      }
      var result = keypath.match(cache);
      if (result) {
          return result[1];
      }
  }

  /**
   * 全局 value holder，避免频繁的创建临时对象
   */
  var holder = {
      value: UNDEFINED
  };

  /**
   * 获取对象的 key 的数组
   *
   * @param object
   * @return
   */
  function keys(object) {
      return Object.keys(object);
  }
  function sortKeyByAsc(a, b) {
      return a.length - b.length;
  }
  function sortKeyByDesc(a, b) {
      return b.length - a.length;
  }
  /**
   * 排序对象的 key
   *
   * @param object
   * @param desc 是否逆序，默认从小到大排序
   * @return
   */
  function sort(object, desc) {
      return keys(object).sort(desc ? sortKeyByDesc : sortKeyByAsc);
  }
  /**
   * 遍历对象
   *
   * @param object
   * @param callback 返回 false 可停止遍历
   */
  function each$2(object, callback) {
      for (var key in object) {
          if (callback(object[key], key) === FALSE) {
              break;
          }
      }
  }
  /**
   * 清空对象所有的键值对
   *
   * @param object
   */
  function clear(object) {
      each$2(object, function (_, key) {
          delete object[key];
      });
  }
  /**
   * 扩展对象
   *
   * @return
   */
  function extend(original, object) {
      each$2(object, function (value, key) {
          original[key] = value;
      });
      return original;
  }
  /**
   * 合并对象
   *
   * @return
   */
  function merge(object1, object2) {
      return object1 && object2
          ? extend(extend({}, object1), object2)
          : object1 || object2;
  }
  /**
   * 拷贝对象
   *
   * @param object
   * @param deep 是否需要深拷贝
   * @return
   */
  function copy(object$1, deep) {
      var result = object$1;
      if (array(object$1)) {
          if (deep) {
              result = [];
              each(object$1, function (item, index) {
                  result[index] = copy(item, deep);
              });
          }
          else {
              result = object$1.slice();
          }
      }
      else if (object(object$1)) {
          result = {};
          each$2(object$1, function (value, key) {
              result[key] = deep ? copy(value, deep) : value;
          });
      }
      return result;
  }
  /**
   * 从对象中查找一个 keypath
   *
   * 返回值是空时，表示没找到值
   *
   * @param object
   * @param keypath
   * @return
   */
  function get(object, keypath) {
      each$1(keypath, function (key, isLast) {
          if (object != NULL) {
              // 先直接取值
              var value = object[key], 
              // 紧接着判断值是否存在
              // 下面会处理计算属性的值，不能在它后面设置 hasValue
              hasValue = value !== UNDEFINED;
              // 如果是计算属性，取计算属性的值
              if (value && func(value.get)) {
                  value = value.get();
              }
              if (isLast) {
                  if (hasValue) {
                      holder.value = value;
                      object = holder;
                  }
                  else {
                      object = UNDEFINED;
                  }
              }
              else {
                  object = value;
              }
          }
          else {
              object = UNDEFINED;
              return FALSE;
          }
      });
      return object;
  }
  /**
   * 为对象设置一个键值对
   *
   * @param object
   * @param keypath
   * @param value
   * @param autofill 是否自动填充不存在的对象，默认自动填充
   */
  function set(object, keypath, value, autofill) {
      each$1(keypath, function (key, isLast) {
          if (isLast) {
              object[key] = value;
          }
          else if (object[key]) {
              object = object[key];
          }
          else if (autofill) {
              object = object[key] = {};
          }
          else {
              return FALSE;
          }
      });
  }
  /**
   * 对象是否包含某个 key
   *
   * @param object
   * @param key
   * @return
   */
  function has$2(object, key) {
      // 不用 hasOwnProperty，性能差
      return object[key] !== UNDEFINED;
  }
  /**
   * 是否是空对象
   *
   * @param object
   * @return
   */
  function falsy$2(object$1) {
      return !object(object$1)
          || array(object$1)
          || !keys(object$1).length;
  }

  var object$1 = /*#__PURE__*/Object.freeze({
    keys: keys,
    sort: sort,
    each: each$2,
    clear: clear,
    extend: extend,
    merge: merge,
    copy: copy,
    get: get,
    set: set,
    has: has$2,
    falsy: falsy$2
  });

  function toString (target, defaultValue) {
      return target != NULL && target.toString
          ? target.toString()
          : defaultValue !== UNDEFINED
              ? defaultValue
              : EMPTY_STRING;
  }

  var DEBUG = 1;
  var INFO = 2;
  var WARN = 3;
  var ERROR = 4;
  var FATAL = 5;
  /**
   * 是否有原生的日志特性，没有必要单独实现
   */
  var nativeConsole = typeof console !== RAW_UNDEFINED ? console : NULL, 
  /**
   * 当前是否是源码调试，如果开启了代码压缩，empty function 里的注释会被干掉
   * 源码模式默认选 INFO，因为 DEBUG 输出的日志太多，会导致性能急剧下降
   */
  defaultLogLevel = /yox/.test(toString(EMPTY_FUNCTION)) ? INFO : WARN, 
  /**
   * console 样式前缀
   * ie 和 edge 不支持 console.log 样式
   */
  stylePrefix = WINDOW && /edge|msie|trident/i.test(WINDOW.navigator.userAgent)
      ? EMPTY_STRING
      : '%c', 
  /**
   * 日志打印函数
   */
  printLog = nativeConsole
      ? stylePrefix
          ? function (tag, msg, style) {
              nativeConsole.log(stylePrefix + tag, style, msg);
          }
          : function (tag, msg) {
              nativeConsole.log(tag, msg);
          }
      : EMPTY_FUNCTION;
  /**
   * 全局调试开关
   */
  function getLogLevel() {
      if (GLOBAL) {
          var logLevel = GLOBAL['YOX_LOG_LEVEL'];
          if (logLevel >= DEBUG && logLevel <= FATAL) {
              return logLevel;
          }
      }
      return defaultLogLevel;
  }
  function getStyle(backgroundColor) {
      return "background-color:" + backgroundColor + ";border-radius:12px;color:#fff;font-size:10px;padding:3px 6px;";
  }
  /**
   * 打印 debug 日志
   *
   * @param msg
   */
  function debug(msg, tag) {
      if (getLogLevel() <= DEBUG) {
          printLog(tag || 'Yox debug', msg, getStyle('#999'));
      }
  }
  /**
   * 打印 info 日志
   *
   * @param msg
   */
  function info(msg, tag) {
      if (getLogLevel() <= INFO) {
          printLog(tag || 'Yox info', msg, getStyle('#2db7f5'));
      }
  }
  /**
   * 打印 warn 日志
   *
   * @param msg
   */
  function warn(msg, tag) {
      if (getLogLevel() <= WARN) {
          printLog(tag || 'Yox warn', msg, getStyle('#f90'));
      }
  }
  /**
   * 打印 error 日志
   *
   * @param msg
   */
  function error(msg, tag) {
      if (getLogLevel() <= ERROR) {
          printLog(tag || 'Yox error', msg, getStyle('#ed4014'));
      }
  }
  /**
   * 致命错误，中断程序
   *
   * @param msg
   */
  function fatal(msg, tag) {
      if (getLogLevel() <= FATAL) {
          throw new Error("[" + (tag || 'Yox fatal') + "]: " + msg);
      }
  }

  var logger = /*#__PURE__*/Object.freeze({
    DEBUG: DEBUG,
    INFO: INFO,
    WARN: WARN,
    ERROR: ERROR,
    FATAL: FATAL,
    debug: debug,
    info: info,
    warn: warn,
    error: error,
    fatal: fatal
  });

  var Emitter = /** @class */ (function () {
      function Emitter(ns) {
          this.ns = ns || FALSE;
          this.listeners = {};
      }
      /**
       * 发射事件
       *
       * @param type 事件名称或命名空间
       * @param args 事件处理函数的参数列表
       * @param filter 自定义过滤器
       */
      Emitter.prototype.fire = function (type, args, filter) {
          var instance = this, namespace = string(type) ? instance.parse(type) : type, list = instance.listeners[namespace.type], isComplete = TRUE;
          if (list) {
              // 避免遍历过程中，数组发生变化，比如增删了
              list = copy(list);
              // 判断是否是发射事件
              // 如果 args 的第一个参数是 CustomEvent 类型，表示发射事件
              // 因为事件处理函数的参数列表是 (event, data)
              var event_1 = args && args[0] instanceof CustomEvent
                  ? args[0]
                  : UNDEFINED;
              each(list, function (options) {
                  // 命名空间不匹配
                  if (!matchNamespace(namespace.ns, options)
                      // 在 fire 过程中被移除了
                      || !has(list, options)
                      // 传了 filter，则用 filter 判断是否过滤此 options
                      || (filter && !filter(namespace, args, options))) {
                      return;
                  }
                  // 为 event 对象加上当前正在处理的 listener
                  // 这样方便业务层移除事件绑定
                  // 比如 on('xx', function) 这样定义了匿名 listener
                  // 在这个 listener 里面获取不到当前 listener 的引用
                  // 为了能引用到，有时候会先定义 var listener = function
                  // 然后再 on('xx', listener) 这样其实是没有必要的
                  if (event_1) {
                      event_1.listener = options.fn;
                  }
                  var result = execute(options.fn, options.ctx, args);
                  if (event_1) {
                      event_1.listener = UNDEFINED;
                  }
                  // 执行次数
                  options.num = options.num ? (options.num + 1) : 1;
                  // 注册的 listener 可以指定最大执行次数
                  if (options.num === options.max) {
                      instance.off(namespace, options.fn);
                  }
                  // 如果没有返回 false，而是调用了 event.stop 也算是返回 false
                  if (event_1) {
                      if (result === FALSE) {
                          event_1.prevent().stop();
                      }
                      else if (event_1.isStoped) {
                          result = FALSE;
                      }
                  }
                  if (result === FALSE) {
                      return isComplete = FALSE;
                  }
              });
          }
          return isComplete;
      };
      /**
       * 注册监听
       *
       * @param type
       * @param listener
       */
      Emitter.prototype.on = function (type, listener) {
          var instance = this, listeners = instance.listeners, options = func(listener)
              ? { fn: listener }
              : listener;
          if (object(options) && func(options.fn)) {
              var namespace = string(type) ? instance.parse(type) : type;
              options.ns = namespace.ns;
              push(listeners[namespace.type] || (listeners[namespace.type] = []), options);
          }
      };
      /**
       * 取消监听
       *
       * @param type
       * @param listener
       */
      Emitter.prototype.off = function (type, listener) {
          var instance = this, listeners = instance.listeners;
          if (type) {
              var namespace = string(type) ? instance.parse(type) : type, name = namespace.type, ns_1 = namespace.ns, matchListener_1 = createMatchListener(listener), each$1 = function (list, name) {
                  each(list, function (options, index) {
                      if (matchListener_1(options) && matchNamespace(ns_1, options)) {
                          list.splice(index, 1);
                      }
                  }, TRUE);
                  if (!list.length) {
                      delete listeners[name];
                  }
              };
              if (name) {
                  if (listeners[name]) {
                      each$1(listeners[name], name);
                  }
              }
              else if (ns_1) {
                  each$2(listeners, each$1);
              }
          }
          else {
              // 清空
              instance.listeners = {};
          }
      };
      /**
       * 是否已监听某个事件
       *
       * @param type
       * @param listener
       */
      Emitter.prototype.has = function (type, listener) {
          var instance = this, listeners = instance.listeners, namespace = string(type) ? instance.parse(type) : type, name = namespace.type, ns = namespace.ns, result = TRUE, matchListener = createMatchListener(listener), each$1 = function (list) {
              each(list, function (options) {
                  if (matchListener(options) && matchNamespace(ns, options)) {
                      return result = FALSE;
                  }
              });
              return result;
          };
          if (name) {
              if (listeners[name]) {
                  each$1(listeners[name]);
              }
          }
          else if (ns) {
              each$2(listeners, each$1);
          }
          return !result;
      };
      /**
       * 把事件类型解析成命名空间格式
       *
       * @param type
       */
      Emitter.prototype.parse = function (type) {
          // 这里 ns 必须为字符串
          // 用于区分 event 对象是否已完成命名空间的解析
          var result = {
              type: type,
              ns: EMPTY_STRING
          };
          // 是否开启命名空间
          if (this.ns) {
              var index = indexOf$1(type, RAW_DOT);
              if (index >= 0) {
                  result.type = slice(type, 0, index);
                  result.ns = slice(type, index + 1);
              }
          }
          return result;
      };
      return Emitter;
  }());
  function matchTrue() {
      return TRUE;
  }
  /**
   * 外部会传入 Function 或 EmitterOptions 或 空
   *
   * 这里根据传入值的不同类型，创建不同的判断函数
   *
   * 如果传入的是 EmitterOptions，则全等判断
   *
   * 如果传入的是 Function，则判断函数是否全等
   *
   * 如果传入的是空，则直接返回 true
   *
   * @param listener
   */
  function createMatchListener(listener) {
      return func(listener)
          ? function (options) {
              return listener === options.fn;
          }
          : matchTrue;
  }
  /**
   * 判断 options 是否能匹配命名空间
   *
   * 如果 namespace 和 options.ns 都不为空，则需完全匹配
   *
   * 如果他们两个其中任何一个为空，则不判断命名空间
   *
   * @param namespace
   * @param options
   */
  function matchNamespace(namespace, options) {
      var ns = options.ns;
      return ns && namespace
          ? ns === namespace
          : TRUE;
  }

  function isNative (target) {
      return func(target)
          && has$1(toString(target), '[native code]');
  }

  var nextTick;
  // IE (10+) 和 node
  if (typeof setImmediate === RAW_FUNCTION && isNative(setImmediate)) {
      nextTick = setImmediate;
  }
  // 用 MessageChannel 去做 setImmediate 的 polyfill
  // 原理是将新的 message 事件加入到原有的 dom events 之后
  // 兼容性 IE10+ 和其他标准浏览器
  if (typeof MessageChannel === RAW_FUNCTION && isNative(MessageChannel)) {
      nextTick = function (fn) {
          var channel = new MessageChannel();
          channel.port1.onmessage = fn;
          channel.port2.postMessage(1);
      };
  }
  else {
      nextTick = setTimeout;
  }
  var nextTick$1 = nextTick;

  var shared;
  var NextTask = /** @class */ (function () {
      function NextTask() {
          this.tasks = [];
      }
      /**
       * 全局单例
       */
      NextTask.shared = function () {
          return shared || (shared = new NextTask());
      };
      /**
       * 在队尾添加异步任务
       */
      NextTask.prototype.append = function (func, context) {
          var instance = this, tasks = instance.tasks;
          push(tasks, {
              fn: func,
              ctx: context
          });
          if (tasks.length === 1) {
              nextTick$1(function () {
                  instance.run();
              });
          }
      };
      /**
       * 在队首添加异步任务
       */
      NextTask.prototype.prepend = function (func, context) {
          var instance = this, tasks = instance.tasks;
          unshift(tasks, {
              fn: func,
              ctx: context
          });
          if (tasks.length === 1) {
              nextTick$1(function () {
                  instance.run();
              });
          }
      };
      /**
       * 清空异步队列
       */
      NextTask.prototype.clear = function () {
          this.tasks.length = 0;
      };
      /**
       * 立即执行异步任务，并清空队列
       */
      NextTask.prototype.run = function () {
          var tasks = this.tasks;
          if (tasks.length) {
              this.tasks = [];
              each(tasks, function (task) {
                  execute(task.fn, task.ctx);
              });
          }
      };
      return NextTask;
  }());

  function toNumber (target, defaultValue) {
      return numeric(target)
          ? +target
          : defaultValue !== UNDEFINED
              ? defaultValue
              : 0;
  }

  /**
   * 计算属性
   *
   * 可配置 cache、deps、get、set 等
   */
  var Computed = /** @class */ (function () {
      function Computed(keypath, sync, cache, deps, observer, getter, setter) {
          var instance = this;
          instance.keypath = keypath;
          instance.cache = cache;
          instance.deps = deps;
          instance.context = observer.context;
          instance.observer = observer;
          instance.getter = getter;
          instance.setter = setter;
          instance.unique = {};
          instance.watcher = function ($0, $1, $2) {
              // 计算属性的依赖变了会走进这里
              var oldValue = instance.value, newValue = instance.get(TRUE);
              if (newValue !== oldValue) {
                  observer.diff(keypath, newValue, oldValue);
              }
          };
          instance.watcherOptions = {
              sync: sync,
              watcher: instance.watcher
          };
          if (instance.fixed = !falsy(deps)) {
              each(deps, function (dep) {
                  observer.watch(dep, instance.watcherOptions);
              });
          }
      }
      /**
       * 读取计算属性的值
       *
       * @param force 是否强制刷新缓存
       */
      Computed.prototype.get = function (force) {
          var instance = this, getter = instance.getter, context = instance.context;
          // 禁用缓存
          if (!instance.cache) {
              instance.value = execute(getter, context);
          }
          // 减少取值频率，尤其是处理复杂的计算规则
          else if (force || !has$2(instance, RAW_VALUE)) {
              // 如果写死了依赖，则不需要收集依赖
              if (instance.fixed) {
                  instance.value = execute(getter, context);
              }
              else {
                  // 清空上次收集的依赖
                  instance.unbind();
                  // 开始收集新的依赖
                  var lastComputed = Computed.current;
                  Computed.current = instance;
                  instance.value = execute(getter, context);
                  // 绑定新的依赖
                  instance.bind();
                  Computed.current = lastComputed;
              }
          }
          return instance.value;
      };
      Computed.prototype.set = function (value) {
          var _a = this, setter = _a.setter, context = _a.context;
          if (setter) {
              setter.call(context, value);
          }
      };
      /**
       * 添加依赖
       *
       * 这里只是为了保证依赖唯一，最后由 bind() 实现绑定
       *
       * @param dep
       */
      Computed.prototype.add = function (dep) {
          this.unique[dep] = TRUE;
      };
      /**
       * 绑定依赖
       */
      Computed.prototype.bind = function () {
          var _a = this, unique = _a.unique, deps = _a.deps, observer = _a.observer, watcherOptions = _a.watcherOptions;
          each$2(unique, function (_, dep) {
              push(deps, dep);
              observer.watch(dep, watcherOptions);
          });
          // 用完重置
          // 方便下次收集依赖
          this.unique = {};
      };
      /**
       * 解绑依赖
       */
      Computed.prototype.unbind = function () {
          var _a = this, deps = _a.deps, observer = _a.observer, watcher = _a.watcher;
          each(deps, function (dep) {
              observer.unwatch(dep, watcher);
          }, TRUE);
          deps.length = 0;
      };
      return Computed;
  }());

  /**
   * 从 keypath 数组中选择和 keypath 最匹配的那一个
   *
   * @param sorted 经过排序的 keypath 数组
   * @param keypath
   */
  function matchBest (sorted, keypath) {
      var result;
      each(sorted, function (prefix) {
          var length = match(keypath, prefix);
          if (length >= 0) {
              result = {
                  name: prefix,
                  prop: slice(keypath, length)
              };
              return FALSE;
          }
      });
      return result;
  }

  function readValue (source, keypath) {
      if (source == NULL || keypath === EMPTY_STRING) {
          return source;
      }
      var result = get(source, keypath);
      if (result) {
          return result.value;
      }
  }

  /**
   * 对比新旧数组
   *
   * @param newValue
   * @param oldValue
   * @param callback
   */
  function diffString (newValue, oldValue, callback) {
      var newIsString = string(newValue), oldIsString = string(oldValue);
      if (newIsString || oldIsString) {
          callback(RAW_LENGTH, newIsString ? newValue.length : UNDEFINED, oldIsString ? oldValue.length : UNDEFINED);
          return TRUE;
      }
  }

  /**
   * 对比新旧数组
   *
   * @param newValue
   * @param oldValue
   * @param callback
   */
  function diffArray (newValue, oldValue, callback) {
      var newIsArray = array(newValue), oldIsArray = array(oldValue);
      if (newIsArray || oldIsArray) {
          var newLength = newIsArray ? newValue.length : UNDEFINED, oldLength = oldIsArray ? oldValue.length : UNDEFINED;
          callback(RAW_LENGTH, newLength, oldLength);
          for (var i = 0, length = Math.max(newLength || 0, oldLength || 0); i < length; i++) {
              callback('' + i, newValue ? newValue[i] : UNDEFINED, oldValue ? oldValue[i] : UNDEFINED);
          }
          return TRUE;
      }
  }

  /**
   * 对比新旧对象
   *
   * @param newValue
   * @param oldValue
   * @param callback
   */
  function diffObject (newValue, oldValue, callback) {
      var newIsObject = object(newValue), oldIsObject = object(oldValue);
      if (newIsObject || oldIsObject) {
          newValue = newIsObject ? newValue : EMPTY_OBJECT;
          oldValue = oldIsObject ? oldValue : EMPTY_OBJECT;
          if (newIsObject) {
              each$2(newValue, function (value, key) {
                  if (value !== oldValue[key]) {
                      callback(key, value, oldValue[key]);
                  }
              });
          }
          if (oldIsObject) {
              each$2(oldValue, function (value, key) {
                  if (value !== newValue[key]) {
                      callback(key, newValue[key], value);
                  }
              });
          }
      }
  }

  function diffRecursion(keypath, newValue, oldValue, watchFuzzyKeypaths, callback) {
      var diff = function (subKeypath, subNewValue, subOldValue) {
          if (subNewValue !== subOldValue) {
              var newKeypath_1 = join$1(keypath, subKeypath);
              each(watchFuzzyKeypaths, function (fuzzyKeypath) {
                  if (matchFuzzy(newKeypath_1, fuzzyKeypath) !== UNDEFINED) {
                      callback(fuzzyKeypath, newKeypath_1, subNewValue, subOldValue);
                  }
              });
              diffRecursion(newKeypath_1, subNewValue, subOldValue, watchFuzzyKeypaths, callback);
          }
      };
      diffString(newValue, oldValue, diff)
          || diffArray(newValue, oldValue, diff)
          || diffObject(newValue, oldValue, diff);
  }

  function diffWatcher (keypath, newValue, oldValue, watcher, isRecursive, callback) {
      var fuzzyKeypaths;
      // 遍历监听的 keypath，如果未被监听，则无需触发任何事件
      each$2(watcher, function (_, watchKeypath) {
          // 模糊监听，如 users.*.name
          if (isFuzzy(watchKeypath)) {
              // 如果当前修改的是 users.0 整个对象
              // users.0 和 users.*.name 无法匹配
              // 此时要知道设置 users.0 到底会不会改变 users.*.name 需要靠递归了
              // 如果匹配，则无需递归
              if (matchFuzzy(keypath, watchKeypath) !== UNDEFINED) {
                  callback(watchKeypath, keypath, newValue, oldValue);
              }
              else if (isRecursive) {
                  if (fuzzyKeypaths) {
                      push(fuzzyKeypaths, watchKeypath);
                  }
                  else {
                      fuzzyKeypaths = [watchKeypath];
                  }
              }
              return;
          }
          // 不是模糊匹配，直接靠前缀匹配
          // 比如监听的是 users.0.name，此时修改 users.0，则直接读出子属性值，判断是否相等
          var length = match(watchKeypath, keypath);
          if (length >= 0) {
              var subKeypath = slice(watchKeypath, length), subNewValue = readValue(newValue, subKeypath), subOldValue = readValue(oldValue, subKeypath);
              if (subNewValue !== subOldValue) {
                  callback(watchKeypath, watchKeypath, subNewValue, subOldValue);
              }
          }
      });
      // 存在模糊匹配的需求
      // 必须对数据进行递归
      // 性能确实会慢一些，但是很好用啊，几乎可以监听所有的数据
      if (fuzzyKeypaths) {
          diffRecursion(keypath, newValue, oldValue, fuzzyKeypaths, callback);
      }
  }

  /**
   * 触发异步变化时，用此函数过滤下，哪些 listener 应该执行
   *
   * @param item
   * @param data
   */
  function filterWatcher (_, args, options) {
      if (options.count && args) {
          // 采用计数器的原因是，同一个 options 可能执行多次
          // 比如监听 user.*，如果同批次修改了 user.name 和 user.age
          // 这个监听器会调用多次，如果第一次执行就把 count 干掉了，第二次就无法执行了
          options.count--;
          // 新旧值不相等
          return args[0] !== args[1];
      }
  }

  // 避免频繁创建对象
  var optionsHolder = {
      watcher: EMPTY_FUNCTION
  };
  /**
   * 格式化 watch options
   *
   * @param options
   */
  function formatWatcherOptions (options, immediate) {
      if (func(options)) {
          optionsHolder.watcher = options;
          optionsHolder.immediate = immediate === TRUE;
          return optionsHolder;
      }
      if (options && options.watcher) {
          return options;
      }
  }

  /**
   * 观察者有两种观察模式：
   *
   * 1. 同步监听
   * 2. 异步监听
   *
   * 对于`计算属性`这种需要实时变化的对象，即它的依赖变了，它需要立即跟着变，否则会出现不一致的问题
   * 这种属于同步监听
   *
   * 对于外部调用 observer.watch('keypath', listener)，属于异步监听，它只关心是否变了，而不关心是否是立即触发的
   */
  var Observer = /** @class */ (function () {
      function Observer(data, context) {
          var instance = this;
          instance.data = data || {};
          instance.context = context || instance;
          instance.nextTask = new NextTask();
          instance.syncEmitter = new Emitter();
          instance.asyncEmitter = new Emitter();
          instance.asyncChanges = {};
      }
      /**
       * 获取数据
       *
       * @param keypath
       * @param defaultValue
       * @param depIgnore
       * @return
       */
      Observer.prototype.get = function (keypath, defaultValue, depIgnore) {
          var instance = this, currentComputed = Computed.current, data = instance.data, computed = instance.computed, reversedComputedKeys = instance.reversedComputedKeys;
          // 传入 '' 获取整个 data
          if (keypath === EMPTY_STRING) {
              return data;
          }
          // 调用 get 时，外面想要获取依赖必须设置是谁在收集依赖
          // 如果没设置，则跳过依赖收集
          if (currentComputed && !depIgnore) {
              currentComputed.add(keypath);
          }
          var result, target;
          if (computed) {
              target = computed[keypath];
              if (target) {
                  return target.get();
              }
              if (reversedComputedKeys) {
                  var match = matchBest(reversedComputedKeys, keypath);
                  if (match && match.prop) {
                      result = get(computed[match.name].get(), match.prop);
                  }
              }
          }
          if (!result) {
              result = get(data, keypath);
          }
          return result ? result.value : defaultValue;
      };
      /**
       * 更新数据
       *
       * @param keypath
       * @param value
       */
      Observer.prototype.set = function (keypath, value) {
          var instance = this, data = instance.data, computed = instance.computed, reversedComputedKeys = instance.reversedComputedKeys, setValue = function (newValue, keypath) {
              var oldValue = instance.get(keypath);
              if (newValue === oldValue) {
                  return;
              }
              var target;
              if (computed) {
                  target = computed[keypath];
                  if (target) {
                      target.set(newValue);
                  }
                  if (reversedComputedKeys) {
                      var match = matchBest(reversedComputedKeys, keypath);
                      if (match && match.prop) {
                          target = computed[match.name];
                          if (target) {
                              var targetValue = target.get();
                              if (object(targetValue)) {
                                  set(targetValue, match.prop, newValue);
                              }
                          }
                      }
                  }
              }
              if (!target) {
                  set(data, keypath, newValue);
              }
              instance.diff(keypath, newValue, oldValue);
          };
          if (string(keypath)) {
              setValue(value, keypath);
          }
          else if (object(keypath)) {
              each$2(keypath, setValue);
          }
      };
      /**
       * 同步调用的 diff，用于触发 syncEmitter，以及唤醒 asyncEmitter
       *
       * @param keypath
       * @param newValue
       * @param oldValue
       */
      Observer.prototype.diff = function (keypath, newValue, oldValue) {
          var instance = this, syncEmitter = instance.syncEmitter, asyncEmitter = instance.asyncEmitter, asyncChanges = instance.asyncChanges, 
          /**
           * 我们认为 $ 开头的变量是不可递归的
           * 比如浏览器中常见的 $0 表示当前选中元素
           * DOM 元素是不能递归的
           */
          isRecursive = codeAt(keypath) !== 36;
          diffWatcher(keypath, newValue, oldValue, syncEmitter.listeners, isRecursive, function (watchKeypath, keypath, newValue, oldValue) {
              syncEmitter.fire(watchKeypath, [newValue, oldValue, keypath]);
          });
          /**
           * 此处有坑，举个例子
           *
           * observer.watch('a', function () {})
           *
           * observer.set('a', 1)
           *
           * observer.watch('a', function () {})
           *
           * 这里，第一个 watcher 应该触发，但第二个不应该，因为它绑定监听时，值已经是最新的了
           */
          diffWatcher(keypath, newValue, oldValue, asyncEmitter.listeners, isRecursive, function (watchKeypath, keypath, newValue, oldValue) {
              each(asyncEmitter.listeners[watchKeypath], function (item) {
                  item.count++;
              });
              var keypaths = (asyncChanges[keypath] || (asyncChanges[keypath] = { value: oldValue, keypaths: [] })).keypaths;
              if (!has(keypaths, watchKeypath)) {
                  push(keypaths, watchKeypath);
              }
              if (!instance.pending) {
                  instance.pending = TRUE;
                  instance.nextTask.append(function () {
                      if (instance.pending) {
                          instance.pending = UNDEFINED;
                          instance.diffAsync();
                      }
                  });
              }
          });
      };
      /**
       * 异步触发的 diff
       */
      Observer.prototype.diffAsync = function () {
          var instance = this, asyncEmitter = instance.asyncEmitter, asyncChanges = instance.asyncChanges;
          instance.asyncChanges = {};
          each$2(asyncChanges, function (change, keypath) {
              var args = [instance.get(keypath), change.value, keypath];
              // 不能在这判断新旧值是否相同，相同就不 fire
              // 因为前面标记了 count，在这中断会导致 count 无法清除
              each(change.keypaths, function (watchKeypath) {
                  asyncEmitter.fire(watchKeypath, args, filterWatcher);
              });
          });
      };
      /**
       * 添加计算属性
       *
       * @param keypath
       * @param computed
       */
      Observer.prototype.addComputed = function (keypath, options) {
          var cache = TRUE, sync = TRUE, deps = [], getter, setter;
          if (func(options)) {
              getter = options;
          }
          else if (object(options)) {
              var computedOptions = options;
              if (boolean(computedOptions.cache)) {
                  cache = computedOptions.cache;
              }
              if (boolean(computedOptions.sync)) {
                  sync = computedOptions.sync;
              }
              // 因为可能会修改 deps，所以这里创建一个新的 deps，避免影响外部传入的 deps
              if (array(computedOptions.deps)) {
                  deps = copy(computedOptions.deps);
              }
              if (func(computedOptions.get)) {
                  getter = computedOptions.get;
              }
              if (func(computedOptions.set)) {
                  setter = computedOptions.set;
              }
          }
          if (getter) {
              var instance = this, computed = new Computed(keypath, sync, cache, deps, instance, getter, setter);
              if (!instance.computed) {
                  instance.computed = {};
              }
              instance.computed[keypath] = computed;
              instance.reversedComputedKeys = sort(instance.computed, TRUE);
              return computed;
          }
      };
      /**
       * 移除计算属性
       *
       * @param keypath
       */
      Observer.prototype.removeComputed = function (keypath) {
          var instance = this, computed = instance.computed;
          if (computed && has$2(computed, keypath)) {
              delete computed[keypath];
              instance.reversedComputedKeys = sort(computed, TRUE);
          }
      };
      /**
       * 监听数据变化
       *
       * @param keypath
       * @param watcher
       * @param immediate
       */
      Observer.prototype.watch = function (keypath, watcher, immediate) {
          var instance = this, context = instance.context, syncEmitter = instance.syncEmitter, asyncEmitter = instance.asyncEmitter, bind = function (keypath, options) {
              var emitter = options.sync ? syncEmitter : asyncEmitter, 
              // formatWatcherOptions 保证了 options.watcher 一定存在
              listener = {
                  fn: options.watcher,
                  ctx: context,
                  count: 0
              };
              if (options.once) {
                  listener.max = 1;
              }
              emitter.on(keypath, listener);
              if (options.immediate) {
                  execute(options.watcher, context, [
                      instance.get(keypath),
                      UNDEFINED,
                      keypath
                  ]);
              }
          };
          if (string(keypath)) {
              bind(keypath, formatWatcherOptions(watcher, immediate));
              return;
          }
          each$2(keypath, function (options, keypath) {
              bind(keypath, formatWatcherOptions(options));
          });
      };
      /**
       * 取消监听数据变化
       *
       * @param keypath
       * @param watcher
       */
      Observer.prototype.unwatch = function (keypath, watcher) {
          this.syncEmitter.off(keypath, watcher);
          this.asyncEmitter.off(keypath, watcher);
      };
      /**
       * 取反 keypath 对应的数据
       *
       * 不管 keypath 对应的数据是什么类型，操作后都是布尔型
       *
       * @param keypath
       * @return 取反后的布尔值
       */
      Observer.prototype.toggle = function (keypath) {
          var value = !this.get(keypath);
          this.set(keypath, value);
          return value;
      };
      /**
       * 递增 keypath 对应的数据
       *
       * 注意，最好是整型的加法，如果涉及浮点型，不保证计算正确
       *
       * @param keypath 值必须能转型成数字，如果不能，则默认从 0 开始递增
       * @param step 步进值，默认是 1
       * @param max 可以递增到的最大值，默认不限制
       */
      Observer.prototype.increase = function (keypath, step, max) {
          var value = toNumber(this.get(keypath), 0) + (step || 1);
          if (!number(max) || value <= max) {
              this.set(keypath, value);
              return value;
          }
      };
      /**
       * 递减 keypath 对应的数据
       *
       * 注意，最好是整型的减法，如果涉及浮点型，不保证计算正确
       *
       * @param keypath 值必须能转型成数字，如果不能，则默认从 0 开始递减
       * @param step 步进值，默认是 1
       * @param min 可以递减到的最小值，默认不限制
       */
      Observer.prototype.decrease = function (keypath, step, min) {
          var value = toNumber(this.get(keypath), 0) - (step || 1);
          if (!number(min) || value >= min) {
              this.set(keypath, value);
              return value;
          }
      };
      /**
       * 在数组指定位置插入元素
       *
       * @param keypath
       * @param item
       * @param index
       */
      Observer.prototype.insert = function (keypath, item, index) {
          var list = this.get(keypath);
          list = !array(list) ? [] : copy(list);
          var length = list.length;
          if (index === TRUE || index === length) {
              list.push(item);
          }
          else if (index === FALSE || index === 0) {
              list.unshift(item);
          }
          else if (index > 0 && index < length) {
              list.splice(index, 0, item);
          }
          else {
              return;
          }
          this.set(keypath, list);
          return TRUE;
      };
      /**
       * 在数组尾部添加元素
       *
       * @param keypath
       * @param item
       */
      Observer.prototype.append = function (keypath, item) {
          return this.insert(keypath, item, TRUE);
      };
      /**
       * 在数组首部添加元素
       *
       * @param keypath
       * @param item
       */
      Observer.prototype.prepend = function (keypath, item) {
          return this.insert(keypath, item, FALSE);
      };
      /**
       * 通过索引移除数组中的元素
       *
       * @param keypath
       * @param index
       */
      Observer.prototype.removeAt = function (keypath, index) {
          var list = this.get(keypath);
          if (array(list)
              && index >= 0
              && index < list.length) {
              list = copy(list);
              list.splice(index, 1);
              this.set(keypath, list);
              return TRUE;
          }
      };
      /**
       * 直接移除数组中的元素
       *
       * @param keypath
       * @param item
       */
      Observer.prototype.remove = function (keypath, item) {
          var list = this.get(keypath);
          if (array(list)) {
              list = copy(list);
              if (remove(list, item)) {
                  this.set(keypath, list);
                  return TRUE;
              }
          }
      };
      /**
       * 拷贝任意数据，支持深拷贝
       *
       * @param data
       * @param deep
       */
      Observer.prototype.copy = function (data, deep) {
          return copy(data, deep);
      };
      /**
       * 销毁
       */
      Observer.prototype.destroy = function () {
          var instance = this;
          instance.syncEmitter.off();
          instance.asyncEmitter.off();
          instance.nextTask.clear();
          clear(instance);
      };
      return Observer;
  }());

  var Yox = /** @class */ (function () {
      function Yox(options) {
          var instance = this, $options = options || EMPTY_OBJECT;
          // 为了冒泡 HOOK_BEFORE_CREATE 事件，必须第一时间创建 emitter
          // 监听各种事件
          // 支持命名空间
          instance.$emitter = new Emitter(TRUE);
          if ($options.events) {
              instance.on($options.events);
          }
          var data = $options.data, props = $options.props, vnode = $options.vnode, propTypes = $options.propTypes, computed = $options.computed, methods = $options.methods, watchers = $options.watchers, extensions = $options.extensions;
          instance.$options = $options;
          if (extensions) {
              extend(instance, extensions);
          }
          // 数据源，默认值仅在创建组件时启用
          var source = props ? copy(props) : {};
          // 先放 props
          // 当 data 是函数时，可以通过 this.get() 获取到外部数据
          var observer = instance.$observer = new Observer(source, instance);
          if (computed) {
              each$2(computed, function (options, keypath) {
                  observer.addComputed(keypath, options);
              });
          }
          var extend$1 = func(data) ? execute(data, instance, options) : data;
          if (object(extend$1)) {
              each$2(extend$1, function (value, key) {
                  source[key] = value;
              });
          }
          if (methods) {
              each$2(methods, function (method, name) {
                  instance[name] = method;
              });
          }
          if (watchers) {
              instance.watch(watchers);
          }
      }
      /**
       * 定义组件对象
       */
      Yox.define = function (options) {
          return options;
      };
      /**
       * 安装插件
       *
       * 插件必须暴露 install 方法
       */
      Yox.use = function (plugin) {
          plugin.install(Yox);
      };
      /**
       * 因为组件采用的是异步更新机制，为了在更新之后进行一些操作，可使用 nextTick
       */
      Yox.nextTick = function (task, context) {
          NextTask.shared().append(task, context);
      };
      /**
       * 编译模板，暴露出来是为了打包阶段的模板预编译
       */
      Yox.compile = function (template, stringify) {
          {
              return template;
          }
      };
      /**
       * 注册全局指令
       */
      Yox.directive = function (name, directive) {
      };
      /**
       * 注册全局过渡动画
       */
      Yox.transition = function (name, transition) {
      };
      /**
       * 注册全局组件
       */
      Yox.component = function (name, component) {
      };
      /**
       * 注册全局子模板
       */
      Yox.partial = function (name, partial) {
      };
      /**
       * 注册全局过滤器
       */
      Yox.filter = function (name, filter) {
      };
      /**
       * 取值
       */
      Yox.prototype.get = function (keypath, defaultValue) {
          return this.$observer.get(keypath, defaultValue);
      };
      /**
       * 设值
       */
      Yox.prototype.set = function (keypath, value) {
          // 组件经常有各种异步改值，为了避免组件销毁后依然调用 set
          // 这里判断一下，至于其他方法的异步调用就算了，业务自己控制吧
          var $observer = this.$observer;
          if ($observer) {
              $observer.set(keypath, value);
          }
      };
      /**
       * 监听事件，支持链式调用
       */
      Yox.prototype.on = function (type, listener) {
          addEvents(this, type, listener);
          return this;
      };
      /**
       * 监听一次事件，支持链式调用
       */
      Yox.prototype.once = function (type, listener) {
          addEvents(this, type, listener, TRUE);
          return this;
      };
      /**
       * 取消监听事件，支持链式调用
       */
      Yox.prototype.off = function (type, listener) {
          this.$emitter.off(type, listener);
          return this;
      };
      /**
       * 发射事件
       */
      Yox.prototype.fire = function (type, data, downward) {
          // 外部为了使用方便，fire(type) 或 fire(type, data) 就行了
          // 内部为了保持格式统一
          // 需要转成 Event，这样还能知道 target 是哪个组件
          var instance = this, $emitter = instance.$emitter, $parent = instance.$parent, $children = instance.$children, event = type instanceof CustomEvent ? type : new CustomEvent(type), args = [event], isComplete;
          // 创建完 CustomEvent，如果没有人为操作
          // 它的 ns 为 undefined
          // 这里先解析出命名空间，避免每次 fire 都要解析
          if (event.ns === UNDEFINED) {
              var namespace = $emitter.parse(event.type);
              event.type = namespace.type;
              event.ns = namespace.ns;
          }
          // 告诉外部是谁发出的事件
          if (!event.target) {
              event.target = instance;
          }
          // 比如 fire('name', true) 直接向下发事件
          if (object(data)) {
              push(args, data);
          }
          else if (data === TRUE) {
              downward = TRUE;
          }
          isComplete = $emitter.fire(event, args);
          if (isComplete) {
              if (downward) {
                  if ($children) {
                      event.phase = CustomEvent.PHASE_DOWNWARD;
                      each($children, function (child) {
                          return isComplete = child.fire(event, data, TRUE);
                      });
                  }
              }
              else if ($parent) {
                  event.phase = CustomEvent.PHASE_UPWARD;
                  isComplete = $parent.fire(event, data);
              }
          }
          return isComplete;
      };
      /**
       * 监听数据变化，支持链式调用
       */
      Yox.prototype.watch = function (keypath, watcher, immediate) {
          this.$observer.watch(keypath, watcher, immediate);
          return this;
      };
      /**
       * 取消监听数据变化，支持链式调用
       */
      Yox.prototype.unwatch = function (keypath, watcher) {
          this.$observer.unwatch(keypath, watcher);
          return this;
      };
      /**
       * 加载组件，组件可以是同步或异步，最后会调用 callback
       *
       * @param name 组件名称
       * @param callback 组件加载成功后的回调
       */
      Yox.prototype.loadComponent = function (name, callback) {
      };
      /**
       * 创建子组件
       *
       * @param options 组件配置
       * @param vnode 虚拟节点
       */
      Yox.prototype.createComponent = function (options, vnode) {
          {
              return this;
          }
      };
      /**
       * 注册当前组件级别的指令
       */
      Yox.prototype.directive = function (name, directive) {
      };
      /**
       * 注册当前组件级别的过渡动画
       */
      Yox.prototype.transition = function (name, transition) {
      };
      /**
       * 注册当前组件级别的组件
       */
      Yox.prototype.component = function (name, component) {
      };
      /**
       * 注册当前组件级别的子模板
       */
      Yox.prototype.partial = function (name, partial) {
      };
      /**
       * 注册当前组件级别的过滤器
       */
      Yox.prototype.filter = function (name, filter) {
      };
      /**
       * 对于某些特殊场景，修改了数据，但是模板的依赖中并没有这一项
       * 而你非常确定需要更新模板，强制刷新正是你需要的
       */
      Yox.prototype.forceUpdate = function (props) {
      };
      /**
       * 把模板抽象语法树渲染成 virtual dom
       */
      Yox.prototype.render = function () {
      };
      /**
       * 更新 virtual dom
       *
       * @param vnode
       * @param oldVnode
       */
      Yox.prototype.update = function (vnode, oldVnode) {
      };
      /**
       * 校验组件参数
       *
       * @param props
       */
      Yox.prototype.checkProp = function (key, value) {
      };
      /**
       * 销毁组件
       */
      Yox.prototype.destroy = function () {
          var instance = this, $parent = instance.$parent, $options = instance.$options, $emitter = instance.$emitter, $observer = instance.$observer;
          $observer.destroy();
          // 发完 after destroy 事件再解绑所有事件
          $emitter.off();
          clear(instance);
      };
      /**
       * 因为组件采用的是异步更新机制，为了在更新之后进行一些操作，可使用 nextTick
       */
      Yox.prototype.nextTick = function (task) {
          this.$observer.nextTask.append(task, this);
      };
      /**
       * 取反 keypath 对应的数据
       *
       * 不管 keypath 对应的数据是什么类型，操作后都是布尔型
       */
      Yox.prototype.toggle = function (keypath) {
          return this.$observer.toggle(keypath);
      };
      /**
       * 递增 keypath 对应的数据
       *
       * 注意，最好是整型的加法，如果涉及浮点型，不保证计算正确
       *
       * @param keypath 值必须能转型成数字，如果不能，则默认从 0 开始递增
       * @param step 步进值，默认是 1
       * @param max 可以递增到的最大值，默认不限制
       */
      Yox.prototype.increase = function (keypath, step, max) {
          return this.$observer.increase(keypath, step, max);
      };
      /**
       * 递减 keypath 对应的数据
       *
       * 注意，最好是整型的减法，如果涉及浮点型，不保证计算正确
       *
       * @param keypath 值必须能转型成数字，如果不能，则默认从 0 开始递减
       * @param step 步进值，默认是 1
       * @param min 可以递减到的最小值，默认不限制
       */
      Yox.prototype.decrease = function (keypath, step, min) {
          return this.$observer.decrease(keypath, step, min);
      };
      /**
       * 在数组指定位置插入元素
       *
       * @param keypath
       * @param item
       * @param index
       */
      Yox.prototype.insert = function (keypath, item, index) {
          return this.$observer.insert(keypath, item, index);
      };
      /**
       * 在数组尾部添加元素
       *
       * @param keypath
       * @param item
       */
      Yox.prototype.append = function (keypath, item) {
          return this.$observer.append(keypath, item);
      };
      /**
       * 在数组首部添加元素
       *
       * @param keypath
       * @param item
       */
      Yox.prototype.prepend = function (keypath, item) {
          return this.$observer.prepend(keypath, item);
      };
      /**
       * 通过索引移除数组中的元素
       *
       * @param keypath
       * @param index
       */
      Yox.prototype.removeAt = function (keypath, index) {
          return this.$observer.removeAt(keypath, index);
      };
      /**
       * 直接移除数组中的元素
       *
       * @param keypath
       * @param item
       */
      Yox.prototype.remove = function (keypath, item) {
          return this.$observer.remove(keypath, item);
      };
      /**
       * 拷贝任意数据，支持深拷贝
       *
       * @param data
       * @param deep
       */
      Yox.prototype.copy = function (data, deep) {
          return this.$observer.copy(data, deep);
      };
      /**
       * core 版本
       */
      Yox.version = "1.0.0-alpha.108";
      /**
       * 方便外部共用的通用逻辑，特别是写插件，减少重复代码
       */
      Yox.is = is;
      Yox.array = array$1;
      Yox.object = object$1;
      Yox.string = string$1;
      Yox.logger = logger;
      Yox.Event = CustomEvent;
      Yox.Emitter = Emitter;
      return Yox;
  }());
  function addEvent(instance, type, listener, once) {
      var options = {
          fn: listener,
          ctx: instance
      };
      if (once) {
          options.max = 1;
      }
      // YoxInterface 没有声明 $emitter，因为不想让外部访问，
      // 但是这里要用一次，所以加了 as any
      instance.$emitter.on(type, options);
  }
  function addEvents(instance, type, listener, once) {
      if (string(type)) {
          addEvent(instance, type, listener, once);
      }
      else {
          each$2(type, function (value, key) {
              addEvent(instance, key, value, once);
          });
      }
  }

  return Yox;

}));
//# sourceMappingURL=yox.js.map
