import { reinvent } from "./reinvent";

// from organic-ui framework
import { BaseComponent } from "../core/base-component";
import { Utils } from "../core/utils";
import { AppUtils } from '../core/app-utils';
import { routeTable } from "../core/router";
import { BindingSource } from "./binding-source";

const proxyHandler: ProxyHandler<BaseComponent<any, any>> = {
    get: (target, key) => target.state[key],
    set: (target, key, value) => (!Utils.equals(target[key], value) && target.repatch({ [key]: value })) as any
}
function baseClassFactory<S>({ chainMethods, className }) {
    class ReinventComponent extends BaseComponent<any, S>{
        static _hooks = {};
        static _hookArray = [];
        static doneFunc: Function;
        private static renderFunc;
        private static className = className;
        static StaticValues: any = {};
        static afterConsturct: Function;
        static _defaultState: S;
        devPortId: any;
        proxiedState: S;
        bindingSource: any;
        data: any;
        constructor(p) {
            super(p);
            this.devPortId = Utils.accquireDevPortId();
            this.autoUpdateState =
                ReinventComponent.
                    _hookArray
                    .filter(h => h.type == 'watcher')
                    .reduce((a, { hookName, callback }) => Object.assign(a, { [hookName]: callback }), {})
            this.proxiedState = (new Proxy(this, proxyHandler) as any) as S;
            if (ReinventComponent._defaultState)
                Object.assign(this.state, ReinventComponent._defaultState);

            if (ReinventComponent.afterConsturct instanceof Function)
                ReinventComponent.afterConsturct.apply(this, [p]);

            this.data = {};
            this.bindingSource = new BindingSource();
        }
        static queryChains(callerName: string, callbackFn: Function, ...args) {
            const items = Array.from(ReinventComponent[`_${callerName}Array`] || []) as Function[];
            return items.map(item => callbackFn(item, ...args));
        }
        static applyChains(callerName: string, ...args) {
            return ReinventComponent.queryChain(callerName, (method, ...array) => method(...array), ...args);
        }
        static queryChain(callerName: string, callbackFn: Function, ...args) {
            const items = Array.from(ReinventComponent[`_${callerName}Array`] || []) as Function[];
            console.assert(items.length < 2, `queryChain fail for ${callerName}`);
            return callbackFn(items[0], ...args);
        }

        static applyChain(callerName: string, ...args) {
            return ReinventComponent.queryChain(callerName, (method, ...array) => method instanceof Function && method(...array), ...args);
        }
        private static getHookMonitor(): Function {
            return !!OrganicUI.DeveloperBar.developerFriendlyEnabled && ReinventComponent['hookMonitor'];
        }
        callHook(hookName, ...args) {
            const { method } = (ReinventComponent._hooks[hookName] || {}) as any;
            if (method instanceof Function)
                return method.apply(this, args);
        }
        hook(type: string, hookName: string, method: Function) {
            const item = ({ type, hookName, method });
            ReinventComponent._hooks[hookName] = item;
            ReinventComponent._hookArray.push(item);
            return ReinventComponent;
        }
        static renderer(renderFunc) {
            ReinventComponent.renderFunc = renderFunc;
            return ReinventComponent;
        }
        showModal(hookName, ...args) {
            const result = this.callHook(hookName, ...args);
            if (React.isValidElement(result))
                return AppUtils.showDialog(result)
            else console.warn('invalid element in showModal ', result);
        }
        runAction(hookName, ...args) {
            const result = this.callHook(hookName, ...args);
            if (result instanceof Promise)
                return result;
            else
                throw `runAction ${hookName} failed, result is not promise`;
        }
        subrender(hookName, ...params) {
            const content = this.callHook(hookName, ...params);
            if (content && !React.isValidElement(content))
                throw `invalid subrender"${hookName}" `;
            return content;
        }
        static getRenderParams(target: ReinventComponent): any {
            return {
                props: target.props,
                state: target.proxiedState,
                binding: target.bindingSource,
                repatch: target.repatch.bind(this),
                runAction: target.runAction.bind(this),
                subrender: target.subrender.bind(this),
                showModal: target.showModal.bind(this),
                root: target.refs.root
            };
        }
        renderContent() {
            const { renderFunc, getRenderParams } = ReinventComponent;
            try {
                const content = renderFunc.apply(this, [getRenderParams(this)]);
                return <div className={Utils.classNames("developer-features", "reinvent-component", ReinventComponent.className)} ref="root">
                    {content}
                </div>
            }
            catch (exc) {
                console.log('renderError>>>>', exc);
                return this.renderErrorMode(`problem in renderContent`, exc.toString());
            }
        }

        getDevButton() {
            return Utils.renderDevButton({ prefix: "Reinvent", targetText: <i className="fa fa-info" /> }, this);
        }
        static done({ moduleId }) {
            if (doneCheckerTimeOut) clearTimeout(doneCheckerTimeOut);
            if (ReinventComponent.doneFunc instanceof Function)
                ReinventComponent.doneFunc();
            reinvent.modules[moduleId] = ReinventComponent;
            return ReinventComponent;
        }
        static assignRoute(pattern: string) {
            routeTable(pattern, ReinventComponent);
            return ReinventComponent;
        }
        static forkData = null;
        static getForkData() {
            return this.forkData;
        }
    }
    Array.from(chainMethods || [])
        .forEach(key => {
            ReinventComponent[`_${key}Array`] = [];

            ReinventComponent[`${key}`] =
                (...args) => {
                    const array = ReinventComponent[`_${key}Array`];
                    array.push(args.length == 1 ? args[0] : args);
                    ReinventComponent.StaticValues[key as string] = args.length == 1 ? args[0] : args;
                    return ReinventComponent;
                };


        });

    const doneCheckerTimeOut = !Utils.isProdMode() && setTimeout(function () {
        alert('undone reinvert');
        console.log('undone reinvert >>>', ReinventComponent);
    }, 100);
    return ReinventComponent;
}
Object.assign(reinvent, { baseClassFactory });
reinvent.factoryTable['frontend'] = function () {
    return baseClassFactory({ className: 'frontend', chainMethods: [] });
};

