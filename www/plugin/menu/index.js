(function(window) {

    window.Help = {
        nextUUID: 0,
        generateUUID: function() {
            return ++this.nextUUID;
        },
        generateService: function(element) {
            var service = ['com.phonegap.menu'];

            if (element.parentElement) service.push(element.parentElement.attribute.type);
            
            service.push(element.attribute['type']);
            
            return service.join('.');
        },
        execute: function(options) {
            if (typeof options.data === 'undefined') options.data = [];
            
            var service = this.generateService(options.element);
            var id      = options.element.attribute['data-uuid'];
            
            options.data.unshift(id);
            
            PhoneGap.exec(
                options.callback,
                options.callback,
                service,
                options.action,
                options.data
            );
        },
        process: function(queue) {
            (function next() {
                if (queue.length <= 0) return;
                queue.shift()(next);
            })();
        },
        exists: function(element) {
            return (typeof element.attribute['data-uuid'] !== 'undefined');
        }
    };
    
    /**
     * HTMLMenuElement
     * ===============
     *
     * Creates a new HTML Menu Element with a unique ID.
     *
     * The unique ID is stored as the attribute 'data-uuid'
     *
     * Since the type of menu is not yet defined, there is nothing to render.
     */
    window.HTMLMenuElement = function() {
        var self = this;
        
        self.children = [];
        self.attribute = {
            'data-uuid': undefined,
            'label':     '',
            'type':      ''
        };
        
        self.fn = {
            'commands': function(callback) {
                // for each child commmand
                //   execute update
                // then
                //   fire callback
            },
            'create': function(callback) {
                self.attribute['data-uuid'] = Help.generateUUID();
                
                Help.execute({
                    action:   'create',
                    data:     [ self.attribute.type ],
                    element:  self,
                    callback: callback
                });
            },
            'delete': function(callback) {
                if (typeof self.attribute['data-uuid'] === 'undefined') {
                    callback();
                    return;
                }
                
                Help.execute({
                    action:   'delete',
                    element:  self,
                    callback: function() {
                        self.attribute['data-uuid'] = undefined;
                        callback();
                    }
                });
            },
            'label': function(callback) {
                Help.execute({
                    action:   'label',
                    element:  self,
                    data:     [ self.attribute.label ],
                    callback: callback
                });
            }
        };
        
        self.update = {
            'type': function() {
                Help.process([
                    self.fn['delete'],
                    self.fn['create'],
                    self.fn['label'],
                    self.fn['commands']
                ]);
            },
            'label': function() {
                Help.process([
                    self.fn['label']
                ]);
            }
        };
    };

    /**
     * getAttribute
     * ------------
     *
     * Return an attribute with the given name.
     *
     *     menu.getAttribute('data-uuid');
     */
    HTMLMenuElement.prototype.getAttribute = function(name) {
        return this.attribute[name];
    };

    /**
     * hasAttribute
     * ------------
     *
     * Return a boolean for whether the attribute exists.
     *
     * An attribute exists if it has a value other than undefined.
     *
     *     menu.hasAttribute('data-uuid'); // true
     */
    HTMLMenuElement.prototype.hasAttribute = function(name) {
        return (typeof this.attribute[name] !== 'undefined');
    };

    /**
     * setAttribute
     * ------------
     *
     * Sets the element's attribute and invokes any actions that
     * are consequences of the attribute.
     *
     * ### Type
     *
     *     menu.setAttribute('type', 'toolbar'); // create a toolbar
     *     menu.setAttribute('type', 'context'); // create a context menu
     *
     * ### Label
     *
     *     menu.setAttribute('label', 'My Title'); // give menu a title
     */
    HTMLMenuElement.prototype.setAttribute = function(name, value) {
        this.attribute[name] = value;
        this.update[name]();
    };

    HTMLMenuElement.prototype.appendChild = function(element) {
        // add command to list
        // phonegap.exec com.phonegap.menu.[toolbar|context].command create
        this.children.push(element);
        element.parentElement = this;
        element.setAttribute('data-init', true);
    };

    HTMLMenuElement.prototype.removeChild = function(element) {
        var self = this;
        // remove command from list
        this.children.forEach(function(value, index) {
            if (value === element) { self.children.splice(index, 1); }
        });
        
        // element.parentElement is removed by setAttribute('data-init', false);
        element.setAttribute('data-init', false);
    };

    //
    //
    //
    
    /**
     * HTMLCommandElement
     * ===============
     *
     * Creates a new HTML Command Element with a unique ID.
     *
     * The unique ID is stored as the attribute 'data-uuid'
     */
    window.HTMLCommandElement = function() {
        var self = this;
        
        self.parentElement = undefined;
        self.attribute = {
            'accesskey': '',
            'action':    function(){},
            'data-uuid': undefined,
            'disabled':  false,
            'icon':      '',
            'label':     '',
            'type':      'command'
        };
        
        self.fn = {
            'create': function(callback) {
                self.attribute['data-uuid'] = Help.generateUUID();

                window.HTMLCommandElement.elements[self.attribute['data-uuid']] = self;
                
                Help.execute({
                    action:   'create',
                    element:  self,
                    callback: callback
                });
            },
            'delete': function(callback) {
                if (typeof self.attribute['data-uuid'] === 'undefined') {
                    callback();
                    return;
                }
                
                Help.execute({
                    action:   'delete',
                    element:  self,
                    callback: function() {
                        self.attribute['data-uuid'] = undefined;
                        self.parentElement = undefined;
                        callback();
                    }
                });
            },
            'accesskey': function(callback) {
                // if backbutton
                //   if supports backbutton (Android or BlackBerry)
                //     bind success to back
                //
                // if search
                //   if supports search (Android)
                //     bind success to search
                if (!Help.exists(self)) { callback(); return; }

                Help.execute({
                    action:   'accesskey',
                    element:  self,
                    data:     [ self.attribute.accesskey ],
                    callback: callback
                });
            },
            'disabled': function(callback) {
                if (!Help.exists(self)) { callback(); return; }

                Help.execute({
                    action:   'disabled',
                    element:  self,
                    data:     [ self.attribute.disabled ],
                    callback: callback
                });
            },
            'icon': function(callback) {
                if (!Help.exists(self)) { callback(); return; }

                Help.execute({
                    action:   'icon',
                    element:  self,
                    data:     [ self.attribute.icon ],
                    callback: callback
                });
            },
            'label': function(callback) {
                if (!Help.exists(self)) { callback(); return; }

                Help.execute({
                    action:   'label',
                    element:  self,
                    data:     [ self.attribute.label ],
                    callback: callback
                });
            }
        };
        
        self.update = {
            'accesskey': function() {
                Help.process([ self.fn['accesskey'] ]);
            },
            'action': function() {
                // Nothing needs to be done because action is called directly from
                // the attribute
            },
            'data-init': function() {
                if (self.attribute['data-init']) {
                    Help.process([
                        self.fn['delete'],
                        self.fn['create'],
                        self.fn['label'],
                        self.fn['icon'],
                        self.fn['disabled'],
                        self.fn['action'],
                        self.fn['accesskey']
                    ]);
                }
                else
                    Help.process([ self.fn['delete'] ]);
            },
            'disabled': function() {
                Help.process([ self.fn['disabled'] ]);
            },
            'icon': function() {
                Help.process([ self.fn['icon'] ]);
            },
            'label': function() {
                Help.process([ self.fn['label'] ]);
            }
        };
    };

    HTMLCommandElement.elements = {};

    /**
     * getAttribute
     * ------------
     *
     * Return an attribute with the given name.
     *
     *     menu.getAttribute('data-uuid');
     */
    HTMLCommandElement.prototype.getAttribute = function(name) {
        return this.attribute[name];
    };

    /**
     * hasAttribute
     * ------------
     *
     * Return a boolean for whether the attribute exists.
     *
     * An attribute exists if it has a value other than undefined.
     *
     *     menu.hasAttribute('data-uuid'); // true
     */
    HTMLCommandElement.prototype.hasAttribute = function(name) {
        return (typeof this.attribute[name] !== 'undefined');
    };

    /**
     * setAttribute
     * ------------
     *
     * Sets the element's attribute and invokes any actions that
     * are consequences of the attribute.
     *
     * ### Type
     *
     *     menu.setAttribute('type', 'toolbar'); // create a toolbar
     *     menu.setAttribute('type', 'context'); // create a context menu
     *
     * ### Label
     *
     *     menu.setAttribute('label', 'My Title'); // give menu a title
     */
    HTMLCommandElement.prototype.setAttribute = function(name, value) {
        this.attribute[name] = value;
        this.update[name]();
    };
    
    //
    //
    //
    
    // backup original `document.createElement`
    var _createElement = document.createElement;

    // override `document.createElement` to support menu
    document.createElement = function() {
        if (arguments[0] === 'menu')
            return new HTMLMenuElement();
        else if (arguments[0] === 'command')
            return new HTMLCommandElement();
        else
            return _createElement.apply(this, arguments);
    };

})(window);

//
// Android-Specific
//

if (navigator.userAgent.match(/android/i) && typeof window.PhoneGap !== 'undefined') {
    PhoneGap.originalExec = PhoneGap.exec;

    PhoneGap.exec = function(success, fail, service, action, args) {
        if (service === 'com.phonegap.menu.toolbar') {
            window.toolbar[action](success, fail, args);
        }
        else if (service === 'com.phonegap.menu.toolbar.command') {
            try {
            window.toolbarCommand[action](success, fail, args);
            } catch(e) { console.log(e); }
        }
        else {
            PhoneGap.originalExec(success, fail, service, action, args);
        }
    };
    
    PhoneGap.addConstructor(function() {
        navigator.app.addService('com.phonegap.menu.context',         'com.phonegap.menu.AppMenu');
        navigator.app.addService('com.phonegap.menu.context.command', 'com.phonegap.menu.AppMenuItem');
    });
}

//
// iOS-Specific
//

if (navigator.userAgent.match(/iphone/i) && typeof window.PhoneGap !== 'undefined') {
    (function() {
        window.Help._execute = {
            'com.phonegap.menu.toolbar': {
                'create': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "createToolBar", []);
                },
                'delete': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "removeToolBar", []);
                },
                'label': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "updateToolBar", [ { 'label': data['label'] } ]);
                }
            },
            'com.phonegap.menu.context': {
                'create': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "createTabBar", []);
                },
                'delete': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "removeTabBar", []);
                },
                'label': function(data) {
                    console.log('Unsupported: com.phonegap.menu.context :: label');
                }
            },
            'com.phonegap.menu.toolbar.command': {
                'create': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "createToolBarItem", [ data['data-uuid'], data['label'], data['icon'], !data['disabled'], data['data-uuid'] ]);
                },
                'delete': function(data ) {
                    PhoneGap.exec(null, null, "NativeControls2", "removeToolBarItem", [ data['data-uuid'] ]);
                },
                'accesskey': function(data) {
                    console.log('Unsupported: com.phonegap.menu.toolbar.command :: accesskey');
                },
                'disabled': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "enableToolBarItem", [ data['data-uuid'], !data['disabled'] ]);
                },
                'icon': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "updateToolBarItem", [data['data-uuid'], { 'icon': data['icon'] }]);
                },
                'label': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "updateToolBarItem", [data['data-uuid'], { 'label': data['label'] }]);
                }
            },
            'com.phonegap.menu.context.command': {
                'create': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "createTabBarItem", [ data['data-uuid'], data['label'], data['icon'], !data['disabled'], data['data-uuid'] ]);
                },
                'delete': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "removeTabBarItem", [ data['data-uuid'] ]);
                },
                'accesskey': function(data) {
                    console.log('Unsupported: com.phonegap.menu.toolbar.command :: accesskey');
                },
                'disabled': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "enableTabBarItem", [ data['data-uuid'], !data['disabled'] ]);
                },
                'icon': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "updateTabBarItem", [ data['data-uuid'], { 'icon': data['icon'] } ]);
                },
                'label': function(data) {
                    PhoneGap.exec(null, null, "NativeControls2", "updateTabBarItem", [ data['data-uuid'], { 'title': data['label'] } ]);
                }
            }
        };

        window.Help.execute = function(options) {
            if (typeof options.data === 'undefined') options.data = [];

            var service = this.generateService(options.element);
            var action  = options.action;

            window.Help._execute[service][action](options.element.attribute);
        };
    })();
}

//
// HTML Menu Implementation
//

(function(window) {
    var elements = {};
    var htmlElement;
    var contextElement;
    var touchType = 'click';

    try {
        document.createEvent('TouchEvent');
        touchType = 'touchend';
    }
    catch(e) {
    }
    
    
    window.toolbar = {
        'create': function(success, fail, args) {
            if (args[1] === 'toolbar') {
                if (document.getElementById('phonegap-menu-toolbar')) {
                    success();
                    return;
                }

                htmlElement = document.createElement('div');
                htmlElement.setAttribute('id', 'phonegap-menu-toolbar');
                document.body.appendChild(htmlElement);

                var labelElement = document.createElement('div');
                labelElement.setAttribute('id', 'phonegap-menu-toolbar-label');
                htmlElement.appendChild(labelElement);

                var listElement = document.createElement('ul');
                listElement.setAttribute('id', 'phonegap-menu-toolbar-list');
                htmlElement.appendChild(listElement);

                document.body.style.marginTop = '32px';

                success();
            }
            else {
                fail();
            }
        },

        'delete': function(success, fail, args) {
            htmlElement.parentElement.removeChild(htmlElement)
            delete htmlElement;
            document.body.style.marginTop = '';
            success();
        },
        
        'label': function(success, fail, args) {
            try {
                document.getElementById('phonegap-menu-toolbar-label').innerHTML = args[1];
                success();
            }
            catch(e) {
                fail(e);
            }
        }
    };
    
    window.toolbarCommand = {
        'create': function(success, fail, args) {
            var element = document.createElement('li');
            element.setAttribute('class', 'command');
            element.addEventListener(touchType, window.HTMLCommandElement.elements[args[0]].attribute.action, false);
            document.getElementById('phonegap-menu-toolbar-list').appendChild(element);
            elements[args[0]] = element;
            success();
        },
        'delete': function(success, fail, args) {
            contextElement.parentElement.removeChild(contextElement)
            delete contextElement;
            success();
        },
        'accesskey': function(success, fail, args) {
            var element = elements[args[0]];
            var classes = element.getAttribute('class').split(' ');

            switch(args[1]) {
                case 'back':
                    classes.push('accesskey-back');
                    break;
                default:
                    classes.forEach(function(v, i) { if (v === 'accesskey-back') classes.splice(i, 1); });
                    break;
            }

            element.setAttribute('class', classes.join(' '));

            success();
        },
        'disabled': function(success, fail, args) {
            var element = elements[args[0]];
            var classes = element.getAttribute('class').split(' ');
            
            if (args[1]) {
                classes.push('disabled');
                element.removeEventListener(touchType, window.HTMLCommandElement.elements[args[0]].attribute.action);
            }
            else {
                classes.forEach(function(v, i) { if (v === 'disabled') classes.splice(i, 1); });
                element.addEventListener(touchType, window.HTMLCommandElement.elements[args[0]].attribute.action, false);
            }

            element.setAttribute('class', classes.join(' '));

            success();
        },
        'icon': function(success, fail, args) {
            if (args[1] !== '')
                elements[args[0]].innerHTML = '<span><img src="' + args[1] + '" />';
            success();
        },
        'label': function(success, fail, args) {
            elements[args[0]].innerHTML = '<span>' + args[1] + '</span>';
            success();
        }
    };

    window.context = {
        'create': function(success, fail, args) {
            if (args[1] === 'context') {
                if (document.getElementById('phonegap-menu-context')) {
                    success();
                    return;
                }

                contextElement = document.createElement('div');
                contextElement.setAttribute('id', 'phonegap-menu-context');
                document.body.appendChild(contextElement);
                document.body.style.marginBottom = '42px';
                success();
            }
            else {
                fail();
            }
        },

        'delete': function(success, fail, args) {
            contextElement.parentElement.removeChild(contextElement)
            delete contextElement;
            document.body.style.marginBottom = '';
            success();
        },
        
        'label': function(success, fail, args) {
            success();
        }
    };
    
    window.contextCommand = {
        'create': function(success, fail, args) {
            var element = document.createElement('div');
            element.setAttribute('class', 'command');
            element.addEventListener(touchType, window.HTMLCommandElement.elements[args[0]].attribute.action, false);
            document.getElementById('phonegap-menu-context').appendChild(element);
            elements[args[0]] = element;
            success();
        },
        'delete': function(success, fail, args) {
            contextElement.parentElement.removeChild(contextElement)
            delete contextElement;
            success();
        },
        'disabled': function(success, fail, args) {
            var element = elements[args[0]];
            var classes = element.getAttribute('class').split(' ');
            
            if (args[1]) {
                classes.push('disabled');
                element.removeEventListener(touchType, window.HTMLCommandElement.elements[args[0]].attribute.action);
            }
            else {
                classes.forEach(function(v, i) { if (v === 'disabled') classes.splice(i, 1); });
                element.addEventListener(touchType, window.HTMLCommandElement.elements[args[0]].attribute.action, false);
            }

            element.setAttribute('class', classes.join(' '));

            success();
        },
        'icon': function(success, fail, args) {
            elements[args[0]].style.backgroundImage = "url('" + args[1] + "')";
            success();
        },
        'label': function(success, fail, args) {
            elements[args[0]].innerHTML = '<span>' + args[1] + '</span>';
            success();
        }
    };
})(window);
