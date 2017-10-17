(function() {
    var Tools,
        Calendar,
        I18n,
        Module,
        Events,
        Validator,
        TimePicker,
        D,
        Canvas,
        Feedback,
        moduleKeywords = ' included extended ',
        _WEEK = 7, //每周天数
        _i18nWeek = { //中英文日历抬头
            'zh-CN': [
                '日',
                "一",
                '二',
                "三",
                '四',
                "五",
                "六"
            ],
            'en-US': [
                "Sun",
                'Mon',
                "Tues",
                'Wed',
                "Thur",
                "Fri",
                'Sat'
            ]
        },
        str = {
            submit: {
                'zh-CN': '确定',
                'en-US': 'submit'
            },

            undefinedError: {
                'zh-CN': '未声明的错误',
                'en-US': 'Undefined error'
            }
        },

        extend = function(child, parent) {
            for (var key in parent) {
                if ({}.hasOwnProperty.call(parent, key))
                    child[key] = parent[key];
            }

            function Ctor() {}
            Ctor.prototype = parent.prototype;
            child.prototype = new Ctor();
            child.prototype.constructor = child;
            child.__super__ = parent.prototype;
            return child;
        };

    I18n = {
        language: (navigator.language || navigator.browserLanguage),
        trans: function(str) {
            var ref;
            return ((ref = str[this.language]) == null ? str : ref);
        },
        i18n: function(str, arr) {
            str = this.trans(str);
            if (null != arr) {
                var i = 0,
                    content = (arr.constructor == Array ? arr : [arr]);
                str = str.replace(/%s/g, function() {
                    return ' ' + content[i++] + ' ';
                });
            }
            return str;
        }
    };

    Events = {
        on: (function() {
            if (document.body.addEventListener) {
                return function(tag, event, func) {
                    tag.addEventListener(event, func, false);
                };
            } else if (document.body.attachEvent) {
                return function(tag, event, func) {
                    var f = function (){
                        func.apply(tag);
                    };
                    tag.attachEvent('on' + event, f);
                };
            } else {
                return function(tag, event, func) {
                    tag['on' + event] = func;
                };
            }
        })(),
        off: (function() {
            if (document.body.removeEventListener) {
                return function(tag, event, func) {
                    tag.removeEventListener(event, func, false);
                };
            } else if (document.body.detachEvent) {
                return function(tag, event, func) {
                    tag.detachEvent('on' + event, func);
                };
            } else {
                return function(tag, event, func) {
                    tag['on' + event] = null;
                };
            }
        })(),
        getEvent: function(e) {
            return e || window.event;
        },
        stopBubble: function(e) {
            var event = this.getEvent(e);
            if (document.all) {
                event.cancelBubble = true;
            } else {
                event.stopPropagation();
            }
        },
        stopDefault: function(e) {
            var event = this.getEvent(e);
            if (document.all) {
                event.returnValue = false;
            } else {
                event.preventDefault();
            }
        },
        getTarget: function(e) {
            var event = this.getEvent(e);
            return event.target || event.srcElement;
        }
    };

    Module = (function() {
        Module.include = function(obj) {
            var key,
                ref,
                value;
            if (!obj) {
                throw new Error('include(obj) requires obj');
            }
            for (key in obj) {
                value = obj[key];
                if (moduleKeywords.indexOf(' ' + key + ' ') < 0) {
                    this.prototype[key] = value;
                }
            }
            if ((ref = obj.included) != null) {
                ref.apply(this);
            }
            return this;
        };

        Module.extend = function(obj) {
            var key,
                ref,
                value;
            if (!obj) {
                throw new Error('extend(obj) requires obj');
            }
            for (key in obj) {
                value = obj[key];
                if (moduleKeywords.indexOf(' ' + key + ' ') < 0) {
                    this[key] = value;
                }
            }
            if ((ref = obj.extended) != null) {
                ref.apply(this);
            }
            return this;
        };

        Module.proxy = function(func) {
            return (function(_this) {
                return function() {
                    return func.apply(_this, arguments);
                };
            })(this);
        };

        Module.prototype.proxy = function(func) {
            return (function(_this) {
                return function() {
                    return func.apply(_this, arguments);
                };
            })(this);
        };

        function Module() {
            if (typeof this.init === "function") {
                this.init.apply(this, arguments);
            }
        }

        return Module;

    })();

    Validator = (function(superClass) {
        extend(Validator, superClass);

        Validator.include(I18n);
        Validator.include(Events);

        function Validator() {
            Validator.__super__.constructor.apply(this, arguments);
        }

        Validator.defineConfig = function(obj) {
            if (typeof obj !== 'object') {
                throw new Error(this.i18n('Validator.defineConfig的参数类型为object'));
            }
            var key,
                val,
                ref;
            for (key in obj) {
                val = obj[key];
                if (typeof(ref = window[val.func] || this[val.func] || window[key] || this[key]) == 'function') {
                    Validator.vConfig[key] = val;
                }
            }
        };

        Validator.vConfig = {
            "require": {
                "func": "require",
                "type": 15,
                "error": I18n.i18n("require")
            },
            "int": {
                "func": "integer",
                "type": 15,
                "error": I18n.i18n("int")
            },
            "phone": {
                "func": "phone",
                "type": 15,
                "error": I18n.i18n("phone")
            },
            "email": {
                "func": "email",
                "type": 15,
                "error": I18n.i18n("email")
            },
            "IP": {
                "func": "IP",
                "type": 15,
                "error": I18n.i18n("IP")
            },
            "port": {
                "func": "port",
                "type": 15,
                "error": I18n.i18n("port")
            },
            "size": {
                "func": "size",
                "type": 15,
                "error": "%p0-%p1",
                "params": [
                    "minSize", "maxSize"
                ],
                "minSize": "1",
                "maxSize": "99"
            },
            "length": {
                "func": "length",
                "type": 15,
                "error": I18n.i18n("%p0-%p1位"),
                "params": [
                    "minLength", "maxLength"
                ],
                "minLength": "1",
                "maxLength": "32"
            }
        };

        Validator.prototype.init = function() {
            var ref,
                options = arguments[0] || {};
            this.showAllStatus = ((ref = options.showAllStatus) != null ? ref : true);
            this.language = ((ref = options.language) != null ? ref : this.language);
        };

        Validator.prototype.initOptions = function() {
            var options = arguments[0],
                i,
                ref,
                len,
                attrs,
                temp,
                params,
                j,
                p,
                len1,
                _this = this,
                isDom = this.isDom(options);
            this.acType = (arguments.length > 1 ? arguments[1] : '0');
            if (isDom) {
                this.statusTarget = options;
            } else if (typeof options == 'string') {
                this.statusTarget = document.querySelector(options);
            } else if (typeof options == 'object') {
                this.statusTarget = ((ref = options.statusTarget) != null ? (this.isDom(ref) ? ref : document.querySelector(ref)) : void 0);
            }

            if (this.statusTarget == null) {
                throw new Error('校验对象不存在，参数一必须为【dom对象，string类型的选择器、包含statusTarget属性的对象】中的一种，statusTarget值为dom对象或选择器');
            }

            function getTemp(attr) {
                _this[attr] = ((ref = options[attr]) != null ? ref : _this.statusTarget.getAttribute(attr));
            }

            attrs = ['valueTarget', 'showStatus', 'validators', 'validateTypes', 'errors'];
            this.validators = '';
            this.validateTypes = '';
            this.errors = '';
            for (i = 0, len = attrs.length; i < len; i++) {
                getTemp.call(this, attrs[i]);
            }

            this.valueTarget = ((ref = this.valueTarget) != null ? (this.isDom(ref) ? ref : document.querySelector(ref)) : void 0);

            if (this.valueTarget == null) {
                this.valueTarget = this.statusTarget;
            }

            this.showStatus = (this.showStatus == null ? true : this.showStatus);

            function dealArr(attr) {
                if (null == this[attr]) {
                    this[attr] = [];
                }
                if (typeof this[attr] == 'string') {
                    this[attr] = this[attr].split(/[,|\s]/);
                }
            }

            for (i = 2, len = attrs.length; i < len; i++) {
                dealArr.call(this, attrs[i]);
            }

            for (i = 0, len = this.validators.length; i < len; i++) {
                temp = Validator.vConfig[this.validators[i]];
                if (temp != null) {
                    params = temp.params;
                }
                if (null != params) { // 判断参数变量的值是否采用默认值
                    for (j = 0, len1 = params.length; j < len1; j++) {
                        p = params[j];
                        getTemp.call(this, p);
                        if (null == this[p] && null != temp[p]) {
                            this[p] = temp[p];
                        }
                    }
                }
            }

        };

        Validator.prototype.check = function() {
            this.initOptions.apply(this, arguments);

            var validator,
                temp,
                funcType,
                acType,
                reg,
                result,
                func,
                i,
                len,
                _this = this,
                validators = this.validators,
                validateTypes = this.validateTypes;

            for (i = 0, len = validators.length; i < len; i++) {
                validator = validators[i];
                // 该方法是获取json配置到新的对象中，防止当前配置改变原json的配置
                temp = Validator.vConfig[validator];
                if (null != temp) {
                    funcType = null != validateTypes[i] ? Number(validateTypes[i]) : temp.type ? Number(temp.type) : 15;
                    acType = Number(this.acType);
                    if ((acType & funcType) == acType) {
                        func = window[temp.func] || this[temp.func] || window[validator] || this[validator] || void 0;
                        result = func.call(this, this);
                        if (false === result) {
                            result = this.errors[i];
                            if (null == result) {
                                reg = /%p(\d+)/g;
                                result = temp.error != null ?
                                    temp.error.replace(reg, (function(_this, temp) {
                                        return function(a, b) {
                                            return _this[(temp.params)[b]];
                                        };
                                    })(_this, temp)) : null;
                            }
                        }
                        if (('true' == this.showAllStatus || '1' == this.showAllStatus) && ('true' == this.showStatus || '1' == this.showStatus)) {
                            this.setStatus(result);
                        }
                        return this.i18n(result);
                    }
                }
            }
        };

        Validator.prototype.setStatus = function() {
            var target = this.statusTarget,
                result = arguments[0],
                parentTarget = target.parentNode,
                errorShow = parentTarget.querySelector('.validatorStatus'),
                className = target.className;

            if (result === true) {
                D(target).removeClass('input-error');
                if (errorShow != null) {
                    parentTarget.removeChild(errorShow);
                }
                return true;
            } else {
                if (null == result) {
                    result = this.i18n('undefinedError');
                }
                if (errorShow == null) {
                    errorShow = document.createElement('div');
                    errorShow.className = 'validatorStatus';
                    parentTarget.appendChild(errorShow);
                }
                errorShow.innerHTML = result;
                errorShow.style.left = Number(target.offsetLeft) + "px";
                errorShow.style.top = (Number(target.offsetTop) + Number(target.offsetHeight)) + 2 + "px";
                D(target).addClass('input-error');
                return result;
            }
        };

        Validator.prototype.isDom = function(obj) {
            return (typeof HTMLElement === 'object') ? obj instanceof HTMLElement : obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
        };

        Validator.prototype.clearNotice = function(target) {
            var ref,
                tag = target || document;
            while ((ref = tag.querySelector('.validatorStatus')) != null) {
                tag.removeChild(ref);
            }
        };

        Validator.prototype.clear = function() {
            this.clearClass('inputError inputCorrect');
            this.clearNotice();
        };

        Validator.prototype.clearClass = function(classNames, target) {
            var i,
                len,
                className,
                ref,
                j,
                len1,
                temp,
                reg,
                tag;
            classNames = classNames.split(/\s+/);
            tag = target || document;
            for (j = 0, len1 = classNames.length; j < len1; i++) {
                temp = classNames[j];
                ref = tag.querySelectorAll('.' + temp);
                for (i = 0, len = ref.length; i < len; i++) {
                    className = ref[i].className;
                    reg = new RegExp(temp, 'gi');
                    ref[i].className = className.replace(reg, ' ').replace(/\s+/gi, ' ');
                }
            }
        };

        Validator.prototype.require = function() {
            return this.valueTarget.value != null && this.valueTarget.value.length > 0;
        };

        Validator.prototype.size = function() {
            var ref = parseInt(this.valueTarget.value);
            return ref != null && ref >= parseInt(this.minSize) && ref <= parseInt(this.maxSize);
        };

        return Validator;

    })(Module);

    D = (function(superClass) {
        extend(D, superClass);

        function D(selector, context) {
            return new D.prototype.init(selector, context);
        }

        D.fn = D.prototype = {
            constructor: D,
            init: function(selector, context) {
                var elem,
                    con,
                    i,
                    len,
                    j,
                    len1,
                    _this = this;
                this.length = 0;
                if (!selector) {
                    return this;
                }
                if (selector.nodeType) {
                    this.context = this[0] = selector;
                    this.length = 1;
                    return this;
                }

                if (selector === "body" && document.body) {
                    this.context = document;
                    this[0] = document.body;
                    this.length = 1;
                    return this;
                }

                if (selector instanceof D) {
                    return selector;
                }

                if (typeof selector === "string") {
                    if (!context) {
                        this.context = document;
                    } else if (typeof context === "string") {
                        con = document.querySelectorAll(context);
                        this.context = con.length > 0 ? con : document;
                    } else if (context.nodeType) {
                        this.context = context;
                    } else if (context instanceof D) {
                        this.context = context;
                    }

                    if (this.context.nodeType) {
                        this.getFromContext(selector, this.context);
                    } else {
                        for (j = 0, len1 = this.context; j < len1; j++) {
                            this.getFromContext(selector, this.context[j]);
                        }
                    }
                    return this;
                }

            },

            getFromContext: function(selector, context) {
                elem = context.querySelectorAll(selector);
                for (i = 0, len = elem.length; i < len; i++) {
                    this[this.length] = elem[i];
                    this.length += 1;
                }
                return this;
            },

            on: function(type, selector, fn) {
                var i,
                    len,
                    dom;
                if (!fn) {
                    fn = selector;
                    selector = null;
                }
                if (selector) {
                    dom = D(selector, this);
                } else {
                    dom = this;
                }
                for (i = 0, len = dom.length; i < len; i++) {
                    Events.on(dom[i], type, fn);
                }
                return this;
            },

            off: function(type, selector, fn) {
                var i,
                    len,
                    dom;
                if (!fn) {
                    fn = selector;
                    selector = null;
                }
                if (selector) {
                    dom = D(selector, this);
                } else {
                    dom = this;
                }
                for (i = 0, len = dom.length; i < len; i++) {
                    Events.off(dom[i], type, fn);
                }
                return this;
            },

            removeClass: function(value) {
                var className,
                    i,
                    len,
                    strs,
                    k,
                    str,
                    elem,
                    finalValue,
                    proceed = arguments.length === 0 || typeof value === "string" && value;
                if (proceed) {
                    strs = (value || "").match(/\S+/g) || [];
                    for (i = 0, len = this.length; i < len; i++) {
                        elem = this[i];
                        className = elem.nodeType === 1 && (elem.className ? (" " + elem.className + " ").replace(/\s+/g, " ") : "");
                        if (className) {
                            k = 0;
                            while ((str = strs[k++])) {
                                if (className.indexOf(" " + str + " ") >= 0) {
                                    className = className.replace(' ' + str + ' ', ' ');
                                }
                            }
                            finalValue = value ? Tools.trim(className) : "";
                            if (elem.className !== finalValue) {
                                elem.className = finalValue;
                            }
                        }
                    }
                }
                return this;
            },

            addClass: function(value) {
                var className,
                    strs,
                    i,
                    len,
                    elem,
                    k,
                    str;
                if (typeof value === "string" && value) {
                    strs = (value || "").match(/\S+/g) || [];
                    for (i = 0, len = this.length; i < len; i++) {
                        elem = this[i];
                        if (elem.nodeType === 1) {
                            className = elem.className ? (" " + elem.className + " ").replace(/\s+/g, " ") : " ";
                            k = 0;
                            while ((str = strs[k++])) {
                                if (className.indexOf(" " + str + " ") < 0) {
                                    className += str + " ";
                                }
                            }
                            elem.className = Tools.trim(className);
                        }
                    }
                }
                return this;
            },

            attr: function(attr, value) {
                var i,
                    len;
                if (null == value || typeof value !== "string") {
                    return this[0].getAttribute(attr);
                } else {
                    for (i = 0, len = this.length; i < len; i++) {
                        this[i].setAttribute(attr, value);
                    }
                }
            },

            hasClass: function(value) {
                var className,
                    strs,
                    i,
                    len,
                    elem,
                    k,
                    str,
                    reg,
                    result = true;
                if (typeof value === "string" && value) {
                    strs = (value || "").match(/\S+/g) || [];
                    for (i = 0, len = this.length; i < len; i++) {
                        elem = this[i];
                        if (elem.nodeType === 1) {
                            className = elem.className ? (" " + elem.className + " ").replace(/\s+/g, " ") : " ";
                            k = 0;
                            while ((str = strs[k++])) {
                                if (className.indexOf(" " + str + " ") < 0) {
                                    result = false;
                                    break;
                                }
                            }
                            if (!result) {
                                break;
                            }
                        }
                    }
                }
                return result;
            },

            badge: function(value) {
                var i,
                    len;
                if (null == value || 0 == value) {
                    this.removeClass('toolsBadge');
                } else {
                    this.addClass('toolsBadge');
                    for (i = 0, len = this.length; i < len; i++) {
                        this[i].setAttribute('data-toolsBadge', value);
                    }
                }
                return this;
            },

            tip: function(value) {
                var i,
                    len,
                    elem,
                    childs,
                    child,
                    j;
                if (null == value) {
                    for (i = 0, len = this.length; i < len; i++) {
                        elem = this[i];
                        childs = D('.toolsTip', elem);
                        j = 0;
                        while ((child = childs[j++])) {
                            elem.removeChild(child);
                        }
                    }
                } else if (typeof value === 'string') {
                    for (i = 0, len = this.length; i < len; i++) {
                        elem = this[i];
                        childs = D('.toolsTip', elem);
                        j = 0;
                        while ((child = childs[j++])) {
                            elem.removeChild(child);
                        }
                        child = document.createElement('p');
                        child.className = 'toolsTip';
                        child.innerHTML = value;
                        elem.appendChild(child);

                        D(elem).on('mouseenter', (function(tip, oP) {
                            return function() {
                                var p = tip.offsetParent || oP,
                                    x = 0,
                                    y = 0,
                                    w = this.offsetWidth,
                                    left = tip.offsetWidth / 2 - 10,
                                    top = tip.offsetHeight + 15;
                                if (p != this) {
                                    x = this.offsetLeft;
                                    y = this.offsetTop;
                                }
                                tip.style.left = (x + w / 2 - left) + 'px';
                                tip.style.top = (y - top) + 'px';
                            };
                        })(child, document.body)).on('mouseleave', (function(tip) {
                            return function() {
                                tip.style.left = '-999px';
                            };
                        })(child));
                    }
                }
                return this;
            }
        };
        D.prototype.init.prototype = D.prototype;

        return D;
    })(Module);

    Calendar = (function(superClass) {

        function Calendar() {
            Calendar.__super__.constructor.apply(this, arguments);
        }

        extend(Calendar, superClass);
        Calendar.include(I18n);
        Calendar.include(Events);

        Calendar.fn = Calendar.prototype;

        Calendar.prototype.errorInfo = {
            'require': {
                'en-US': 'the attribute:%s is required when you init a Calendar!',
                'zh-CN': '属性[%s]不能为空'
            }
        };

        Calendar.prototype.dealOptions = function(options) {
            var ref;
            // 全格式样例 yyyy/MM/dd HH:mm:ss
            this.dateFmt = (ref = options.dateFmt) != null ? ref : "yyyy/MM/dd";
            //每周第一天：0-6；
            this.firstDayOfWeek = (ref = options.firstDayOfWeek) != null ? ref : "0";
            //显示时间;0:不显示；
            this.showTime = (ref = options.showTime) != null ? ref : "0";

            if (this.showTime) {
                this.validator = new Validator();
            }

            this.language = (ref = options.language) != null ? ref : this.language;
            this.weeks = (ref = options.weeks) != null ? ref : '6';

            if (this.valueTarget) {
                this.currentDate = this.valueTarget.value || void 0;
            }

            this.currentDate = this.parseDate(this.currentDate, this.dateFmt);
        };

        Calendar.prototype.init = function() {
            var obj = arguments[0],
                options,
                ref;
            options = (arguments.length > 1 && typeof(ref = arguments[1]) == 'object') ? ref : {};

            this.position = typeof obj == 'string' ? document.querySelector(obj) : obj;

            if (null == this.position) {
                throw new Error(this.i18n(this.errorInfo.require, 'param 1'));
            }

            this.valueTarget = (ref = options.valueTarget) != null ? ref : void 0;

            this.dealOptions(options);

        };

        Calendar.prototype.parseDate = function(d, format) {
            var dates,
                fmt,
                i,
                year,
                mon,
                day,
                hour,
                min,
                sec,
                today;
            today = new Date();
            if (d == null) {
                return today;
            }
            dates = d.split(/\D+/g);
            fmt = format.match(/[a-zA-Z]+/g);
            for (i = 0; i < dates.length; ++i) {
                switch (fmt[i]) {
                    case "yy":
                    case "yyyy":
                    case "YY":
                    case "YYYY":
                        year = parseInt(dates[i], 10);
                        if (year < 100) {
                            year += ((year > 70) ? 1900 : 2000);
                        }
                        break;
                    case "M":
                    case "MM":
                        mon = parseInt(dates[i], 10) - 1;
                        break;
                    case "dd":
                    case "d":
                    case "DD":
                    case "D":
                        day = parseInt(dates[i], 10);
                        break;
                    case "HH":
                    case "H":
                        hour = parseInt(dates[i], 10);
                        break;
                    case "mm":
                    case "m":
                        min = parseInt(dates[i], 10);
                        break;
                    case "ss":
                    case "s":
                        sec = parseInt(dates[i], 10);
                        break;
                }
            }

            year = isNaN(year) ? today.getFullYear() : year;
            mon = isNaN(mon) ? today.getMonth() : mon;
            day = isNaN(day) ? today.getDate() : day;
            hour = isNaN(hour) ? today.getHours() : hour;
            min = isNaN(min) ? today.getMinutes() : min;
            sec = isNaN(sec) ? today.getSeconds() : sec;
            return new Date(year, mon, day, hour, min, sec);
        };

        Calendar.prototype.setDateBefore = function(d, num, differFmt) {
            if (d == null) {
                d = new Date();
            }
            if (isNaN(num) || isNaN(differFmt)) {
                return d;
            }
            switch (Number(differFmt)) {
                case 1: //计算相差天数
                    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - num, d.getHours(), d.getMinutes(), d.getSeconds());
                    break;
                case 2: //计算相差周数
                    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - num * 7, d.getHours(), d.getMinutes(), d.getSeconds());
                    break;
                case 3: //计算相差月数
                    d = new Date(d.getFullYear(), d.getMonth() - num, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
                    break;
                case 4: //计算相差季度
                    d = new Date(d.getFullYear(), d.getMonth() - num * 3, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
                    break;
                case 5: //计算相差年数
                    d = new Date(d.getFullYear() - num, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
                    break;
            }
            return d;
        };

        Calendar.prototype.isLeap = function(d) {
            var year = d.getFullYear();
            return ((0 == year % 4 && 0 != year % 100) || "0" == year % 400);
        };

        Calendar.prototype.dateFormat = function(format, d) {
            if (d == null) {
                d = new Date();
            } else {
                d = new Date(d);
            }
            var dates = {
                "M+": d.getMonth() + 1,
                "d+": d.getDate(),
                "D+": d.getDate(),
                "H+": d.getHours(),
                "m+": d.getMinutes(),
                "s+": d.getSeconds(),
                "q+": Math.floor((d.getMonth() + 3) / 3),
                "S+": d.getMilliseconds()
            };
            if (/(y+)/i.test(format)) {
                format = format.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
            }
            for (var k in dates) {
                if (new RegExp("(" + k + ")").test(format)) {
                    format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? dates[k] : ("00" + dates[k]).substr(("" + dates[k]).length));
                }
            }
            return format;
        };

        Calendar.prototype.getWeekNumber = function(d) {
            var day,
                ms;
            if (d == null) {
                d = new Date();
            }
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
            day = d.getDay();
            d.setDate(d.getDate() - (day + 6) % 7 + 3);
            ms = d.valueOf();
            d.setMonth(0);
            d.setDate(4);
            return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
        };

        Calendar.prototype.changeDate = function(num, fmt) {
            this.currentDate = this.setDateBefore(this.currentDate, num, fmt);
            this.create();
        };

        Calendar.prototype.setDayList = function() {

            var year = this.currentDate.getFullYear();
            var mon = this.currentDate.getMonth();

            //判断而与有多少天；
            var dayList = [];
            var nowDate = new Date(year, mon);
            var currentWeekday = nowDate.getDay();

            var i = 0;
            for (; i < _WEEK * this.weeks; i++) {
                dayList[i] = [];
                // 当前日期的date；
                dayList[i].date = this.setDateBefore(nowDate, (Number(currentWeekday) - Number(this.firstDayOfWeek) - i), 1);
                // 控件展示的内容：日期day
                dayList[i].day = dayList[i].date.getDate();
                // 是否为当前月份日期，根据标识变更字体颜色和样式
                dayList[i].curMonFlag = (dayList[i].date.getMonth() == mon);
                dayList[i].currentDay = (this.currentDate.getDate() == dayList[i].date.getDate());
            }
            return dayList;
        };

        Calendar.prototype.create = function() {
            var dom = document.createElement('div'),
                calendarHtml = this.createTop() + this.createDaylist();
            this.dom = null;
            if (1 == this.showTime) {
                calendarHtml += this.createTime();
            }
            dom.className = 'calendarWrap';
            dom.innerHTML = calendarHtml;
            this.remove();
            this.position.appendChild(dom);
            this.turn();
            this.dom = dom;
            return this;
        };

        Calendar.prototype.createTop = function() {
            return '<p class="calendarTop"><a class="prevYear">&lt;&lt;</a><a class="prevMon" >&lt;</a><label class="date">' + this.dateFormat("YYYY-MM", this.currentDate) + '</label><a class="nextMon">&gt;</a><a class="nextYear">&gt;&gt;</a></p>';
        };

        Calendar.prototype.createDaylist = function() {
            var i,
                len,
                temp,
                d = this.setDayList(),
                w = this.i18n(_i18nWeek),
                calendarHtml = '<table class="dayList"><thead><tr>';
            for (i = 0, len = w.length; i < len; i++) {
                temp = (Number(i) + Number(this.firstDayOfWeek)) % len;
                calendarHtml += '<th>' + w[temp] + '</th>';
            }
            calendarHtml += '</tr></thead><tbody>';
            i = 0;
            while (i < d.length) {
                if (0 == i % 7) {
                    calendarHtml += "<tr>";
                }
                calendarHtml += '<td class="';
                if (d[i].curMonFlag) {
                    calendarHtml += 'curMonFlag';
                    if (d[i].currentDay) {
                        calendarHtml += ' currentDay';
                    }
                }
                calendarHtml += '" data-date="' + d[i].date + '">' + d[i].day + '</td>';
                if (6 == i % 7) {
                    calendarHtml += "</tr>";
                }
                i++;
            }
            calendarHtml += '</tbody></table>';
            return calendarHtml;
        };

        Calendar.prototype.createTime = function() {
            return '<p class="timeWrap"><a class="today">' + this.dateFormat('yyyy/MM/dd HH:mm:ss') + '</a></p>';
        };

        Calendar.prototype.remove = function() {
            if (this.dom != null) {
                this.position.removeChild(this.dom);
            }
            this.dom = null;
        };

        Calendar.removeAll = function() {
            var current = document.querySelector('.calendarWrap'),
                parent;
            while (null != current) {
                parent = current.parentNode;
                parent.removeChild(current);
                current = document.querySelector('.calendarWrap');
            }
            current = null;
        };

        Calendar.prototype.turn = function() {
            var _this = this,
                dom;
            this.on(this.position.querySelector('.prevYear'), 'click', function() {
                _this.changeDate(1, 5);
                return false;
            });
            this.on(this.position.querySelector('.prevMon'), 'click', function() {
                _this.changeDate(1, 3);
                return false;
            });
            this.on(this.position.querySelector('.nextMon'), 'click', function() {
                _this.changeDate(-1, 3);
                return false;
            });
            this.on(this.position.querySelector('.nextYear'), 'click', function() {
                _this.changeDate(-1, 5);
                return false;
            });
            dom = this.position.querySelector('.today');
            if (dom != null) {
                this.on(dom, 'click', function() {
                    _this.currentDate = new Date();
                    _this.create();
                    return false;
                });
            }
        };

        return Calendar;
    })(Module);

    TimePicker = (function(superClass) {
        extend(TimePicker, superClass);

        function TimePicker() {
            TimePicker.__super__.constructor.apply(this, arguments);
        }

        TimePicker.prototype.init = function() {
            var obj = arguments[0],
                options,
                ref;
            options = (arguments.length > 1 && typeof(ref = arguments[1]) == 'object') ? ref : {};

            this.valueTarget = typeof obj == 'string' ? document.querySelector(obj) : obj;

            if (null == this.valueTarget) {
                throw new Error(this.i18n(this.errorInfo.require, 'param 1'));
            }

            this.selectedCallback = (ref = options.selectedCallback) != null ? ref : void 0;
            this.position = this.valueTarget.parentNode;
            this.dealOptions(options);
        };

        TimePicker.prototype.createTime = function() {
            return '<p class="timeWrap"><input class="timeInput" minSize="0" type="text" maxSize="23" validators="size" value="' + this.currentDate.getHours() + '"/><span>:</span><input class="timeInput" type="text" minSize="0" maxSize="59" validators="size" value="' + this.currentDate.getMinutes() + '"/><span>:</span><input class="timeInput" type="text" minSize="0" maxSize="59" validators="size" value="' + this.currentDate.getSeconds() + '"/><a class="timeSubmit">' + this.i18n(str.submit) + '</a></p>';
        };

        TimePicker.prototype.create = function() {
            TimePicker.removeAll();
            TimePicker.__super__.create.call(this);
            this.dom.style.position = 'absolute';
            this.dom.style.left = Number(this.valueTarget.offsetLeft) + "px";
            this.dom.style.top = (Number(this.valueTarget.offsetTop) + Number(this.valueTarget.offsetHeight)) + "px";
            this.dom.style.zIndex = 3;
            this.selected();
            this.listenToHide();
            return this;
        };

        TimePicker.prototype.selected = function() {
            var _this = this,
                dom,
                dom1;
            if ((dom = this.position.querySelector('.dayList')) != null) {
                this.on(dom, 'click', function(e) {
                    e = e || window.event;
                    var target = e.target || e.srcElement,
                        flag = true,
                        times,
                        date;
                    if (target.tagName.toUpperCase() == 'TD') {
                        date = new Date(target.getAttribute('data-date'));
                        if ('0' != _this.showTime && true === (flag = _this.checkTime())) {
                            times = _this.position.querySelectorAll('.timeWrap .timeInput');
                            date.setHours(times[0].value);
                            date.setMinutes(times[1].value);
                            date.setSeconds(times[2].value);
                        }
                        if (true === flag) {
                            _this.valueTarget.value = _this.dateFormat(_this.dateFmt, date);
                            _this.remove();
                            if (this.selectedCallback != null && typeof this.selectedCallback == 'function') {
                                this.selectedCallback.call();
                            }
                        }
                    }
                });
            }

            if ((dom1 = this.position.querySelector('.timeSubmit')) != null) {
                this.on(dom1, 'click', function() {
                    var times,
                        date,
                        flag = true;
                    date = new Date(_this.position.querySelector('.currentDay').getAttribute('data-date'));
                    if (_this.showTime && true === (flag = _this.checkTime())) {
                        times = _this.position.querySelectorAll('.timeWrap .timeInput');
                        date.setHours(times[0].value);
                        date.setMinutes(times[1].value);
                        date.setSeconds(times[2].value);
                    }
                    if (true === flag) {
                        _this.valueTarget.value = _this.dateFormat(_this.dateFmt, date);
                        _this.remove();
                    }
                });
            }
        };

        TimePicker.prototype.checkTime = function() {
            var dom,
                doms,
                i,
                len,
                result;
            doms = this.position.querySelectorAll('.timeInput');
            for (i = 0, len = doms.length; i < len; i++) {
                dom = doms[i];
                if ((result = this.validator.check(dom)) !== true) {
                    break;
                }
            }
            return result;
        };

        TimePicker.prototype.listenToHide = function() {
            var _this = this;
            this.on(this.dom, 'click', function(e) {
                _this.stopBubble(e);
            });

            this.on(this.valueTarget, 'click', function(e) {
                _this.stopBubble(e);
            });

            this.on(document, 'click', function(e) {
                var target = _this.getTarget(e);
                if (target != _this.valueTarget) {
                    _this.remove();
                }
            });
        };

        return TimePicker;
    })(Calendar);

    Canvas = (function(superClass) {
        extend(Canvas, superClass);

        function Canvas(id, w, r, g, b) {
            this.canvas = document.getElementById(id);
            if (this.canvas.getContext) {
                this.r = r || 40;
                this.g = g || 143;
                this.b = b || 247;
                this.w = this.canvas.width;
                this.h = this.canvas.height;
                if (!('devicePixelRatio' in window)) {
                    this.scale = 1;
                } else {
                    this.scale = window.devicePixelRatio > 1 ? window.devicePixelRatio : 1;
                }
                this.canvas.width = this.w * this.scale;
                this.canvas.height = this.h * this.scale;
                this.lineWidth = w || this.w * this.scale / 24;
                this.canvas.getContext('2d').scale(this.scale, this.scale);
                this.ctx = this.canvas.getContext('2d');
                this.ctx.strokeStyle = 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
                this.ctx.lineCap = 'round';
                this.ctx.lineGrid = 'round';
                return this;
            } else {
                return Canvas.error();
            }
        }

        Canvas.error = function() {
            console.log('浏览器不支持canvas');
            return false;
        };

        Canvas.prototype = {
            constructor: Canvas,
            /**
             * [convas中画圆]
             * @param  {[type]} w         [lineWidth线条宽度]
             * @param  {[type]} deg       [圆的弧度数，完整圆为360]
             * @param  {[type]} alphaFlag [颜色渐变标志]
             * @param  {[type]} angle     [起始点的偏移角度]
             * @param  {[type]} r         [rgb颜色中的r]
             * @param  {[type]} g         [rgb颜色中的g]
             * @param  {[type]} b         [rgb颜色中的b]
             * @param  {[type]} a         [rgba颜色中的a]
             * @return {[type]}           [暂无返回值]
             */
            circle: function(w, deg, alphaFlag, angle, r, g, b, a) {
                deg = deg || 360;
                angle = angle || 0;
                a = a || 1;
                r = undefined != r ? r : this.r;
                g = undefined != g ? g : this.g;
                b = undefined != b ? b : this.b;
                w = w || this.lineWidth;
                this.ctx.lineWidth = w;
                for (var i = 0; i < deg; i++) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = alphaFlag != 0 ? 'rgba(' + r + ',' + g + ',' + b + ',' + a * i / deg + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
                    this.ctx.arc(this.w / 2, this.h / 2, (Math.min(this.w, this.h) - 2 * w - 2) / 2, (i + angle) * Math.PI / 180, (i + 1 + angle) * Math.PI / 180);
                    this.ctx.stroke();
                }
                return this;
            },

            /**
             * [逐渐画出一个圆]
             * @param  {[type]} w         [lineWidth线条宽度]
             * @param  {[type]} deg       [圆的弧度数，完整圆为360]
             * @param  {[type]} alphaFlag [颜色渐变标志]
             * @param  {[type]} angle     [起始点的偏移角度]
             * @param  {[type]} r         [rgb颜色中的r]
             * @param  {[type]} g         [rgb颜色中的g]
             * @param  {[type]} b         [rgb颜色中的b]
             * @param  {[type]} a         [rgba颜色中的a]
             * @param  {[type]} count     [画圆次数]
             * @param  {[type]} delay     [每次画圆之间延迟时间]
             * @param  {[type]} s         [step 单次画圆分成多少次绘制]
             * @return {[type]}           [description]
             */
            gradualCircle: function(w, r, g, b, a, count, delay, s, deg, alphaFlag, angle) {
                delay = delay || 0;
                s = s || 40;
                angle = angle || -90;
                deg = deg || 360;
                a = a || 1;
                alphaFlag = alphaFlag || 0;
                var _this = this,
                    d = deg / s,
                    alpha,
                    i = 1;
                clearTimeout(_this.loadingTimer);
                clearInterval(_this.loadingTimer);
                _this.loadingTimer = setInterval(function() {
                    angle += d;
                    if (alphaFlag) {
                        alpha = i * a / s;
                    } else {
                        alpha = a;
                    }
                    _this.circle(w, d, alphaFlag, angle, r, g, b, alpha);
                    if (i++ == s) {
                        clearInterval(_this.loadingTimer);
                        if (undefined !== count && null != count && 0 !== count) {
                            count = 'infinite' == count ? count : count - 1;
                            _this.loadingTimer = setTimeout(function() {
                                _this.ctx.clearRect(0, 0, _this.w, _this.h);
                                _this.gradualCircle(w, r, g, b, a, count, delay);
                            }, delay);
                        }
                    }
                }, 1000 / s);
                return this;
            },

            //s:speed;
            line: function(startX, startY, endX, endY, w, r, g, b, s) {
                w = w || this.lineWidth;
                this.ctx.lineWidth = w;
                r = undefined != r ? r : this.r;
                g = undefined != g ? g : this.g;
                b = undefined != b ? b : this.b;
                s = s || 40;
                this.ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',1)';

                var _this = this,
                    tempX = startX,
                    tempY = startY,
                    lenY = endY - startY,
                    lenX = endX - startX,
                    incrementsX = lenX / s,
                    incrementsY = lenY / s,
                    t = setInterval(function() {
                        _this.ctx.moveTo(tempX, tempY);
                        tempX += incrementsX;
                        tempY += incrementsY;
                        _this.ctx.lineTo(tempX, tempY);
                        _this.ctx.stroke();
                        if (tempX == endX) {
                            clearInterval(t);
                        }
                    }, 1000 / s);
                return this;
            },

            alphaLoading: function(w, r, g, b, s) {
                var deg = 300,
                    angle = 0;
                var _this = this;
                s = s || 40;
                _this.loadingTimer = setInterval(function() {
                    angle += 360 / s;
                    _this.ctx.clearRect(0, 0, _this.w, _this.h);
                    _this.circle(w, deg, 1, angle, r, g, b);
                }, 1000 / s);
                return this;
            },
            loading: function(w, r, g, b, s) {
                this.gradualCircle(w, r, g, b, 0, 'infinite', 500, s);
                return this;
            },
            success: function(w, r, g, b, s) {
                this.ctx.clearRect(0, 0, this.w, this.h);

                r = r || 0;
                g = g || 128;
                b = b || 0;

                var x = this.w / 4,
                    y = this.h / 2;
                var centerX = this.w * 7 / 16,
                    centerY = this.h * 2 / 3;
                var endX = this.w * 3 / 4,
                    endY = this.h / 3;
                this.gradualCircle(w, r, g, b, 0, 0, 0, s).line(centerX, centerY, x, y, w, r, g, b, s).line(centerX, centerY, endX, endY, w, r, g, b, s);
                return this;
            },
            faild: function(w, r, g, b, s) {
                this.ctx.clearRect(0, 0, this.w, this.h);
                r = r || 255;
                g = g || 0;
                b = b || 0;
                this.gradualCircle(w, r, g, b, 0, 0, 0, s).line(this.w / 4, this.h / 4, this.w * 3 / 4, this.h * 3 / 4, w, r, g, b, s).line(this.w * 3 / 4, this.h / 4, this.w / 4, this.h * 3 / 4, w, r, g, b, s);
                return this;
            },
            error: function() {
                console.log('浏览器不支持canvas');
                return false;
            }
        };

        return Canvas;
    })(Module);

    Feedback = {
        msg: function(type, content, options) {
            var msg,
                duration = 3000,
                showAnimation = 'anim-show-down',
                hideAnimation = 'anim-hide-up',
                msgs = document.querySelector('.fd-msgs');

            if (!type) {
                return false;
            }

            if (!content || typeof content == 'object') {
                options = content || {};
                content = type;
                type = null;
            }

            if (options == null) {
                options = {};
            }

            if (!msgs) {
                msgs = document.createElement('div');
                msgs.className = 'fd-msgs';
                document.body.appendChild(msgs);
            }

            if ('showAnimation' in options) {
                showAnimation = options.showAnimation;
            }

            msg = document.createElement('div');
            msg.className = 'fd-msg ' + showAnimation;
            msg.innerHTML = '<span class="fd-msg-content" type="' + type + '">' + content + '</span>';

            msgs.appendChild(msg);

            if (typeof options == 'object' && false !== options.autoHide) {
                if ('duration' in options && !isNaN(options.duration)) {
                    duration = options.duration;
                }
                setTimeout(function() {
                    if ('hideAnimation' in options) {
                        hideAnimation = options.hideAnimation;
                    }
                    D(msg).addClass(hideAnimation);
                    setTimeout(function() {
                        msgs.removeChild(msg);
                    }, 300);
                }, duration);
            }
        }
    };

    Tools = this.Tools = {
        trim: function(str) {
            return str.replace(/^\s+|\s+$/gi, '');
        },
        alert: function(type, title, text, options) {},
        confirm: function(title, text, callback) {},
        notice: function(title, text, callback) {},
        dialog: function() {}
    };

    Tools.Events = Events;
    Tools.Calendar = Calendar;
    Tools.TimePicker = TimePicker;
    Tools.Validator = Validator;
    Tools.D = D;
    Tools.Canvas = Canvas;
    Tools.Feedback = Feedback;
})();

var $ = $ || Tools.D;
$('.switch').on('click', function() {
    var elem = $(this);
    if (elem.hasClass('onswitch')) {
        elem.removeClass('onswitch');
    } else {
        elem.addClass('onswitch');
    }
});

$('.select').on('click', function(event) {
    var elem = $(this),
        t = Tools.Events.getTarget(event);
    if ($(t).hasClass('option') || t.tagName.toLowerCase() == 'dd') {
        $('.option', this).removeClass('current');
        $('dd', this).removeClass('current');
        $(t).addClass('current');
        $('input', this).attr('value', $(t).attr('data-value'));
    }
    if (elem.hasClass('selected')) {
        elem.removeClass('selected');
    } else {
        $('.select').removeClass('selected');
        elem.addClass('selected');
    }
    Tools.Events.stopBubble(event);
});

$('.checkbox').on('click', function(e) {
    var elem = $(this),
        f = elem.attr('for'),
        c = elem.hasClass('checked'),
        d = elem.hasClass('disabled');
    if (!d) {
        if (c) {
            elem.removeClass('checked');
            $('#' + f)[0].checked = false;
        } else {
            elem.addClass('checked');
            $('#' + f)[0].checked = true;
        }
    }
});

$('.checkboxs').on('click', function(e) {
    var elem = $(this),
        f = elem.attr('for'),
        a = elem.hasClass('all'),
        d = elem.hasClass('disabled');
    if (!d) {
        elem.removeClass('some');
        if (a) {
            elem.removeClass('all');
        } else {
            elem.addClass('all');
        }
    }
});

$(document).on('click', function(e) {
    $('.select').removeClass('selected');
});
