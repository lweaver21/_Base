(function (_app) {

    var _app = _app || angular.module('_main');

    _app.factory('$iDataLite', ['$rootScope', '$log', function ($rootScope, $log) {

        var iData = this;
        var nextIndex = 0;

        iData.isNgScope = function (x) {
            if (x instanceof $rootScope.constructor) {
                return true;
            }
            else return false;
        }

        iData.isScoper = function (x) {
            if (!x)
                return false;

            if (x instanceof iData.Scoper) {
                return true;
            }
            return false;
        }

        iData.ifScoperDoThis = function (s, fn) {
            if (typeof fn !== "function")
                throw Error('Fn is not a function');

            if (iData.isScoper(s)) {
                return fn();
            } else {
                $log.warn('Not a scoper instance, function did not run');
                return "";
            }
        }

        iData.stringOrNumberConditional = function (val, stringFn, numberFn) {
            if (typeof stringFn !== 'function' || typeof numberFn !== 'function')
                throw Error('iData.stringOrNum: Remember to pass functions as the second and third arg');
            
            else {
                if (val instanceof String) {
                    return stringFn(val);
                }
                else if (val instanceof Number) {
                    return numberFn(val);
                }
                else throw Error('iData.stringOrNum: Not a valid type');
            }
        }

        var assignId = function () {
            var x = nextIndex;
            nextIndex++;
            return x;
        }

        var Internal = function () {

            var internal = this;

            internal.storage = [];

            internal.findByName = function (name) {
                if (!name)
                    throw Error('Name required to find scope');

                var selected = _.findWhere(internal.storage, { name: name });
                if (selected) {
                    return selected;
                }
                else {
                    $log.log('internal.findByName: Could not locate scope');
                    return null;
                }
            }

            internal.removeByName = function (name) {
                var x = internal.findByName(name);
                if (x) {
                    var index = _.indexOf(internal.storage, x);
                    internal.storage.splice(index, 1);
                }
            }

            internal.removeById = function (id) {
                var x = internal.findById(id);
                if (x) {
                    var index = _.indexOf(internal.storage, x);
                    internal.storage.splice(index, 1);
                }
            }

            internal.findById = function (id) {
                if (typeof id !== "number")
                    throw Error('Internal.findById: Passed arg must be a number to check ID');


                var x = _.findWhere(internal.storage, { id: id });
                if (x.name) {
                    return x;
                } else {
                        $log.warn('Internal.findById: Scoper Not Found');
                        return null;
                    
                }
            }

            internal.pushTo = function (x) {
                var checkName = _.findWhere(internal.storage, { name: x.name });

                if (checkName)
                    $log.warn(checkName.name + ' has already been created.');

                else if (x instanceof iData.Scoper) {
                    internal.storage.push(x);
                    return true;
                } else {
                    throw Error('Passed argument is not a scoper');
                }
            }

            internal.createTo = function (name, config, existingScope) {
                var checkName = _.findWhere(internal.storage, { name: name });
                var scoper = new iData.Scoper(name, config, existingScope);

                if (checkName) {
                    $log.log(checkName.name + ' has already been created.');
                    var preExisting = checkName;
                    //Overwriting scoper ability
                    if (preExisting.override.accessCode && config.override.tryCode && preExisting.override.accessCode === config.override.tryCode) {
                        //Create new and return
                        $log.log('Overwriting... Priority level high.');
                        preExisting = scoper;
                        return preExisting;
                    }
                    else if (config.override.overwritePreExisting && config.override.overwritePreExisting === true) {
                        if (!preExisting.denyOverwrite) {
                            //Supposed to only either be false or undefined
                            //Create new
                            $log.log('Overwriting... Priority level mid.');
                            preExisting = scoper;
                            return preExisting;
                        }
                        else {
                            //Return pre-existing
                            $log.log('Scoper with that name has been found. Returning pre-existing scoper.');
                            //preExisting = scoper;
                            return preExisting;
                        }
                    }
                    else if (preExisting.override.denyOverwrite && preExisting.override.denyOverwrite === false) {
                        //Create new
                        $log.log('Overwriting... Priority level low.');
                        preExisting = scoper;
                        return preExisting;
                    }
                    else {
                        $log.log('Scoper with name ' + name + ' has been found. Returning pre-existing scoper.');
                        return preExisting;
                    }
                }
                else {
                    var scoper = new iData.Scoper(name, config, existingScope);
                    internal.pushTo(scoper);
                    return internal.findByName(name);
                }
            }

            internal.findOrCreateParent = function (parentIdentification, childName) {
                if (!parentIdentification)
                    return null;

                childName = childName || '';

                var checkArr,
                    foundParent,
                    parent = parentIdentification,
                    defaultParName = childName + '_Parent',
                    findDefaultParent = internal.findByName(defaultParName);

                //First checks array then checks cachedRef
                if (typeof parent === "number") {
                    checkArr = internal.findById(parent);
                    if (checkArr instanceof iData.Scoper) {
                        foundParent = checkArr;
                    }
                    else if (findDefaultParent instanceof iData.Scoper) {
                        foundParent = findDefaultParent;
                    }
                    else {
                        $log.warn('Internal.findOrCreateParent: Could not find parent with the given ID. Creating one from scratch');
                        if (defaultParName !== '_Parent') {
                            internal.createTo(defaultParName, {});
                            foundParent = internal.findByName(defaultParName);
                        } else {
                            throw Error('Internal.findOrCreateParent: Could not create parent because child scoper name was not passed as the second arg. Default naming convention is [childName]_Parent');
                        }
                    }

                    return foundParent;
                } else if (typeof parent === "string") {
                    //Try to find the name in the cachedReference Array
                    checkArr = internal.findByName(parent);

                    if (checkArr instanceof iData.Scoper) {
                        //If one was found
                        foundParent = checkArr;
                    }
                    else if (findDefaultParent instanceof iData.Scoper) {
                        foundParent = findDefaultParent;
                    } else {
                        $log.warn('Internal.findOrCreateParent: Could not locate parent scoper with the given name. Creating one with the name passed.');
                        internal.createTo(parent, {});
                        foundParent = internal.findByName(parent);
                    }
                    return foundParent;
                }
                else if (parent instanceof iData.Scoper) {
                    //First check to see if this is a private scoper or one that has been added to storage
                    checkArr = internal.findByName(parent.name);

                    if (checkArr !== parent) {
                        $log.warn('Internal.findOrCreateParent: A seperate scoper with that name already exists, overwritting the initial scoper.');
                        checkArr = parent;
                        foundParent = checkArr;
                    } else {
                        foundParent = parent;
                    }
                    return foundParent;
                }
                else if (parent instanceof $rootScope.constructor) {
                    //Can't check cache or session for parent passed as scope because we can't store a complete scope as JSON
                    //Find by $id (might not work depending on how deep this goes
                    checkArr = _.findWhere(internal.storage, { scope: { $id: parent.$id } });
                    if (checkArr instanceof iData.Scoper) {
                        foundParent = checkArr;
                    } else {
                        $log.warn('Internal.findOrCreateParent: Scoper with that scope could not be found, creating one with the scope passed');
                        if (defaultParName !== '_Parent') {
                            internal.createTo(defaultParName, {}, parent);
                            foundParent = internal.findByName(defaultParName);
                        } else {
                            throw Error('Internal.findOrCreateParent: Could not create parent scoper because the name of the child scoper was not passed. Default naming convention is [childName]_Parent');
                        }
                        return foundParent;
                    }
                }
                $log.warn('');
                return null;
            }

            var findOrCreateParent = internal.findOrCreateParent;

        }

        iData.Scoper = function (name, config, existingScope) {
            var scoper = this;
            if (!name)
                throw Error('Scoper requires a name');

            scoper.addTo = function () {
                iData.internal.createTo(name, config, existingScope);
            }

            scoper.name = name;
            scoper.id = assignId();

            var create = function () {

                scoper.WatcherObject = function (key, watchHandler, fnCollection, fireOn, fireWhen, setVal) {
                    var watcher = this;
                    watcher.key = angular.copy(key);
                    if (!scoper.scope[key]) {
                        scoper.scope[key] = null;
                    }

                    //TODO
                    if (setVal)
                        scoper.scope[key] = setVal;

                    //Since stopPropigation is only a function used for emit, I won't need a variable for it anymore
                    //since I broadcast the event from $rootScope

                    watcher.setVal = scoper.scope[key] || setVal || undefined;
                    var reference = function () { return scoper.scope[key]; }
                    var internal = iData.internal;
                    var when = function () {
                        if (!fireWhen || typeof fireWhen !== "string")
                            fireWhen = '>=';

                        switch (fireWhen.toLowerCase()) {
                            case "equals":
                                return watcher.fireOn === watcher.count;
                                break;
                            case "===":
                                return watcher.fireOn === watcher.count;
                                break;
                            case "less than":
                                return watcher.fireOn < watcher.count;
                                break;
                            case "<":
                                return watcher.fireOn < watcher.count;
                                break;
                            case "greater than":
                                return watcher.fireOn > watcher.count;
                                break;
                            case ">":
                                return watcher.fireOn > watcher.count;
                                break;
                            case "less than equal to":
                                return watcher.fireOn <= watcher.count;
                                break;
                            case "<=":
                                return watcher.fireOn <= watcher.count;
                                break;
                            case "greater than eqaul to":
                                return watcher.fireOn >= watcher.count;
                                break;
                            case ">=":
                                return watcher.fireOn >= watcher.count;
                                break;
                            default:
                                return watcher.fireOn >= watcher.count;
                                break;
                        }

                    }

                    var increment = function () {
                        watcher.fireOn++;
                    }

                    //Now it will pass the whole scoper, this watcher, and a collection of args
                    var handlerFn = function (s, w, otherArgs) {
                        if (when() && typeof watcher.handlerFunction === "function") {
                            watcher.handlerFunction(s, w, otherArgs);
                            increment();
                        } else if (typeof watchHandler.fn !== "function") {
                            throw Error('Watch handler is not an instance of a function at scoper ' +
                                scoper.name +
                                ', property of ' +
                                key);
                        } else {
                            $log.log('When not true');
                            increment();
                        }
                    }

                    var init = function () {
                        watcher.handlerFunction = watchHandler.fn;
                        watcher.count = 0;

                        //When would be the appropriate time to set these?
                        //My guess would be 1 right after you get the watcher/set it equal to a var
                        //and 2, inside of your functions pertaining to this property
                        //Can also just set watcher.handlerArgs manually
                        watcher.setHandlerArgs = function (args) {
                            watcher.handlerArgs = args;
                        }

                        watcher.setWatch = function () {
                            if (!watcher.done || watcher.done === false) {
                                scoper.scope.$watch(key, handlerFn(scoper, watcher, watcher.handlerArgs), true);
                                $rootScope.$broadcast(watcher.eventNamePartial + 'off');
                            }
                        }


                        //watcher.val = angular.copy(reference)();
                        //Set custom event listeners for when using a property function with this watcher
                        //That means people can set listeners for whenever we want to set off the $watch with an added function
                        //$on(watcher.eventNamePartial + 'on' OR 'off', function() {});
                        watcher.eventNamePartial = scoper.name + '_' + watcher.key + '_';
                        if (fnCollection instanceof Function) {
                            watcher.fnCollection = angular.copy(fnCollection);
                            //watcher.fnArgsCollection = fnArgsCollection || null;
                        }
                        else if (fnCollection instanceof Array && fnCollection.length) {
                            for (var i = 0; i < fnCollection.length; i++) {
                                if (fnCollection[i] && typeof fnCollection[i] !== 'function') {
                                    throw Error('fnCollection must be composed of functions completely. Only functions/function arrays/function objects allowed');
                                }
                            }
                        }
                        else if (fnCollection instanceof Object && fnCollection)
                        {
                            for (var key in fnCollection) {
                                if (fnCollection.hasOwnProperty(key) && typeof fnCollection[key] !== 'function') {
                                    throw Error('fnCollection must be composed of functions completely. Only functions/function arrays/function objects allowed');
                                }
                            }
                        }
                        else {
                            $log.log(fnCollection);
                            throw Error('fnCollection needs to either be a function or a collection of ALL functions');
                        }
                        watcher.fireOn = (-angular.copy(fireOn) + 1) || 0;

                        if (!fireWhen || typeof fireWhen !== "string") {
                            watcher.fireWhen = '>=';
                            fireWhen = '>=';
                        } else {
                            watcher.fireWhen = fireWhen;
                        }

                        //If you passed an object as fnCollection, then fnSelector is the specified key
                        //If you passed an Array, then fnSelector will be the index of that array
                        //If you only passed one function, then fnSelector doesn't matter, however, if you still want to use
                        //Args with it, you can put anything in fnSelector, it won't make a difference
                        //What you return will be what you set the property value as
                        //Remember args must be stored in a collection and can only be used when indexing that collection (unless you only have one)
                        watcher.useProperty = function (fnSelector, args) {
                            var selectedFn,
                                selectedArgs = args;

                            if (typeof watcher.fnCollection === 'function') {
                                selectedFn = fnCollection;
                            }
                            else if (watcher.fnCollection && _.isArray(fnCollection)) {
                                if (typeof watcher.fnCollection[fnSelector] !== 'function') {
                                    throw Error('Selected function is not an instance of a function');
                                }
                                selectedFn = fnCollection[fnSelector];
                            }
                            else if (fnCollection && _.isObject(fnCollection)) {
                                if (typeof fnCollection[fnSelector] !== 'function') {
                                    throw Error('Selected function is not an instance of a function');
                                }
                                selectedFn = fnCollection[fnSelector];
                            }
                            else if (!(watcher.fnCollection instanceof Function)) {
                                throw Error('Not an instance of a function');
                            }
                            //When writing the function, you only need to account for internal and selectedArgs in the params,
                            //there is also the ability to use the this keyword to reference the scope property itself.
                            scoper.scope.selectedFn = selectedFn;
                            //Remember, each function you pass in to the fnCollection has the capacity to take TWO args
                            //The first is a reference to the object itself, the second is the args you pass via UseProperty()
                            //You can also access the scoper and this watcher from the functions you pass, remember though that if
                            //you want to use args, you need to include the other three parameters in the function declaration
                            var t = scoper.scope.selectedFn(scoper, watcher, selectedArgs);
                            //$log.log(selectedArgs);
                            if (t) {
                                scoper.scope[watcher.key] = t;
                            }

                            delete scoper.scope.selectedFn;


                            //At this point it has run the selected function, now it will start the $digest cycle
                            //$rootScope.$broadcast(watcher.eventNamePartial + 'on');
                            //watcher.setWatch();
                        }

                        watcher.usePropertyHandle = function (fnSelector, args) {
                            watcher.useProperty(fnSelector, args);
                            watcher.setWatch();
                        }

                        watcher.setValueFn = function (val) {
                            //$log.log(val);
                            scoper.scope[watcher.key] = val;
                        }

                        var getCurrent = function () {
                            return scoper.scope[key];
                        }

                        watcher.getCurrentVal = function () {
                            return getCurrent();
                        }

                    }

                    init();

                    scoper.scope.$on(watcher.eventNamePartial + 'on', function (event) {
                        if (watcher.stopProp && (watcher.stopProp === true || (watcher.stopProp.off && watcher.stopProp.off === true))) {
                            event.stopPropagation();
                        }

                        watcher.setWatch();

                    });

                    scoper.scope.$on(watcher.eventNamePartial + 'off', function (event) {
                        if (watcher.stopProp && (watcher.stopProp === true || (watcher.stopProp.off && watcher.stopProp.off === true)))
                            event.stopPropagation();

                        scoper.scope.$$watchers = [];

                    });

                    var eventOn = watcher.eventNamePartial + 'on';
                    var eventOff = watcher.eventNamePartial + 'off';
                    //Remove duplicate listeners causing $watch handlers to fire twice
                    //This could possiblby cause problems for others trying to listen in on this event, but maybe not, test it
                    scoper.scope.$$listeners[eventOn].splice(1, 1);
                    scoper.scope.$$listeners[eventOff].splice(1, 1);

                    return watcher;

                }

                scoper.watcherArr = [];

                scoper.getWatcher = function (key) {
                    var keyName = key;
                    var f = _.findWhere(scoper.watcherArr, { key: keyName });
                    if (f && f instanceof scoper.WatcherObject)
                        return f;
                    else
                        throw Error('Could not get watcher. Key not found');

                }

                scoper.broadcast = function (x, args) {
                    $rootScope.$broadcast(x, args);
                }

                var pushWatcher = function (watcher) {

                    if (watcher instanceof scoper.WatcherObject) {
                        var duplicate = _.findWhere(scoper.watcherArr, { key: watcher.key });
                        if (!duplicate) {
                            scoper.watcherArr.push(watcher);
                        }
                    } else {
                        throw Error('Not a valid watcher object');
                    }
                }

                //For the config.watchProps property, pass either an array with between 2 and 6 elements. Or an object with the property names of the object equal to the properties defined below.
                var getWatchedProps = function (props) {
                    var createWatcherObj = function (x) {
                        var fnCollection,
                            fireOn,
                            fireWhen,
                            watcher,
                            setVal;

                        if (_.isArray(x) && x.length >= 2 && x.length <= 7) {
                            fnCollection = x[2] || null;
                            fireOn = x[3] || null;
                            fireWhen = x[4] || null;
                            setVal = x[5] || null;
                            watcher = new scoper.WatcherObject(x[0], x[1], fnCollection, fireOn, fireWhen, setVal);
                            pushWatcher(watcher);
                        }
                        else if (_.isObject(x)) {
                            //(key, watchHandler, fnCollection, fireOn, fireWhen)

                            //Test the watchers to see if the scoper.scope.$watch function works properly
                            //Reference the object/array requirements above and below
                            //Just don't forget that it's 6 properties at most to overload the constructor
                            var keyName = x.key;

                            if (!keyName) {
                                throw Error('Scope property name required');
                            }

                            var handler = x.watchHandler || x.handler || { fn: angular.noop, stopProp: false };
                            fnCollection = x.fn || x.fnCollection || angular.noop;
                            fireOn = x.on || x.fireOn || null;
                            fireWhen = x.when || x.fireWhen || null;
                            setVal = x.setVal || x.val || x.set || null;
                            watcher = new scoper.WatcherObject(keyName, handler, fnCollection, fireOn, fireWhen, setVal);
                            pushWatcher(watcher);

                        }
                    }

                    //If the big collection is an array, then iterate through that array and create watcher objects with the above function
                    if (_.isArray(props)) {
                        for (var i = 0; i < props.length; i++) {
                            createWatcherObj(props[i]);
                        }
                    }
                    if (_.isObject(props)) {
                        for (var keyN in props) {
                            if (props.hasOwnProperty(keyN)) {
                                createWatcherObj(props[keyN]);
                            }
                        }
                    }

                    return angular.copy(scoper.watcherArr);

                }

                //Set watched properties on the foreign scope
                var setWatch = function () {
                    if (config.watchProps) {
                        var props = config.watchProps;
                        var x = getWatchedProps(props);
                        //set scoper variable equal to a reference of the watcher array, this way you can't change the contents of the actual
                        //behind the scenes array and mess everything up accidentally
                        //This also means we can only set the watch properties once for now TODO
                        scoper.watchProps = x;
                    }
                }

                var dConfig = {
                    parent: '',
                    isolate: false,
                    watchProps: [],
                    setupFn: angular.noop,
                    removingFn: angular.noop,
                    override: {
                        denyOverwrite: undefined,
                        overwritePreExisting: undefined,
                        accessCode: undefined,
                        tryCode: ''
                    }
                };

                //Merges default with passed config object if not null
                //Returns a filled out config object
                var combineConfigs = function () {
                    var mergedConfig = {};
                    config = config || {};
                    var watch = config.watchProps || [];
                    var saveWatch = watch;
                    //for (var i = 0; i < watch.length; i++) {
                    //    saveWatch.push(watch[i]);
                    //}
                    var storeParent = config.parent || dConfig.parent;
                    if (config) {
                        config.parent = '';

                        mergedConfig = angular.merge(dConfig, config);
                    } else {
                        mergedConfig = dConfig;
                    }

                    //End of the private combine configs function
                    return mergedConfig;
                }

                //Sets a variable equal to the final mergedConfig object in the function
                var finalConfig = combineConfigs();


                //Stores config as a property of scoper for re-initializing from cache
                var storeConfig = function () {
                    scoper.config = finalConfig;
                }
                storeConfig();

                var configRef = scoper.config;

                //Pass a config to create a new scope and assign it to scoper
                //Also may create a parent scope if necessary
                var scopeFromScratch = function (config) {
                    var parFinder,
                        findAgain,
                        defaultParName = scoper.name + '_Parent';
                    //get either a name, id, scope, or scoper and try to either find one stored (already created/cache/session) or
                    //create a new one with what we have
                    //Needs to find parent before creating a new scope
                    //If no parent, the scope will be a child of $rootScope
                    var x = config.parent;
                    if (x) {
                        //First: x should be able to be something that you can index in the cachedRef
                        //I.E. Name, Id, parent (many to one), and ctor for the scoper
                        //If it's a string, it's assumed to be the name of the parent
                        if (typeof x === "string") {
                            //Attempt to get the parent from service scoper collection
                            parFinder = iData.internal.findByName(x);
                            //If it did find one, reset x to equal the scope of that parent scoper
                            if (parFinder) {
                                x = parFinder.scope;
                            } else {
                                //If it couldn't find anything, check cache
                                //CheckCache function here
                                //finish create from cache function
                                //var cache = internal.genFromCache(x);

                                iData.internal.createTo(x, {});
                                findAgain = iData.internal.findByName(x);
                                x = findAgain.scope;
                            }
                        }
                        else if (typeof x === "number") {
                            parFinder = iData.internal.findById(x);
                            if (parFinder) {
                                x = parFinder.scope;
                            } else {
                                iData.internal.createTo(defaultParName, {});
                                findAgain = iData.internal.findByName(defaultParName);
                                config.parent = findAgain.name;
                                x = findAgain.scope;
                            }
                        }
                        else if (x instanceof $rootScope.constructor) {
                            parFinder = _.findWhere(iData.internal.storage, { scope: { $id: x.$id } });
                            if (parFinder) {
                                x = parFinder.scope;
                            } else {
                                iData.internal.createTo(defaultParName, {});
                                iData.internal.createTo(defaultParName, {}, x);
                                findAgain = iData.internal.findByName(defaultParName);

                                config.parent = findAgain.name;
                                x = findAgain.scope;
                            }
                        }
                    }
                    else { x = null }

                    var s;
                    if (config.isolate === true) {
                        s = $rootScope.$new(true);
                    } else {
                        s = $rootScope.$new(false, x);
                    }
                    return s;
                }


                //Creates a scope and adds it to the scoper
                var appendScope = function () {
                    var config = finalConfig;
                    if (existingScope && iData.isNgScope(existingScope)) {
                        scoper.scope = existingScope;
                    }
                    else if (existingScope && !(iData.isNgScope(existingScope))) {
                        $log.warn('Existing Scope param is not of type scope. Assigning a new Scope to object.');
                    }
                    scoper.scope = scopeFromScratch(config);
                }
                //Run the setup function on the scope
                var setupScope = function (fn) {
                    scoper.scope.setup = angular.copy(fn);
                    scoper.scope.setup();
                    delete scoper.scope.setup;
                }

                //Run the scope setup passed via config
                var setup = function () {
                    var fn = angular.copy(scoper.config.setupFn);
                    //fn = iData.internal.findStringFn(fn);

                    setupScope(fn);
                }

                appendScope();
                setup();
                setWatch();
            }

            var init = function () {
                create();
            }

            init();

            return scoper;
        }

        iData.internal = new Internal();
        iData.createTo = iData.internal.createTo;
        iData.findByName = iData.internal.findByName;
        iData.findById = iData.internal.findById;
        iData.defaultConfig =  {
                                parent: '',
                                isolate: false,
                                watchProps: [],
                                setupFn: angular.noop,
                                removingFn: angular.noop,
                                override: {
                                    denyOverwrite: undefined,
                                    overwritePreExisting: undefined,
                                    accessCode: undefined,
                                    tryCode: ''
                                }
        };
        iData.defaultWatchProp = {
            key: '',
            watchHandler: {
                fn: angular.noop,
                stopProp: false
            },
            fnCollection: null,
            fireOn: 0,
            fireWhen: '>=',
            setVal: undefined
        }
        //Converts array of strings into one string literal with each element seperated by a comma
        //Useful for converting arrays containing class names to a string for the html style attribute
        iData.arrayToString = function (arr) {
            if (typeof arr === 'String')
                return arr;
            else if (!(arr instanceof Array))
                return null;

            var result = '';
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                if (typeof item === 'String' || item.toString()) {
                    if (i === 0)
                        result = item.toString();
                    else 
                        result != ', ' + item.toString();
                }
            }
            return result;
        }
        return iData;

    }]);

})(_app);