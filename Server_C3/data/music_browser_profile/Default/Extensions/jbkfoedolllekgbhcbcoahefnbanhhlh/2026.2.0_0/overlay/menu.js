/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 90495:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// ../../libs/common/src/autofill/constants/match-patterns.ts
const CardExpiryDateDelimiters = ["/", "-", ".", " "];
// `CardExpiryDateDelimiters` is not intended solely for regex consumption,
// so we need to format it here
const ExpiryDateDelimitersPattern = "\\" +
    CardExpiryDateDelimiters.join("\\")
        // replace space character with the regex whitespace character class
        .replace(" ", "s");
const MonthPattern = "(([1]{1}[0-2]{1})|(0?[1-9]{1}))";
// Because we're dealing with expiry dates, we assume the year will be in current or next century (as of 2024)
const ExpiryFullYearPattern = "2[0-1]{1}\\d{2}";
const DelimiterPatternExpression = new RegExp(`[${ExpiryDateDelimitersPattern}]`, "g");
const IrrelevantExpiryCharactersPatternExpression = new RegExp(
// "nor digits" to ensure numbers are removed from guidance pattern, which aren't covered by ^\w
`[^\\d${ExpiryDateDelimitersPattern}]`, "g");
const MonthPatternExpression = new RegExp(`^${MonthPattern}$`);
const ExpiryFullYearPatternExpression = new RegExp(`^${ExpiryFullYearPattern}$`);

;// ../../libs/common/src/autofill/constants/index.ts
const TYPE_CHECK = {
    FUNCTION: "function",
    NUMBER: "number",
    STRING: "string",
};
const EVENTS = {
    CHANGE: "change",
    INPUT: "input",
    KEYDOWN: "keydown",
    KEYPRESS: "keypress",
    KEYUP: "keyup",
    BLUR: "blur",
    CLICK: "click",
    FOCUS: "focus",
    FOCUSIN: "focusin",
    FOCUSOUT: "focusout",
    SCROLL: "scroll",
    RESIZE: "resize",
    DOMCONTENTLOADED: "DOMContentLoaded",
    LOAD: "load",
    MESSAGE: "message",
    VISIBILITYCHANGE: "visibilitychange",
    MOUSEENTER: "mouseenter",
    MOUSELEAVE: "mouseleave",
    MOUSEUP: "mouseup",
    MOUSEOUT: "mouseout",
    SUBMIT: "submit",
};
/**
 * HTML attributes observed by the MutationObserver for autofill form/field tracking.
 * If you need to observe a new attribute, add it here.
 */
const AUTOFILL_ATTRIBUTES = {
    ACTION: "action",
    ARIA_DESCRIBEDBY: "aria-describedby",
    ARIA_DISABLED: "aria-disabled",
    ARIA_HASPOPUP: "aria-haspopup",
    ARIA_HIDDEN: "aria-hidden",
    ARIA_LABEL: "aria-label",
    ARIA_LABELLEDBY: "aria-labelledby",
    AUTOCOMPLETE: "autocomplete",
    AUTOCOMPLETE_TYPE: "autocompletetype",
    X_AUTOCOMPLETE_TYPE: "x-autocompletetype",
    CHECKED: "checked",
    CLASS: "class",
    DATA_LABEL: "data-label",
    DATA_STRIPE: "data-stripe",
    DISABLED: "disabled",
    ID: "id",
    MAXLENGTH: "maxlength",
    METHOD: "method",
    NAME: "name",
    PLACEHOLDER: "placeholder",
    POPOVER: "popover",
    POPOVERTARGET: "popovertarget",
    POPOVERTARGETACTION: "popovertargetaction",
    READONLY: "readonly",
    REL: "rel",
    TABINDEX: "tabindex",
    TITLE: "title",
    TYPE: "type",
};
const ClearClipboardDelay = {
    Never: null,
    TenSeconds: 10,
    TwentySeconds: 20,
    ThirtySeconds: 30,
    OneMinute: 60,
    TwoMinutes: 120,
    FiveMinutes: 300,
};
/* Ids for context menu items and messaging events */
const AUTOFILL_CARD_ID = "autofill-card";
const AUTOFILL_ID = "autofill";
const SHOW_AUTOFILL_BUTTON = "show-autofill-button";
const AUTOFILL_IDENTITY_ID = "autofill-identity";
const COPY_IDENTIFIER_ID = "copy-identifier";
const COPY_PASSWORD_ID = "copy-password";
const COPY_USERNAME_ID = "copy-username";
const COPY_VERIFICATION_CODE_ID = "copy-totp";
const CREATE_CARD_ID = "create-card";
const CREATE_IDENTITY_ID = "create-identity";
const CREATE_LOGIN_ID = "create-login";
const GENERATE_PASSWORD_ID = "generate-password";
const NOOP_COMMAND_SUFFIX = "noop";
const ROOT_ID = "root";
const SEPARATOR_ID = "separator";
const UPDATE_PASSWORD = "update-password";
const NOTIFICATION_BAR_LIFESPAN_MS = 150000; // 150 seconds
const AUTOFILL_OVERLAY_HANDLE_REPOSITION = "autofill-overlay-handle-reposition-event";
const AUTOFILL_OVERLAY_HANDLE_SCROLL = "autofill-overlay-handle-scroll-event";
const UPDATE_PASSKEYS_HEADINGS_ON_SCROLL = "update-passkeys-headings-on-scroll";
const AUTOFILL_TRIGGER_FORM_FIELD_SUBMIT = "autofill-trigger-form-field-submit";
const AutofillOverlayVisibility = {
    Off: 0,
    OnButtonClick: 1,
    OnFieldFocus: 2,
};
const BrowserClientVendors = {
    Chrome: "Chrome",
    Opera: "Opera",
    Edge: "Edge",
    Vivaldi: "Vivaldi",
    Unknown: "Unknown",
};
const BrowserShortcutsUris = {
    Chrome: "chrome://extensions/shortcuts",
    Opera: "opera://extensions/shortcuts",
    Edge: "edge://extensions/shortcuts",
    Vivaldi: "vivaldi://extensions/shortcuts",
    Unknown: "https://bitwarden.com/help/keyboard-shortcuts",
};
const DisablePasswordManagerUris = {
    Chrome: "chrome://settings/autofill",
    Opera: "opera://settings/autofill",
    Edge: "edge://settings/passwords",
    Vivaldi: "vivaldi://settings/autofill",
    Unknown: "https://bitwarden.com/help/disable-browser-autofill/",
};
const ExtensionCommand = {
    AutofillCommand: "autofill_cmd",
    AutofillCard: "autofill_card",
    AutofillIdentity: "autofill_identity",
    AutofillLogin: "autofill_login",
    OpenAutofillOverlay: "open_autofill_overlay",
    GeneratePassword: "generate_password",
    OpenPopup: "open_popup",
    LockVault: "lock_vault",
    NoopCommand: "noop",
};
const CLEAR_NOTIFICATION_LOGIN_DATA_DURATION = (/* unused pure expression or super */ null && (60 * 1000)); // 1 minute
const MAX_DEEP_QUERY_RECURSION_DEPTH = 4;


;// ../../node_modules/tslib/tslib.es6.mjs
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** *//* global Reflect, Promise, SuppressedError, Symbol, Iterator */var extendStatics=function(d,b){extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(d,b){d.__proto__=b;}||function(d,b){for(var p in b)if(Object.prototype.hasOwnProperty.call(b,p))d[p]=b[p];};return extendStatics(d,b);};function __extends(d,b){if(typeof b!=="function"&&b!==null)throw new TypeError("Class extends value "+String(b)+" is not a constructor or null");extendStatics(d,b);function __(){this.constructor=d;}d.prototype=b===null?Object.create(b):(__.prototype=b.prototype,new __());}var __assign=function(){__assign=Object.assign||function __assign(t){for(var s,i=1,n=arguments.length;i<n;i++){s=arguments[i];for(var p in s)if(Object.prototype.hasOwnProperty.call(s,p))t[p]=s[p];}return t;};return __assign.apply(this,arguments);};function __rest(s,e){var t={};for(var p in s)if(Object.prototype.hasOwnProperty.call(s,p)&&e.indexOf(p)<0)t[p]=s[p];if(s!=null&&typeof Object.getOwnPropertySymbols==="function")for(var i=0,p=Object.getOwnPropertySymbols(s);i<p.length;i++){if(e.indexOf(p[i])<0&&Object.prototype.propertyIsEnumerable.call(s,p[i]))t[p[i]]=s[p[i]];}return t;}function __decorate(decorators,target,key,desc){var c=arguments.length,r=c<3?target:desc===null?desc=Object.getOwnPropertyDescriptor(target,key):desc,d;if(typeof Reflect==="object"&&typeof Reflect.decorate==="function")r=Reflect.decorate(decorators,target,key,desc);else for(var i=decorators.length-1;i>=0;i--)if(d=decorators[i])r=(c<3?d(r):c>3?d(target,key,r):d(target,key))||r;return c>3&&r&&Object.defineProperty(target,key,r),r;}function __param(paramIndex,decorator){return function(target,key){decorator(target,key,paramIndex);};}function __esDecorate(ctor,descriptorIn,decorators,contextIn,initializers,extraInitializers){function accept(f){if(f!==void 0&&typeof f!=="function")throw new TypeError("Function expected");return f;}var kind=contextIn.kind,key=kind==="getter"?"get":kind==="setter"?"set":"value";var target=!descriptorIn&&ctor?contextIn["static"]?ctor:ctor.prototype:null;var descriptor=descriptorIn||(target?Object.getOwnPropertyDescriptor(target,contextIn.name):{});var _,done=false;for(var i=decorators.length-1;i>=0;i--){var context={};for(var p in contextIn)context[p]=p==="access"?{}:contextIn[p];for(var p in contextIn.access)context.access[p]=contextIn.access[p];context.addInitializer=function(f){if(done)throw new TypeError("Cannot add initializers after decoration has completed");extraInitializers.push(accept(f||null));};var result=(0,decorators[i])(kind==="accessor"?{get:descriptor.get,set:descriptor.set}:descriptor[key],context);if(kind==="accessor"){if(result===void 0)continue;if(result===null||typeof result!=="object")throw new TypeError("Object expected");if(_=accept(result.get))descriptor.get=_;if(_=accept(result.set))descriptor.set=_;if(_=accept(result.init))initializers.unshift(_);}else if(_=accept(result)){if(kind==="field")initializers.unshift(_);else descriptor[key]=_;}}if(target)Object.defineProperty(target,contextIn.name,descriptor);done=true;};function __runInitializers(thisArg,initializers,value){var useValue=arguments.length>2;for(var i=0;i<initializers.length;i++){value=useValue?initializers[i].call(thisArg,value):initializers[i].call(thisArg);}return useValue?value:void 0;};function __propKey(x){return typeof x==="symbol"?x:"".concat(x);};function __setFunctionName(f,name,prefix){if(typeof name==="symbol")name=name.description?"[".concat(name.description,"]"):"";return Object.defineProperty(f,"name",{configurable:true,value:prefix?"".concat(prefix," ",name):name});};function __metadata(metadataKey,metadataValue){if(typeof Reflect==="object"&&typeof Reflect.metadata==="function")return Reflect.metadata(metadataKey,metadataValue);}function __awaiter(thisArg,_arguments,P,generator){function adopt(value){return value instanceof P?value:new P(function(resolve){resolve(value);});}return new(P||(P=Promise))(function(resolve,reject){function fulfilled(value){try{step(generator.next(value));}catch(e){reject(e);}}function rejected(value){try{step(generator["throw"](value));}catch(e){reject(e);}}function step(result){result.done?resolve(result.value):adopt(result.value).then(fulfilled,rejected);}step((generator=generator.apply(thisArg,_arguments||[])).next());});}function __generator(thisArg,body){var _={label:0,sent:function(){if(t[0]&1)throw t[1];return t[1];},trys:[],ops:[]},f,y,t,g=Object.create((typeof Iterator==="function"?Iterator:Object).prototype);return g.next=verb(0),g["throw"]=verb(1),g["return"]=verb(2),typeof Symbol==="function"&&(g[Symbol.iterator]=function(){return this;}),g;function verb(n){return function(v){return step([n,v]);};}function step(op){if(f)throw new TypeError("Generator is already executing.");while(g&&(g=0,op[0]&&(_=0)),_)try{if(f=1,y&&(t=op[0]&2?y["return"]:op[0]?y["throw"]||((t=y["return"])&&t.call(y),0):y.next)&&!(t=t.call(y,op[1])).done)return t;if(y=0,t)op=[op[0]&2,t.value];switch(op[0]){case 0:case 1:t=op;break;case 4:_.label++;return{value:op[1],done:false};case 5:_.label++;y=op[1];op=[0];continue;case 7:op=_.ops.pop();_.trys.pop();continue;default:if(!(t=_.trys,t=t.length>0&&t[t.length-1])&&(op[0]===6||op[0]===2)){_=0;continue;}if(op[0]===3&&(!t||op[1]>t[0]&&op[1]<t[3])){_.label=op[1];break;}if(op[0]===6&&_.label<t[1]){_.label=t[1];t=op;break;}if(t&&_.label<t[2]){_.label=t[2];_.ops.push(op);break;}if(t[2])_.ops.pop();_.trys.pop();continue;}op=body.call(thisArg,_);}catch(e){op=[6,e];y=0;}finally{f=t=0;}if(op[0]&5)throw op[1];return{value:op[0]?op[1]:void 0,done:true};}}var __createBinding=Object.create?function(o,m,k,k2){if(k2===undefined)k2=k;var desc=Object.getOwnPropertyDescriptor(m,k);if(!desc||("get"in desc?!m.__esModule:desc.writable||desc.configurable)){desc={enumerable:true,get:function(){return m[k];}};}Object.defineProperty(o,k2,desc);}:function(o,m,k,k2){if(k2===undefined)k2=k;o[k2]=m[k];};function __exportStar(m,o){for(var p in m)if(p!=="default"&&!Object.prototype.hasOwnProperty.call(o,p))__createBinding(o,m,p);}function __values(o){var s=typeof Symbol==="function"&&Symbol.iterator,m=s&&o[s],i=0;if(m)return m.call(o);if(o&&typeof o.length==="number")return{next:function(){if(o&&i>=o.length)o=void 0;return{value:o&&o[i++],done:!o};}};throw new TypeError(s?"Object is not iterable.":"Symbol.iterator is not defined.");}function __read(o,n){var m=typeof Symbol==="function"&&o[Symbol.iterator];if(!m)return o;var i=m.call(o),r,ar=[],e;try{while((n===void 0||n-->0)&&!(r=i.next()).done)ar.push(r.value);}catch(error){e={error:error};}finally{try{if(r&&!r.done&&(m=i["return"]))m.call(i);}finally{if(e)throw e.error;}}return ar;}/** @deprecated */function __spread(){for(var ar=[],i=0;i<arguments.length;i++)ar=ar.concat(__read(arguments[i]));return ar;}/** @deprecated */function __spreadArrays(){for(var s=0,i=0,il=arguments.length;i<il;i++)s+=arguments[i].length;for(var r=Array(s),k=0,i=0;i<il;i++)for(var a=arguments[i],j=0,jl=a.length;j<jl;j++,k++)r[k]=a[j];return r;}function __spreadArray(to,from,pack){if(pack||arguments.length===2)for(var i=0,l=from.length,ar;i<l;i++){if(ar||!(i in from)){if(!ar)ar=Array.prototype.slice.call(from,0,i);ar[i]=from[i];}}return to.concat(ar||Array.prototype.slice.call(from));}function __await(v){return this instanceof __await?(this.v=v,this):new __await(v);}function __asyncGenerator(thisArg,_arguments,generator){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var g=generator.apply(thisArg,_arguments||[]),i,q=[];return i=Object.create((typeof AsyncIterator==="function"?AsyncIterator:Object).prototype),verb("next"),verb("throw"),verb("return",awaitReturn),i[Symbol.asyncIterator]=function(){return this;},i;function awaitReturn(f){return function(v){return Promise.resolve(v).then(f,reject);};}function verb(n,f){if(g[n]){i[n]=function(v){return new Promise(function(a,b){q.push([n,v,a,b])>1||resume(n,v);});};if(f)i[n]=f(i[n]);}}function resume(n,v){try{step(g[n](v));}catch(e){settle(q[0][3],e);}}function step(r){r.value instanceof __await?Promise.resolve(r.value.v).then(fulfill,reject):settle(q[0][2],r);}function fulfill(value){resume("next",value);}function reject(value){resume("throw",value);}function settle(f,v){if(f(v),q.shift(),q.length)resume(q[0][0],q[0][1]);}}function __asyncDelegator(o){var i,p;return i={},verb("next"),verb("throw",function(e){throw e;}),verb("return"),i[Symbol.iterator]=function(){return this;},i;function verb(n,f){i[n]=o[n]?function(v){return(p=!p)?{value:__await(o[n](v)),done:false}:f?f(v):v;}:f;}}function __asyncValues(o){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var m=o[Symbol.asyncIterator],i;return m?m.call(o):(o=typeof __values==="function"?__values(o):o[Symbol.iterator](),i={},verb("next"),verb("throw"),verb("return"),i[Symbol.asyncIterator]=function(){return this;},i);function verb(n){i[n]=o[n]&&function(v){return new Promise(function(resolve,reject){v=o[n](v),settle(resolve,reject,v.done,v.value);});};}function settle(resolve,reject,d,v){Promise.resolve(v).then(function(v){resolve({value:v,done:d});},reject);}}function __makeTemplateObject(cooked,raw){if(Object.defineProperty){Object.defineProperty(cooked,"raw",{value:raw});}else{cooked.raw=raw;}return cooked;};var __setModuleDefault=Object.create?function(o,v){Object.defineProperty(o,"default",{enumerable:true,value:v});}:function(o,v){o["default"]=v;};var ownKeys=function(o){ownKeys=Object.getOwnPropertyNames||function(o){var ar=[];for(var k in o)if(Object.prototype.hasOwnProperty.call(o,k))ar[ar.length]=k;return ar;};return ownKeys(o);};function __importStar(mod){if(mod&&mod.__esModule)return mod;var result={};if(mod!=null)for(var k=ownKeys(mod),i=0;i<k.length;i++)if(k[i]!=="default")__createBinding(result,mod,k[i]);__setModuleDefault(result,mod);return result;}function __importDefault(mod){return mod&&mod.__esModule?mod:{default:mod};}function __classPrivateFieldGet(receiver,state,kind,f){if(kind==="a"&&!f)throw new TypeError("Private accessor was defined without a getter");if(typeof state==="function"?receiver!==state||!f:!state.has(receiver))throw new TypeError("Cannot read private member from an object whose class did not declare it");return kind==="m"?f:kind==="a"?f.call(receiver):f?f.value:state.get(receiver);}function __classPrivateFieldSet(receiver,state,value,kind,f){if(kind==="m")throw new TypeError("Private method is not writable");if(kind==="a"&&!f)throw new TypeError("Private accessor was defined without a setter");if(typeof state==="function"?receiver!==state||!f:!state.has(receiver))throw new TypeError("Cannot write private member to an object whose class did not declare it");return kind==="a"?f.call(receiver,value):f?f.value=value:state.set(receiver,value),value;}function __classPrivateFieldIn(state,receiver){if(receiver===null||typeof receiver!=="object"&&typeof receiver!=="function")throw new TypeError("Cannot use 'in' operator on non-object");return typeof state==="function"?receiver===state:state.has(receiver);}function __addDisposableResource(env,value,async){if(value!==null&&value!==void 0){if(typeof value!=="object"&&typeof value!=="function")throw new TypeError("Object expected.");var dispose,inner;if(async){if(!Symbol.asyncDispose)throw new TypeError("Symbol.asyncDispose is not defined.");dispose=value[Symbol.asyncDispose];}if(dispose===void 0){if(!Symbol.dispose)throw new TypeError("Symbol.dispose is not defined.");dispose=value[Symbol.dispose];if(async)inner=dispose;}if(typeof dispose!=="function")throw new TypeError("Object not disposable.");if(inner)dispose=function(){try{inner.call(this);}catch(e){return Promise.reject(e);}};env.stack.push({value:value,dispose:dispose,async:async});}else if(async){env.stack.push({async:true});}return value;}var _SuppressedError=typeof SuppressedError==="function"?SuppressedError:function(error,suppressed,message){var e=new Error(message);return e.name="SuppressedError",e.error=error,e.suppressed=suppressed,e;};function __disposeResources(env){function fail(e){env.error=env.hasError?new _SuppressedError(e,env.error,"An error was suppressed during disposal."):e;env.hasError=true;}var r,s=0;function next(){while(r=env.stack.pop()){try{if(!r.async&&s===1)return s=0,env.stack.push(r),Promise.resolve().then(next);if(r.dispose){var result=r.dispose.call(r.value);if(r.async)return s|=2,Promise.resolve(result).then(next,function(e){fail(e);return next();});}else s|=1;}catch(e){fail(e);}}if(s===1)return env.hasError?Promise.reject(env.error):Promise.resolve();if(env.hasError)throw env.error;}return next();}function __rewriteRelativeImportExtension(path,preserveJsx){if(typeof path==="string"&&/^\.\.?\//.test(path)){return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i,function(m,tsx,d,ext,cm){return tsx?preserveJsx?".jsx":".js":d&&(!ext||!cm)?m:d+ext+"."+cm.toLowerCase()+"js";});}return path;}/* harmony default export */ var tslib_es6 = ({__extends,__assign,__rest,__decorate,__param,__esDecorate,__runInitializers,__propKey,__setFunctionName,__metadata,__awaiter,__generator,__createBinding,__exportStar,__values,__read,__spread,__spreadArrays,__spreadArray,__await,__asyncGenerator,__asyncDelegator,__asyncValues,__makeTemplateObject,__importStar,__importDefault,__classPrivateFieldGet,__classPrivateFieldSet,__classPrivateFieldIn,__addDisposableResource,__disposeResources,__rewriteRelativeImportExtension});
;// ../../node_modules/rxjs/dist/esm5/internal/util/isFunction.js
function isFunction(value){return typeof value==='function';}
;// ../../node_modules/rxjs/dist/esm5/internal/util/createErrorClass.js
function createErrorClass(createImpl){var _super=function(instance){Error.call(instance);instance.stack=new Error().stack;};var ctorFunc=createImpl(_super);ctorFunc.prototype=Object.create(Error.prototype);ctorFunc.prototype.constructor=ctorFunc;return ctorFunc;}
;// ../../node_modules/rxjs/dist/esm5/internal/util/UnsubscriptionError.js
var UnsubscriptionError=createErrorClass(function(_super){return function UnsubscriptionErrorImpl(errors){_super(this);this.message=errors?errors.length+" errors occurred during unsubscription:\n"+errors.map(function(err,i){return i+1+") "+err.toString();}).join('\n  '):'';this.name='UnsubscriptionError';this.errors=errors;};});
;// ../../node_modules/rxjs/dist/esm5/internal/util/arrRemove.js
function arrRemove(arr,item){if(arr){var index=arr.indexOf(item);0<=index&&arr.splice(index,1);}}
;// ../../node_modules/rxjs/dist/esm5/internal/Subscription.js
var Subscription=function(){function Subscription(initialTeardown){this.initialTeardown=initialTeardown;this.closed=false;this._parentage=null;this._finalizers=null;}Subscription.prototype.unsubscribe=function(){var e_1,_a,e_2,_b;var errors;if(!this.closed){this.closed=true;var _parentage=this._parentage;if(_parentage){this._parentage=null;if(Array.isArray(_parentage)){try{for(var _parentage_1=__values(_parentage),_parentage_1_1=_parentage_1.next();!_parentage_1_1.done;_parentage_1_1=_parentage_1.next()){var parent_1=_parentage_1_1.value;parent_1.remove(this);}}catch(e_1_1){e_1={error:e_1_1};}finally{try{if(_parentage_1_1&&!_parentage_1_1.done&&(_a=_parentage_1.return))_a.call(_parentage_1);}finally{if(e_1)throw e_1.error;}}}else{_parentage.remove(this);}}var initialFinalizer=this.initialTeardown;if(isFunction(initialFinalizer)){try{initialFinalizer();}catch(e){errors=e instanceof UnsubscriptionError?e.errors:[e];}}var _finalizers=this._finalizers;if(_finalizers){this._finalizers=null;try{for(var _finalizers_1=__values(_finalizers),_finalizers_1_1=_finalizers_1.next();!_finalizers_1_1.done;_finalizers_1_1=_finalizers_1.next()){var finalizer=_finalizers_1_1.value;try{execFinalizer(finalizer);}catch(err){errors=errors!==null&&errors!==void 0?errors:[];if(err instanceof UnsubscriptionError){errors=__spreadArray(__spreadArray([],__read(errors)),__read(err.errors));}else{errors.push(err);}}}}catch(e_2_1){e_2={error:e_2_1};}finally{try{if(_finalizers_1_1&&!_finalizers_1_1.done&&(_b=_finalizers_1.return))_b.call(_finalizers_1);}finally{if(e_2)throw e_2.error;}}}if(errors){throw new UnsubscriptionError(errors);}}};Subscription.prototype.add=function(teardown){var _a;if(teardown&&teardown!==this){if(this.closed){execFinalizer(teardown);}else{if(teardown instanceof Subscription){if(teardown.closed||teardown._hasParent(this)){return;}teardown._addParent(this);}(this._finalizers=(_a=this._finalizers)!==null&&_a!==void 0?_a:[]).push(teardown);}}};Subscription.prototype._hasParent=function(parent){var _parentage=this._parentage;return _parentage===parent||Array.isArray(_parentage)&&_parentage.includes(parent);};Subscription.prototype._addParent=function(parent){var _parentage=this._parentage;this._parentage=Array.isArray(_parentage)?(_parentage.push(parent),_parentage):_parentage?[_parentage,parent]:parent;};Subscription.prototype._removeParent=function(parent){var _parentage=this._parentage;if(_parentage===parent){this._parentage=null;}else if(Array.isArray(_parentage)){arrRemove(_parentage,parent);}};Subscription.prototype.remove=function(teardown){var _finalizers=this._finalizers;_finalizers&&arrRemove(_finalizers,teardown);if(teardown instanceof Subscription){teardown._removeParent(this);}};Subscription.EMPTY=function(){var empty=new Subscription();empty.closed=true;return empty;}();return Subscription;}();var EMPTY_SUBSCRIPTION=Subscription.EMPTY;function isSubscription(value){return value instanceof Subscription||value&&'closed'in value&&isFunction(value.remove)&&isFunction(value.add)&&isFunction(value.unsubscribe);}function execFinalizer(finalizer){if(isFunction(finalizer)){finalizer();}else{finalizer.unsubscribe();}}
;// ../../node_modules/rxjs/dist/esm5/internal/config.js
var config={onUnhandledError:null,onStoppedNotification:null,Promise:undefined,useDeprecatedSynchronousErrorHandling:false,useDeprecatedNextContext:false};
;// ../../node_modules/rxjs/dist/esm5/internal/scheduler/timeoutProvider.js
var timeoutProvider={setTimeout:function(handler,timeout){var args=[];for(var _i=2;_i<arguments.length;_i++){args[_i-2]=arguments[_i];}var delegate=timeoutProvider.delegate;if(delegate===null||delegate===void 0?void 0:delegate.setTimeout){return delegate.setTimeout.apply(delegate,__spreadArray([handler,timeout],__read(args)));}return setTimeout.apply(void 0,__spreadArray([handler,timeout],__read(args)));},clearTimeout:function(handle){var delegate=timeoutProvider.delegate;return((delegate===null||delegate===void 0?void 0:delegate.clearTimeout)||clearTimeout)(handle);},delegate:undefined};
;// ../../node_modules/rxjs/dist/esm5/internal/util/reportUnhandledError.js
function reportUnhandledError(err){timeoutProvider.setTimeout(function(){var onUnhandledError=config.onUnhandledError;if(onUnhandledError){onUnhandledError(err);}else{throw err;}});}
;// ../../node_modules/rxjs/dist/esm5/internal/util/noop.js
function noop(){}
;// ../../node_modules/rxjs/dist/esm5/internal/NotificationFactories.js
var COMPLETE_NOTIFICATION=function(){return createNotification('C',undefined,undefined);}();function errorNotification(error){return createNotification('E',undefined,error);}function nextNotification(value){return createNotification('N',value,undefined);}function createNotification(kind,value,error){return{kind:kind,value:value,error:error};}
;// ../../node_modules/rxjs/dist/esm5/internal/util/errorContext.js
var context=null;function errorContext(cb){if(config.useDeprecatedSynchronousErrorHandling){var isRoot=!context;if(isRoot){context={errorThrown:false,error:null};}cb();if(isRoot){var _a=context,errorThrown=_a.errorThrown,error=_a.error;context=null;if(errorThrown){throw error;}}}else{cb();}}function captureError(err){if(config.useDeprecatedSynchronousErrorHandling&&context){context.errorThrown=true;context.error=err;}}
;// ../../node_modules/rxjs/dist/esm5/internal/Subscriber.js
var Subscriber=function(_super){__extends(Subscriber,_super);function Subscriber(destination){var _this=_super.call(this)||this;_this.isStopped=false;if(destination){_this.destination=destination;if(isSubscription(destination)){destination.add(_this);}}else{_this.destination=EMPTY_OBSERVER;}return _this;}Subscriber.create=function(next,error,complete){return new SafeSubscriber(next,error,complete);};Subscriber.prototype.next=function(value){if(this.isStopped){handleStoppedNotification(nextNotification(value),this);}else{this._next(value);}};Subscriber.prototype.error=function(err){if(this.isStopped){handleStoppedNotification(errorNotification(err),this);}else{this.isStopped=true;this._error(err);}};Subscriber.prototype.complete=function(){if(this.isStopped){handleStoppedNotification(COMPLETE_NOTIFICATION,this);}else{this.isStopped=true;this._complete();}};Subscriber.prototype.unsubscribe=function(){if(!this.closed){this.isStopped=true;_super.prototype.unsubscribe.call(this);this.destination=null;}};Subscriber.prototype._next=function(value){this.destination.next(value);};Subscriber.prototype._error=function(err){try{this.destination.error(err);}finally{this.unsubscribe();}};Subscriber.prototype._complete=function(){try{this.destination.complete();}finally{this.unsubscribe();}};return Subscriber;}(Subscription);var _bind=Function.prototype.bind;function bind(fn,thisArg){return _bind.call(fn,thisArg);}var ConsumerObserver=function(){function ConsumerObserver(partialObserver){this.partialObserver=partialObserver;}ConsumerObserver.prototype.next=function(value){var partialObserver=this.partialObserver;if(partialObserver.next){try{partialObserver.next(value);}catch(error){handleUnhandledError(error);}}};ConsumerObserver.prototype.error=function(err){var partialObserver=this.partialObserver;if(partialObserver.error){try{partialObserver.error(err);}catch(error){handleUnhandledError(error);}}else{handleUnhandledError(err);}};ConsumerObserver.prototype.complete=function(){var partialObserver=this.partialObserver;if(partialObserver.complete){try{partialObserver.complete();}catch(error){handleUnhandledError(error);}}};return ConsumerObserver;}();var SafeSubscriber=function(_super){__extends(SafeSubscriber,_super);function SafeSubscriber(observerOrNext,error,complete){var _this=_super.call(this)||this;var partialObserver;if(isFunction(observerOrNext)||!observerOrNext){partialObserver={next:observerOrNext!==null&&observerOrNext!==void 0?observerOrNext:undefined,error:error!==null&&error!==void 0?error:undefined,complete:complete!==null&&complete!==void 0?complete:undefined};}else{var context_1;if(_this&&config.useDeprecatedNextContext){context_1=Object.create(observerOrNext);context_1.unsubscribe=function(){return _this.unsubscribe();};partialObserver={next:observerOrNext.next&&bind(observerOrNext.next,context_1),error:observerOrNext.error&&bind(observerOrNext.error,context_1),complete:observerOrNext.complete&&bind(observerOrNext.complete,context_1)};}else{partialObserver=observerOrNext;}}_this.destination=new ConsumerObserver(partialObserver);return _this;}return SafeSubscriber;}(Subscriber);function handleUnhandledError(error){if(config.useDeprecatedSynchronousErrorHandling){captureError(error);}else{reportUnhandledError(error);}}function defaultErrorHandler(err){throw err;}function handleStoppedNotification(notification,subscriber){var onStoppedNotification=config.onStoppedNotification;onStoppedNotification&&timeoutProvider.setTimeout(function(){return onStoppedNotification(notification,subscriber);});}var EMPTY_OBSERVER={closed:true,next:noop,error:defaultErrorHandler,complete:noop};
;// ../../node_modules/rxjs/dist/esm5/internal/symbol/observable.js
var observable=function(){return typeof Symbol==='function'&&Symbol.observable||'@@observable';}();
;// ../../node_modules/rxjs/dist/esm5/internal/util/identity.js
function identity(x){return x;}
;// ../../node_modules/rxjs/dist/esm5/internal/util/pipe.js
function pipe(){var fns=[];for(var _i=0;_i<arguments.length;_i++){fns[_i]=arguments[_i];}return pipeFromArray(fns);}function pipeFromArray(fns){if(fns.length===0){return identity;}if(fns.length===1){return fns[0];}return function piped(input){return fns.reduce(function(prev,fn){return fn(prev);},input);};}
;// ../../node_modules/rxjs/dist/esm5/internal/Observable.js
var Observable=function(){function Observable(subscribe){if(subscribe){this._subscribe=subscribe;}}Observable.prototype.lift=function(operator){var observable=new Observable();observable.source=this;observable.operator=operator;return observable;};Observable.prototype.subscribe=function(observerOrNext,error,complete){var _this=this;var subscriber=isSubscriber(observerOrNext)?observerOrNext:new SafeSubscriber(observerOrNext,error,complete);errorContext(function(){var _a=_this,operator=_a.operator,source=_a.source;subscriber.add(operator?operator.call(subscriber,source):source?_this._subscribe(subscriber):_this._trySubscribe(subscriber));});return subscriber;};Observable.prototype._trySubscribe=function(sink){try{return this._subscribe(sink);}catch(err){sink.error(err);}};Observable.prototype.forEach=function(next,promiseCtor){var _this=this;promiseCtor=getPromiseCtor(promiseCtor);return new promiseCtor(function(resolve,reject){var subscriber=new SafeSubscriber({next:function(value){try{next(value);}catch(err){reject(err);subscriber.unsubscribe();}},error:reject,complete:resolve});_this.subscribe(subscriber);});};Observable.prototype._subscribe=function(subscriber){var _a;return(_a=this.source)===null||_a===void 0?void 0:_a.subscribe(subscriber);};Observable.prototype[observable]=function(){return this;};Observable.prototype.pipe=function(){var operations=[];for(var _i=0;_i<arguments.length;_i++){operations[_i]=arguments[_i];}return pipeFromArray(operations)(this);};Observable.prototype.toPromise=function(promiseCtor){var _this=this;promiseCtor=getPromiseCtor(promiseCtor);return new promiseCtor(function(resolve,reject){var value;_this.subscribe(function(x){return value=x;},function(err){return reject(err);},function(){return resolve(value);});});};Observable.create=function(subscribe){return new Observable(subscribe);};return Observable;}();function getPromiseCtor(promiseCtor){var _a;return(_a=promiseCtor!==null&&promiseCtor!==void 0?promiseCtor:config.Promise)!==null&&_a!==void 0?_a:Promise;}function isObserver(value){return value&&isFunction(value.next)&&isFunction(value.error)&&isFunction(value.complete);}function isSubscriber(value){return value&&value instanceof Subscriber||isObserver(value)&&isSubscription(value);}
;// ../../libs/client-type/src/index.ts
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var ClientType;
(function (ClientType) {
    ClientType["Web"] = "web";
    ClientType["Browser"] = "browser";
    ClientType["Desktop"] = "desktop";
    // Mobile = "mobile",
    ClientType["Cli"] = "cli";
    // DirectoryConnector = "connector",
})(ClientType || (ClientType = {}));

;// ../../libs/common/src/enums/client-type.enum.ts


;// ../../libs/common/src/enums/device-type.enum.ts
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var DeviceType;
(function (DeviceType) {
    DeviceType[DeviceType["Android"] = 0] = "Android";
    DeviceType[DeviceType["iOS"] = 1] = "iOS";
    DeviceType[DeviceType["ChromeExtension"] = 2] = "ChromeExtension";
    DeviceType[DeviceType["FirefoxExtension"] = 3] = "FirefoxExtension";
    DeviceType[DeviceType["OperaExtension"] = 4] = "OperaExtension";
    DeviceType[DeviceType["EdgeExtension"] = 5] = "EdgeExtension";
    DeviceType[DeviceType["WindowsDesktop"] = 6] = "WindowsDesktop";
    DeviceType[DeviceType["MacOsDesktop"] = 7] = "MacOsDesktop";
    DeviceType[DeviceType["LinuxDesktop"] = 8] = "LinuxDesktop";
    DeviceType[DeviceType["ChromeBrowser"] = 9] = "ChromeBrowser";
    DeviceType[DeviceType["FirefoxBrowser"] = 10] = "FirefoxBrowser";
    DeviceType[DeviceType["OperaBrowser"] = 11] = "OperaBrowser";
    DeviceType[DeviceType["EdgeBrowser"] = 12] = "EdgeBrowser";
    DeviceType[DeviceType["IEBrowser"] = 13] = "IEBrowser";
    DeviceType[DeviceType["UnknownBrowser"] = 14] = "UnknownBrowser";
    DeviceType[DeviceType["AndroidAmazon"] = 15] = "AndroidAmazon";
    DeviceType[DeviceType["UWP"] = 16] = "UWP";
    DeviceType[DeviceType["SafariBrowser"] = 17] = "SafariBrowser";
    DeviceType[DeviceType["VivaldiBrowser"] = 18] = "VivaldiBrowser";
    DeviceType[DeviceType["VivaldiExtension"] = 19] = "VivaldiExtension";
    DeviceType[DeviceType["SafariExtension"] = 20] = "SafariExtension";
    DeviceType[DeviceType["SDK"] = 21] = "SDK";
    DeviceType[DeviceType["Server"] = 22] = "Server";
    DeviceType[DeviceType["WindowsCLI"] = 23] = "WindowsCLI";
    DeviceType[DeviceType["MacOsCLI"] = 24] = "MacOsCLI";
    DeviceType[DeviceType["LinuxCLI"] = 25] = "LinuxCLI";
    DeviceType[DeviceType["DuckDuckGoBrowser"] = 26] = "DuckDuckGoBrowser";
})(DeviceType || (DeviceType = {}));
const DeviceTypeMetadata = {
    [DeviceType.Android]: { category: "mobile", platform: "Android" },
    [DeviceType.iOS]: { category: "mobile", platform: "iOS" },
    [DeviceType.AndroidAmazon]: { category: "mobile", platform: "Amazon" },
    [DeviceType.ChromeExtension]: { category: "extension", platform: "Chrome" },
    [DeviceType.FirefoxExtension]: { category: "extension", platform: "Firefox" },
    [DeviceType.OperaExtension]: { category: "extension", platform: "Opera" },
    [DeviceType.EdgeExtension]: { category: "extension", platform: "Edge" },
    [DeviceType.VivaldiExtension]: { category: "extension", platform: "Vivaldi" },
    [DeviceType.SafariExtension]: { category: "extension", platform: "Safari" },
    [DeviceType.ChromeBrowser]: { category: "webApp", platform: "Chrome" },
    [DeviceType.FirefoxBrowser]: { category: "webApp", platform: "Firefox" },
    [DeviceType.OperaBrowser]: { category: "webApp", platform: "Opera" },
    [DeviceType.EdgeBrowser]: { category: "webApp", platform: "Edge" },
    [DeviceType.IEBrowser]: { category: "webApp", platform: "IE" },
    [DeviceType.SafariBrowser]: { category: "webApp", platform: "Safari" },
    [DeviceType.VivaldiBrowser]: { category: "webApp", platform: "Vivaldi" },
    [DeviceType.DuckDuckGoBrowser]: { category: "webApp", platform: "DuckDuckGo" },
    [DeviceType.UnknownBrowser]: { category: "webApp", platform: "Unknown" },
    [DeviceType.WindowsDesktop]: { category: "desktop", platform: "Windows" },
    [DeviceType.MacOsDesktop]: { category: "desktop", platform: "macOS" },
    [DeviceType.LinuxDesktop]: { category: "desktop", platform: "Linux" },
    [DeviceType.UWP]: { category: "desktop", platform: "Windows UWP" },
    [DeviceType.WindowsCLI]: { category: "cli", platform: "Windows" },
    [DeviceType.MacOsCLI]: { category: "cli", platform: "macOS" },
    [DeviceType.LinuxCLI]: { category: "cli", platform: "Linux" },
    [DeviceType.SDK]: { category: "sdk", platform: "" },
    [DeviceType.Server]: { category: "server", platform: "" },
};

;// ../../libs/common/src/enums/event-system-user.enum.ts
// Note: the enum key is used to describe the EventSystemUser in the UI. Be careful about changing it.
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var EventSystemUser;
(function (EventSystemUser) {
    EventSystemUser[EventSystemUser["SCIM"] = 1] = "SCIM";
    EventSystemUser[EventSystemUser["DomainVerification"] = 2] = "DomainVerification";
    EventSystemUser[EventSystemUser["PublicApi"] = 3] = "PublicApi";
    EventSystemUser[EventSystemUser["BitwardenPortal"] = 5] = "BitwardenPortal";
})(EventSystemUser || (EventSystemUser = {}));

;// ../../libs/common/src/enums/event-type.enum.ts
// Increment by 100 for each new set of events
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var EventType;
(function (EventType) {
    EventType[EventType["User_LoggedIn"] = 1000] = "User_LoggedIn";
    EventType[EventType["User_ChangedPassword"] = 1001] = "User_ChangedPassword";
    EventType[EventType["User_Updated2fa"] = 1002] = "User_Updated2fa";
    EventType[EventType["User_Disabled2fa"] = 1003] = "User_Disabled2fa";
    EventType[EventType["User_Recovered2fa"] = 1004] = "User_Recovered2fa";
    EventType[EventType["User_FailedLogIn"] = 1005] = "User_FailedLogIn";
    EventType[EventType["User_FailedLogIn2fa"] = 1006] = "User_FailedLogIn2fa";
    EventType[EventType["User_ClientExportedVault"] = 1007] = "User_ClientExportedVault";
    EventType[EventType["User_UpdatedTempPassword"] = 1008] = "User_UpdatedTempPassword";
    EventType[EventType["User_MigratedKeyToKeyConnector"] = 1009] = "User_MigratedKeyToKeyConnector";
    EventType[EventType["User_RequestedDeviceApproval"] = 1010] = "User_RequestedDeviceApproval";
    EventType[EventType["User_TdeOffboardingPasswordSet"] = 1011] = "User_TdeOffboardingPasswordSet";
    EventType[EventType["Cipher_Created"] = 1100] = "Cipher_Created";
    EventType[EventType["Cipher_Updated"] = 1101] = "Cipher_Updated";
    EventType[EventType["Cipher_Deleted"] = 1102] = "Cipher_Deleted";
    EventType[EventType["Cipher_AttachmentCreated"] = 1103] = "Cipher_AttachmentCreated";
    EventType[EventType["Cipher_AttachmentDeleted"] = 1104] = "Cipher_AttachmentDeleted";
    EventType[EventType["Cipher_Shared"] = 1105] = "Cipher_Shared";
    EventType[EventType["Cipher_UpdatedCollections"] = 1106] = "Cipher_UpdatedCollections";
    EventType[EventType["Cipher_ClientViewed"] = 1107] = "Cipher_ClientViewed";
    EventType[EventType["Cipher_ClientToggledPasswordVisible"] = 1108] = "Cipher_ClientToggledPasswordVisible";
    EventType[EventType["Cipher_ClientToggledHiddenFieldVisible"] = 1109] = "Cipher_ClientToggledHiddenFieldVisible";
    EventType[EventType["Cipher_ClientToggledCardCodeVisible"] = 1110] = "Cipher_ClientToggledCardCodeVisible";
    EventType[EventType["Cipher_ClientCopiedPassword"] = 1111] = "Cipher_ClientCopiedPassword";
    EventType[EventType["Cipher_ClientCopiedHiddenField"] = 1112] = "Cipher_ClientCopiedHiddenField";
    EventType[EventType["Cipher_ClientCopiedCardCode"] = 1113] = "Cipher_ClientCopiedCardCode";
    EventType[EventType["Cipher_ClientAutofilled"] = 1114] = "Cipher_ClientAutofilled";
    EventType[EventType["Cipher_SoftDeleted"] = 1115] = "Cipher_SoftDeleted";
    EventType[EventType["Cipher_Restored"] = 1116] = "Cipher_Restored";
    EventType[EventType["Cipher_ClientToggledCardNumberVisible"] = 1117] = "Cipher_ClientToggledCardNumberVisible";
    EventType[EventType["Cipher_ClientToggledTOTPSeedVisible"] = 1118] = "Cipher_ClientToggledTOTPSeedVisible";
    EventType[EventType["Collection_Created"] = 1300] = "Collection_Created";
    EventType[EventType["Collection_Updated"] = 1301] = "Collection_Updated";
    EventType[EventType["Collection_Deleted"] = 1302] = "Collection_Deleted";
    EventType[EventType["Group_Created"] = 1400] = "Group_Created";
    EventType[EventType["Group_Updated"] = 1401] = "Group_Updated";
    EventType[EventType["Group_Deleted"] = 1402] = "Group_Deleted";
    EventType[EventType["OrganizationUser_Invited"] = 1500] = "OrganizationUser_Invited";
    EventType[EventType["OrganizationUser_Confirmed"] = 1501] = "OrganizationUser_Confirmed";
    EventType[EventType["OrganizationUser_Updated"] = 1502] = "OrganizationUser_Updated";
    EventType[EventType["OrganizationUser_Removed"] = 1503] = "OrganizationUser_Removed";
    EventType[EventType["OrganizationUser_UpdatedGroups"] = 1504] = "OrganizationUser_UpdatedGroups";
    EventType[EventType["OrganizationUser_UnlinkedSso"] = 1505] = "OrganizationUser_UnlinkedSso";
    EventType[EventType["OrganizationUser_ResetPassword_Enroll"] = 1506] = "OrganizationUser_ResetPassword_Enroll";
    EventType[EventType["OrganizationUser_ResetPassword_Withdraw"] = 1507] = "OrganizationUser_ResetPassword_Withdraw";
    EventType[EventType["OrganizationUser_AdminResetPassword"] = 1508] = "OrganizationUser_AdminResetPassword";
    EventType[EventType["OrganizationUser_ResetSsoLink"] = 1509] = "OrganizationUser_ResetSsoLink";
    EventType[EventType["OrganizationUser_FirstSsoLogin"] = 1510] = "OrganizationUser_FirstSsoLogin";
    EventType[EventType["OrganizationUser_Revoked"] = 1511] = "OrganizationUser_Revoked";
    EventType[EventType["OrganizationUser_Restored"] = 1512] = "OrganizationUser_Restored";
    EventType[EventType["OrganizationUser_ApprovedAuthRequest"] = 1513] = "OrganizationUser_ApprovedAuthRequest";
    EventType[EventType["OrganizationUser_RejectedAuthRequest"] = 1514] = "OrganizationUser_RejectedAuthRequest";
    EventType[EventType["OrganizationUser_Deleted"] = 1515] = "OrganizationUser_Deleted";
    EventType[EventType["OrganizationUser_Left"] = 1516] = "OrganizationUser_Left";
    EventType[EventType["OrganizationUser_AutomaticallyConfirmed"] = 1517] = "OrganizationUser_AutomaticallyConfirmed";
    EventType[EventType["Organization_Updated"] = 1600] = "Organization_Updated";
    EventType[EventType["Organization_PurgedVault"] = 1601] = "Organization_PurgedVault";
    EventType[EventType["Organization_ClientExportedVault"] = 1602] = "Organization_ClientExportedVault";
    EventType[EventType["Organization_VaultAccessed"] = 1603] = "Organization_VaultAccessed";
    EventType[EventType["Organization_EnabledSso"] = 1604] = "Organization_EnabledSso";
    EventType[EventType["Organization_DisabledSso"] = 1605] = "Organization_DisabledSso";
    EventType[EventType["Organization_EnabledKeyConnector"] = 1606] = "Organization_EnabledKeyConnector";
    EventType[EventType["Organization_DisabledKeyConnector"] = 1607] = "Organization_DisabledKeyConnector";
    EventType[EventType["Organization_SponsorshipsSynced"] = 1608] = "Organization_SponsorshipsSynced";
    EventType[EventType["Organization_CollectionManagementUpdated"] = 1609] = "Organization_CollectionManagementUpdated";
    EventType[EventType["Organization_CollectionManagement_LimitCollectionCreationEnabled"] = 1610] = "Organization_CollectionManagement_LimitCollectionCreationEnabled";
    EventType[EventType["Organization_CollectionManagement_LimitCollectionCreationDisabled"] = 1611] = "Organization_CollectionManagement_LimitCollectionCreationDisabled";
    EventType[EventType["Organization_CollectionManagement_LimitCollectionDeletionEnabled"] = 1612] = "Organization_CollectionManagement_LimitCollectionDeletionEnabled";
    EventType[EventType["Organization_CollectionManagement_LimitCollectionDeletionDisabled"] = 1613] = "Organization_CollectionManagement_LimitCollectionDeletionDisabled";
    EventType[EventType["Organization_CollectionManagement_LimitItemDeletionEnabled"] = 1614] = "Organization_CollectionManagement_LimitItemDeletionEnabled";
    EventType[EventType["Organization_CollectionManagement_LimitItemDeletionDisabled"] = 1615] = "Organization_CollectionManagement_LimitItemDeletionDisabled";
    EventType[EventType["Organization_CollectionManagement_AllowAdminAccessToAllCollectionItemsEnabled"] = 1616] = "Organization_CollectionManagement_AllowAdminAccessToAllCollectionItemsEnabled";
    EventType[EventType["Organization_CollectionManagement_AllowAdminAccessToAllCollectionItemsDisabled"] = 1617] = "Organization_CollectionManagement_AllowAdminAccessToAllCollectionItemsDisabled";
    EventType[EventType["Organization_ItemOrganization_Accepted"] = 1618] = "Organization_ItemOrganization_Accepted";
    EventType[EventType["Organization_ItemOrganization_Declined"] = 1619] = "Organization_ItemOrganization_Declined";
    EventType[EventType["Organization_AutoConfirmEnabled_Admin"] = 1620] = "Organization_AutoConfirmEnabled_Admin";
    EventType[EventType["Organization_AutoConfirmDisabled_Admin"] = 1621] = "Organization_AutoConfirmDisabled_Admin";
    EventType[EventType["Organization_AutoConfirmEnabled_Portal"] = 1622] = "Organization_AutoConfirmEnabled_Portal";
    EventType[EventType["Organization_AutoConfirmDisabled_Portal"] = 1623] = "Organization_AutoConfirmDisabled_Portal";
    EventType[EventType["Policy_Updated"] = 1700] = "Policy_Updated";
    EventType[EventType["ProviderUser_Invited"] = 1800] = "ProviderUser_Invited";
    EventType[EventType["ProviderUser_Confirmed"] = 1801] = "ProviderUser_Confirmed";
    EventType[EventType["ProviderUser_Updated"] = 1802] = "ProviderUser_Updated";
    EventType[EventType["ProviderUser_Removed"] = 1803] = "ProviderUser_Removed";
    EventType[EventType["ProviderOrganization_Created"] = 1900] = "ProviderOrganization_Created";
    EventType[EventType["ProviderOrganization_Added"] = 1901] = "ProviderOrganization_Added";
    EventType[EventType["ProviderOrganization_Removed"] = 1902] = "ProviderOrganization_Removed";
    EventType[EventType["ProviderOrganization_VaultAccessed"] = 1903] = "ProviderOrganization_VaultAccessed";
    EventType[EventType["OrganizationDomain_Added"] = 2000] = "OrganizationDomain_Added";
    EventType[EventType["OrganizationDomain_Removed"] = 2001] = "OrganizationDomain_Removed";
    EventType[EventType["OrganizationDomain_Verified"] = 2002] = "OrganizationDomain_Verified";
    EventType[EventType["OrganizationDomain_NotVerified"] = 2003] = "OrganizationDomain_NotVerified";
    EventType[EventType["Secret_Retrieved"] = 2100] = "Secret_Retrieved";
    EventType[EventType["Secret_Created"] = 2101] = "Secret_Created";
    EventType[EventType["Secret_Edited"] = 2102] = "Secret_Edited";
    EventType[EventType["Secret_Deleted"] = 2103] = "Secret_Deleted";
    EventType[EventType["Secret_Permanently_Deleted"] = 2104] = "Secret_Permanently_Deleted";
    EventType[EventType["Secret_Restored"] = 2105] = "Secret_Restored";
    EventType[EventType["Project_Retrieved"] = 2200] = "Project_Retrieved";
    EventType[EventType["Project_Created"] = 2201] = "Project_Created";
    EventType[EventType["Project_Edited"] = 2202] = "Project_Edited";
    EventType[EventType["Project_Deleted"] = 2203] = "Project_Deleted";
    EventType[EventType["ServiceAccount_UserAdded"] = 2300] = "ServiceAccount_UserAdded";
    EventType[EventType["ServiceAccount_UserRemoved"] = 2301] = "ServiceAccount_UserRemoved";
    EventType[EventType["ServiceAccount_GroupAdded"] = 2302] = "ServiceAccount_GroupAdded";
    EventType[EventType["ServiceAccount_GroupRemoved"] = 2303] = "ServiceAccount_GroupRemoved";
    EventType[EventType["ServiceAccount_Created"] = 2304] = "ServiceAccount_Created";
    EventType[EventType["ServiceAccount_Deleted"] = 2305] = "ServiceAccount_Deleted";
})(EventType || (EventType = {}));

;// ../../libs/common/src/enums/http-status-code.enum.ts
/**
 * Hypertext Transfer Protocol (HTTP) response status codes.
 *
 * @see {@link https://en.wikipedia.org/wiki/List_of_HTTP_status_codes}
 * src: https://gist.github.com/RWOverdijk/6cef816cfdf5722228e01cc05fd4b094
 */
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var HttpStatusCode;
(function (HttpStatusCode) {
    /**
     * The server has received the request headers and the client should proceed to send the request body
     * (in the case of a request for which a body needs to be sent; for example, a POST request).
     * Sending a large request body to a server after a request has been rejected for inappropriate headers would be inefficient.
     * To have a server check the request's headers, a client must send Expect: 100-continue as a header in its initial request
     * and receive a 100 Continue status code in response before sending the body. The response 417 Expectation Failed indicates the request should not be continued.
     */
    HttpStatusCode[HttpStatusCode["Continue"] = 100] = "Continue";
    /**
     * The requester has asked the server to switch protocols and the server has agreed to do so.
     */
    HttpStatusCode[HttpStatusCode["SwitchingProtocols"] = 101] = "SwitchingProtocols";
    /**
     * A WebDAV request may contain many sub-requests involving file operations, requiring a long time to complete the request.
     * This code indicates that the server has received and is processing the request, but no response is available yet.
     * This prevents the client from timing out and assuming the request was lost.
     */
    HttpStatusCode[HttpStatusCode["Processing"] = 102] = "Processing";
    // **********************************************************************************************************
    // 200s - SUCCESS
    // **********************************************************************************************************
    /**
     * Standard response for successful HTTP requests.
     * The actual response will depend on the request method used.
     * In a GET request, the response will contain an entity corresponding to the requested resource.
     * In a POST request, the response will contain an entity describing or containing the result of the action.
     */
    HttpStatusCode[HttpStatusCode["Ok"] = 200] = "Ok";
    /**
     * The request has been fulfilled, resulting in the creation of a new resource.
     */
    HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
    /**
     * The request has been accepted for processing, but the processing has not been completed.
     * The request might or might not be eventually acted upon, and may be disallowed when processing occurs.
     */
    HttpStatusCode[HttpStatusCode["Accepted"] = 202] = "Accepted";
    /**
     * SINCE HTTP/1.1
     * The server is a transforming proxy that received a 200 OK from its origin,
     * but is returning a modified version of the origin's response.
     */
    HttpStatusCode[HttpStatusCode["NonAuthoritativeInformation"] = 203] = "NonAuthoritativeInformation";
    /**
     * The server successfully processed the request and is not returning any content.
     */
    HttpStatusCode[HttpStatusCode["NoContent"] = 204] = "NoContent";
    /**
     * The server successfully processed the request, but is not returning any content.
     * Unlike a 204 response, this response requires that the requester reset the document view.
     */
    HttpStatusCode[HttpStatusCode["ResetContent"] = 205] = "ResetContent";
    /**
     * The server is delivering only part of the resource (byte serving) due to a range header sent by the client.
     * The range header is used by HTTP clients to enable resuming of interrupted downloads,
     * or split a download into multiple simultaneous streams.
     */
    HttpStatusCode[HttpStatusCode["PartialContent"] = 206] = "PartialContent";
    /**
     * The message body that follows is an XML message and can contain a number of separate response codes,
     * depending on how many sub-requests were made.
     */
    HttpStatusCode[HttpStatusCode["MultiStatus"] = 207] = "MultiStatus";
    /**
     * The members of a DAV binding have already been enumerated in a preceding part of the (multistatus) response,
     * and are not being included again.
     */
    HttpStatusCode[HttpStatusCode["AlreadyReported"] = 208] = "AlreadyReported";
    /**
     * The server has fulfilled a request for the resource,
     * and the response is a representation of the result of one or more instance-manipulations applied to the current instance.
     */
    HttpStatusCode[HttpStatusCode["ImUsed"] = 226] = "ImUsed";
    // **********************************************************************************************************
    // 300s - Redirections
    // **********************************************************************************************************
    /**
     * Indicates multiple options for the resource from which the client may choose (via agent-driven content negotiation).
     * For example, this code could be used to present multiple video format options,
     * to list files with different filename extensions, or to suggest word-sense disambiguation.
     */
    HttpStatusCode[HttpStatusCode["MultipleChoices"] = 300] = "MultipleChoices";
    /**
     * This and all future requests should be directed to the given URI.
     */
    HttpStatusCode[HttpStatusCode["MovedPermanently"] = 301] = "MovedPermanently";
    /**
     * This is an example of industry practice contradicting the standard.
     * The HTTP/1.0 specification (RFC 1945) required the client to perform a temporary redirect
     * (the original describing phrase was "Moved Temporarily"), but popular browsers implemented 302
     * with the functionality of a 303 See Other. Therefore, HTTP/1.1 added status codes 303 and 307
     * to distinguish between the two behaviours. However, some Web applications and frameworks
     * use the 302 status code as if it were the 303.
     */
    HttpStatusCode[HttpStatusCode["Found"] = 302] = "Found";
    /**
     * SINCE HTTP/1.1
     * The response to the request can be found under another URI using a GET method.
     * When received in response to a POST (or PUT/DELETE), the client should presume that
     * the server has received the data and should issue a redirect with a separate GET message.
     */
    HttpStatusCode[HttpStatusCode["SeeOther"] = 303] = "SeeOther";
    /**
     * Indicates that the resource has not been modified since the version specified by the request headers If-Modified-Since or If-None-Match.
     * In such case, there is no need to retransmit the resource since the client still has a previously-downloaded copy.
     */
    HttpStatusCode[HttpStatusCode["NotModified"] = 304] = "NotModified";
    /**
     * SINCE HTTP/1.1
     * The requested resource is available only through a proxy, the address for which is provided in the response.
     * Many HTTP clients (such as Mozilla and Internet Explorer) do not correctly handle responses with this status code, primarily for security reasons.
     */
    HttpStatusCode[HttpStatusCode["UseProxy"] = 305] = "UseProxy";
    /**
     * No longer used. Originally meant "Subsequent requests should use the specified proxy."
     */
    HttpStatusCode[HttpStatusCode["SwitchProxy"] = 306] = "SwitchProxy";
    /**
     * SINCE HTTP/1.1
     * In this case, the request should be repeated with another URI; however, future requests should still use the original URI.
     * In contrast to how 302 was historically implemented, the request method is not allowed to be changed when reissuing the original request.
     * For example, a POST request should be repeated using another POST request.
     */
    HttpStatusCode[HttpStatusCode["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    /**
     * The request and all future requests should be repeated using another URI.
     * 307 and 308 parallel the behaviors of 302 and 301, but do not allow the HTTP method to change.
     * So, for example, submitting a form to a permanently redirected resource may continue smoothly.
     */
    HttpStatusCode[HttpStatusCode["PermanentRedirect"] = 308] = "PermanentRedirect";
    // **********************************************************************************************************
    // 400s - Client / User messed up
    // **********************************************************************************************************
    /**
     * The server cannot or will not process the request due to an apparent client error
     * (e.g., malformed request syntax, too large size, invalid request message framing, or deceptive request routing).
     */
    HttpStatusCode[HttpStatusCode["BadRequest"] = 400] = "BadRequest";
    /**
     * Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet
     * been provided. The response must include a WWW-Authenticate header field containing a challenge applicable to the
     * requested resource. See Basic access authentication and Digest access authentication. 401 semantically means
     * "unauthenticated",i.e. the user does not have the necessary credentials.
     */
    HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
    /**
     * Reserved for future use. The original intention was that this code might be used as part of some form of digital
     * cash or micro payment scheme, but that has not happened, and this code is not usually used.
     * Google Developers API uses this status if a particular developer has exceeded the daily limit on requests.
     */
    HttpStatusCode[HttpStatusCode["PaymentRequired"] = 402] = "PaymentRequired";
    /**
     * The request was valid, but the server is refusing action.
     * The user might not have the necessary permissions for a resource.
     */
    HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
    /**
     * The requested resource could not be found but may be available in the future.
     * Subsequent requests by the client are permissible.
     */
    HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
    /**
     * A request method is not supported for the requested resource;
     * for example, a GET request on a form that requires data to be presented via POST, or a PUT request on a read-only resource.
     */
    HttpStatusCode[HttpStatusCode["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    /**
     * The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.
     */
    HttpStatusCode[HttpStatusCode["NotAcceptable"] = 406] = "NotAcceptable";
    /**
     * The client must first authenticate itself with the proxy.
     */
    HttpStatusCode[HttpStatusCode["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    /**
     * The server timed out waiting for the request.
     * According to HTTP specifications:
     * "The client did not produce a request within the time that the server was prepared to wait. The client MAY repeat the request without modifications at any later time."
     */
    HttpStatusCode[HttpStatusCode["RequestTimeout"] = 408] = "RequestTimeout";
    /**
     * Indicates that the request could not be processed because of conflict in the request,
     * such as an edit conflict between multiple simultaneous updates.
     */
    HttpStatusCode[HttpStatusCode["Conflict"] = 409] = "Conflict";
    /**
     * Indicates that the resource requested is no longer available and will not be available again.
     * This should be used when a resource has been intentionally removed and the resource should be purged.
     * Upon receiving a 410 status code, the client should not request the resource in the future.
     * Clients such as search engines should remove the resource from their indices.
     * Most use cases do not require clients and search engines to purge the resource, and a "404 Not Found" may be used instead.
     */
    HttpStatusCode[HttpStatusCode["Gone"] = 410] = "Gone";
    /**
     * The request did not specify the length of its content, which is required by the requested resource.
     */
    HttpStatusCode[HttpStatusCode["LengthRequired"] = 411] = "LengthRequired";
    /**
     * The server does not meet one of the preconditions that the requester put on the request.
     */
    HttpStatusCode[HttpStatusCode["PreconditionFailed"] = 412] = "PreconditionFailed";
    /**
     * The request is larger than the server is willing or able to process. Previously called "Request Entity Too Large".
     */
    HttpStatusCode[HttpStatusCode["PayloadTooLarge"] = 413] = "PayloadTooLarge";
    /**
     * The URI provided was too long for the server to process. Often the result of too much data being encoded as a query-string of a GET request,
     * in which case it should be converted to a POST request.
     * Called "Request-URI Too Long" previously.
     */
    HttpStatusCode[HttpStatusCode["UriTooLong"] = 414] = "UriTooLong";
    /**
     * The request entity has a media type which the server or resource does not support.
     * For example, the client uploads an image as image/svg+xml, but the server requires that images use a different format.
     */
    HttpStatusCode[HttpStatusCode["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
    /**
     * The client has asked for a portion of the file (byte serving), but the server cannot supply that portion.
     * For example, if the client asked for a part of the file that lies beyond the end of the file.
     * Called "Requested Range Not Satisfiable" previously.
     */
    HttpStatusCode[HttpStatusCode["RangeNotSatisfiable"] = 416] = "RangeNotSatisfiable";
    /**
     * The server cannot meet the requirements of the Expect request-header field.
     */
    HttpStatusCode[HttpStatusCode["ExpectationFailed"] = 417] = "ExpectationFailed";
    /**
     * This code was defined in 1998 as one of the traditional IETF April Fools' jokes, in RFC 2324, Hyper Text Coffee Pot Control Protocol,
     * and is not expected to be implemented by actual HTTP servers. The RFC specifies this code should be returned by
     * teapots requested to brew coffee. This HTTP status is used as an Easter egg in some websites, including Google.com.
     */
    HttpStatusCode[HttpStatusCode["IAmATeapot"] = 418] = "IAmATeapot";
    /**
     * The request was directed at a server that is not able to produce a response (for example because a connection reuse).
     */
    HttpStatusCode[HttpStatusCode["MisdirectedRequest"] = 421] = "MisdirectedRequest";
    /**
     * The request was well-formed but was unable to be followed due to semantic errors.
     */
    HttpStatusCode[HttpStatusCode["UnprocessableEntity"] = 422] = "UnprocessableEntity";
    /**
     * The resource that is being accessed is locked.
     */
    HttpStatusCode[HttpStatusCode["Locked"] = 423] = "Locked";
    /**
     * The request failed due to failure of a previous request (e.g., a PROPPATCH).
     */
    HttpStatusCode[HttpStatusCode["FailedDependency"] = 424] = "FailedDependency";
    /**
     * The client should switch to a different protocol such as TLS/1.0, given in the Upgrade header field.
     */
    HttpStatusCode[HttpStatusCode["UpgradeRequired"] = 426] = "UpgradeRequired";
    /**
     * The origin server requires the request to be conditional.
     * Intended to prevent "the 'lost update' problem, where a client
     * GETs a resource's state, modifies it, and PUTs it back to the server,
     * when meanwhile a third party has modified the state on the server, leading to a conflict."
     */
    HttpStatusCode[HttpStatusCode["PreconditionRequired"] = 428] = "PreconditionRequired";
    /**
     * The user has sent too many requests in a given amount of time. Intended for use with rate-limiting schemes.
     */
    HttpStatusCode[HttpStatusCode["TooManyRequests"] = 429] = "TooManyRequests";
    /**
     * The server is unwilling to process the request because either an individual header field,
     * or all the header fields collectively, are too large.
     */
    HttpStatusCode[HttpStatusCode["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
    /**
     * A server operator has received a legal demand to deny access to a resource or to a set of resources
     * that includes the requested resource. The code 451 was chosen as a reference to the novel Fahrenheit 451.
     */
    HttpStatusCode[HttpStatusCode["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
    // **********************************************************************************************************
    // 500s - Server messed up
    // **********************************************************************************************************
    /**
     * A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.
     */
    HttpStatusCode[HttpStatusCode["InternalServerError"] = 500] = "InternalServerError";
    /**
     * The server either does not recognize the request method, or it lacks the ability to fulfill the request.
     * Usually this implies future availability (e.g., a new feature of a web-service API).
     */
    HttpStatusCode[HttpStatusCode["NotImplemented"] = 501] = "NotImplemented";
    /**
     * The server was acting as a gateway or proxy and received an invalid response from the upstream server.
     */
    HttpStatusCode[HttpStatusCode["BadGateway"] = 502] = "BadGateway";
    /**
     * The server is currently unavailable (because it is overloaded or down for maintenance).
     * Generally, this is a temporary state.
     */
    HttpStatusCode[HttpStatusCode["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    /**
     * The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.
     */
    HttpStatusCode[HttpStatusCode["GatewayTimeout"] = 504] = "GatewayTimeout";
    /**
     * The server does not support the HTTP protocol version used in the request
     */
    HttpStatusCode[HttpStatusCode["HttpVersionNotSupported"] = 505] = "HttpVersionNotSupported";
    /**
     * Transparent content negotiation for the request results in a circular reference.
     */
    HttpStatusCode[HttpStatusCode["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
    /**
     * The server is unable to store the representation needed to complete the request.
     */
    HttpStatusCode[HttpStatusCode["InsufficientStorage"] = 507] = "InsufficientStorage";
    /**
     * The server detected an infinite loop while processing the request.
     */
    HttpStatusCode[HttpStatusCode["LoopDetected"] = 508] = "LoopDetected";
    /**
     * Further extensions to the request are required for the server to fulfill it.
     */
    HttpStatusCode[HttpStatusCode["NotExtended"] = 510] = "NotExtended";
    /**
     * The client needs to authenticate to gain network access.
     * Intended for use by intercepting proxies used to control access to the network (e.g., "captive portals" used
     * to require agreement to Terms of Service before granting full Internet access via a Wi-Fi hotspot).
     */
    HttpStatusCode[HttpStatusCode["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(HttpStatusCode || (HttpStatusCode = {}));

;// ../../libs/common/src/enums/integration-type.enum.ts
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var IntegrationType;
(function (IntegrationType) {
    IntegrationType["Integration"] = "integration";
    IntegrationType["SDK"] = "sdk";
    IntegrationType["SSO"] = "sso";
    IntegrationType["SCIM"] = "scim";
    IntegrationType["BWDC"] = "bwdc";
    IntegrationType["EVENT"] = "event";
    IntegrationType["DEVICE"] = "device";
})(IntegrationType || (IntegrationType = {}));

;// ../../libs/common/src/enums/native-messaging-version.enum.ts
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var NativeMessagingVersion;
(function (NativeMessagingVersion) {
    NativeMessagingVersion[NativeMessagingVersion["One"] = 1] = "One";
    NativeMessagingVersion[NativeMessagingVersion["Latest"] = 1] = "Latest";
})(NativeMessagingVersion || (NativeMessagingVersion = {}));

;// ../../libs/common/src/enums/notification-type.enum.ts
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["SyncCipherUpdate"] = 0] = "SyncCipherUpdate";
    NotificationType[NotificationType["SyncCipherCreate"] = 1] = "SyncCipherCreate";
    NotificationType[NotificationType["SyncLoginDelete"] = 2] = "SyncLoginDelete";
    NotificationType[NotificationType["SyncFolderDelete"] = 3] = "SyncFolderDelete";
    NotificationType[NotificationType["SyncCiphers"] = 4] = "SyncCiphers";
    NotificationType[NotificationType["SyncVault"] = 5] = "SyncVault";
    NotificationType[NotificationType["SyncOrgKeys"] = 6] = "SyncOrgKeys";
    NotificationType[NotificationType["SyncFolderCreate"] = 7] = "SyncFolderCreate";
    NotificationType[NotificationType["SyncFolderUpdate"] = 8] = "SyncFolderUpdate";
    NotificationType[NotificationType["SyncCipherDelete"] = 9] = "SyncCipherDelete";
    NotificationType[NotificationType["SyncSettings"] = 10] = "SyncSettings";
    NotificationType[NotificationType["LogOut"] = 11] = "LogOut";
    NotificationType[NotificationType["SyncSendCreate"] = 12] = "SyncSendCreate";
    NotificationType[NotificationType["SyncSendUpdate"] = 13] = "SyncSendUpdate";
    NotificationType[NotificationType["SyncSendDelete"] = 14] = "SyncSendDelete";
    NotificationType[NotificationType["AuthRequest"] = 15] = "AuthRequest";
    NotificationType[NotificationType["AuthRequestResponse"] = 16] = "AuthRequestResponse";
    NotificationType[NotificationType["SyncOrganizations"] = 17] = "SyncOrganizations";
    NotificationType[NotificationType["SyncOrganizationStatusChanged"] = 18] = "SyncOrganizationStatusChanged";
    NotificationType[NotificationType["SyncOrganizationCollectionSettingChanged"] = 19] = "SyncOrganizationCollectionSettingChanged";
    NotificationType[NotificationType["Notification"] = 20] = "Notification";
    NotificationType[NotificationType["NotificationStatus"] = 21] = "NotificationStatus";
    NotificationType[NotificationType["RefreshSecurityTasks"] = 22] = "RefreshSecurityTasks";
    NotificationType[NotificationType["OrganizationBankAccountVerified"] = 23] = "OrganizationBankAccountVerified";
    NotificationType[NotificationType["ProviderBankAccountVerified"] = 24] = "ProviderBankAccountVerified";
    NotificationType[NotificationType["SyncPolicy"] = 25] = "SyncPolicy";
    NotificationType[NotificationType["AutoConfirmMember"] = 26] = "AutoConfirmMember";
})(NotificationType || (NotificationType = {}));

;// ../../libs/common/src/enums/push-notification-logout-reason.enum.ts
const PushNotificationLogOutReasonType = Object.freeze({
    KdfChange: 0,
});

;// ../../libs/common/src/enums/index.ts










;// ../../libs/platform/src/services/browser-service.ts
function isBrowserSafariApi() {
    return (navigator.userAgent.indexOf(" Safari/") !== -1 &&
        navigator.userAgent.indexOf(" Chrome/") === -1 &&
        navigator.userAgent.indexOf(" Chromium/") === -1);
}

;// ../../libs/common/src/platform/scheduling/task-scheduler.service.ts
// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore

/**
 * Creates a RXJS scheduler based on a {@link TaskSchedulerService}.
 *
 * @description This API defers to `TaskSchedulerService` to schedule a task to be ran
 * in the future but the task that is ran is NOT the remainder of your RXJS pipeline. The
 * task you want ran must instead be registered in a location reachable on a service worker
 * startup (on browser). An example of an acceptible location is the constructor of a service
 * you know is created in `MainBackground`. Uses of this API in other clients _can_ have the
 * `registerTaskHandler` call in more places, but in order to have it work across clients
 * it is recommended to register it according to the rules of browser.
 *
 * @link https://rxjs.dev/guide/scheduler#using-schedulers
 *
 * @example
 * ```ts
 * class MyService {
 *   constructor(messageListener: MessageListener, taskScheduler: TaskSchedulerService) {
 *    // VERY IMPORTANT!
 *    this.taskSchedulerService.registerTaskHandler(SchedulerTaskNames.myTaskName, async () => {
 *      await this.runEvent();
 *    });
 *
 *     messageListener.messages$(MY_MESSAGE).pipe(
 *        debounceTime(
 *          10 * 1000,
 *          toScheduler(taskScheduler, ShedulerTaskNames.myTaskName),
 *        ),
 *        switchMap(() => this.runEvent()),
 *     )
 *   }
 * }
 * ```
 *
 * @param taskScheduler The task scheduler service to use to shedule RXJS work.
 * @param taskName The name of the task that the handler should be registered and scheduled based on.
 * @returns A SchedulerLike object that can be passed in to RXJS operators like `delay` and `timeout`.
 */
function toScheduler(taskScheduler, taskName) {
    return new TaskSchedulerSheduler(taskScheduler, taskName);
}
class TaskSchedulerSheduler {
    constructor(taskSchedulerService, taskName) {
        this.taskSchedulerService = taskSchedulerService;
        this.taskName = taskName;
    }
    schedule(work, delay, state) {
        return this.taskSchedulerService.setTimeout(this.taskName, delay !== null && delay !== void 0 ? delay : 0);
    }
    now() {
        return asyncScheduler.now();
    }
}
class TaskSchedulerService {
}

;// ../../libs/common/src/platform/scheduling/default-task-scheduler.service.ts
var default_task_scheduler_service_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


class DefaultTaskSchedulerService extends TaskSchedulerService {
    constructor(logService) {
        super();
        this.logService = logService;
        this.taskHandlers = new Map();
    }
    /**
     * Sets a timeout and returns the timeout id.
     *
     * @param taskName - The name of the task. Unused in the base implementation.
     * @param delayInMs - The delay in milliseconds.
     */
    setTimeout(taskName, delayInMs) {
        this.validateRegisteredTask(taskName);
        const timeoutHandle = globalThis.setTimeout(() => this.triggerTask(taskName), delayInMs);
        return new Subscription(() => globalThis.clearTimeout(timeoutHandle));
    }
    /**
     * Sets an interval and returns the interval id.
     *
     * @param taskName - The name of the task. Unused in the base implementation.
     * @param intervalInMs - The interval in milliseconds.
     * @param _initialDelayInMs - The initial delay in milliseconds. Unused in the base implementation.
     */
    setInterval(taskName, intervalInMs, _initialDelayInMs) {
        this.validateRegisteredTask(taskName);
        const intervalHandle = globalThis.setInterval(() => this.triggerTask(taskName), intervalInMs);
        return new Subscription(() => globalThis.clearInterval(intervalHandle));
    }
    /**
     * Registers a task handler.
     *
     * @param taskName - The name of the task.
     * @param handler - The task handler.
     */
    registerTaskHandler(taskName, handler) {
        const existingHandler = this.taskHandlers.get(taskName);
        if (existingHandler) {
            this.logService.warning(`Task handler for ${taskName} already exists. Overwriting.`);
            this.unregisterTaskHandler(taskName);
        }
        this.taskHandlers.set(taskName, handler);
    }
    /**
     * Unregisters a task handler.
     *
     * @param taskName - The name of the task.
     */
    unregisterTaskHandler(taskName) {
        this.taskHandlers.delete(taskName);
    }
    /**
     * Triggers a task.
     *
     * @param taskName - The name of the task.
     * @param _periodInMinutes - The period in minutes. Unused in the base implementation.
     */
    triggerTask(taskName, _periodInMinutes) {
        return default_task_scheduler_service_awaiter(this, void 0, void 0, function* () {
            const handler = this.taskHandlers.get(taskName);
            if (handler) {
                handler();
            }
        });
    }
    /**
     * Validates that a task handler is registered.
     *
     * @param taskName - The name of the task.
     */
    validateRegisteredTask(taskName) {
        if (!this.taskHandlers.has(taskName)) {
            throw new Error(`Task handler for ${taskName} not registered. Unable to schedule task.`);
        }
    }
}

;// ../../libs/common/src/platform/scheduling/scheduled-task-name.enum.ts
const scheduled_task_name_enum_ScheduledTaskNames = {
    generatePasswordClearClipboardTimeout: "generatePasswordClearClipboardTimeout",
    systemClearClipboardTimeout: "systemClearClipboardTimeout",
    loginStrategySessionTimeout: "loginStrategySessionTimeout",
    notificationsReconnectTimeout: "notificationsReconnectTimeout",
    fido2ClientAbortTimeout: "fido2ClientAbortTimeout",
    scheduleNextSyncInterval: "scheduleNextSyncInterval",
    eventUploadsInterval: "eventUploadsInterval",
    vaultTimeoutCheckInterval: "vaultTimeoutCheckInterval",
    clearPopupViewCache: "clearPopupViewCache",
    phishingDomainUpdate: "phishingDomainUpdate",
};

;// ../../libs/common/src/platform/scheduling/index.ts




;// ../../libs/platform/src/background-sync/background-sync.service.ts

/**
 * The default interval between background syncs.
 * 300,000ms = 5 minutes
 */
const DEFAULT_SYNC_INTERVAL_MS = 300000;
/**
 * Service responsible for registering and managing background synchronization for the browser extension.
 * Handles scheduling of periodic sync operations using the task scheduler infrastructure.
 */
class BackgroundSyncService {
    /**
     * Creates a new instance of BackgroundSyncService.
     * @param taskSchedulerService - Service that handles scheduling and execution of periodic tasks
     */
    constructor(taskSchedulerService) {
        this.taskSchedulerService = taskSchedulerService;
    }
    /**
     * Registers a callback function to be executed when the sync interval task is triggered.
     * This associates the sync task name with the provided callback in the task scheduler.
     *
     * @param syncCallback - The function to execute when the sync task is triggered
     */
    register(syncCallback) {
        this.taskSchedulerService.registerTaskHandler(ScheduledTaskNames.scheduleNextSyncInterval, syncCallback);
    }
    /**
     * Initializes the background sync service by scheduling the sync interval task.
     * This sets up a recurring timer that triggers the registered sync callback at regular intervals.
     *
     * @param intervalMs - The interval in milliseconds between sync operations (defaults to 300000ms/5 minutes)
     */
    init(intervalMs = DEFAULT_SYNC_INTERVAL_MS) {
        intervalMs = intervalMs < 1 ? DEFAULT_SYNC_INTERVAL_MS : intervalMs;
        this.taskSchedulerService.setInterval(ScheduledTaskNames.scheduleNextSyncInterval, intervalMs);
    }
}

;// ../../libs/platform/src/background-sync/index.ts


;// ../../libs/platform/src/util.ts
function toURL(input) {
    if (input instanceof URL) {
        return input;
    }
    try {
        return new URL(input);
    }
    catch (_a) {
        return null;
    }
}
function effectiveOrigin(url) {
    // The URL spec returns "null" for .origin on non-special schemes
    // (e.g. chrome-extension://) so we build the origin from protocol + host instead.
    // An empty host means no meaningful origin can be compared (file:, data:, etc.).
    if (!url.host) {
        return null;
    }
    return `${url.protocol}//${url.host}`;
}
/**
 * Compares two URLs to determine whether the suspect URL originates from the
 * same host as the canonical URL.
 *
 * Both arguments accept either a string or an existing {@link URL} object.
 *
 * Returns `false` when:
 * - Either argument cannot be parsed as a valid URL
 * - Either URL has no host (e.g. `file:`, `data:` schemes), since URLs without
 *   a meaningful host cannot be distinguished by origin
 *
 * @param canonical - The reference URL whose origin acts as the baseline.
 * @param suspect - The URL being tested against the canonical origin.
 * @returns `true` if both URLs share the same scheme, host, and port; `false` otherwise.
 */
function urlOriginsMatch(canonical, suspect) {
    const canonicalUrl = toURL(canonical);
    const suspectUrl = toURL(suspect);
    if (!canonicalUrl || !suspectUrl) {
        return false;
    }
    const canonicalOrigin = effectiveOrigin(canonicalUrl);
    const suspectOrigin = effectiveOrigin(suspectUrl);
    // Safari sends the extension GUID in uppercase while the canonical URL is lowercase,
    // Normalize both to lowercase and trim trailing slashes to avoid browser specific issues.
    const normalizedCanonicalOrigin = canonicalOrigin === null || canonicalOrigin === void 0 ? void 0 : canonicalOrigin.replace(/\/$/, "").toLowerCase();
    const normalizedSuspectOrigin = suspectOrigin === null || suspectOrigin === void 0 ? void 0 : suspectOrigin.replace(/\/$/, "").toLowerCase();
    if (!normalizedCanonicalOrigin || !normalizedSuspectOrigin) {
        return false;
    }
    return normalizedCanonicalOrigin === normalizedSuspectOrigin;
}

;// ../../libs/platform/src/index.ts




;// ./src/browser/safariApp.ts

class SafariApp {
    static sendMessageToApp(command, data = null, resolveNow = false) {
        if (!BrowserApi.isSafariApi) {
            return Promise.resolve(null);
        }
        return new Promise((resolve) => {
            const now = new Date();
            const messageId = now.getTime().toString() + "_" + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            browser.runtime.sendNativeMessage("com.bitwarden.desktop", {
                id: messageId,
                command: command,
                data: data,
                responseData: null,
            }, (response) => {
                resolve(response);
            });
        });
    }
}

;// ../../libs/logging/src/log-level.ts
// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warning"] = 2] = "Warning";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel || (LogLevel = {}));

;// ../../libs/logging/src/console-log.service.ts

class ConsoleLogService {
    constructor(isDev, filter = null) {
        this.isDev = isDev;
        this.filter = filter;
        this.timersMap = new Map();
    }
    debug(message, ...optionalParams) {
        if (!this.isDev) {
            return;
        }
        this.write(LogLevel.Debug, message, ...optionalParams);
    }
    info(message, ...optionalParams) {
        this.write(LogLevel.Info, message, ...optionalParams);
    }
    warning(message, ...optionalParams) {
        this.write(LogLevel.Warning, message, ...optionalParams);
    }
    error(message, ...optionalParams) {
        this.write(LogLevel.Error, message, ...optionalParams);
    }
    write(level, message, ...optionalParams) {
        if (this.filter != null && this.filter(level)) {
            return;
        }
        switch (level) {
            case LogLevel.Debug:
                // eslint-disable-next-line
                console.log(message, ...optionalParams);
                break;
            case LogLevel.Info:
                // eslint-disable-next-line
                console.log(message, ...optionalParams);
                break;
            case LogLevel.Warning:
                // eslint-disable-next-line
                console.warn(message, ...optionalParams);
                break;
            case LogLevel.Error:
                // eslint-disable-next-line
                console.error(message, ...optionalParams);
                break;
            default:
                break;
        }
    }
    measure(start, trackGroup, track, name, properties) {
        const measureName = `[${track}]: ${name}`;
        const measure = performance.measure(measureName, {
            start: start,
            detail: {
                devtools: {
                    dataType: "track-entry",
                    track,
                    trackGroup,
                    properties,
                },
            },
        });
        this.info(`${measureName} took ${measure.duration}`, properties);
        return measure;
    }
    mark(name) {
        const mark = performance.mark(name, {
            detail: {
                devtools: {
                    dataType: "marker",
                },
            },
        });
        this.info(mark.name, new Date().toISOString());
        return mark;
    }
}

;// ../../libs/logging/src/index.ts




;// ../../libs/common/src/platform/services/console-log.service.ts


;// ./src/platform/services/browser-clipboard.service.ts
var browser_clipboard_service_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

class BrowserClipboardService {
    /**
     * Copies the given text to the user's clipboard.
     *
     * @param globalContext - The global window context.
     * @param text - The text to copy.
     */
    static copy(globalContext, text) {
        return browser_clipboard_service_awaiter(this, void 0, void 0, function* () {
            if (!BrowserClipboardService.isClipboardApiSupported(globalContext, "writeText")) {
                this.useLegacyCopyMethod(globalContext, text);
                return;
            }
            try {
                yield globalContext.navigator.clipboard.writeText(text);
            }
            catch (error) {
                BrowserClipboardService.consoleLogService.debug(`Error copying to clipboard using the clipboard API, attempting legacy method: ${error}`);
                this.useLegacyCopyMethod(globalContext, text);
            }
        });
    }
    /**
     * Reads the user's clipboard and returns the text.
     *
     * @param globalContext - The global window context.
     */
    static read(globalContext) {
        return browser_clipboard_service_awaiter(this, void 0, void 0, function* () {
            if (!BrowserClipboardService.isClipboardApiSupported(globalContext, "readText")) {
                return this.useLegacyReadMethod(globalContext);
            }
            try {
                return yield globalContext.navigator.clipboard.readText();
            }
            catch (error) {
                BrowserClipboardService.consoleLogService.debug(`Error reading from clipboard using the clipboard API, attempting legacy method: ${error}`);
                return this.useLegacyReadMethod(globalContext);
            }
        });
    }
    /**
     * Copies the given text to the user's clipboard using the legacy `execCommand` method. This
     * method is used as a fallback when the clipboard API is not supported or fails.
     *
     * @param globalContext - The global window context.
     * @param text - The text to copy.
     */
    static useLegacyCopyMethod(globalContext, text) {
        if (!BrowserClipboardService.isLegacyClipboardMethodSupported(globalContext, "copy")) {
            BrowserClipboardService.consoleLogService.warning("Legacy copy method not supported");
            return;
        }
        const textareaElement = globalContext.document.createElement("textarea");
        textareaElement.textContent = !text ? " " : text;
        textareaElement.style.position = "fixed";
        globalContext.document.body.appendChild(textareaElement);
        textareaElement.select();
        try {
            globalContext.document.execCommand("copy");
        }
        catch (error) {
            BrowserClipboardService.consoleLogService.warning(`Error writing to clipboard: ${error}`);
        }
        finally {
            globalContext.document.body.removeChild(textareaElement);
        }
    }
    /**
     * Reads the user's clipboard using the legacy `execCommand` method. This method is used as a
     * fallback when the clipboard API is not supported or fails.
     *
     * @param globalContext - The global window context.
     */
    static useLegacyReadMethod(globalContext) {
        if (!BrowserClipboardService.isLegacyClipboardMethodSupported(globalContext, "paste")) {
            BrowserClipboardService.consoleLogService.warning("Legacy paste method not supported");
            return "";
        }
        const textareaElement = globalContext.document.createElement("textarea");
        textareaElement.style.position = "fixed";
        globalContext.document.body.appendChild(textareaElement);
        textareaElement.focus();
        try {
            return globalContext.document.execCommand("paste") ? textareaElement.value : "";
        }
        catch (error) {
            BrowserClipboardService.consoleLogService.warning(`Error reading from clipboard: ${error}`);
        }
        finally {
            globalContext.document.body.removeChild(textareaElement);
        }
        return "";
    }
    /**
     * Checks if the clipboard API is supported in the current environment.
     *
     * @param globalContext - The global window context.
     * @param method - The clipboard API method to check for support.
     */
    static isClipboardApiSupported(globalContext, method) {
        return "clipboard" in globalContext.navigator && method in globalContext.navigator.clipboard;
    }
    /**
     * Checks if the legacy clipboard method is supported in the current environment.
     *
     * @param globalContext - The global window context.
     * @param method - The legacy clipboard method to check for support.
     */
    static isLegacyClipboardMethodSupported(globalContext, method) {
        return ("queryCommandSupported" in globalContext.document &&
            globalContext.document.queryCommandSupported(method));
    }
}
BrowserClipboardService.consoleLogService = new ConsoleLogService(false);
/* harmony default export */ var browser_clipboard_service = (BrowserClipboardService);

;// ./src/platform/services/platform-utils/browser-platform-utils.service.ts
var browser_platform_utils_service_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore





class BrowserPlatformUtilsService {
    constructor(clipboardWriteCallback, globalContext, offscreenDocumentService) {
        this.clipboardWriteCallback = clipboardWriteCallback;
        this.globalContext = globalContext;
        this.offscreenDocumentService = offscreenDocumentService;
    }
    static getDevice(globalContext) {
        if (this.deviceCache) {
            return this.deviceCache;
        }
        // ORDERING MATTERS HERE
        // Ordered from most specific to least specific. We try to discern the greatest detail
        // for the type of extension the user is on by checking specific cases first and as we go down
        // the list we hope to catch all by the most generic clients they could be on.
        if (BrowserPlatformUtilsService.isFirefox()) {
            this.deviceCache = DeviceType.FirefoxExtension;
        }
        else if (BrowserPlatformUtilsService.isOpera(globalContext)) {
            this.deviceCache = DeviceType.OperaExtension;
        }
        else if (BrowserPlatformUtilsService.isEdge()) {
            this.deviceCache = DeviceType.EdgeExtension;
        }
        else if (BrowserPlatformUtilsService.isVivaldi()) {
            this.deviceCache = DeviceType.VivaldiExtension;
        }
        else if (BrowserPlatformUtilsService.isChrome(globalContext)) {
            this.deviceCache = DeviceType.ChromeExtension;
        }
        else if (BrowserPlatformUtilsService.isSafari(globalContext)) {
            this.deviceCache = DeviceType.SafariExtension;
        }
        return this.deviceCache;
    }
    getDevice() {
        return BrowserPlatformUtilsService.getDevice(this.globalContext);
    }
    getDeviceString() {
        const device = DeviceType[this.getDevice()].toLowerCase();
        return device.replace("extension", "");
    }
    getClientType() {
        return ClientType.Browser;
    }
    static isFirefox() {
        return (navigator.userAgent.indexOf(" Firefox/") !== -1 ||
            navigator.userAgent.indexOf(" Gecko/") !== -1);
    }
    isFirefox() {
        return this.getDevice() === DeviceType.FirefoxExtension;
    }
    static isChrome(globalContext) {
        return globalContext.chrome && navigator.userAgent.indexOf(" Chrome/") !== -1;
    }
    isChrome() {
        return this.getDevice() === DeviceType.ChromeExtension;
    }
    static isEdge() {
        return navigator.userAgent.indexOf(" Edg/") !== -1;
    }
    isEdge() {
        return this.getDevice() === DeviceType.EdgeExtension;
    }
    static isOpera(globalContext) {
        var _a;
        return (!!((_a = globalContext.opr) === null || _a === void 0 ? void 0 : _a.addons) ||
            !!globalContext.opera ||
            navigator.userAgent.indexOf(" OPR/") >= 0);
    }
    isOpera() {
        return this.getDevice() === DeviceType.OperaExtension;
    }
    static isVivaldi() {
        return navigator.userAgent.indexOf(" Vivaldi/") !== -1;
    }
    isVivaldi() {
        return this.getDevice() === DeviceType.VivaldiExtension;
    }
    static isSafari(globalContext) {
        // Opera masquerades as Safari, so make sure we're not there first
        return (!BrowserPlatformUtilsService.isOpera(globalContext) &&
            navigator.userAgent.indexOf(" Safari/") !== -1);
    }
    static safariVersion() {
        var _a;
        return (_a = navigator.userAgent.match("Version/([0-9.]*)")) === null || _a === void 0 ? void 0 : _a[1];
    }
    isSafari() {
        return this.getDevice() === DeviceType.SafariExtension;
    }
    isChromium() {
        return this.isChrome() || this.isEdge() || this.isOpera() || this.isVivaldi();
    }
    /**
     * Safari previous to version 16.1 had a bug which caused artifacts on hover in large extension popups.
     * https://bugs.webkit.org/show_bug.cgi?id=218704
     */
    static shouldApplySafariHeightFix(globalContext) {
        var _a;
        if (BrowserPlatformUtilsService.getDevice(globalContext) !== DeviceType.SafariExtension) {
            return false;
        }
        const version = BrowserPlatformUtilsService.safariVersion();
        const parts = (_a = version === null || version === void 0 ? void 0 : version.split(".")) === null || _a === void 0 ? void 0 : _a.map((v) => Number(v));
        return (parts === null || parts === void 0 ? void 0 : parts[0]) < 16 || ((parts === null || parts === void 0 ? void 0 : parts[0]) === 16 && (parts === null || parts === void 0 ? void 0 : parts[1]) === 0);
    }
    isIE() {
        return false;
    }
    isMacAppStore() {
        return false;
    }
    /**
     * Identifies if the vault popup is currently open. This is done by sending a
     * message to the popup and waiting for a response. If a response is received,
     * the view is open.
     */
    isPopupOpen() {
        return browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
            if (this.isSafari()) {
                // Query views on safari since chrome.runtime.sendMessage does not timeout and will hang.
                return BrowserApi.isPopupOpen();
            }
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ command: "checkVaultPopupHeartbeat" }, (response) => {
                    if (chrome.runtime.lastError != null) {
                        // This error means that nothing was there to listen to the message,
                        // meaning the view is not open.
                        if (chrome.runtime.lastError.message ===
                            "Could not establish connection. Receiving end does not exist.") {
                            resolve(false);
                            return;
                        }
                        // All unhandled errors still reject
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve(Boolean(response));
                });
            });
        });
    }
    lockTimeout() {
        return null;
    }
    launchUri(uri, options) {
        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        BrowserApi.createNewTab(uri, options && options.extensionPage === true);
    }
    getApplicationVersion() {
        var _a;
        const manifest = chrome.runtime.getManifest();
        return Promise.resolve((_a = manifest.version_name) !== null && _a !== void 0 ? _a : manifest.version);
    }
    getApplicationVersionNumber() {
        const manifest = chrome.runtime.getManifest();
        return Promise.resolve(manifest.version.split(RegExp("[+|-]"))[0].trim());
    }
    supportsWebAuthn(win) {
        return typeof PublicKeyCredential !== "undefined";
    }
    supportsDuo() {
        return true;
    }
    supportsAutofill() {
        return true;
    }
    supportsFileDownloads() {
        return false;
    }
    isDev() {
        return "production" === "development";
    }
    isSelfHost() {
        return false;
    }
    /**
     * Copies the passed text to the clipboard. For Safari, this will use
     * the native messaging API to send the text to the Bitwarden app. If
     * the extension is using manifest v3, the offscreen document API will
     * be used to copy the text to the clipboard. Otherwise, the browser's
     * clipboard API will be used.
     *
     * @param text - The text to copy to the clipboard.
     * @param options - Options for the clipboard operation.
     */
    copyToClipboard(text, options) {
        const windowContext = (options === null || options === void 0 ? void 0 : options.window) || this.globalContext;
        const clearing = Boolean(options === null || options === void 0 ? void 0 : options.clearing);
        const clearMs = (options === null || options === void 0 ? void 0 : options.clearMs) || null;
        const handleClipboardWriteCallback = () => {
            if (!clearing && this.clipboardWriteCallback != null) {
                this.clipboardWriteCallback(text, clearMs);
            }
        };
        if (this.isSafari()) {
            void SafariApp.sendMessageToApp("copyToClipboard", text).then(handleClipboardWriteCallback);
            return;
        }
        if (this.isChrome() && text === "") {
            text = "\u0000";
        }
        if (BrowserApi.isManifestVersion(3) && this.offscreenDocumentService.offscreenApiSupported()) {
            void this.triggerOffscreenCopyToClipboard(text).then(handleClipboardWriteCallback);
            return;
        }
        void browser_clipboard_service.copy(windowContext, text).then(handleClipboardWriteCallback);
    }
    /**
     * Reads the text from the clipboard. For Safari, this will use the
     * native messaging API to request the text from the Bitwarden app. If
     * the extension is using manifest v3, the offscreen document API will
     * be used to read the text from the clipboard. Otherwise, the browser's
     * clipboard API will be used.
     *
     * @param options - Options for the clipboard operation.
     */
    readFromClipboard(options) {
        return browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
            const windowContext = (options === null || options === void 0 ? void 0 : options.window) || this.globalContext;
            if (this.isSafari()) {
                return yield SafariApp.sendMessageToApp("readFromClipboard");
            }
            if (BrowserApi.isManifestVersion(3) && this.offscreenDocumentService.offscreenApiSupported()) {
                return yield this.triggerOffscreenReadFromClipboard();
            }
            return yield browser_clipboard_service.read(windowContext);
        });
    }
    supportsSecureStorage() {
        return false;
    }
    getAutofillKeyboardShortcut() {
        return browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
            let autofillCommand;
            // You can not change the command in Safari or obtain it programmatically
            if (this.isSafari()) {
                autofillCommand = "Cmd+Shift+L";
            }
            else if (this.isFirefox()) {
                autofillCommand = (yield browser.commands.getAll()).find((c) => c.name === ExtensionCommand.AutofillLogin).shortcut;
                // Firefox is returning Ctrl instead of Cmd for the modifier key on macOS if
                // the command is the default one set on installation.
                if ((yield browser.runtime.getPlatformInfo()).os === "mac" &&
                    autofillCommand === "Ctrl+Shift+L") {
                    autofillCommand = "Cmd+Shift+L";
                }
            }
            else {
                yield new Promise((resolve) => chrome.commands.getAll((c) => resolve((autofillCommand = c.find((c) => c.name === ExtensionCommand.AutofillLogin).shortcut))));
            }
            return autofillCommand;
        });
    }
    packageType() {
        return browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
            switch (this.getDevice()) {
                case DeviceType.ChromeExtension:
                    return "Chrome Extension";
                case DeviceType.FirefoxExtension:
                    return "Firefox Extension";
                case DeviceType.OperaExtension:
                    return "Opera Extension";
                case DeviceType.EdgeExtension:
                    return "Edge Extension";
                case DeviceType.VivaldiExtension:
                    return "Vivaldi Extension";
                case DeviceType.SafariExtension:
                    return "Safari Extension";
                default:
                    return "Unknown Browser Extension";
            }
        });
    }
    /**
     * Triggers the offscreen document API to copy the text to the clipboard.
     */
    triggerOffscreenCopyToClipboard(text) {
        return browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
            yield this.offscreenDocumentService.withDocument([chrome.offscreen.Reason.CLIPBOARD], "Write text to the clipboard.", () => browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
                yield BrowserApi.sendMessageWithResponse("offscreenCopyToClipboard", { text });
            }));
        });
    }
    /**
     * Triggers the offscreen document API to read the text from the clipboard.
     */
    triggerOffscreenReadFromClipboard() {
        return browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
            const response = yield this.offscreenDocumentService.withDocument([chrome.offscreen.Reason.CLIPBOARD], "Read text from the clipboard.", () => browser_platform_utils_service_awaiter(this, void 0, void 0, function* () {
                return yield BrowserApi.sendMessageWithResponse("offscreenReadFromClipboard");
            }));
            if (typeof response === "string") {
                return response;
            }
            return "";
        });
    }
}
BrowserPlatformUtilsService.deviceCache = null;

;// ./src/platform/browser/browser-api.register-content-scripts-polyfill.ts
var browser_api_register_content_scripts_polyfill_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
/**
 * MIT License
 *
 * Copyright (c) Federico Brigante <me@fregante.com> (https://fregante.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @see https://github.com/fregante/content-scripts-register-polyfill
 * @version 4.0.2
 */


let registerContentScripts;
function registerContentScriptsPolyfill(contentScriptOptions, callback) {
    return browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () {
        if (!registerContentScripts) {
            registerContentScripts = buildRegisterContentScriptsPolyfill();
        }
        return registerContentScripts(contentScriptOptions, callback);
    });
}
function buildRegisterContentScriptsPolyfill() {
    var _a, _b;
    const logService = new ConsoleLogService(false);
    const chromeProxy = globalThis.chrome && NestedProxy(globalThis.chrome);
    const patternValidationRegex = /^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:/;
    const isFirefox = (_a = globalThis.navigator) === null || _a === void 0 ? void 0 : _a.userAgent.includes("Firefox/");
    const gotScripting = Boolean((_b = globalThis.chrome) === null || _b === void 0 ? void 0 : _b.scripting);
    const gotNavigation = typeof chrome === "object" && "webNavigation" in chrome;
    function NestedProxy(target) {
        return new Proxy(target, {
            get(target, prop) {
                if (!target[prop]) {
                    return;
                }
                if (typeof target[prop] !== "function") {
                    return NestedProxy(target[prop]);
                }
                return (...arguments_) => new Promise((resolve, reject) => {
                    target[prop](...arguments_, (result) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        }
                        else {
                            resolve(result);
                        }
                    });
                });
            },
        });
    }
    function assertValidPattern(matchPattern) {
        if (!isValidPattern(matchPattern)) {
            throw new Error(`${matchPattern} is an invalid pattern, it must match ${String(patternValidationRegex)}`);
        }
    }
    function isValidPattern(matchPattern) {
        return matchPattern === "<all_urls>" || patternValidationRegex.test(matchPattern);
    }
    function getRawPatternRegex(matchPattern) {
        assertValidPattern(matchPattern);
        let [, protocol, host = "", pathname] = matchPattern.split(/(^[^:]+:[/][/])([^/]+)?/);
        protocol = protocol
            .replace("*", isFirefox ? "(https?|wss?)" : "https?")
            .replaceAll(/[/]/g, "[/]");
        if (host === "*") {
            host = "[^/]+";
        }
        else if (host) {
            host = host
                .replace(/^[*][.]/, "([^/]+.)*")
                .replaceAll(/[.]/g, "[.]")
                .replace(/[*]$/, "[^.]+");
        }
        pathname = pathname
            .replaceAll(/[/]/g, "[/]")
            .replaceAll(/[.]/g, "[.]")
            .replaceAll(/[*]/g, ".*");
        return "^" + protocol + host + "(" + pathname + ")?$";
    }
    function patternToRegex(...matchPatterns) {
        if (matchPatterns.length === 0) {
            return /$./;
        }
        if (matchPatterns.includes("<all_urls>")) {
            // <all_urls> regex
            return /^(https?|file|ftp):[/]+/;
        }
        if (matchPatterns.includes("*://*/*")) {
            // all stars regex
            return isFirefox ? /^(https?|wss?):[/][/][^/]+([/].*)?$/ : /^https?:[/][/][^/]+([/].*)?$/;
        }
        return new RegExp(matchPatterns.map((x) => getRawPatternRegex(x)).join("|"));
    }
    function castAllFramesTarget(target) {
        if (typeof target === "object") {
            return Object.assign(Object.assign({}, target), { allFrames: false });
        }
        return {
            tabId: target,
            frameId: undefined,
            allFrames: true,
        };
    }
    function castArray(possibleArray) {
        if (Array.isArray(possibleArray)) {
            return possibleArray;
        }
        return [possibleArray];
    }
    function createTarget(tabId, frameId, allFrames) {
        if (frameId === undefined) {
            return {
                tabId,
                frameIds: undefined,
                allFrames: allFrames,
            };
        }
        else {
            return {
                tabId,
                frameIds: [frameId],
                allFrames: undefined,
            };
        }
    }
    function insertCSS(_a) {
        return browser_api_register_content_scripts_polyfill_awaiter(this, arguments, void 0, function* ({ tabId, frameId, files, allFrames, matchAboutBlank, runAt, }, { ignoreTargetErrors } = {}) {
            const everyInsertion = Promise.all(files.map((content) => browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () {
                if (typeof content === "string") {
                    content = { file: content };
                }
                if (gotScripting) {
                    if ("file" in content) {
                        return chrome.scripting.insertCSS({
                            target: createTarget(tabId, frameId, allFrames),
                            files: [content.file],
                        });
                    }
                    else {
                        return chrome.scripting.insertCSS({
                            target: createTarget(tabId, frameId, allFrames),
                            css: content.code,
                        });
                    }
                }
                return chromeProxy.tabs.insertCSS(tabId, Object.assign(Object.assign({}, content), { matchAboutBlank,
                    allFrames,
                    frameId, runAt: runAt !== null && runAt !== void 0 ? runAt : "document_start" }));
            })));
            if (ignoreTargetErrors) {
                yield catchTargetInjectionErrors(everyInsertion);
            }
            else {
                yield everyInsertion;
            }
        });
    }
    function assertNoCode(files) {
        if (files.some((content) => "code" in content)) {
            throw new Error("chrome.scripting does not support injecting strings of `code`");
        }
    }
    function executeScript(_a) {
        return browser_api_register_content_scripts_polyfill_awaiter(this, arguments, void 0, function* ({ tabId, frameId, files, allFrames, matchAboutBlank, runAt, }, { ignoreTargetErrors } = {}) {
            const normalizedFiles = files.map((file) => (typeof file === "string" ? { file } : file));
            if (gotScripting) {
                assertNoCode(normalizedFiles);
                const injection = chrome.scripting.executeScript({
                    target: createTarget(tabId, frameId, allFrames),
                    files: normalizedFiles.map(({ file }) => file),
                });
                if (ignoreTargetErrors) {
                    yield catchTargetInjectionErrors(injection);
                }
                else {
                    yield injection;
                }
                return;
            }
            const executions = [];
            for (const content of normalizedFiles) {
                if ("code" in content) {
                    yield executions.at(-1);
                }
                executions.push(chromeProxy.tabs.executeScript(tabId, Object.assign(Object.assign({}, content), { matchAboutBlank,
                    allFrames,
                    frameId,
                    runAt })));
            }
            if (ignoreTargetErrors) {
                yield catchTargetInjectionErrors(Promise.all(executions));
            }
            else {
                yield Promise.all(executions);
            }
        });
    }
    function injectContentScript(where_1, scripts_1) {
        return browser_api_register_content_scripts_polyfill_awaiter(this, arguments, void 0, function* (where, scripts, options = {}) {
            const targets = castArray(where);
            yield Promise.all(targets.map((target) => browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () { return injectContentScriptInSpecificTarget(castAllFramesTarget(target), scripts, options); })));
        });
    }
    function injectContentScriptInSpecificTarget(_a, scripts_1) {
        return browser_api_register_content_scripts_polyfill_awaiter(this, arguments, void 0, function* ({ frameId, tabId, allFrames }, scripts, options = {}) {
            const injections = castArray(scripts).flatMap((script) => {
                var _a, _b, _c, _d, _e, _f;
                return [
                    insertCSS({
                        tabId,
                        frameId,
                        allFrames,
                        files: (_a = script.css) !== null && _a !== void 0 ? _a : [],
                        matchAboutBlank: (_b = script.matchAboutBlank) !== null && _b !== void 0 ? _b : script.match_about_blank,
                        runAt: (_c = script.runAt) !== null && _c !== void 0 ? _c : script.run_at,
                    }, options),
                    executeScript({
                        tabId,
                        frameId,
                        allFrames,
                        files: (_d = script.js) !== null && _d !== void 0 ? _d : [],
                        matchAboutBlank: (_e = script.matchAboutBlank) !== null && _e !== void 0 ? _e : script.match_about_blank,
                        runAt: (_f = script.runAt) !== null && _f !== void 0 ? _f : script.run_at,
                    }, options),
                ];
            });
            yield Promise.all(injections);
        });
    }
    function catchTargetInjectionErrors(promise) {
        return browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () {
            try {
                yield promise;
            }
            catch (error) {
                const targetErrors = /^No frame with id \d+ in tab \d+.$|^No tab with id: \d+.$|^The tab was closed.$|^The frame was removed.$/;
                if (!targetErrors.test(error === null || error === void 0 ? void 0 : error.message)) {
                    throw error;
                }
            }
        });
    }
    function isOriginPermitted(url) {
        return browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () {
            return chromeProxy.permissions.contains({
                origins: [new URL(url).origin + "/*"],
            });
        });
    }
    return (contentScriptOptions, callback) => browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () {
        const { js = [], css = [], matchAboutBlank, matches = [], excludeMatches, runAt, } = contentScriptOptions;
        let { allFrames } = contentScriptOptions;
        if (gotNavigation) {
            allFrames = false;
        }
        else if (allFrames) {
            logService.warning("`allFrames: true` requires the `webNavigation` permission to work correctly: https://github.com/fregante/content-scripts-register-polyfill#permissions");
        }
        if (matches.length === 0) {
            throw new Error("Type error for parameter contentScriptOptions (Error processing matches: Array requires at least 1 items; you have 0) for contentScripts.register.");
        }
        yield Promise.all(matches.map((pattern) => browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () {
            if (!(yield chromeProxy.permissions.contains({ origins: [pattern] }))) {
                throw new Error(`Permission denied to register a content script for ${pattern}`);
            }
        })));
        const matchesRegex = patternToRegex(...matches);
        const excludeMatchesRegex = patternToRegex(...(excludeMatches !== null && excludeMatches !== void 0 ? excludeMatches : []));
        const inject = (url_1, tabId_1, ...args_1) => browser_api_register_content_scripts_polyfill_awaiter(this, [url_1, tabId_1, ...args_1], void 0, function* (url, tabId, frameId = 0) {
            if (!matchesRegex.test(url) ||
                excludeMatchesRegex.test(url) ||
                !(yield isOriginPermitted(url))) {
                return;
            }
            yield injectContentScript({ tabId, frameId }, { css, js, matchAboutBlank, runAt }, { ignoreTargetErrors: true });
        });
        const tabListener = (tabId_1, _a, _b) => browser_api_register_content_scripts_polyfill_awaiter(this, [tabId_1, _a, _b], void 0, function* (tabId, { status }, { url }) {
            if (status === "loading" && url) {
                void inject(url, tabId);
            }
        });
        const navListener = (_a) => browser_api_register_content_scripts_polyfill_awaiter(this, [_a], void 0, function* ({ tabId, frameId, url, }) {
            void inject(url, tabId, frameId);
        });
        if (gotNavigation) {
            BrowserApi.addListener(chrome.webNavigation.onCommitted, navListener);
        }
        else {
            BrowserApi.addListener(chrome.tabs.onUpdated, tabListener);
        }
        const registeredContentScript = {
            unregister() {
                return browser_api_register_content_scripts_polyfill_awaiter(this, void 0, void 0, function* () {
                    if (gotNavigation) {
                        chrome.webNavigation.onCommitted.removeListener(navListener);
                    }
                    else {
                        chrome.tabs.onUpdated.removeListener(tabListener);
                    }
                });
            },
        };
        if (typeof callback === "function") {
            callback(registeredContentScript);
        }
        return registeredContentScript;
    });
}

;// ./src/platform/browser/browser-api.ts
var browser_api_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore






class BrowserApi {
    static get manifestVersion() {
        return chrome.runtime.getManifest().manifest_version;
    }
    /**
     * Determines if the extension manifest version is the given version.
     *
     * @param expectedVersion - The expected manifest version to check against.
     */
    static isManifestVersion(expectedVersion) {
        return BrowserApi.manifestVersion === expectedVersion;
    }
    /**
     * Returns `true` if the message sender appears to originate from within this extension.
     *
     * Returns `false` when:
     * - `sender` is absent or has no `origin` property
     * - The extension's own URL cannot be determined at runtime
     * - The sender's origin does not match the extension's origin (compared by scheme, host, and port;
     *   senders without a host such as `file:` or `data:` URLs are always rejected)
     * - The message comes from a sub-frame rather than the top-level frame
     *
     * Note: this is a best-effort check that relies on the browser correctly populating `sender.origin`.
     *
     * @param sender - The message sender to validate. `undefined` or a sender without `origin` returns `false`.
     * @param logger - Optional logger; rejections are reported at `warning` level, acceptance at `info`.
     * @returns `true` if the sender appears to be internal to the extension; `false` otherwise.
     */
    static senderIsInternal(sender, logger) {
        var _a;
        if (!(sender === null || sender === void 0 ? void 0 : sender.origin)) {
            logger === null || logger === void 0 ? void 0 : logger.warning("[BrowserApi] Message sender has no origin");
            return false;
        }
        // Empty path yields the extension's base URL; coalesce to empty string so the guard below fires on a missing runtime.
        const extensionUrl = (_a = BrowserApi.getRuntimeURL("")) !== null && _a !== void 0 ? _a : "";
        if (!extensionUrl) {
            logger === null || logger === void 0 ? void 0 : logger.warning("[BrowserApi] Unable to determine extension URL");
            return false;
        }
        if (!urlOriginsMatch(extensionUrl, sender.origin)) {
            logger === null || logger === void 0 ? void 0 : logger.warning(`[BrowserApi] Message sender origin (${sender.origin}) does not match extension URL (${extensionUrl})`);
            return false;
        }
        // frameId is absent for popups, so use an 'in' check rather than direct comparison.
        if ("frameId" in sender && sender.frameId !== 0) {
            logger === null || logger === void 0 ? void 0 : logger.warning("[BrowserApi] Message sender is not from the top-level frame");
            return false;
        }
        logger === null || logger === void 0 ? void 0 : logger.info("[BrowserApi] Message sender appears to be internal");
        return true;
    }
    /**
     * Gets all open browser windows, including their tabs.
     *
     * @returns A promise that resolves to an array of browser windows.
     */
    static getWindows() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.windows.getAll({ populate: true }, resolve));
        });
    }
    /**
     * Gets the current window or the window with the given id.
     *
     * @param windowId - The id of the window to get. If not provided, the current window is returned.
     */
    static getWindow(windowId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            if (!windowId) {
                return BrowserApi.getCurrentWindow();
            }
            return yield BrowserApi.getWindowById(windowId);
        });
    }
    /**
     * Gets the currently active browser window.
     */
    static getCurrentWindow() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.windows.getCurrent({ populate: true }, resolve));
        });
    }
    /**
     * Gets the window with the given id.
     *
     * @param windowId - The id of the window to get.
     */
    static getWindowById(windowId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.windows.get(windowId, { populate: true }, resolve));
        });
    }
    static createWindow(options) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                chrome.windows.create(options, (newWindow) => browser_api_awaiter(this, void 0, void 0, function* () {
                    if (!BrowserApi.isSafariApi) {
                        return resolve(newWindow);
                    }
                    // Safari doesn't close the default extension popup when a new window is created so we need to
                    // manually trigger the close by focusing the main window after the new window is created
                    const allWindows = yield new Promise((resolve) => {
                        chrome.windows.getAll({ windowTypes: ["normal"] }, (windows) => resolve(windows));
                    });
                    const mainWindow = allWindows.find((window) => window.id !== newWindow.id);
                    // No main window found, resolve the new window
                    if (mainWindow == null || !mainWindow.id) {
                        return resolve(newWindow);
                    }
                    // Focus the main window to close the extension popup
                    chrome.windows.update(mainWindow.id, { focused: true }, () => {
                        // Refocus the newly created window
                        chrome.windows.update(newWindow.id, { focused: true }, () => {
                            resolve(newWindow);
                        });
                    });
                }));
            });
        });
    }
    /**
     * Removes the window with the given id.
     *
     * @param windowId - The id of the window to remove.
     */
    static removeWindow(windowId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.windows.remove(windowId, () => resolve()));
        });
    }
    /**
     * Updates the properties of the window with the given id.
     *
     * @param windowId - The id of the window to update.
     * @param options - The window properties to update.
     */
    static updateWindowProperties(windowId, options) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.windows.update(windowId, options, () => {
                resolve();
            }));
        });
    }
    /**
     * Focuses the window with the given id.
     *
     * @param windowId - The id of the window to focus.
     */
    static focusWindow(windowId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            yield BrowserApi.updateWindowProperties(windowId, { focused: true });
        });
    }
    static getTabFromCurrentWindowId() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return yield BrowserApi.tabsQueryFirstCurrentWindowForSafari({
                active: true,
                windowId: chrome.windows.WINDOW_ID_CURRENT,
            });
        });
    }
    static getBrowserClientVendor(clientWindow) {
        const device = BrowserPlatformUtilsService.getDevice(clientWindow);
        switch (device) {
            case DeviceType.ChromeExtension:
            case DeviceType.ChromeBrowser:
                return BrowserClientVendors.Chrome;
            case DeviceType.OperaExtension:
            case DeviceType.OperaBrowser:
                return BrowserClientVendors.Opera;
            case DeviceType.EdgeExtension:
            case DeviceType.EdgeBrowser:
                return BrowserClientVendors.Edge;
            case DeviceType.VivaldiExtension:
            case DeviceType.VivaldiBrowser:
                return BrowserClientVendors.Vivaldi;
            default:
                return BrowserClientVendors.Unknown;
        }
    }
    /**
     * Gets the tab with the given id.
     *
     * @param tabId - The id of the tab to get.
     */
    static getTab(tabId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            if (!tabId) {
                return null;
            }
            if (BrowserApi.isManifestVersion(3)) {
                return yield chrome.tabs.get(tabId);
            }
            return new Promise((resolve) => chrome.tabs.get(tabId, (tab) => {
                resolve(tab);
            }));
        });
    }
    static getTabFromCurrentWindow() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return yield BrowserApi.tabsQueryFirstCurrentWindowForSafari({
                active: true,
                currentWindow: true,
            });
        });
    }
    static getActiveTabs() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return yield BrowserApi.tabsQuery({
                active: true,
            });
        });
    }
    /**
     * Fetch the currently open browser tab
     */
    static getCurrentTab() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            if (BrowserApi.isManifestVersion(3)) {
                return yield chrome.tabs.getCurrent();
            }
            return new Promise((resolve) => chrome.tabs.getCurrent((tab) => {
                resolve(tab);
            }));
        });
    }
    /**
     * Closes a browser tab with the given id
     *
     * @param tabId The id of the tab to close
     */
    static closeTab(tabId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            if (tabId) {
                if (BrowserApi.isWebExtensionsApi) {
                    yield browser.tabs.remove(tabId).catch((error) => {
                        throw new Error("[BrowserApi] Failed to remove current tab: " + error.message);
                    });
                }
                else if (BrowserApi.isChromeApi) {
                    yield chrome.tabs.remove(tabId).catch((error) => {
                        throw new Error("[BrowserApi] Failed to remove current tab: " + error.message);
                    });
                }
            }
        });
    }
    /**
     * Navigates a browser tab to the given URL
     *
     * @param tabId The id of the tab to navigate
     * @param url The URL to navigate to
     */
    static navigateTabToUrl(tabId, url) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            if (tabId) {
                if (BrowserApi.isWebExtensionsApi) {
                    yield browser.tabs.update(tabId, { url: url.href }).catch((error) => {
                        throw new Error("Failed to navigate tab to URL: " + error.message);
                    });
                }
                else if (BrowserApi.isChromeApi) {
                    chrome.tabs.update(tabId, { url: url.href }, () => {
                        if (chrome.runtime.lastError) {
                            throw new Error("Failed to navigate tab to URL: " + chrome.runtime.lastError.message);
                        }
                    });
                }
            }
        });
    }
    static tabsQuery(options) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                chrome.tabs.query(options, (tabs) => {
                    resolve(tabs);
                });
            });
        });
    }
    static tabsQueryFirst(options) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            const tabs = yield BrowserApi.tabsQuery(options);
            if (tabs.length > 0) {
                return tabs[0];
            }
            return null;
        });
    }
    /**
     * Drop-in replacement for {@link BrowserApi.tabsQueryFirst}.
     *
     * Safari sometimes returns >1 tabs unexpectedly even when
     * specifying a `windowId` or `currentWindow: true` query option.
     *
     * For all of these calls,
     * ```
     * await chrome.tabs.query({active: true, currentWindow: true})
     * await chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT})
     * await chrome.tabs.query({active: true, windowId: 10})
     * ```
     *
     * Safari could return:
     * ```
     * [
     *   {windowId: 2, pinned: true, title: "Incorrect tab in another window", …},
     *   {windowId: 10, title: "Correct tab in foreground", …},
     * ]
     * ```
     *
     * This function captures the current window ID manually before running the query,
     * then finds and returns the tab with the matching window ID.
     *
     * See the `SafariTabsQuery` tests in `browser-api.spec.ts`.
     *
     * This workaround can be removed when Safari fixes this bug.
     */
    static tabsQueryFirstCurrentWindowForSafari(options) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!BrowserApi.isSafariApi) {
                return yield BrowserApi.tabsQueryFirst(options);
            }
            const currentWindowId = (yield BrowserApi.getCurrentWindow()).id;
            const tabs = yield BrowserApi.tabsQuery(options);
            if (tabs.length <= 1 || currentWindowId == null) {
                return tabs[0];
            }
            return (_a = tabs.find((t) => t.windowId === currentWindowId)) !== null && _a !== void 0 ? _a : tabs[0];
        });
    }
    static tabSendMessageData(tab, command, data = null) {
        const obj = {
            command: command,
        };
        if (data != null) {
            obj.data = data;
        }
        return BrowserApi.tabSendMessage(tab, obj);
    }
    static tabSendMessage(tab_1, obj_1) {
        return browser_api_awaiter(this, arguments, void 0, function* (tab, obj, options = null, rejectOnError = false) {
            if (!tab || !tab.id) {
                return;
            }
            return new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, obj, options, (response) => {
                    if (chrome.runtime.lastError && rejectOnError) {
                        // Some error happened
                        reject();
                    }
                    resolve(response);
                });
            });
        });
    }
    static sendTabsMessage(tabId, message, options, responseCallback) {
        chrome.tabs.sendMessage(tabId, message, options, responseCallback);
    }
    static getRuntimeURL(path) {
        if (BrowserApi.isWebExtensionsApi) {
            return browser.runtime.getURL(path);
        }
        else if (BrowserApi.isChromeApi) {
            return chrome.runtime.getURL(path);
        }
    }
    static onWindowCreated(callback) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            // FIXME: Make sure that is does not cause a memory leak in Safari or use BrowserApi.AddListener
            // and test that it doesn't break.
            // eslint-disable-next-line no-restricted-syntax
            return chrome.windows.onCreated.addListener(callback);
        });
    }
    /**
     * Gets the background page for the extension. This method is
     * not valid within manifest v3 background service workers. As
     * a result, it will return null when called from that context.
     */
    static getBackgroundPage() {
        if (typeof chrome.extension.getBackgroundPage === "undefined") {
            return null;
        }
        return chrome.extension.getBackgroundPage();
    }
    /**
     * Accepts a window object and determines if it is
     * associated with the background page of the extension.
     *
     * @param window - The window to check.
     */
    static isBackgroundPage(window) {
        return typeof window !== "undefined" && window === BrowserApi.getBackgroundPage();
    }
    /**
     * Gets the extension views that match the given properties. This method is not
     * available within background service worker. As a result, it will return an
     * empty array when called from that context.
     *
     * @param fetchProperties - The properties used to filter extension views.
     */
    static getExtensionViews(fetchProperties) {
        if (typeof chrome.extension.getViews === "undefined") {
            return [];
        }
        return chrome.extension.getViews(fetchProperties);
    }
    /**
     * Queries all extension views that are of type `popup`
     * and returns whether any are currently open.
     */
    static isPopupOpen() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(BrowserApi.getExtensionViews({ type: "popup" }).length > 0);
        });
    }
    static createNewTab(url, active = true) {
        return new Promise((resolve) => chrome.tabs.create({ url: url, active: active }, (tab) => resolve(tab)));
    }
    /**
     * Gathers the details for a specified sub-frame of a tab.
     *
     * @param details - The details of the frame to get.
     */
    static getFrameDetails(details) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.webNavigation.getFrame(details, resolve));
        });
    }
    /**
     * Gets all frames associated with a tab.
     *
     * @param tabId - The id of the tab to get the frames for.
     */
    static getAllFrameDetails(tabId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.webNavigation.getAllFrames({ tabId }, resolve));
        });
    }
    static messageListener(name, callback) {
        BrowserApi.addListener(chrome.runtime.onMessage, callback);
    }
    static messageListener$() {
        return new Observable((subscriber) => {
            const handler = (message) => {
                subscriber.next(message);
            };
            BrowserApi.addListener(chrome.runtime.onMessage, handler);
            return () => BrowserApi.removeListener(chrome.runtime.onMessage, handler);
        });
    }
    static storageChangeListener(callback) {
        BrowserApi.addListener(chrome.storage.onChanged, callback);
    }
    /**
     * Adds a callback to the given chrome event in a cross-browser platform manner.
     *
     * **Important:** All event listeners in the browser extension popup context must
     * use this instead of the native APIs to handle unsubscribing from Safari properly.
     *
     * @param event - The event in which to add the listener to.
     * @param callback - The callback you want registered onto the event.
     */
    static addListener(event, callback) {
        event.addListener(callback);
        if (BrowserApi.isSafariApi && !BrowserApi.isBackgroundPage(self)) {
            BrowserApi.trackedChromeEventListeners.push([event, callback]);
            BrowserApi.setupUnloadListeners();
        }
    }
    /**
     * Removes a callback from the given chrome event in a cross-browser platform manner.
     * @param event - The event in which to remove the listener from.
     * @param callback - The callback you want removed from the event.
     */
    // Chrome's Event.removeListener expects callback args as `any[]` to align with its internal event typings.
    static removeListener(event, callback) {
        event.removeListener(callback);
        if (BrowserApi.isSafariApi && !BrowserApi.isBackgroundPage(self)) {
            const index = BrowserApi.trackedChromeEventListeners.findIndex(([_event, eventListener]) => {
                return eventListener == callback;
            });
            if (index !== -1) {
                BrowserApi.trackedChromeEventListeners.splice(index, 1);
            }
        }
    }
    // Setup the event to destroy all the listeners when the popup gets unloaded in Safari, otherwise we get a memory leak
    static setupUnloadListeners() {
        // The MDN recommend using 'visibilitychange' but that event is fired any time the popup window is obscured as well
        // 'pagehide' works just like 'unload' but is compatible with the back/forward cache, so we prefer using that one
        self.addEventListener("pagehide", () => {
            for (const [event, callback] of BrowserApi.trackedChromeEventListeners) {
                event.removeListener(callback);
            }
        });
    }
    static sendMessage(subscriber, arg = {}) {
        const message = Object.assign({}, { command: subscriber }, arg);
        return chrome.runtime.sendMessage(message);
    }
    static sendMessageWithResponse(subscriber, arg = {}) {
        const message = Object.assign({}, { command: subscriber }, arg);
        return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
    }
    static focusTab(tabId) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            chrome.tabs.update(tabId, { active: true, highlighted: true });
        });
    }
    static closePopup(win) {
        if (BrowserApi.isWebExtensionsApi && BrowserApi.isFirefoxOnAndroid) {
            // Reactivating the active tab dismisses the popup tab. The promise final
            // condition is only called if the popup wasn't already dismissed (future proofing).
            // ref: https://bugzilla.mozilla.org/show_bug.cgi?id=1433604
            // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            browser.tabs.update({ active: true }).finally(win.close);
        }
        else {
            win.close();
        }
    }
    static gaFilter() {
        return "production" !== "production";
    }
    static getUILanguage() {
        return chrome.i18n.getUILanguage();
    }
    /**
     * Handles reloading the extension using the underlying functionality exposed by the browser API.
     */
    static reloadExtension() {
        // If we do `chrome.runtime.reload` on safari they will send an onInstalled reason of install
        // and that prompts us to show a new tab, this apparently doesn't happen on sideloaded
        // extensions and only shows itself production scenarios. See: https://bitwarden.atlassian.net/browse/PM-12298
        if (this.isSafariApi) {
            return self.location.reload();
        }
        return chrome.runtime.reload();
    }
    /**
     * Reloads all open extension views, except the background page. Will also
     * skip reloading the current window location if exemptCurrentHref is true.
     *
     * @param exemptCurrentHref - Whether to exempt the current window location from the reload.
     */
    static reloadOpenWindows(exemptCurrentHref = false) {
        const views = BrowserApi.getExtensionViews();
        if (!views.length) {
            return;
        }
        const currentHref = self.location.href;
        views
            .filter((w) => w.location.href != null && !w.location.href.includes("background.html"))
            .filter((w) => !exemptCurrentHref || w.location.href !== currentHref)
            .forEach((w) => w.location.reload());
    }
    static connectNative(application) {
        if (BrowserApi.isWebExtensionsApi) {
            return browser.runtime.connectNative(application);
        }
        else if (BrowserApi.isChromeApi) {
            return chrome.runtime.connectNative(application);
        }
    }
    static requestPermission(permission) {
        if (BrowserApi.isWebExtensionsApi) {
            return browser.permissions.request(permission);
        }
        return new Promise((resolve) => {
            chrome.permissions.request(permission, resolve);
        });
    }
    /**
     * Checks if the user has provided the given permissions to the extension.
     *
     * @param permissions - The permissions to check.
     */
    static permissionsGranted(permissions) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => chrome.permissions.contains({ permissions }, (result) => resolve(result)));
        });
    }
    static getPlatformInfo() {
        if (BrowserApi.isWebExtensionsApi) {
            return browser.runtime.getPlatformInfo();
        }
        return new Promise((resolve) => {
            chrome.runtime.getPlatformInfo(resolve);
        });
    }
    /**
     * Returns the supported BrowserAction API based on the manifest version.
     */
    static getBrowserAction() {
        return BrowserApi.isManifestVersion(3) ? chrome.action : chrome.browserAction;
    }
    static getSidebarAction(win) {
        var _a;
        const deviceType = BrowserPlatformUtilsService.getDevice(win);
        if (deviceType === DeviceType.FirefoxExtension) {
            return browser.sidebarAction;
        }
        if (deviceType === DeviceType.OperaExtension) {
            return (_a = win.opr) === null || _a === void 0 ? void 0 : _a.sidebarAction;
        }
        return null;
    }
    static captureVisibleTab() {
        return new Promise((resolve) => {
            chrome.tabs.captureVisibleTab(null, { format: "png" }, resolve);
        });
    }
    /**
     * Extension API helper method used to execute a script in a tab.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/tabs/#method-executeScript
     * @param tabId - The id of the tab to execute the script in.
     * @param details {@link "InjectDetails" https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extensionTypes/InjectDetails}
     * @param scriptingApiDetails {@link "ExecutionWorld" https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/ExecutionWorld}
     */
    static executeScriptInTab(tabId, details, scriptingApiDetails) {
        if (BrowserApi.isManifestVersion(3)) {
            let target;
            if (typeof details.frameId === "number") {
                target = { tabId, frameIds: [details.frameId] };
            }
            else if (details.allFrames) {
                target = { tabId, allFrames: true };
            }
            else {
                target = { tabId };
            }
            return chrome.scripting.executeScript({
                target,
                files: details.file ? [details.file] : null,
                injectImmediately: details.runAt === "document_start",
                world: (scriptingApiDetails === null || scriptingApiDetails === void 0 ? void 0 : scriptingApiDetails.world) || chrome.scripting.ExecutionWorld.ISOLATED,
            });
        }
        return new Promise((resolve) => {
            chrome.tabs.executeScript(tabId, details, (result) => {
                resolve(result);
            });
        });
    }
    /**
     * Identifies if the browser autofill settings are overridden by the extension.
     */
    static browserAutofillSettingsOverridden() {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            if (!(yield BrowserApi.permissionsGranted(["privacy"]))) {
                return false;
            }
            const checkOverrideStatus = (details) => details.levelOfControl === "controlled_by_this_extension" && !details.value;
            const autofillAddressOverridden = yield new Promise((resolve) => chrome.privacy.services.autofillAddressEnabled.get({}, (details) => resolve(checkOverrideStatus(details))));
            const autofillCreditCardOverridden = yield new Promise((resolve) => chrome.privacy.services.autofillCreditCardEnabled.get({}, (details) => resolve(checkOverrideStatus(details))));
            const passwordSavingOverridden = yield new Promise((resolve) => chrome.privacy.services.passwordSavingEnabled.get({}, (details) => resolve(checkOverrideStatus(details))));
            return autofillAddressOverridden && autofillCreditCardOverridden && passwordSavingOverridden;
        });
    }
    /**
     * Updates the browser autofill settings to the given value.
     *
     * @param value - Determines whether to enable or disable the autofill settings.
     */
    static updateDefaultBrowserAutofillSettings(value) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            yield chrome.privacy.services.autofillAddressEnabled.set({ value });
            yield chrome.privacy.services.autofillCreditCardEnabled.set({ value });
            yield chrome.privacy.services.passwordSavingEnabled.set({ value });
        });
    }
    /**
     * Handles registration of static content scripts within manifest v2.
     *
     * @param contentScriptOptions - Details of the registered content scripts
     */
    static registerContentScriptsMv2(contentScriptOptions) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            var _a;
            if (typeof browser !== "undefined" && !!((_a = browser.contentScripts) === null || _a === void 0 ? void 0 : _a.register)) {
                return yield browser.contentScripts.register(contentScriptOptions);
            }
            return yield registerContentScriptsPolyfill(contentScriptOptions);
        });
    }
    /**
     * Handles registration of static content scripts within manifest v3.
     *
     * @param scripts - Details of the registered content scripts
     */
    static registerContentScriptsMv3(scripts) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            yield chrome.scripting.registerContentScripts(scripts);
        });
    }
    /**
     * Handles unregistering of static content scripts within manifest v3.
     *
     * @param filter - Optional filter to unregister content scripts. Passing an empty object will unregister all content scripts.
     */
    static unregisterContentScriptsMv3(filter) {
        return browser_api_awaiter(this, void 0, void 0, function* () {
            yield chrome.scripting.unregisterContentScripts(filter);
        });
    }
}
BrowserApi.isWebExtensionsApi = typeof browser !== "undefined";
BrowserApi.isSafariApi = isBrowserSafariApi();
BrowserApi.isChromeApi = !BrowserApi.isSafariApi && typeof chrome !== "undefined";
BrowserApi.isFirefoxOnAndroid = navigator.userAgent.indexOf("Firefox/") !== -1 && navigator.userAgent.indexOf("Android") !== -1;
// Keep track of all the events registered in a Safari popup so we can remove
// them when the popup gets unloaded, otherwise we cause a memory leak
BrowserApi.trackedChromeEventListeners = [];

;// ./src/autofill/enums/autofill-port.enum.ts
const autofill_port_enum_AutofillPort = {
    InjectedScript: "autofill-injected-script-port",
};


;// ./src/autofill/utils/index.ts
var utils_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

/**
 * Generates a random string of characters.
 *
 * @param length - The length of the random string to generate.
 */
function generateRandomChars(length) {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const randomChars = [];
    const randomBytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(randomBytes);
    for (let byteIndex = 0; byteIndex < randomBytes.length; byteIndex++) {
        const byte = randomBytes[byteIndex];
        randomChars.push(chars[byte % chars.length]);
    }
    return randomChars.join("");
}
/**
 * Polyfills the requestIdleCallback API with a setTimeout fallback.
 *
 * @param callback - The callback function to run when the browser is idle.
 * @param options - The options to pass to the requestIdleCallback function.
 */
function requestIdleCallbackPolyfill(callback, options) {
    if ("requestIdleCallback" in globalThis) {
        return globalThis.requestIdleCallback(() => callback(), options);
    }
    return globalThis.setTimeout(() => callback(), 1);
}
/**
 * Polyfills the cancelIdleCallback API with a clearTimeout fallback.
 *
 * @param id - The ID of the idle callback to cancel.
 */
function cancelIdleCallbackPolyfill(id) {
    if ("cancelIdleCallback" in globalThis) {
        return globalThis.cancelIdleCallback(id);
    }
    return globalThis.clearTimeout(id);
}
/**
 * Generates a random string of characters that formatted as a custom element name.
 */
function generateRandomCustomElementName() {
    const length = Math.floor(Math.random() * 5) + 8; // Between 8 and 12 characters
    const numHyphens = Math.min(Math.max(Math.floor(Math.random() * 4), 1), length - 1); // At least 1, maximum of 3 hyphens
    const hyphenIndices = [];
    while (hyphenIndices.length < numHyphens) {
        const index = Math.floor(Math.random() * (length - 1)) + 1;
        if (!hyphenIndices.includes(index)) {
            hyphenIndices.push(index);
        }
    }
    hyphenIndices.sort((a, b) => a - b);
    let randomString = "";
    let prevIndex = 0;
    for (let index = 0; index < hyphenIndices.length; index++) {
        const hyphenIndex = hyphenIndices[index];
        randomString = randomString + generateRandomChars(hyphenIndex - prevIndex) + "-";
        prevIndex = hyphenIndex;
    }
    randomString += generateRandomChars(length - prevIndex);
    return randomString;
}
/**
 * Builds a DOM element from an SVG string.
 *
 * @param svgString - The SVG string to build the DOM element from.
 * @param ariaHidden - Determines whether the SVG should be hidden from screen readers.
 */
function buildSvgDomElement(svgString, ariaHidden = true) {
    const domParser = new DOMParser();
    const svgDom = domParser.parseFromString(svgString, "image/svg+xml");
    const domElement = svgDom.documentElement;
    domElement.setAttribute("aria-hidden", `${ariaHidden}`);
    return domElement;
}
/**
 * Sends a message to the extension.
 *
 * @param command - The command to send.
 * @param options - The options to send with the command.
 */
function sendExtensionMessage(command_1) {
    return utils_awaiter(this, arguments, void 0, function* (command, options = {}) {
        if (typeof browser !== "undefined" &&
            typeof browser.runtime !== "undefined" &&
            typeof browser.runtime.sendMessage !== "undefined") {
            return browser.runtime.sendMessage(Object.assign({ command }, options));
        }
        return new Promise((resolve) => chrome.runtime.sendMessage(Object.assign({ command }, options), (response) => {
            if (chrome.runtime.lastError) {
                resolve(null);
            }
            resolve(response);
        }));
    });
}
/**
 * Sets CSS styles on an element.
 *
 * @param element - The element to set the styles on.
 * @param styles - The styles to set on the element.
 * @param priority - Determines whether the styles should be set as important.
 */
function setElementStyles(element, styles, priority) {
    if (!element || !styles || !Object.keys(styles).length) {
        return;
    }
    for (const styleProperty in styles) {
        const styleValue = styles[styleProperty];
        if (styleValue !== undefined) {
            element.style.setProperty(styleProperty.replace(/([a-z])([A-Z])/g, "$1-$2"), // Convert camelCase to kebab-case
            styleValue, priority ? "important" : undefined);
        }
    }
}
/**
 * Sets up a long-lived connection with the extension background
 * and triggers an onDisconnect event if the extension context
 * is invalidated.
 *
 * @param callback - Callback export function to run when the extension disconnects
 */
function setupExtensionDisconnectAction(callback) {
    const port = chrome.runtime.connect({ name: AutofillPort.InjectedScript });
    const onDisconnectCallback = (disconnectedPort) => {
        callback(disconnectedPort);
        port.onDisconnect.removeListener(onDisconnectCallback);
    };
    port.onDisconnect.addListener(onDisconnectCallback);
}
/**
 * Handles setup of the extension disconnect action for the autofill init class
 * in both instances where the overlay might or might not be initialized.
 *
 * @param windowContext - The global window context
 */
function setupAutofillInitDisconnectAction(windowContext) {
    const bitwardenAutofillInit = windowContext.bitwardenAutofillInit;
    if (!bitwardenAutofillInit) {
        return;
    }
    const onDisconnectCallback = () => {
        bitwardenAutofillInit.destroy();
        delete windowContext.bitwardenAutofillInit;
    };
    setupExtensionDisconnectAction(onDisconnectCallback);
}
/**
 * Identifies whether an element is a fillable form field.
 * This is determined by whether the element is a form field and not a span.
 *
 * @param formFieldElement - The form field element to check.
 */
function elementIsFillableFormField(formFieldElement) {
    return !elementIsSpanElement(formFieldElement);
}
/**
 * Identifies whether an element is an instance of a specific tag name.
 *
 * @param element - The element to check.
 * @param tagName -  The tag name to check against.
 */
function elementIsInstanceOf(element, tagName) {
    return nodeIsElement(element) && element.tagName.toLowerCase() === tagName;
}
/**
 * Identifies whether an element is a span element.
 *
 * @param element - The element to check.
 */
function elementIsSpanElement(element) {
    return elementIsInstanceOf(element, "span");
}
/**
 * Identifies whether an element is an input field.
 *
 * @param element - The element to check.
 */
function elementIsInputElement(element) {
    return elementIsInstanceOf(element, "input");
}
/**
 * Identifies whether an element is a select field.
 *
 * @param element - The element to check.
 */
function elementIsSelectElement(element) {
    return elementIsInstanceOf(element, "select");
}
/**
 * Identifies whether an element is a textarea field.
 *
 * @param element - The element to check.
 */
function elementIsTextAreaElement(element) {
    return elementIsInstanceOf(element, "textarea");
}
/**
 * Identifies whether an element is a form element.
 *
 * @param element - The element to check.
 */
function elementIsFormElement(element) {
    return elementIsInstanceOf(element, "form");
}
/**
 * Identifies whether an element is a label element.
 *
 * @param element - The element to check.
 */
function elementIsLabelElement(element) {
    return elementIsInstanceOf(element, "label");
}
/**
 * Identifies whether an element is a description details `dd` element.
 *
 * @param element - The element to check.
 */
function elementIsDescriptionDetailsElement(element) {
    return elementIsInstanceOf(element, "dd");
}
/**
 * Identifies whether an element is a description term `dt` element.
 *
 * @param element - The element to check.
 */
function elementIsDescriptionTermElement(element) {
    return elementIsInstanceOf(element, "dt");
}
/**
 * Identifies whether a node is an HTML element.
 *
 * @param node - The node to check.
 */
function nodeIsElement(node) {
    if (!node) {
        return false;
    }
    return (node === null || node === void 0 ? void 0 : node.nodeType) === Node.ELEMENT_NODE;
}
/**
 * Identifies whether a node is an input element.
 *
 * @param node - The node to check.
 */
function nodeIsInputElement(node) {
    return nodeIsElement(node) && elementIsInputElement(node);
}
/**
 * Identifies whether a node is a form element.
 *
 * @param node - The node to check.
 */
function nodeIsFormElement(node) {
    return nodeIsElement(node) && elementIsFormElement(node);
}
function nodeIsTypeSubmitElement(node) {
    return nodeIsElement(node) && getPropertyOrAttribute(node, "type") === "submit";
}
function nodeIsButtonElement(node) {
    return (nodeIsElement(node) &&
        (elementIsInstanceOf(node, "button") ||
            getPropertyOrAttribute(node, "type") === "button"));
}
function nodeIsAnchorElement(node) {
    return nodeIsElement(node) && elementIsInstanceOf(node, "a");
}
/**
 * Returns a boolean representing the attribute value of an element.
 *
 * @param element
 * @param attributeName
 * @param checkString
 */
function getAttributeBoolean(element, attributeName, checkString = false) {
    if (checkString) {
        return getPropertyOrAttribute(element, attributeName) === "true";
    }
    return Boolean(getPropertyOrAttribute(element, attributeName));
}
/**
 * Get the value of a property or attribute from a FormFieldElement.
 *
 * @param element
 * @param attributeName
 */
function getPropertyOrAttribute(element, attributeName) {
    var _a;
    if (attributeName in element) {
        return (_a = element[attributeName]) !== null && _a !== void 0 ? _a : null;
    }
    return element.getAttribute(attributeName);
}
/**
 * Throttles a callback function to run at most once every `limit` milliseconds.
 *
 * @param callback - The callback function to throttle (must return void).
 * @param limit - The time in milliseconds to throttle the callback.
 */
function throttle(callback, limit) {
    let waitingDelay = false;
    return function (...args) {
        if (waitingDelay) {
            return;
        }
        callback.apply(this, args);
        waitingDelay = true;
        globalThis.setTimeout(() => (waitingDelay = false), limit);
    };
}
/**
 * Debounces a callback function to run after a delay of `delay` milliseconds.
 *
 * @param callback - The callback function to debounce.
 * @param delay - The time in milliseconds to debounce the callback.
 * @param immediate - Determines whether the callback should run immediately.
 */
function debounce(callback, delay, immediate) {
    let timeout = null;
    return function (...args) {
        const callImmediately = !!immediate && !timeout;
        if (timeout) {
            globalThis.clearTimeout(timeout);
        }
        timeout = globalThis.setTimeout(() => {
            timeout = null;
            if (!callImmediately) {
                callback.apply(this, args);
            }
        }, delay);
        if (callImmediately) {
            callback.apply(this, args);
        }
    };
}
/**
 * Gathers and normalizes keywords from a potential submit button element. Used
 * to verify if the element submits a login or change password form.
 *
 * @param element - The element to gather keywords from.
 */
function getSubmitButtonKeywordsSet(element) {
    const keywords = [
        element.textContent,
        element.getAttribute("type"),
        element.getAttribute("value"),
        element.getAttribute("aria-label"),
        element.getAttribute("aria-labelledby"),
        element.getAttribute("aria-describedby"),
        element.getAttribute("title"),
        element.getAttribute("id"),
        element.getAttribute("name"),
        element.getAttribute("class"),
    ];
    const keywordsSet = new Set();
    for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        if (typeof keyword === "string") {
            // Iterate over all keywords metadata and split them by non-letter characters.
            // This ensures we check against individual words and not the entire string.
            keyword
                .toLowerCase()
                .replace(/[-\s]/g, "")
                .split(/[^\p{L}]+/gu)
                .forEach((splitKeyword) => {
                if (splitKeyword) {
                    keywordsSet.add(splitKeyword);
                }
            });
        }
    }
    return keywordsSet;
}
/**
 * Generates the origin and subdomain match patterns for the URL.
 *
 * @param url - The URL of the tab
 */
function generateDomainMatchPatterns(url) {
    try {
        const extensionUrlPattern = /^(chrome|chrome-extension|moz-extension|safari-web-extension):\/\/\/?/;
        if (extensionUrlPattern.test(url)) {
            return [];
        }
        // Add protocol to URL if it is missing to allow for parsing the hostname correctly
        const urlPattern = /^(https?|file):\/\/\/?/;
        if (!urlPattern.test(url)) {
            url = `https://${url}`;
        }
        let protocolGlob = "*://";
        if (url.startsWith("file:///")) {
            protocolGlob = "*:///"; // File URLs require three slashes to be a valid match pattern
        }
        const parsedUrl = new URL(url);
        const originMatchPattern = `${protocolGlob}${parsedUrl.hostname}/*`;
        const splitHost = parsedUrl.hostname.split(".");
        const domain = splitHost.slice(-2).join(".");
        const subDomainMatchPattern = `${protocolGlob}*.${domain}/*`;
        return [originMatchPattern, subDomainMatchPattern];
    }
    catch (_a) {
        return [];
    }
}
/**
 * Determines if the status code of the web response is invalid. An invalid status code is
 * any status code that is not in the 200-299 range.
 *
 * @param statusCode - The status code of the web response
 */
function isInvalidResponseStatusCode(statusCode) {
    return statusCode < 200 || statusCode >= 300;
}
/**
 * Determines if the current context is within a sandboxed iframe.
 */
function currentlyInSandboxedIframe() {
    var _a, _b;
    if (String(self.origin).toLowerCase() === "null" || globalThis.location.hostname === "") {
        return true;
    }
    const sandbox = (_b = (_a = globalThis.frameElement) === null || _a === void 0 ? void 0 : _a.getAttribute) === null || _b === void 0 ? void 0 : _b.call(_a, "sandbox");
    // No frameElement or sandbox attribute means not sandboxed
    if (sandbox === null || sandbox === undefined) {
        return false;
    }
    // An empty string means fully sandboxed
    if (sandbox === "") {
        return true;
    }
    const tokens = new Set(sandbox.toLowerCase().split(" "));
    return !["allow-scripts", "allow-same-origin"].every((token) => tokens.has(token));
}
/**
 * This object allows us to map a special character to a key name. The key name is used
 * in gathering the i18n translation of the written version of the special character.
 */
const specialCharacterToKeyMap = {
    " ": "spaceCharacterDescriptor",
    "~": "tildeCharacterDescriptor",
    "`": "backtickCharacterDescriptor",
    "!": "exclamationCharacterDescriptor",
    "@": "atSignCharacterDescriptor",
    "#": "hashSignCharacterDescriptor",
    $: "dollarSignCharacterDescriptor",
    "%": "percentSignCharacterDescriptor",
    "^": "caretCharacterDescriptor",
    "&": "ampersandCharacterDescriptor",
    "*": "asteriskCharacterDescriptor",
    "(": "parenLeftCharacterDescriptor",
    ")": "parenRightCharacterDescriptor",
    "-": "hyphenCharacterDescriptor",
    _: "underscoreCharacterDescriptor",
    "+": "plusCharacterDescriptor",
    "=": "equalsCharacterDescriptor",
    "{": "braceLeftCharacterDescriptor",
    "}": "braceRightCharacterDescriptor",
    "[": "bracketLeftCharacterDescriptor",
    "]": "bracketRightCharacterDescriptor",
    "|": "pipeCharacterDescriptor",
    "\\": "backSlashCharacterDescriptor",
    ":": "colonCharacterDescriptor",
    ";": "semicolonCharacterDescriptor",
    '"': "doubleQuoteCharacterDescriptor",
    "'": "singleQuoteCharacterDescriptor",
    "<": "lessThanCharacterDescriptor",
    ">": "greaterThanCharacterDescriptor",
    ",": "commaCharacterDescriptor",
    ".": "periodCharacterDescriptor",
    "?": "questionCharacterDescriptor",
    "/": "forwardSlashCharacterDescriptor",
};
/**
 * Determines if the current rect values are not all 0.
 */
function rectHasSize(rect) {
    if (rect.right > 0 && rect.left > 0 && rect.top > 0 && rect.bottom > 0) {
        return true;
    }
    return false;
}
/**
 * Checks if all the values corresponding to the specified keys in an object are null.
 * If no keys are specified, checks all keys in the object.
 *
 * @param obj - The object to check.
 * @param keys - An optional array of keys to check in the object. Defaults to all keys.
 * @returns Returns true if all values for the specified keys (or all keys if none are provided) are null; otherwise, false.
 */
function areKeyValuesNull(obj, keys) {
    const keysToCheck = keys && keys.length > 0 ? keys : Object.keys(obj);
    return keysToCheck.every((key) => obj[key] == null);
}

;// ./src/autofill/overlay/inline-menu/pages/menu-container/autofill-inline-menu-container.ts



/**
 * Allowlist of commands that can be sent to the background script.
 */
const ALLOWED_BG_COMMANDS = new Set([
    "addNewVaultItem",
    "autofillInlineMenuBlurred",
    "autofillInlineMenuButtonClicked",
    "checkAutofillInlineMenuButtonFocused",
    "checkInlineMenuButtonFocused",
    "fillAutofillInlineMenuCipher",
    "fillGeneratedPassword",
    "redirectAutofillInlineMenuFocusOut",
    "refreshGeneratedPassword",
    "refreshOverlayCiphers",
    "triggerDelayedAutofillInlineMenuClosure",
    "updateAutofillInlineMenuColorScheme",
    "updateAutofillInlineMenuListHeight",
    "unlockVault",
    "viewSelectedCipher",
]);
class AutofillInlineMenuContainer {
    constructor() {
        var _a;
        this.setElementStyles = setElementStyles;
        this.port = null;
        this.isInitialized = false;
        this.iframeStyles = {
            all: "initial",
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: "2147483647",
            lineHeight: "0",
            overflow: "hidden",
            visibility: "visible",
            clipPath: "none",
            pointerEvents: "auto",
            margin: "0",
            padding: "0",
            colorScheme: "normal",
        };
        this.defaultIframeAttributes = {
            src: "",
            title: "",
            sandbox: "allow-scripts",
            allowtransparency: "true",
            tabIndex: "-1",
        };
        this.windowMessageHandlers = {
            initAutofillInlineMenuButton: (message) => this.handleInitInlineMenuIframe(message),
            initAutofillInlineMenuList: (message) => this.handleInitInlineMenuIframe(message),
        };
        /**
         * Sets up the port message listener for the inline menu page.
         *
         * @param message - The message containing the port name.
         */
        this.setupPortMessageListener = (message) => {
            this.port = chrome.runtime.connect({ name: this.portName });
            const initMessage = Object.assign(Object.assign({}, message), { token: this.token });
            this.postMessageToInlineMenuPageUnsafe(initMessage);
        };
        /**
         * Handles window messages, routing them to the appropriate handler.
         *
         * @param event - The message event.
         */
        this.handleWindowMessage = (event) => {
            const message = event.data;
            if (!(message === null || message === void 0 ? void 0 : message.command)) {
                return;
            }
            if (this.isForeignWindowMessage(event)) {
                return;
            }
            if (this.windowMessageHandlers[message.command]) {
                // only accept init messages from extension origin or parent window
                if ((message.command === "initAutofillInlineMenuButton" ||
                    message.command === "initAutofillInlineMenuList") &&
                    !this.isMessageFromExtensionOrigin(event) &&
                    !this.isMessageFromParentWindow(event)) {
                    return;
                }
                this.windowMessageHandlers[message.command](message);
                return;
            }
            if (this.isMessageFromParentWindow(event)) {
                // messages from parent window are trusted and forwarded to iframe
                this.postMessageToInlineMenuPage(message);
                return;
            }
            // messages from iframe to background require object identity verification with a contentWindow check and token auth
            if (this.isMessageFromInlineMenuPageIframe(event)) {
                if (this.isValidSessionToken(message)) {
                    this.postMessageToBackground(message);
                }
                return;
            }
        };
        this.token = generateRandomChars(32);
        this.extensionOrigin = (_a = BrowserApi.getRuntimeURL("")) === null || _a === void 0 ? void 0 : _a.slice(0, -1);
        globalThis.addEventListener("message", this.handleWindowMessage);
    }
    /**
     * Handles initialization of the iframe used to display the inline menu.
     *
     * @param message - The message containing the iframe url and page title.
     */
    handleInitInlineMenuIframe(message) {
        if (this.isInitialized) {
            return;
        }
        const expectedOrigin = message.extensionOrigin || this.extensionOrigin;
        if (!this.isExtensionUrlWithOrigin(message.iframeUrl, expectedOrigin)) {
            return;
        }
        if (message.styleSheetUrl && !this.isExtensionUrlWithOrigin(message.styleSheetUrl)) {
            return;
        }
        this.defaultIframeAttributes.src = message.iframeUrl;
        this.defaultIframeAttributes.title = message.pageTitle;
        this.portName = message.portName;
        this.isInitialized = true;
        this.inlineMenuPageIframe = globalThis.document.createElement("iframe");
        this.setElementStyles(this.inlineMenuPageIframe, this.iframeStyles, true);
        for (const [attribute, value] of Object.entries(this.defaultIframeAttributes)) {
            this.inlineMenuPageIframe.setAttribute(attribute, value);
        }
        const handleInlineMenuPageIframeLoad = () => {
            this.inlineMenuPageIframe.removeEventListener(EVENTS.LOAD, handleInlineMenuPageIframeLoad);
            this.setupPortMessageListener(message);
        };
        this.inlineMenuPageIframe.addEventListener(EVENTS.LOAD, handleInlineMenuPageIframeLoad);
        globalThis.document.body.appendChild(this.inlineMenuPageIframe);
    }
    /**
     * Validates that a URL uses an extension protocol and matches the expected extension origin.
     * If no expectedOrigin is provided, validates against the URL's own origin.
     *
     * @param url - The URL to validate.
     */
    isExtensionUrlWithOrigin(url, expectedOrigin) {
        if (!url) {
            return false;
        }
        try {
            const urlObj = new URL(url);
            const extensionProtocols = new Set([
                "chrome-extension:",
                "moz-extension:",
                "safari-web-extension:",
            ]);
            const isExtensionProtocol = extensionProtocols.has(urlObj.protocol);
            if (!isExtensionProtocol) {
                return false;
            }
            const originToValidate = expectedOrigin !== null && expectedOrigin !== void 0 ? expectedOrigin : urlObj.origin;
            return urlObj.origin === originToValidate || urlObj.href.startsWith(originToValidate + "/");
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * Posts a message to the inline menu page iframe.
     *
     * @param message - The message to post.
     */
    postMessageToInlineMenuPage(message) {
        var _a;
        if ((_a = this.inlineMenuPageIframe) === null || _a === void 0 ? void 0 : _a.contentWindow) {
            const messageWithToken = Object.assign(Object.assign({}, message), { token: this.token });
            this.postMessageToInlineMenuPageUnsafe(messageWithToken);
        }
    }
    /**
     * Posts a message to the inline menu page iframe without token validation.
     *
     * UNSAFE: Bypasses token authentication and sends raw messages. Only use internally
     * when sending trusted messages (e.g., initialization) or when token validation
     * would create circular dependencies. External callers should use postMessageToInlineMenuPage().
     *
     * @param message - The message to post.
     */
    postMessageToInlineMenuPageUnsafe(message) {
        var _a;
        if ((_a = this.inlineMenuPageIframe) === null || _a === void 0 ? void 0 : _a.contentWindow) {
            this.inlineMenuPageIframe.contentWindow.postMessage(message, "*");
        }
    }
    /**
     * Posts a message from the inline menu iframe to the background script.
     *
     * @param message - The message to post.
     */
    postMessageToBackground(message) {
        if (!this.port) {
            return;
        }
        if (message.command && !ALLOWED_BG_COMMANDS.has(message.command)) {
            return;
        }
        this.port.postMessage(message);
    }
    /**
     * Identifies if the message is from a foreign window. A foreign window message is
     * considered as any message that does not have a portKey, is not from the parent window,
     * or is not from the inline menu page iframe.
     *
     * @param event - The message event.
     */
    isForeignWindowMessage(event) {
        var _a;
        if (!((_a = event.data) === null || _a === void 0 ? void 0 : _a.portKey)) {
            return true;
        }
        if (this.isMessageFromParentWindow(event)) {
            return false;
        }
        return !this.isMessageFromInlineMenuPageIframe(event);
    }
    /**
     * Identifies if the message is from the parent window.
     *
     * @param event - The message event.
     */
    isMessageFromParentWindow(event) {
        return globalThis.parent === event.source;
    }
    /**
     * Identifies if the message is from the inline menu page iframe.
     *
     * @param event - The message event.
     */
    isMessageFromInlineMenuPageIframe(event) {
        if (!this.inlineMenuPageIframe) {
            return false;
        }
        // only trust the specific iframe we created
        return this.inlineMenuPageIframe.contentWindow === event.source;
    }
    /**
     * Validates that the message contains a valid session token.
     * The session token is generated when the container is created and is refreshed
     * every time the inline menu container is recreated.
     *
     */
    isValidSessionToken(message) {
        if (!this.token || !(message === null || message === void 0 ? void 0 : message.token) || !(message === null || message === void 0 ? void 0 : message.token.length)) {
            return false;
        }
        return message.token === this.token;
    }
    /**
     * Validates that a message event originates from the extension.
     *
     * @param event - The message event to validate.
     * @returns True if the message is from the extension origin.
     */
    isMessageFromExtensionOrigin(event) {
        try {
            if (event.origin === "null") {
                return false;
            }
            return event.origin === this.extensionOrigin;
        }
        catch (_a) {
            return false;
        }
    }
}

;// ./src/autofill/overlay/inline-menu/pages/menu-container/bootstrap-autofill-inline-menu-container.ts
// FIXME: Remove when updating file. Eslint update
// eslint-disable-next-line @typescript-eslint/no-require-imports
__webpack_require__(90495);

(() => new AutofillInlineMenuContainer())();

/******/ })()
;