"use strict";
(() => {
  // node_modules/solid-js/dist/solid.js
  var sharedConfig = {
    context: void 0,
    registry: void 0
  };
  function setHydrateContext(context2) {
    sharedConfig.context = context2;
  }
  function nextHydrateContext() {
    return {
      ...sharedConfig.context,
      id: `${sharedConfig.context.id}${sharedConfig.context.count++}-`,
      count: 0
    };
  }
  var equalFn = (a2, b2) => a2 === b2;
  var $PROXY = Symbol("solid-proxy");
  var $TRACK = Symbol("solid-track");
  var $DEVCOMP = Symbol("solid-dev-component");
  var signalOptions = {
    equals: equalFn
  };
  var ERROR = null;
  var runEffects = runQueue;
  var STALE = 1;
  var PENDING = 2;
  var UNOWNED = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };
  var Owner = null;
  var Transition = null;
  var Scheduler = null;
  var ExternalSourceConfig = null;
  var Listener = null;
  var Updates = null;
  var Effects = null;
  var ExecCount = 0;
  function createRoot(fn2, detachedOwner) {
    const listener = Listener, owner = Owner, unowned = fn2.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
      owned: null,
      cleanups: null,
      context: current ? current.context : null,
      owner: current
    }, updateFn = unowned ? fn2 : () => fn2(() => untrack(() => cleanNode(root)));
    Owner = root;
    Listener = null;
    try {
      return runUpdates(updateFn, true);
    } finally {
      Listener = listener;
      Owner = owner;
    }
  }
  function createSignal(value, options) {
    options = options ? Object.assign({}, signalOptions, options) : signalOptions;
    const s2 = {
      value,
      observers: null,
      observerSlots: null,
      comparator: options.equals || void 0
    };
    const setter = (value2) => {
      if (typeof value2 === "function") {
        if (Transition && Transition.running && Transition.sources.has(s2))
          value2 = value2(s2.tValue);
        else
          value2 = value2(s2.value);
      }
      return writeSignal(s2, value2);
    };
    return [readSignal.bind(s2), setter];
  }
  function createComputed(fn2, value, options) {
    const c2 = createComputation(fn2, value, true, STALE);
    if (Scheduler && Transition && Transition.running)
      Updates.push(c2);
    else
      updateComputation(c2);
  }
  function createRenderEffect(fn2, value, options) {
    const c2 = createComputation(fn2, value, false, STALE);
    if (Scheduler && Transition && Transition.running)
      Updates.push(c2);
    else
      updateComputation(c2);
  }
  function createEffect(fn2, value, options) {
    runEffects = runUserEffects;
    const c2 = createComputation(fn2, value, false, STALE), s2 = SuspenseContext && useContext(SuspenseContext);
    if (s2)
      c2.suspense = s2;
    if (!options || !options.render)
      c2.user = true;
    Effects ? Effects.push(c2) : updateComputation(c2);
  }
  function createMemo(fn2, value, options) {
    options = options ? Object.assign({}, signalOptions, options) : signalOptions;
    const c2 = createComputation(fn2, value, true, 0);
    c2.observers = null;
    c2.observerSlots = null;
    c2.comparator = options.equals || void 0;
    if (Scheduler && Transition && Transition.running) {
      c2.tState = STALE;
      Updates.push(c2);
    } else
      updateComputation(c2);
    return readSignal.bind(c2);
  }
  function createSelector(source, fn2 = equalFn, options) {
    const subs = /* @__PURE__ */ new Map();
    const node = createComputation(
      (p2) => {
        const v = source();
        for (const [key, val] of subs.entries())
          if (fn2(key, v) !== fn2(key, p2)) {
            for (const c2 of val.values()) {
              c2.state = STALE;
              if (c2.pure)
                Updates.push(c2);
              else
                Effects.push(c2);
            }
          }
        return v;
      },
      void 0,
      true,
      STALE
    );
    updateComputation(node);
    return (key) => {
      const listener = Listener;
      if (listener) {
        let l2;
        if (l2 = subs.get(key))
          l2.add(listener);
        else
          subs.set(key, l2 = /* @__PURE__ */ new Set([listener]));
        onCleanup(() => {
          l2.delete(listener);
          !l2.size && subs.delete(key);
        });
      }
      return fn2(
        key,
        Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value
      );
    };
  }
  function batch(fn2) {
    return runUpdates(fn2, false);
  }
  function untrack(fn2) {
    if (!ExternalSourceConfig && Listener === null)
      return fn2();
    const listener = Listener;
    Listener = null;
    try {
      if (ExternalSourceConfig)
        return ExternalSourceConfig.untrack(fn2);
      return fn2();
    } finally {
      Listener = listener;
    }
  }
  function on(deps, fn2, options) {
    const isArray = Array.isArray(deps);
    let prevInput;
    let defer = options && options.defer;
    return (prevValue) => {
      let input;
      if (isArray) {
        input = Array(deps.length);
        for (let i2 = 0; i2 < deps.length; i2++)
          input[i2] = deps[i2]();
      } else
        input = deps();
      if (defer) {
        defer = false;
        return void 0;
      }
      const result = untrack(() => fn2(input, prevInput, prevValue));
      prevInput = input;
      return result;
    };
  }
  function onMount(fn2) {
    createEffect(() => untrack(fn2));
  }
  function onCleanup(fn2) {
    if (Owner === null)
      ;
    else if (Owner.cleanups === null)
      Owner.cleanups = [fn2];
    else
      Owner.cleanups.push(fn2);
    return fn2;
  }
  function getListener() {
    return Listener;
  }
  function getOwner() {
    return Owner;
  }
  function runWithOwner(o2, fn2) {
    const prev = Owner;
    const prevListener = Listener;
    Owner = o2;
    Listener = null;
    try {
      return runUpdates(fn2, true);
    } catch (err) {
      handleError(err);
    } finally {
      Owner = prev;
      Listener = prevListener;
    }
  }
  function startTransition(fn2) {
    if (Transition && Transition.running) {
      fn2();
      return Transition.done;
    }
    const l2 = Listener;
    const o2 = Owner;
    return Promise.resolve().then(() => {
      Listener = l2;
      Owner = o2;
      let t2;
      if (Scheduler || SuspenseContext) {
        t2 = Transition || (Transition = {
          sources: /* @__PURE__ */ new Set(),
          effects: [],
          promises: /* @__PURE__ */ new Set(),
          disposed: /* @__PURE__ */ new Set(),
          queue: /* @__PURE__ */ new Set(),
          running: true
        });
        t2.done || (t2.done = new Promise((res) => t2.resolve = res));
        t2.running = true;
      }
      runUpdates(fn2, false);
      Listener = Owner = null;
      return t2 ? t2.done : void 0;
    });
  }
  var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
  function createContext(defaultValue, options) {
    const id = Symbol("context");
    return {
      id,
      Provider: createProvider(id),
      defaultValue
    };
  }
  function useContext(context2) {
    return Owner && Owner.context && Owner.context[context2.id] !== void 0 ? Owner.context[context2.id] : context2.defaultValue;
  }
  function children(fn2) {
    const children2 = createMemo(fn2);
    const memo = createMemo(() => resolveChildren(children2()));
    memo.toArray = () => {
      const c2 = memo();
      return Array.isArray(c2) ? c2 : c2 != null ? [c2] : [];
    };
    return memo;
  }
  var SuspenseContext;
  function readSignal() {
    const runningTransition = Transition && Transition.running;
    if (this.sources && (runningTransition ? this.tState : this.state)) {
      if ((runningTransition ? this.tState : this.state) === STALE)
        updateComputation(this);
      else {
        const updates = Updates;
        Updates = null;
        runUpdates(() => lookUpstream(this), false);
        Updates = updates;
      }
    }
    if (Listener) {
      const sSlot = this.observers ? this.observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [this];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(this);
        Listener.sourceSlots.push(sSlot);
      }
      if (!this.observers) {
        this.observers = [Listener];
        this.observerSlots = [Listener.sources.length - 1];
      } else {
        this.observers.push(Listener);
        this.observerSlots.push(Listener.sources.length - 1);
      }
    }
    if (runningTransition && Transition.sources.has(this))
      return this.tValue;
    return this.value;
  }
  function writeSignal(node, value, isComp) {
    let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
    if (!node.comparator || !node.comparator(current, value)) {
      if (Transition) {
        const TransitionRunning = Transition.running;
        if (TransitionRunning || !isComp && Transition.sources.has(node)) {
          Transition.sources.add(node);
          node.tValue = value;
        }
        if (!TransitionRunning)
          node.value = value;
      } else
        node.value = value;
      if (node.observers && node.observers.length) {
        runUpdates(() => {
          for (let i2 = 0; i2 < node.observers.length; i2 += 1) {
            const o2 = node.observers[i2];
            const TransitionRunning = Transition && Transition.running;
            if (TransitionRunning && Transition.disposed.has(o2))
              continue;
            if (TransitionRunning ? !o2.tState : !o2.state) {
              if (o2.pure)
                Updates.push(o2);
              else
                Effects.push(o2);
              if (o2.observers)
                markDownstream(o2);
            }
            if (!TransitionRunning)
              o2.state = STALE;
            else
              o2.tState = STALE;
          }
          if (Updates.length > 1e6) {
            Updates = [];
            if (false)
              ;
            throw new Error();
          }
        }, false);
      }
    }
    return value;
  }
  function updateComputation(node) {
    if (!node.fn)
      return;
    cleanNode(node);
    const time = ExecCount;
    runComputation(
      node,
      Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value,
      time
    );
    if (Transition && !Transition.running && Transition.sources.has(node)) {
      queueMicrotask(() => {
        runUpdates(() => {
          Transition && (Transition.running = true);
          Listener = Owner = node;
          runComputation(node, node.tValue, time);
          Listener = Owner = null;
        }, false);
      });
    }
  }
  function runComputation(node, value, time) {
    let nextValue;
    const owner = Owner, listener = Listener;
    Listener = Owner = node;
    try {
      nextValue = node.fn(value);
    } catch (err) {
      if (node.pure) {
        if (Transition && Transition.running) {
          node.tState = STALE;
          node.tOwned && node.tOwned.forEach(cleanNode);
          node.tOwned = void 0;
        } else {
          node.state = STALE;
          node.owned && node.owned.forEach(cleanNode);
          node.owned = null;
        }
      }
      node.updatedAt = time + 1;
      return handleError(err);
    } finally {
      Listener = listener;
      Owner = owner;
    }
    if (!node.updatedAt || node.updatedAt <= time) {
      if (node.updatedAt != null && "observers" in node) {
        writeSignal(node, nextValue, true);
      } else if (Transition && Transition.running && node.pure) {
        Transition.sources.add(node);
        node.tValue = nextValue;
      } else
        node.value = nextValue;
      node.updatedAt = time;
    }
  }
  function createComputation(fn2, init, pure, state = STALE, options) {
    const c2 = {
      fn: fn2,
      state,
      updatedAt: null,
      owned: null,
      sources: null,
      sourceSlots: null,
      cleanups: null,
      value: init,
      owner: Owner,
      context: Owner ? Owner.context : null,
      pure
    };
    if (Transition && Transition.running) {
      c2.state = 0;
      c2.tState = state;
    }
    if (Owner === null)
      ;
    else if (Owner !== UNOWNED) {
      if (Transition && Transition.running && Owner.pure) {
        if (!Owner.tOwned)
          Owner.tOwned = [c2];
        else
          Owner.tOwned.push(c2);
      } else {
        if (!Owner.owned)
          Owner.owned = [c2];
        else
          Owner.owned.push(c2);
      }
    }
    if (ExternalSourceConfig && c2.fn) {
      const [track, trigger] = createSignal(void 0, {
        equals: false
      });
      const ordinary = ExternalSourceConfig.factory(c2.fn, trigger);
      onCleanup(() => ordinary.dispose());
      const triggerInTransition = () => startTransition(trigger).then(() => inTransition.dispose());
      const inTransition = ExternalSourceConfig.factory(c2.fn, triggerInTransition);
      c2.fn = (x) => {
        track();
        return Transition && Transition.running ? inTransition.track(x) : ordinary.track(x);
      };
    }
    return c2;
  }
  function runTop(node) {
    const runningTransition = Transition && Transition.running;
    if ((runningTransition ? node.tState : node.state) === 0)
      return;
    if ((runningTransition ? node.tState : node.state) === PENDING)
      return lookUpstream(node);
    if (node.suspense && untrack(node.suspense.inFallback))
      return node.suspense.effects.push(node);
    const ancestors = [node];
    while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
      if (runningTransition && Transition.disposed.has(node))
        return;
      if (runningTransition ? node.tState : node.state)
        ancestors.push(node);
    }
    for (let i2 = ancestors.length - 1; i2 >= 0; i2--) {
      node = ancestors[i2];
      if (runningTransition) {
        let top2 = node, prev = ancestors[i2 + 1];
        while ((top2 = top2.owner) && top2 !== prev) {
          if (Transition.disposed.has(top2))
            return;
        }
      }
      if ((runningTransition ? node.tState : node.state) === STALE) {
        updateComputation(node);
      } else if ((runningTransition ? node.tState : node.state) === PENDING) {
        const updates = Updates;
        Updates = null;
        runUpdates(() => lookUpstream(node, ancestors[0]), false);
        Updates = updates;
      }
    }
  }
  function runUpdates(fn2, init) {
    if (Updates)
      return fn2();
    let wait = false;
    if (!init)
      Updates = [];
    if (Effects)
      wait = true;
    else
      Effects = [];
    ExecCount++;
    try {
      const res = fn2();
      completeUpdates(wait);
      return res;
    } catch (err) {
      if (!wait)
        Effects = null;
      Updates = null;
      handleError(err);
    }
  }
  function completeUpdates(wait) {
    if (Updates) {
      if (Scheduler && Transition && Transition.running)
        scheduleQueue(Updates);
      else
        runQueue(Updates);
      Updates = null;
    }
    if (wait)
      return;
    let res;
    if (Transition) {
      if (!Transition.promises.size && !Transition.queue.size) {
        const sources = Transition.sources;
        const disposed = Transition.disposed;
        Effects.push.apply(Effects, Transition.effects);
        res = Transition.resolve;
        for (const e3 of Effects) {
          "tState" in e3 && (e3.state = e3.tState);
          delete e3.tState;
        }
        Transition = null;
        runUpdates(() => {
          for (const d of disposed)
            cleanNode(d);
          for (const v of sources) {
            v.value = v.tValue;
            if (v.owned) {
              for (let i2 = 0, len = v.owned.length; i2 < len; i2++)
                cleanNode(v.owned[i2]);
            }
            if (v.tOwned)
              v.owned = v.tOwned;
            delete v.tValue;
            delete v.tOwned;
            v.tState = 0;
          }
          setTransPending(false);
        }, false);
      } else if (Transition.running) {
        Transition.running = false;
        Transition.effects.push.apply(Transition.effects, Effects);
        Effects = null;
        setTransPending(true);
        return;
      }
    }
    const e2 = Effects;
    Effects = null;
    if (e2.length)
      runUpdates(() => runEffects(e2), false);
    if (res)
      res();
  }
  function runQueue(queue) {
    for (let i2 = 0; i2 < queue.length; i2++)
      runTop(queue[i2]);
  }
  function scheduleQueue(queue) {
    for (let i2 = 0; i2 < queue.length; i2++) {
      const item = queue[i2];
      const tasks = Transition.queue;
      if (!tasks.has(item)) {
        tasks.add(item);
        Scheduler(() => {
          tasks.delete(item);
          runUpdates(() => {
            Transition.running = true;
            runTop(item);
          }, false);
          Transition && (Transition.running = false);
        });
      }
    }
  }
  function runUserEffects(queue) {
    let i2, userLength = 0;
    for (i2 = 0; i2 < queue.length; i2++) {
      const e2 = queue[i2];
      if (!e2.user)
        runTop(e2);
      else
        queue[userLength++] = e2;
    }
    if (sharedConfig.context) {
      if (sharedConfig.count) {
        sharedConfig.effects || (sharedConfig.effects = []);
        sharedConfig.effects.push(...queue.slice(0, userLength));
        return;
      } else if (sharedConfig.effects) {
        queue = [...sharedConfig.effects, ...queue];
        userLength += sharedConfig.effects.length;
        delete sharedConfig.effects;
      }
      setHydrateContext();
    }
    for (i2 = 0; i2 < userLength; i2++)
      runTop(queue[i2]);
  }
  function lookUpstream(node, ignore) {
    const runningTransition = Transition && Transition.running;
    if (runningTransition)
      node.tState = 0;
    else
      node.state = 0;
    for (let i2 = 0; i2 < node.sources.length; i2 += 1) {
      const source = node.sources[i2];
      if (source.sources) {
        const state = runningTransition ? source.tState : source.state;
        if (state === STALE) {
          if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
            runTop(source);
        } else if (state === PENDING)
          lookUpstream(source, ignore);
      }
    }
  }
  function markDownstream(node) {
    const runningTransition = Transition && Transition.running;
    for (let i2 = 0; i2 < node.observers.length; i2 += 1) {
      const o2 = node.observers[i2];
      if (runningTransition ? !o2.tState : !o2.state) {
        if (runningTransition)
          o2.tState = PENDING;
        else
          o2.state = PENDING;
        if (o2.pure)
          Updates.push(o2);
        else
          Effects.push(o2);
        o2.observers && markDownstream(o2);
      }
    }
  }
  function cleanNode(node) {
    let i2;
    if (node.sources) {
      while (node.sources.length) {
        const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
        if (obs && obs.length) {
          const n2 = obs.pop(), s2 = source.observerSlots.pop();
          if (index < obs.length) {
            n2.sourceSlots[s2] = index;
            obs[index] = n2;
            source.observerSlots[index] = s2;
          }
        }
      }
    }
    if (Transition && Transition.running && node.pure) {
      if (node.tOwned) {
        for (i2 = node.tOwned.length - 1; i2 >= 0; i2--)
          cleanNode(node.tOwned[i2]);
        delete node.tOwned;
      }
      reset(node, true);
    } else if (node.owned) {
      for (i2 = node.owned.length - 1; i2 >= 0; i2--)
        cleanNode(node.owned[i2]);
      node.owned = null;
    }
    if (node.cleanups) {
      for (i2 = node.cleanups.length - 1; i2 >= 0; i2--)
        node.cleanups[i2]();
      node.cleanups = null;
    }
    if (Transition && Transition.running)
      node.tState = 0;
    else
      node.state = 0;
  }
  function reset(node, top2) {
    if (!top2) {
      node.tState = 0;
      Transition.disposed.add(node);
    }
    if (node.owned) {
      for (let i2 = 0; i2 < node.owned.length; i2++)
        reset(node.owned[i2]);
    }
  }
  function castError(err) {
    if (err instanceof Error)
      return err;
    return new Error(typeof err === "string" ? err : "Unknown error", {
      cause: err
    });
  }
  function runErrors(err, fns, owner) {
    try {
      for (const f of fns)
        f(err);
    } catch (e2) {
      handleError(e2, owner && owner.owner || null);
    }
  }
  function handleError(err, owner = Owner) {
    const fns = ERROR && owner && owner.context && owner.context[ERROR];
    const error = castError(err);
    if (!fns)
      throw error;
    if (Effects)
      Effects.push({
        fn() {
          runErrors(error, fns, owner);
        },
        state: STALE
      });
    else
      runErrors(error, fns, owner);
  }
  function resolveChildren(children2) {
    if (typeof children2 === "function" && !children2.length)
      return resolveChildren(children2());
    if (Array.isArray(children2)) {
      const results = [];
      for (let i2 = 0; i2 < children2.length; i2++) {
        const result = resolveChildren(children2[i2]);
        Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
      }
      return results;
    }
    return children2;
  }
  function createProvider(id, options) {
    return function provider(props) {
      let res;
      createRenderEffect(
        () => res = untrack(() => {
          Owner.context = {
            ...Owner.context,
            [id]: props.value
          };
          return children(() => props.children);
        }),
        void 0
      );
      return res;
    };
  }
  var FALLBACK = Symbol("fallback");
  function dispose(d) {
    for (let i2 = 0; i2 < d.length; i2++)
      d[i2]();
  }
  function mapArray(list, mapFn, options = {}) {
    let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
    onCleanup(() => dispose(disposers));
    return () => {
      let newItems = list() || [], i2, j;
      newItems[$TRACK];
      return untrack(() => {
        let newLen = newItems.length, newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start2, end2, newEnd, item;
        if (newLen === 0) {
          if (len !== 0) {
            dispose(disposers);
            disposers = [];
            items = [];
            mapped = [];
            len = 0;
            indexes && (indexes = []);
          }
          if (options.fallback) {
            items = [FALLBACK];
            mapped[0] = createRoot((disposer) => {
              disposers[0] = disposer;
              return options.fallback();
            });
            len = 1;
          }
        } else if (len === 0) {
          mapped = new Array(newLen);
          for (j = 0; j < newLen; j++) {
            items[j] = newItems[j];
            mapped[j] = createRoot(mapper);
          }
          len = newLen;
        } else {
          temp = new Array(newLen);
          tempdisposers = new Array(newLen);
          indexes && (tempIndexes = new Array(newLen));
          for (start2 = 0, end2 = Math.min(len, newLen); start2 < end2 && items[start2] === newItems[start2]; start2++)
            ;
          for (end2 = len - 1, newEnd = newLen - 1; end2 >= start2 && newEnd >= start2 && items[end2] === newItems[newEnd]; end2--, newEnd--) {
            temp[newEnd] = mapped[end2];
            tempdisposers[newEnd] = disposers[end2];
            indexes && (tempIndexes[newEnd] = indexes[end2]);
          }
          newIndices = /* @__PURE__ */ new Map();
          newIndicesNext = new Array(newEnd + 1);
          for (j = newEnd; j >= start2; j--) {
            item = newItems[j];
            i2 = newIndices.get(item);
            newIndicesNext[j] = i2 === void 0 ? -1 : i2;
            newIndices.set(item, j);
          }
          for (i2 = start2; i2 <= end2; i2++) {
            item = items[i2];
            j = newIndices.get(item);
            if (j !== void 0 && j !== -1) {
              temp[j] = mapped[i2];
              tempdisposers[j] = disposers[i2];
              indexes && (tempIndexes[j] = indexes[i2]);
              j = newIndicesNext[j];
              newIndices.set(item, j);
            } else
              disposers[i2]();
          }
          for (j = start2; j < newLen; j++) {
            if (j in temp) {
              mapped[j] = temp[j];
              disposers[j] = tempdisposers[j];
              if (indexes) {
                indexes[j] = tempIndexes[j];
                indexes[j](j);
              }
            } else
              mapped[j] = createRoot(mapper);
          }
          mapped = mapped.slice(0, len = newLen);
          items = newItems.slice(0);
        }
        return mapped;
      });
      function mapper(disposer) {
        disposers[j] = disposer;
        if (indexes) {
          const [s2, set] = createSignal(j);
          indexes[j] = set;
          return mapFn(newItems[j], s2);
        }
        return mapFn(newItems[j]);
      }
    };
  }
  var hydrationEnabled = false;
  function createComponent(Comp, props) {
    if (hydrationEnabled) {
      if (sharedConfig.context) {
        const c2 = sharedConfig.context;
        setHydrateContext(nextHydrateContext());
        const r = untrack(() => Comp(props || {}));
        setHydrateContext(c2);
        return r;
      }
    }
    return untrack(() => Comp(props || {}));
  }
  function trueFn() {
    return true;
  }
  var propTraps = {
    get(_, property, receiver) {
      if (property === $PROXY)
        return receiver;
      return _.get(property);
    },
    has(_, property) {
      if (property === $PROXY)
        return true;
      return _.has(property);
    },
    set: trueFn,
    deleteProperty: trueFn,
    getOwnPropertyDescriptor(_, property) {
      return {
        configurable: true,
        enumerable: true,
        get() {
          return _.get(property);
        },
        set: trueFn,
        deleteProperty: trueFn
      };
    },
    ownKeys(_) {
      return _.keys();
    }
  };
  function resolveSource(s2) {
    return !(s2 = typeof s2 === "function" ? s2() : s2) ? {} : s2;
  }
  function resolveSources() {
    for (let i2 = 0, length = this.length; i2 < length; ++i2) {
      const v = this[i2]();
      if (v !== void 0)
        return v;
    }
  }
  function mergeProps(...sources) {
    let proxy = false;
    for (let i2 = 0; i2 < sources.length; i2++) {
      const s2 = sources[i2];
      proxy = proxy || !!s2 && $PROXY in s2;
      sources[i2] = typeof s2 === "function" ? (proxy = true, createMemo(s2)) : s2;
    }
    if (proxy) {
      return new Proxy(
        {
          get(property) {
            for (let i2 = sources.length - 1; i2 >= 0; i2--) {
              const v = resolveSource(sources[i2])[property];
              if (v !== void 0)
                return v;
            }
          },
          has(property) {
            for (let i2 = sources.length - 1; i2 >= 0; i2--) {
              if (property in resolveSource(sources[i2]))
                return true;
            }
            return false;
          },
          keys() {
            const keys = [];
            for (let i2 = 0; i2 < sources.length; i2++)
              keys.push(...Object.keys(resolveSource(sources[i2])));
            return [...new Set(keys)];
          }
        },
        propTraps
      );
    }
    const sourcesMap = {};
    const defined = /* @__PURE__ */ Object.create(null);
    for (let i2 = sources.length - 1; i2 >= 0; i2--) {
      const source = sources[i2];
      if (!source)
        continue;
      const sourceKeys = Object.getOwnPropertyNames(source);
      for (let i3 = sourceKeys.length - 1; i3 >= 0; i3--) {
        const key = sourceKeys[i3];
        if (key === "__proto__" || key === "constructor")
          continue;
        const desc = Object.getOwnPropertyDescriptor(source, key);
        if (!defined[key]) {
          defined[key] = desc.get ? {
            enumerable: true,
            configurable: true,
            get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
          } : desc.value !== void 0 ? desc : void 0;
        } else {
          const sources2 = sourcesMap[key];
          if (sources2) {
            if (desc.get)
              sources2.push(desc.get.bind(source));
            else if (desc.value !== void 0)
              sources2.push(() => desc.value);
          }
        }
      }
    }
    const target = {};
    const definedKeys = Object.keys(defined);
    for (let i2 = definedKeys.length - 1; i2 >= 0; i2--) {
      const key = definedKeys[i2], desc = defined[key];
      if (desc && desc.get)
        Object.defineProperty(target, key, desc);
      else
        target[key] = desc ? desc.value : void 0;
    }
    return target;
  }
  function splitProps(props, ...keys) {
    if ($PROXY in props) {
      const blocked = new Set(keys.length > 1 ? keys.flat() : keys[0]);
      const res = keys.map((k) => {
        return new Proxy(
          {
            get(property) {
              return k.includes(property) ? props[property] : void 0;
            },
            has(property) {
              return k.includes(property) && property in props;
            },
            keys() {
              return k.filter((property) => property in props);
            }
          },
          propTraps
        );
      });
      res.push(
        new Proxy(
          {
            get(property) {
              return blocked.has(property) ? void 0 : props[property];
            },
            has(property) {
              return blocked.has(property) ? false : property in props;
            },
            keys() {
              return Object.keys(props).filter((k) => !blocked.has(k));
            }
          },
          propTraps
        )
      );
      return res;
    }
    const otherObject = {};
    const objects = keys.map(() => ({}));
    for (const propName of Object.getOwnPropertyNames(props)) {
      const desc = Object.getOwnPropertyDescriptor(props, propName);
      const isDefaultDesc = !desc.get && !desc.set && desc.enumerable && desc.writable && desc.configurable;
      let blocked = false;
      let objectIndex = 0;
      for (const k of keys) {
        if (k.includes(propName)) {
          blocked = true;
          isDefaultDesc ? objects[objectIndex][propName] = desc.value : Object.defineProperty(objects[objectIndex], propName, desc);
        }
        ++objectIndex;
      }
      if (!blocked) {
        isDefaultDesc ? otherObject[propName] = desc.value : Object.defineProperty(otherObject, propName, desc);
      }
    }
    return [...objects, otherObject];
  }
  var narrowedError = (name) => `Stale read from <${name}>.`;
  function For(props) {
    const fallback = "fallback" in props && {
      fallback: () => props.fallback
    };
    return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
  }
  function Show(props) {
    const keyed = props.keyed;
    const condition = createMemo(() => props.when, void 0, {
      equals: (a2, b2) => keyed ? a2 === b2 : !a2 === !b2
    });
    return createMemo(
      () => {
        const c2 = condition();
        if (c2) {
          const child = props.children;
          const fn2 = typeof child === "function" && child.length > 0;
          return fn2 ? untrack(
            () => child(
              keyed ? c2 : () => {
                if (!untrack(condition))
                  throw narrowedError("Show");
                return props.when;
              }
            )
          ) : child;
        }
        return props.fallback;
      },
      void 0,
      void 0
    );
  }
  function Switch(props) {
    let keyed = false;
    const equals = (a2, b2) => (keyed ? a2[1] === b2[1] : !a2[1] === !b2[1]) && a2[2] === b2[2];
    const conditions = children(() => props.children), evalConditions = createMemo(
      () => {
        let conds = conditions();
        if (!Array.isArray(conds))
          conds = [conds];
        for (let i2 = 0; i2 < conds.length; i2++) {
          const c2 = conds[i2].when;
          if (c2) {
            keyed = !!conds[i2].keyed;
            return [i2, c2, conds[i2]];
          }
        }
        return [-1];
      },
      void 0,
      {
        equals
      }
    );
    return createMemo(
      () => {
        const [index, when, cond] = evalConditions();
        if (index < 0)
          return props.fallback;
        const c2 = cond.children;
        const fn2 = typeof c2 === "function" && c2.length > 0;
        return fn2 ? untrack(
          () => c2(
            keyed ? when : () => {
              if (untrack(evalConditions)[0] !== index)
                throw narrowedError("Match");
              return cond.when;
            }
          )
        ) : c2;
      },
      void 0,
      void 0
    );
  }
  function Match(props) {
    return props;
  }
  var SuspenseListContext = createContext();

  // node_modules/solid-js/web/dist/web.js
  var booleans = [
    "allowfullscreen",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "disabled",
    "formnovalidate",
    "hidden",
    "indeterminate",
    "inert",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "seamless",
    "selected"
  ];
  var Properties = /* @__PURE__ */ new Set([
    "className",
    "value",
    "readOnly",
    "formNoValidate",
    "isMap",
    "noModule",
    "playsInline",
    ...booleans
  ]);
  var ChildProperties = /* @__PURE__ */ new Set([
    "innerHTML",
    "textContent",
    "innerText",
    "children"
  ]);
  var Aliases = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
    className: "class",
    htmlFor: "for"
  });
  var PropAliases = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
    class: "className",
    formnovalidate: {
      $: "formNoValidate",
      BUTTON: 1,
      INPUT: 1
    },
    ismap: {
      $: "isMap",
      IMG: 1
    },
    nomodule: {
      $: "noModule",
      SCRIPT: 1
    },
    playsinline: {
      $: "playsInline",
      VIDEO: 1
    },
    readonly: {
      $: "readOnly",
      INPUT: 1,
      TEXTAREA: 1
    }
  });
  function getPropAlias(prop, tagName) {
    const a2 = PropAliases[prop];
    return typeof a2 === "object" ? a2[tagName] ? a2["$"] : void 0 : a2;
  }
  var DelegatedEvents = /* @__PURE__ */ new Set([
    "beforeinput",
    "click",
    "dblclick",
    "contextmenu",
    "focusin",
    "focusout",
    "input",
    "keydown",
    "keyup",
    "mousedown",
    "mousemove",
    "mouseout",
    "mouseover",
    "mouseup",
    "pointerdown",
    "pointermove",
    "pointerout",
    "pointerover",
    "pointerup",
    "touchend",
    "touchmove",
    "touchstart"
  ]);
  var SVGElements = /* @__PURE__ */ new Set([
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animate",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "color-profile",
    "cursor",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "font",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "foreignObject",
    "g",
    "glyph",
    "glyphRef",
    "hkern",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "missing-glyph",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "set",
    "stop",
    "svg",
    "switch",
    "symbol",
    "text",
    "textPath",
    "tref",
    "tspan",
    "use",
    "view",
    "vkern"
  ]);
  var SVGNamespace = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace"
  };
  function reconcileArrays(parentNode, a2, b2) {
    let bLength = b2.length, aEnd = a2.length, bEnd = bLength, aStart = 0, bStart = 0, after = a2[aEnd - 1].nextSibling, map = null;
    while (aStart < aEnd || bStart < bEnd) {
      if (a2[aStart] === b2[bStart]) {
        aStart++;
        bStart++;
        continue;
      }
      while (a2[aEnd - 1] === b2[bEnd - 1]) {
        aEnd--;
        bEnd--;
      }
      if (aEnd === aStart) {
        const node = bEnd < bLength ? bStart ? b2[bStart - 1].nextSibling : b2[bEnd - bStart] : after;
        while (bStart < bEnd)
          parentNode.insertBefore(b2[bStart++], node);
      } else if (bEnd === bStart) {
        while (aStart < aEnd) {
          if (!map || !map.has(a2[aStart]))
            a2[aStart].remove();
          aStart++;
        }
      } else if (a2[aStart] === b2[bEnd - 1] && b2[bStart] === a2[aEnd - 1]) {
        const node = a2[--aEnd].nextSibling;
        parentNode.insertBefore(b2[bStart++], a2[aStart++].nextSibling);
        parentNode.insertBefore(b2[--bEnd], node);
        a2[aEnd] = b2[bEnd];
      } else {
        if (!map) {
          map = /* @__PURE__ */ new Map();
          let i2 = bStart;
          while (i2 < bEnd)
            map.set(b2[i2], i2++);
        }
        const index = map.get(a2[aStart]);
        if (index != null) {
          if (bStart < index && index < bEnd) {
            let i2 = aStart, sequence = 1, t2;
            while (++i2 < aEnd && i2 < bEnd) {
              if ((t2 = map.get(a2[i2])) == null || t2 !== index + sequence)
                break;
              sequence++;
            }
            if (sequence > index - bStart) {
              const node = a2[aStart];
              while (bStart < index)
                parentNode.insertBefore(b2[bStart++], node);
            } else
              parentNode.replaceChild(b2[bStart++], a2[aStart++]);
          } else
            aStart++;
        } else
          a2[aStart++].remove();
      }
    }
  }
  var $$EVENTS = "_$DX_DELEGATE";
  function render(code, element, init, options = {}) {
    let disposer;
    createRoot((dispose2) => {
      disposer = dispose2;
      element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init);
    }, options.owner);
    return () => {
      disposer();
      element.textContent = "";
    };
  }
  function template(html, isCE, isSVG) {
    let node;
    const create = () => {
      const t2 = document.createElement("template");
      t2.innerHTML = html;
      return isSVG ? t2.content.firstChild.firstChild : t2.content.firstChild;
    };
    const fn2 = isCE ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
    fn2.cloneNode = fn2;
    return fn2;
  }
  function delegateEvents(eventNames, document2 = window.document) {
    const e2 = document2[$$EVENTS] || (document2[$$EVENTS] = /* @__PURE__ */ new Set());
    for (let i2 = 0, l2 = eventNames.length; i2 < l2; i2++) {
      const name = eventNames[i2];
      if (!e2.has(name)) {
        e2.add(name);
        document2.addEventListener(name, eventHandler);
      }
    }
  }
  function setAttribute(node, name, value) {
    if (sharedConfig.context)
      return;
    if (value == null)
      node.removeAttribute(name);
    else
      node.setAttribute(name, value);
  }
  function setAttributeNS(node, namespace, name, value) {
    if (sharedConfig.context)
      return;
    if (value == null)
      node.removeAttributeNS(namespace, name);
    else
      node.setAttributeNS(namespace, name, value);
  }
  function className(node, value) {
    if (sharedConfig.context)
      return;
    if (value == null)
      node.removeAttribute("class");
    else
      node.className = value;
  }
  function addEventListener(node, name, handler, delegate) {
    if (delegate) {
      if (Array.isArray(handler)) {
        node[`$$${name}`] = handler[0];
        node[`$$${name}Data`] = handler[1];
      } else
        node[`$$${name}`] = handler;
    } else if (Array.isArray(handler)) {
      const handlerFn = handler[0];
      node.addEventListener(name, handler[0] = (e2) => handlerFn.call(node, handler[1], e2));
    } else
      node.addEventListener(name, handler);
  }
  function classList(node, value, prev = {}) {
    const classKeys = Object.keys(value || {}), prevKeys = Object.keys(prev);
    let i2, len;
    for (i2 = 0, len = prevKeys.length; i2 < len; i2++) {
      const key = prevKeys[i2];
      if (!key || key === "undefined" || value[key])
        continue;
      toggleClassKey(node, key, false);
      delete prev[key];
    }
    for (i2 = 0, len = classKeys.length; i2 < len; i2++) {
      const key = classKeys[i2], classValue = !!value[key];
      if (!key || key === "undefined" || prev[key] === classValue || !classValue)
        continue;
      toggleClassKey(node, key, true);
      prev[key] = classValue;
    }
    return prev;
  }
  function style(node, value, prev) {
    if (!value)
      return prev ? setAttribute(node, "style") : value;
    const nodeStyle = node.style;
    if (typeof value === "string")
      return nodeStyle.cssText = value;
    typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
    prev || (prev = {});
    value || (value = {});
    let v, s2;
    for (s2 in prev) {
      value[s2] == null && nodeStyle.removeProperty(s2);
      delete prev[s2];
    }
    for (s2 in value) {
      v = value[s2];
      if (v !== prev[s2]) {
        nodeStyle.setProperty(s2, v);
        prev[s2] = v;
      }
    }
    return prev;
  }
  function spread(node, props = {}, isSVG, skipChildren) {
    const prevProps = {};
    if (!skipChildren) {
      createRenderEffect(
        () => prevProps.children = insertExpression(node, props.children, prevProps.children)
      );
    }
    createRenderEffect(() => props.ref && props.ref(node));
    createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
    return prevProps;
  }
  function use(fn2, element, arg) {
    return untrack(() => fn2(element, arg));
  }
  function insert(parent, accessor, marker, initial) {
    if (marker !== void 0 && !initial)
      initial = [];
    if (typeof accessor !== "function")
      return insertExpression(parent, accessor, initial, marker);
    createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
  }
  function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
    props || (props = {});
    for (const prop in prevProps) {
      if (!(prop in props)) {
        if (prop === "children")
          continue;
        prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef);
      }
    }
    for (const prop in props) {
      if (prop === "children") {
        if (!skipChildren)
          insertExpression(node, props.children);
        continue;
      }
      const value = props[prop];
      prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef);
    }
  }
  function getNextElement(template2) {
    let node, key;
    if (!sharedConfig.context || !(node = sharedConfig.registry.get(key = getHydrationKey()))) {
      return template2();
    }
    if (sharedConfig.completed)
      sharedConfig.completed.add(node);
    sharedConfig.registry.delete(key);
    return node;
  }
  function toPropertyName(name) {
    return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
  }
  function toggleClassKey(node, key, value) {
    const classNames2 = key.trim().split(/\s+/);
    for (let i2 = 0, nameLen = classNames2.length; i2 < nameLen; i2++)
      node.classList.toggle(classNames2[i2], value);
  }
  function assignProp(node, prop, value, prev, isSVG, skipRef) {
    let isCE, isProp, isChildProp, propAlias, forceProp;
    if (prop === "style")
      return style(node, value, prev);
    if (prop === "classList")
      return classList(node, value, prev);
    if (value === prev)
      return prev;
    if (prop === "ref") {
      if (!skipRef)
        value(node);
    } else if (prop.slice(0, 3) === "on:") {
      const e2 = prop.slice(3);
      prev && node.removeEventListener(e2, prev);
      value && node.addEventListener(e2, value);
    } else if (prop.slice(0, 10) === "oncapture:") {
      const e2 = prop.slice(10);
      prev && node.removeEventListener(e2, prev, true);
      value && node.addEventListener(e2, value, true);
    } else if (prop.slice(0, 2) === "on") {
      const name = prop.slice(2).toLowerCase();
      const delegate = DelegatedEvents.has(name);
      if (!delegate && prev) {
        const h2 = Array.isArray(prev) ? prev[0] : prev;
        node.removeEventListener(name, h2);
      }
      if (delegate || value) {
        addEventListener(node, name, value, delegate);
        delegate && delegateEvents([name]);
      }
    } else if (prop.slice(0, 5) === "attr:") {
      setAttribute(node, prop.slice(5), value);
    } else if ((forceProp = prop.slice(0, 5) === "prop:") || (isChildProp = ChildProperties.has(prop)) || !isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-"))) {
      if (forceProp) {
        prop = prop.slice(5);
        isProp = true;
      } else if (sharedConfig.context)
        return value;
      if (prop === "class" || prop === "className")
        className(node, value);
      else if (isCE && !isProp && !isChildProp)
        node[toPropertyName(prop)] = value;
      else
        node[propAlias || prop] = value;
    } else {
      const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
      if (ns)
        setAttributeNS(node, ns, prop, value);
      else
        setAttribute(node, Aliases[prop] || prop, value);
    }
    return value;
  }
  function eventHandler(e2) {
    const key = `$$${e2.type}`;
    let node = e2.composedPath && e2.composedPath()[0] || e2.target;
    if (e2.target !== node) {
      Object.defineProperty(e2, "target", {
        configurable: true,
        value: node
      });
    }
    Object.defineProperty(e2, "currentTarget", {
      configurable: true,
      get() {
        return node || document;
      }
    });
    if (sharedConfig.registry && !sharedConfig.done)
      sharedConfig.done = _$HY.done = true;
    while (node) {
      const handler = node[key];
      if (handler && !node.disabled) {
        const data = node[`${key}Data`];
        data !== void 0 ? handler.call(node, data, e2) : handler.call(node, e2);
        if (e2.cancelBubble)
          return;
      }
      node = node._$host || node.parentNode || node.host;
    }
  }
  function insertExpression(parent, value, current, marker, unwrapArray) {
    if (sharedConfig.context) {
      !current && (current = [...parent.childNodes]);
      let cleaned = [];
      for (let i2 = 0; i2 < current.length; i2++) {
        const node = current[i2];
        if (node.nodeType === 8 && node.data.slice(0, 2) === "!$")
          node.remove();
        else
          cleaned.push(node);
      }
      current = cleaned;
    }
    while (typeof current === "function")
      current = current();
    if (value === current)
      return current;
    const t2 = typeof value, multi = marker !== void 0;
    parent = multi && current[0] && current[0].parentNode || parent;
    if (t2 === "string" || t2 === "number") {
      if (sharedConfig.context)
        return current;
      if (t2 === "number")
        value = value.toString();
      if (multi) {
        let node = current[0];
        if (node && node.nodeType === 3) {
          node.data !== value && (node.data = value);
        } else
          node = document.createTextNode(value);
        current = cleanChildren(parent, current, marker, node);
      } else {
        if (current !== "" && typeof current === "string") {
          current = parent.firstChild.data = value;
        } else
          current = parent.textContent = value;
      }
    } else if (value == null || t2 === "boolean") {
      if (sharedConfig.context)
        return current;
      current = cleanChildren(parent, current, marker);
    } else if (t2 === "function") {
      createRenderEffect(() => {
        let v = value();
        while (typeof v === "function")
          v = v();
        current = insertExpression(parent, v, current, marker);
      });
      return () => current;
    } else if (Array.isArray(value)) {
      const array = [];
      const currentArray = current && Array.isArray(current);
      if (normalizeIncomingArray(array, value, current, unwrapArray)) {
        createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
        return () => current;
      }
      if (sharedConfig.context) {
        if (!array.length)
          return current;
        if (marker === void 0)
          return [...parent.childNodes];
        let node = array[0];
        let nodes = [node];
        while ((node = node.nextSibling) !== marker)
          nodes.push(node);
        return current = nodes;
      }
      if (array.length === 0) {
        current = cleanChildren(parent, current, marker);
        if (multi)
          return current;
      } else if (currentArray) {
        if (current.length === 0) {
          appendNodes(parent, array, marker);
        } else
          reconcileArrays(parent, current, array);
      } else {
        current && cleanChildren(parent);
        appendNodes(parent, array);
      }
      current = array;
    } else if (value.nodeType) {
      if (sharedConfig.context && value.parentNode)
        return current = multi ? [value] : value;
      if (Array.isArray(current)) {
        if (multi)
          return current = cleanChildren(parent, current, marker, value);
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !parent.firstChild) {
        parent.appendChild(value);
      } else
        parent.replaceChild(value, parent.firstChild);
      current = value;
    } else
      ;
    return current;
  }
  function normalizeIncomingArray(normalized, array, current, unwrap3) {
    let dynamic = false;
    for (let i2 = 0, len = array.length; i2 < len; i2++) {
      let item = array[i2], prev = current && current[normalized.length], t2;
      if (item == null || item === true || item === false)
        ;
      else if ((t2 = typeof item) === "object" && item.nodeType) {
        normalized.push(item);
      } else if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
      } else if (t2 === "function") {
        if (unwrap3) {
          while (typeof item === "function")
            item = item();
          dynamic = normalizeIncomingArray(
            normalized,
            Array.isArray(item) ? item : [item],
            Array.isArray(prev) ? prev : [prev]
          ) || dynamic;
        } else {
          normalized.push(item);
          dynamic = true;
        }
      } else {
        const value = String(item);
        if (prev && prev.nodeType === 3 && prev.data === value)
          normalized.push(prev);
        else
          normalized.push(document.createTextNode(value));
      }
    }
    return dynamic;
  }
  function appendNodes(parent, array, marker = null) {
    for (let i2 = 0, len = array.length; i2 < len; i2++)
      parent.insertBefore(array[i2], marker);
  }
  function cleanChildren(parent, current, marker, replacement) {
    if (marker === void 0)
      return parent.textContent = "";
    const node = replacement || document.createTextNode("");
    if (current.length) {
      let inserted = false;
      for (let i2 = current.length - 1; i2 >= 0; i2--) {
        const el = current[i2];
        if (node !== el) {
          const isParent = el.parentNode === parent;
          if (!inserted && !i2)
            isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
          else
            isParent && el.remove();
        } else
          inserted = true;
      }
    } else
      parent.insertBefore(node, marker);
    return [node];
  }
  function getHydrationKey() {
    const hydrate = sharedConfig.context;
    return `${hydrate.id}${hydrate.count++}`;
  }
  var RequestContext = Symbol();
  var isServer = false;
  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  function createElement(tagName, isSVG = false) {
    return isSVG ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName);
  }
  function Portal(props) {
    const { useShadow } = props, marker = document.createTextNode(""), mount = () => props.mount || document.body, owner = getOwner();
    let content;
    let hydrating = !!sharedConfig.context;
    createEffect(
      () => {
        if (hydrating)
          getOwner().user = hydrating = false;
        content || (content = runWithOwner(owner, () => createMemo(() => props.children)));
        const el = mount();
        if (el instanceof HTMLHeadElement) {
          const [clean, setClean] = createSignal(false);
          const cleanup = () => setClean(true);
          createRoot((dispose2) => insert(el, () => !clean() ? content() : dispose2(), null));
          onCleanup(cleanup);
        } else {
          const container = createElement(props.isSVG ? "g" : "div", props.isSVG), renderRoot = useShadow && container.attachShadow ? container.attachShadow({
            mode: "open"
          }) : container;
          Object.defineProperty(container, "_$host", {
            get() {
              return marker.parentNode;
            },
            configurable: true
          });
          insert(renderRoot, content);
          el.appendChild(container);
          props.ref && props.ref(container);
          onCleanup(() => el.removeChild(container));
        }
      },
      void 0,
      {
        render: !hydrating
      }
    );
    return marker;
  }
  function Dynamic(props) {
    const [p2, others] = splitProps(props, ["component"]);
    const cached = createMemo(() => p2.component);
    return createMemo(() => {
      const component = cached();
      switch (typeof component) {
        case "function":
          return untrack(() => component(others));
        case "string":
          const isSvg = SVGElements.has(component);
          const el = sharedConfig.context ? getNextElement() : createElement(component, isSvg);
          spread(el, others, isSvg);
          return el;
      }
    });
  }

  // node_modules/goober/dist/goober.modern.js
  var e = { data: "" };
  var t = (t2) => "object" == typeof window ? ((t2 ? t2.querySelector("#_goober") : window._goober) || Object.assign((t2 || document.head).appendChild(document.createElement("style")), { innerHTML: " ", id: "_goober" })).firstChild : t2 || e;
  var l = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
  var a = /\/\*[^]*?\*\/|  +/g;
  var n = /\n+/g;
  var o = (e2, t2) => {
    let r = "", l2 = "", a2 = "";
    for (let n2 in e2) {
      let c2 = e2[n2];
      "@" == n2[0] ? "i" == n2[1] ? r = n2 + " " + c2 + ";" : l2 += "f" == n2[1] ? o(c2, n2) : n2 + "{" + o(c2, "k" == n2[1] ? "" : t2) + "}" : "object" == typeof c2 ? l2 += o(c2, t2 ? t2.replace(/([^,])+/g, (e3) => n2.replace(/(^:.*)|([^,])+/g, (t3) => /&/.test(t3) ? t3.replace(/&/g, e3) : e3 ? e3 + " " + t3 : t3)) : n2) : null != c2 && (n2 = /^--/.test(n2) ? n2 : n2.replace(/[A-Z]/g, "-$&").toLowerCase(), a2 += o.p ? o.p(n2, c2) : n2 + ":" + c2 + ";");
    }
    return r + (t2 && a2 ? t2 + "{" + a2 + "}" : a2) + l2;
  };
  var c = {};
  var s = (e2) => {
    if ("object" == typeof e2) {
      let t2 = "";
      for (let r in e2)
        t2 += r + s(e2[r]);
      return t2;
    }
    return e2;
  };
  var i = (e2, t2, r, i2, p2) => {
    let u2 = s(e2), d = c[u2] || (c[u2] = ((e3) => {
      let t3 = 0, r2 = 11;
      for (; t3 < e3.length; )
        r2 = 101 * r2 + e3.charCodeAt(t3++) >>> 0;
      return "go" + r2;
    })(u2));
    if (!c[d]) {
      let t3 = u2 !== e2 ? e2 : ((e3) => {
        let t4, r2, o2 = [{}];
        for (; t4 = l.exec(e3.replace(a, "")); )
          t4[4] ? o2.shift() : t4[3] ? (r2 = t4[3].replace(n, " ").trim(), o2.unshift(o2[0][r2] = o2[0][r2] || {})) : o2[0][t4[1]] = t4[2].replace(n, " ").trim();
        return o2[0];
      })(e2);
      c[d] = o(p2 ? { ["@keyframes " + d]: t3 } : t3, r ? "" : "." + d);
    }
    let f = r && c.g ? c.g : null;
    return r && (c.g = c[d]), ((e3, t3, r2, l2) => {
      l2 ? t3.data = t3.data.replace(l2, e3) : -1 === t3.data.indexOf(e3) && (t3.data = r2 ? e3 + t3.data : t3.data + e3);
    })(c[d], t2, i2, f), d;
  };
  var p = (e2, t2, r) => e2.reduce((e3, l2, a2) => {
    let n2 = t2[a2];
    if (n2 && n2.call) {
      let e4 = n2(r), t3 = e4 && e4.props && e4.props.className || /^go/.test(e4) && e4;
      n2 = t3 ? "." + t3 : e4 && "object" == typeof e4 ? e4.props ? "" : o(e4, "") : false === e4 ? "" : e4;
    }
    return e3 + l2 + (null == n2 ? "" : n2);
  }, "");
  function u(e2) {
    let r = this || {}, l2 = e2.call ? e2(r.p) : e2;
    return i(l2.unshift ? l2.raw ? p(l2, [].slice.call(arguments, 1), r.p) : l2.reduce((e3, t2) => Object.assign(e3, t2 && t2.call ? t2(r.p) : t2), {}) : l2, t(r.target), r.g, r.o, r.k);
  }
  var b = u.bind({ g: 1 });
  var h = u.bind({ k: 1 });

  // node_modules/solid-styled-components/src/index.js
  var getForwardProps = null;
  var ThemeContext = createContext();
  function makeStyled(tag) {
    let _ctx = this || {};
    return (...args) => {
      const Styled = (props) => {
        const theme = useContext(ThemeContext);
        const withTheme = mergeProps(props, { theme });
        const clone = mergeProps(withTheme, {
          get class() {
            const pClass = withTheme.class, append = "class" in withTheme && /^go[0-9]+/.test(pClass);
            let className2 = u.apply(
              { target: _ctx.target, o: append, p: withTheme, g: _ctx.g },
              args
            );
            return [pClass, className2].filter(Boolean).join(" ");
          }
        });
        const [local, newProps] = splitProps(clone, ["as", "theme"]);
        const htmlProps = getForwardProps ? splitProps(newProps, getForwardProps(Object.keys(newProps)))[0] : newProps;
        const createTag = local.as || tag;
        let el;
        if (typeof createTag === "function") {
          el = createTag(htmlProps);
        } else {
          if (isServer) {
            const [local2, others] = splitProps(htmlProps, ["children", "theme"]);
            el = Dynamic({
              component: createTag,
              get children() {
                return local2.children;
              },
              ...others
            });
          } else {
            if (_ctx.g == 1) {
              el = document.createElement(createTag);
              spread(el, htmlProps);
            } else {
              el = Dynamic(mergeProps({ component: createTag }, htmlProps));
            }
          }
        }
        return el;
      };
      Styled.class = (props) => {
        return untrack(() => {
          return u.apply({ target: _ctx.target, p: props, g: _ctx.g }, args);
        });
      };
      return Styled;
    };
  }
  var styled = new Proxy(makeStyled, {
    get(target, tag) {
      return target(tag);
    }
  });
  function createGlobalStyles() {
    const fn2 = makeStyled.call({ g: 1 }, "div").apply(null, arguments);
    return function GlobalStyles(props) {
      fn2(props);
      return null;
    };
  }

  // node_modules/@popperjs/core/lib/enums.js
  var top = "top";
  var bottom = "bottom";
  var right = "right";
  var left = "left";
  var auto = "auto";
  var basePlacements = [top, bottom, right, left];
  var start = "start";
  var end = "end";
  var clippingParents = "clippingParents";
  var viewport = "viewport";
  var popper = "popper";
  var reference = "reference";
  var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
    return acc.concat([placement + "-" + start, placement + "-" + end]);
  }, []);
  var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
    return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
  }, []);
  var beforeRead = "beforeRead";
  var read = "read";
  var afterRead = "afterRead";
  var beforeMain = "beforeMain";
  var main = "main";
  var afterMain = "afterMain";
  var beforeWrite = "beforeWrite";
  var write = "write";
  var afterWrite = "afterWrite";
  var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

  // node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
  function getNodeName(element) {
    return element ? (element.nodeName || "").toLowerCase() : null;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindow.js
  function getWindow(node) {
    if (node == null) {
      return window;
    }
    if (node.toString() !== "[object Window]") {
      var ownerDocument3 = node.ownerDocument;
      return ownerDocument3 ? ownerDocument3.defaultView || window : window;
    }
    return node;
  }

  // node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
  function isElement(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }
  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }
  function isShadowRoot(node) {
    if (typeof ShadowRoot === "undefined") {
      return false;
    }
    var OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }

  // node_modules/@popperjs/core/lib/utils/getBasePlacement.js
  function getBasePlacement(placement) {
    return placement.split("-")[0];
  }

  // node_modules/@popperjs/core/lib/utils/math.js
  var max = Math.max;
  var min = Math.min;
  var round = Math.round;

  // node_modules/@popperjs/core/lib/utils/userAgent.js
  function getUAString() {
    var uaData = navigator.userAgentData;
    if (uaData != null && uaData.brands && Array.isArray(uaData.brands)) {
      return uaData.brands.map(function(item) {
        return item.brand + "/" + item.version;
      }).join(" ");
    }
    return navigator.userAgent;
  }

  // node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
  function isLayoutViewport() {
    return !/^((?!chrome|android).)*safari/i.test(getUAString());
  }

  // node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
  function getBoundingClientRect(element, includeScale, isFixedStrategy) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    var clientRect = element.getBoundingClientRect();
    var scaleX = 1;
    var scaleY = 1;
    if (includeScale && isHTMLElement(element)) {
      scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
      scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
    }
    var _ref = isElement(element) ? getWindow(element) : window, visualViewport = _ref.visualViewport;
    var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
    var x = (clientRect.left + (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) / scaleX;
    var y = (clientRect.top + (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) / scaleY;
    var width = clientRect.width / scaleX;
    var height = clientRect.height / scaleY;
    return {
      width,
      height,
      top: y,
      right: x + width,
      bottom: y + height,
      left: x,
      x,
      y
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
  function getLayoutRect(element) {
    var clientRect = getBoundingClientRect(element);
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (Math.abs(clientRect.width - width) <= 1) {
      width = clientRect.width;
    }
    if (Math.abs(clientRect.height - height) <= 1) {
      height = clientRect.height;
    }
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width,
      height
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/contains.js
  function contains(parent, child) {
    var rootNode = child.getRootNode && child.getRootNode();
    if (parent.contains(child)) {
      return true;
    } else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;
      do {
        if (next && parent.isSameNode(next)) {
          return true;
        }
        next = next.parentNode || next.host;
      } while (next);
    }
    return false;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
  function getComputedStyle2(element) {
    return getWindow(element).getComputedStyle(element);
  }

  // node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
  function isTableElement(element) {
    return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
  function getDocumentElement(element) {
    return ((isElement(element) ? element.ownerDocument : (
      // $FlowFixMe[prop-missing]
      element.document
    )) || window.document).documentElement;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
  function getParentNode(element) {
    if (getNodeName(element) === "html") {
      return element;
    }
    return (
      // this is a quicker (but less type safe) way to save quite some bytes from the bundle
      // $FlowFixMe[incompatible-return]
      // $FlowFixMe[prop-missing]
      element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
      element.parentNode || // DOM Element detected
      (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
      // $FlowFixMe[incompatible-call]: HTMLElement is a Node
      getDocumentElement(element)
    );
  }

  // node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
    getComputedStyle2(element).position === "fixed") {
      return null;
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    var isFirefox = /firefox/i.test(getUAString());
    var isIE = /Trident/i.test(getUAString());
    if (isIE && isHTMLElement(element)) {
      var elementCss = getComputedStyle2(element);
      if (elementCss.position === "fixed") {
        return null;
      }
    }
    var currentNode = getParentNode(element);
    if (isShadowRoot(currentNode)) {
      currentNode = currentNode.host;
    }
    while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
      var css = getComputedStyle2(currentNode);
      if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }
    return null;
  }
  function getOffsetParent(element) {
    var window2 = getWindow(element);
    var offsetParent = getTrueOffsetParent(element);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
      offsetParent = getTrueOffsetParent(offsetParent);
    }
    if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
      return window2;
    }
    return offsetParent || getContainingBlock(element) || window2;
  }

  // node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
  function getMainAxisFromPlacement(placement) {
    return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
  }

  // node_modules/@popperjs/core/lib/utils/within.js
  function within(min2, value, max2) {
    return max(min2, min(value, max2));
  }
  function withinMaxClamp(min2, value, max2) {
    var v = within(min2, value, max2);
    return v > max2 ? max2 : v;
  }

  // node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
  function getFreshSideObject() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  // node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), paddingObject);
  }

  // node_modules/@popperjs/core/lib/utils/expandToHashMap.js
  function expandToHashMap(value, keys) {
    return keys.reduce(function(hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }

  // node_modules/@popperjs/core/lib/modifiers/arrow.js
  var toPaddingObject = function toPaddingObject2(padding, state) {
    padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
      placement: state.placement
    })) : padding;
    return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  };
  function arrow(_ref) {
    var _state$modifiersData$;
    var state = _ref.state, name = _ref.name, options = _ref.options;
    var arrowElement = state.elements.arrow;
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? "height" : "width";
    if (!arrowElement || !popperOffsets2) {
      return;
    }
    var paddingObject = toPaddingObject(options.padding, state);
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === "y" ? top : left;
    var maxProp = axis === "y" ? bottom : right;
    var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
    var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
    var centerToReference = endDiff / 2 - startDiff / 2;
    var min2 = paddingObject[minProp];
    var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset2 = within(min2, center, max2);
    var axisProp = axis;
    state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
  }
  function effect(_ref2) {
    var state = _ref2.state, options = _ref2.options;
    var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
    if (arrowElement == null) {
      return;
    }
    if (typeof arrowElement === "string") {
      arrowElement = state.elements.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return;
      }
    }
    if (!contains(state.elements.popper, arrowElement)) {
      return;
    }
    state.elements.arrow = arrowElement;
  }
  var arrow_default = {
    name: "arrow",
    enabled: true,
    phase: "main",
    fn: arrow,
    effect,
    requires: ["popperOffsets"],
    requiresIfExists: ["preventOverflow"]
  };

  // node_modules/@popperjs/core/lib/utils/getVariation.js
  function getVariation(placement) {
    return placement.split("-")[1];
  }

  // node_modules/@popperjs/core/lib/modifiers/computeStyles.js
  var unsetSides = {
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto"
  };
  function roundOffsetsByDPR(_ref, win) {
    var x = _ref.x, y = _ref.y;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: round(x * dpr) / dpr || 0,
      y: round(y * dpr) / dpr || 0
    };
  }
  function mapToStyles(_ref2) {
    var _Object$assign2;
    var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
    var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y = _offsets$y === void 0 ? 0 : _offsets$y;
    var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
      x,
      y
    }) : {
      x,
      y
    };
    x = _ref3.x;
    y = _ref3.y;
    var hasX = offsets.hasOwnProperty("x");
    var hasY = offsets.hasOwnProperty("y");
    var sideX = left;
    var sideY = top;
    var win = window;
    if (adaptive) {
      var offsetParent = getOffsetParent(popper2);
      var heightProp = "clientHeight";
      var widthProp = "clientWidth";
      if (offsetParent === getWindow(popper2)) {
        offsetParent = getDocumentElement(popper2);
        if (getComputedStyle2(offsetParent).position !== "static" && position === "absolute") {
          heightProp = "scrollHeight";
          widthProp = "scrollWidth";
        }
      }
      offsetParent = offsetParent;
      if (placement === top || (placement === left || placement === right) && variation === end) {
        sideY = bottom;
        var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : (
          // $FlowFixMe[prop-missing]
          offsetParent[heightProp]
        );
        y -= offsetY - popperRect.height;
        y *= gpuAcceleration ? 1 : -1;
      }
      if (placement === left || (placement === top || placement === bottom) && variation === end) {
        sideX = right;
        var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : (
          // $FlowFixMe[prop-missing]
          offsetParent[widthProp]
        );
        x -= offsetX - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }
    var commonStyles = Object.assign({
      position
    }, adaptive && unsetSides);
    var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
      x,
      y
    }, getWindow(popper2)) : {
      x,
      y
    };
    x = _ref4.x;
    y = _ref4.y;
    if (gpuAcceleration) {
      var _Object$assign;
      return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
    }
    return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
  }
  function computeStyles(_ref5) {
    var state = _ref5.state, options = _ref5.options;
    var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
    var commonStyles = {
      placement: getBasePlacement(state.placement),
      variation: getVariation(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration,
      isFixed: state.options.strategy === "fixed"
    };
    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.popperOffsets,
        position: state.options.strategy,
        adaptive,
        roundOffsets
      })));
    }
    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.arrow,
        position: "absolute",
        adaptive: false,
        roundOffsets
      })));
    }
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-placement": state.placement
    });
  }
  var computeStyles_default = {
    name: "computeStyles",
    enabled: true,
    phase: "beforeWrite",
    fn: computeStyles,
    data: {}
  };

  // node_modules/@popperjs/core/lib/modifiers/eventListeners.js
  var passive = {
    passive: true
  };
  function effect2(_ref) {
    var state = _ref.state, instance = _ref.instance, options = _ref.options;
    var _options$scroll = options.scroll, scroll2 = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
    var window2 = getWindow(state.elements.popper);
    var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
    if (scroll2) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.addEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.addEventListener("resize", instance.update, passive);
    }
    return function() {
      if (scroll2) {
        scrollParents.forEach(function(scrollParent) {
          scrollParent.removeEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window2.removeEventListener("resize", instance.update, passive);
      }
    };
  }
  var eventListeners_default = {
    name: "eventListeners",
    enabled: true,
    phase: "write",
    fn: function fn() {
    },
    effect: effect2,
    data: {}
  };

  // node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
  var hash = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function(matched) {
      return hash[matched];
    });
  }

  // node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
  var hash2 = {
    start: "end",
    end: "start"
  };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function(matched) {
      return hash2[matched];
    });
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return {
      scrollLeft,
      scrollTop
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
  function getWindowScrollBarX(element) {
    return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
  function getViewportRect(element, strategy) {
    var win = getWindow(element);
    var html = getDocumentElement(element);
    var visualViewport = win.visualViewport;
    var width = html.clientWidth;
    var height = html.clientHeight;
    var x = 0;
    var y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      var layoutViewport = isLayoutViewport();
      if (layoutViewport || !layoutViewport && strategy === "fixed") {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x: x + getWindowScrollBarX(element),
      y
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
  function getDocumentRect(element) {
    var _element$ownerDocumen;
    var html = getDocumentElement(element);
    var winScroll = getWindowScroll(element);
    var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
    var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
    var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
    var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
    var y = -winScroll.scrollTop;
    if (getComputedStyle2(body || html).direction === "rtl") {
      x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
  function isScrollParent(element) {
    var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }

  // node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
  function getScrollParent(node) {
    if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
      return node.ownerDocument.body;
    }
    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }
    return getScrollParent(getParentNode(node));
  }

  // node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
  function listScrollParents(element, list) {
    var _element$ownerDocumen;
    if (list === void 0) {
      list = [];
    }
    var scrollParent = getScrollParent(element);
    var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
    var win = getWindow(scrollParent);
    var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
    var updatedList = list.concat(target);
    return isBody ? updatedList : (
      // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
      updatedList.concat(listScrollParents(getParentNode(target)))
    );
  }

  // node_modules/@popperjs/core/lib/utils/rectToClientRect.js
  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    });
  }

  // node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
  function getInnerBoundingClientRect(element, strategy) {
    var rect = getBoundingClientRect(element, false, strategy === "fixed");
    rect.top = rect.top + element.clientTop;
    rect.left = rect.left + element.clientLeft;
    rect.bottom = rect.top + element.clientHeight;
    rect.right = rect.left + element.clientWidth;
    rect.width = element.clientWidth;
    rect.height = element.clientHeight;
    rect.x = rect.left;
    rect.y = rect.top;
    return rect;
  }
  function getClientRectFromMixedType(element, clippingParent, strategy) {
    return clippingParent === viewport ? rectToClientRect(getViewportRect(element, strategy)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent, strategy) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  }
  function getClippingParents(element) {
    var clippingParents2 = listScrollParents(getParentNode(element));
    var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
    var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
    if (!isElement(clipperElement)) {
      return [];
    }
    return clippingParents2.filter(function(clippingParent) {
      return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
    });
  }
  function getClippingRect(element, boundary, rootBoundary, strategy) {
    var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
    var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents2[0];
    var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
      var rect = getClientRectFromMixedType(element, clippingParent, strategy);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromMixedType(element, firstClippingParent, strategy));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }

  // node_modules/@popperjs/core/lib/utils/computeOffsets.js
  function computeOffsets(_ref) {
    var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference2.x + reference2.width / 2 - element.width / 2;
    var commonY = reference2.y + reference2.height / 2 - element.height / 2;
    var offsets;
    switch (basePlacement) {
      case top:
        offsets = {
          x: commonX,
          y: reference2.y - element.height
        };
        break;
      case bottom:
        offsets = {
          x: commonX,
          y: reference2.y + reference2.height
        };
        break;
      case right:
        offsets = {
          x: reference2.x + reference2.width,
          y: commonY
        };
        break;
      case left:
        offsets = {
          x: reference2.x - element.width,
          y: commonY
        };
        break;
      default:
        offsets = {
          x: reference2.x,
          y: reference2.y
        };
    }
    var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
    if (mainAxis != null) {
      var len = mainAxis === "y" ? "height" : "width";
      switch (variation) {
        case start:
          offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
          break;
        case end:
          offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
          break;
        default:
      }
    }
    return offsets;
  }

  // node_modules/@popperjs/core/lib/utils/detectOverflow.js
  function detectOverflow(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$strategy = _options.strategy, strategy = _options$strategy === void 0 ? state.strategy : _options$strategy, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    var altContext = elementContext === popper ? reference : popper;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary, strategy);
    var referenceClientRect = getBoundingClientRect(state.elements.reference);
    var popperOffsets2 = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: "absolute",
      placement
    });
    var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
    var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
    var offsetData = state.modifiersData.offset;
    if (elementContext === popper && offsetData) {
      var offset2 = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function(key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
        overflowOffsets[key] += offset2[axis] * multiply;
      });
    }
    return overflowOffsets;
  }

  // node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements2 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
      return getVariation(placement2) === variation;
    }) : basePlacements;
    var allowedPlacements = placements2.filter(function(placement2) {
      return allowedAutoPlacements.indexOf(placement2) >= 0;
    });
    if (allowedPlacements.length === 0) {
      allowedPlacements = placements2;
    }
    var overflows = allowedPlacements.reduce(function(acc, placement2) {
      acc[placement2] = detectOverflow(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding
      })[getBasePlacement(placement2)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function(a2, b2) {
      return overflows[a2] - overflows[b2];
    });
  }

  // node_modules/@popperjs/core/lib/modifiers/flip.js
  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === auto) {
      return [];
    }
    var oppositePlacement = getOppositePlacement(placement);
    return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
  }
  function flip(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    if (state.modifiersData[name]._skip) {
      return;
    }
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
    var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
      return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding,
        flipVariations,
        allowedAutoPlacements
      }) : placement2);
    }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = /* @__PURE__ */ new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements2[0];
    for (var i2 = 0; i2 < placements2.length; i2++) {
      var placement = placements2[i2];
      var _basePlacement = getBasePlacement(placement);
      var isStartVariation = getVariation(placement) === start;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? "width" : "height";
      var overflow = detectOverflow(state, {
        placement,
        boundary,
        rootBoundary,
        altBoundary,
        padding
      });
      var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }
      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];
      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }
      if (checkAltAxis) {
        checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
      }
      if (checks.every(function(check) {
        return check;
      })) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }
      checksMap.set(placement, checks);
    }
    if (makeFallbackChecks) {
      var numberOfChecks = flipVariations ? 3 : 1;
      var _loop = function _loop2(_i2) {
        var fittingPlacement = placements2.find(function(placement2) {
          var checks2 = checksMap.get(placement2);
          if (checks2) {
            return checks2.slice(0, _i2).every(function(check) {
              return check;
            });
          }
        });
        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };
      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);
        if (_ret === "break")
          break;
      }
    }
    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  }
  var flip_default = {
    name: "flip",
    enabled: true,
    phase: "main",
    fn: flip,
    requiresIfExists: ["offset"],
    data: {
      _skip: false
    }
  };

  // node_modules/@popperjs/core/lib/modifiers/hide.js
  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = {
        x: 0,
        y: 0
      };
    }
    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x
    };
  }
  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function(side) {
      return overflow[side] >= 0;
    });
  }
  function hide(_ref) {
    var state = _ref.state, name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow(state, {
      elementContext: "reference"
    });
    var popperAltOverflow = detectOverflow(state, {
      altBoundary: true
    });
    var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets,
      popperEscapeOffsets,
      isReferenceHidden,
      hasPopperEscaped
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-reference-hidden": isReferenceHidden,
      "data-popper-escaped": hasPopperEscaped
    });
  }
  var hide_default = {
    name: "hide",
    enabled: true,
    phase: "main",
    requiresIfExists: ["preventOverflow"],
    fn: hide
  };

  // node_modules/@popperjs/core/lib/modifiers/offset.js
  function distanceAndSkiddingToXY(placement, rects, offset2) {
    var basePlacement = getBasePlacement(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
    var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
      placement
    })) : offset2, skidding = _ref[0], distance = _ref[1];
    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0 ? {
      x: distance,
      y: skidding
    } : {
      x: skidding,
      y: distance
    };
  }
  function offset(_ref2) {
    var state = _ref2.state, options = _ref2.options, name = _ref2.name;
    var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data = placements.reduce(function(acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
      return acc;
    }, {});
    var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x;
      state.modifiersData.popperOffsets.y += y;
    }
    state.modifiersData[name] = data;
  }
  var offset_default = {
    name: "offset",
    enabled: true,
    phase: "main",
    requires: ["popperOffsets"],
    fn: offset
  };

  // node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
  function popperOffsets(_ref) {
    var state = _ref.state, name = _ref.name;
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: "absolute",
      placement: state.placement
    });
  }
  var popperOffsets_default = {
    name: "popperOffsets",
    enabled: true,
    phase: "read",
    fn: popperOffsets,
    data: {}
  };

  // node_modules/@popperjs/core/lib/utils/getAltAxis.js
  function getAltAxis(axis) {
    return axis === "x" ? "y" : "x";
  }

  // node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
  function preventOverflow(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow(state, {
      boundary,
      rootBoundary,
      padding,
      altBoundary
    });
    var basePlacement = getBasePlacement(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
      placement: state.placement
    })) : tetherOffset;
    var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
      mainAxis: tetherOffsetValue,
      altAxis: tetherOffsetValue
    } : Object.assign({
      mainAxis: 0,
      altAxis: 0
    }, tetherOffsetValue);
    var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
    var data = {
      x: 0,
      y: 0
    };
    if (!popperOffsets2) {
      return;
    }
    if (checkMainAxis) {
      var _offsetModifierState$;
      var mainSide = mainAxis === "y" ? top : left;
      var altSide = mainAxis === "y" ? bottom : right;
      var len = mainAxis === "y" ? "height" : "width";
      var offset2 = popperOffsets2[mainAxis];
      var min2 = offset2 + overflow[mainSide];
      var max2 = offset2 - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
      var arrowElement = state.elements.arrow;
      var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
        width: 0,
        height: 0
      };
      var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide];
      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
      var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
      var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
      var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
      var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
      var tetherMax = offset2 + maxOffset - offsetModifierValue;
      var preventedOffset = within(tether ? min(min2, tetherMin) : min2, offset2, tether ? max(max2, tetherMax) : max2);
      popperOffsets2[mainAxis] = preventedOffset;
      data[mainAxis] = preventedOffset - offset2;
    }
    if (checkAltAxis) {
      var _offsetModifierState$2;
      var _mainSide = mainAxis === "x" ? top : left;
      var _altSide = mainAxis === "x" ? bottom : right;
      var _offset = popperOffsets2[altAxis];
      var _len = altAxis === "y" ? "height" : "width";
      var _min = _offset + overflow[_mainSide];
      var _max = _offset - overflow[_altSide];
      var isOriginSide = [top, left].indexOf(basePlacement) !== -1;
      var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
      var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
      var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
      var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
      popperOffsets2[altAxis] = _preventedOffset;
      data[altAxis] = _preventedOffset - _offset;
    }
    state.modifiersData[name] = data;
  }
  var preventOverflow_default = {
    name: "preventOverflow",
    enabled: true,
    phase: "main",
    fn: preventOverflow,
    requiresIfExists: ["offset"]
  };

  // node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
  function getHTMLElementScroll(element) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }

  // node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
  function isElementScaled(element) {
    var rect = element.getBoundingClientRect();
    var scaleX = round(rect.width) / element.offsetWidth || 1;
    var scaleY = round(rect.height) / element.offsetHeight || 1;
    return scaleX !== 1 || scaleY !== 1;
  }
  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    var isOffsetParentAnElement = isHTMLElement(offsetParent);
    var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled, isFixed);
    var scroll2 = {
      scrollLeft: 0,
      scrollTop: 0
    };
    var offsets = {
      x: 0,
      y: 0
    };
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
      isScrollParent(documentElement)) {
        scroll2 = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent, true);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll2.scrollLeft - offsets.x,
      y: rect.top + scroll2.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  // node_modules/@popperjs/core/lib/utils/orderModifiers.js
  function order(modifiers) {
    var map = /* @__PURE__ */ new Map();
    var visited = /* @__PURE__ */ new Set();
    var result = [];
    modifiers.forEach(function(modifier) {
      map.set(modifier.name, modifier);
    });
    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
      requires.forEach(function(dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);
          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }
    modifiers.forEach(function(modifier) {
      if (!visited.has(modifier.name)) {
        sort(modifier);
      }
    });
    return result;
  }
  function orderModifiers(modifiers) {
    var orderedModifiers = order(modifiers);
    return modifierPhases.reduce(function(acc, phase) {
      return acc.concat(orderedModifiers.filter(function(modifier) {
        return modifier.phase === phase;
      }));
    }, []);
  }

  // node_modules/@popperjs/core/lib/utils/debounce.js
  function debounce(fn2) {
    var pending;
    return function() {
      if (!pending) {
        pending = new Promise(function(resolve) {
          Promise.resolve().then(function() {
            pending = void 0;
            resolve(fn2());
          });
        });
      }
      return pending;
    };
  }

  // node_modules/@popperjs/core/lib/utils/mergeByName.js
  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function(merged2, current) {
      var existing = merged2[current.name];
      merged2[current.name] = existing ? Object.assign({}, existing, current, {
        options: Object.assign({}, existing.options, current.options),
        data: Object.assign({}, existing.data, current.data)
      }) : current;
      return merged2;
    }, {});
    return Object.keys(merged).map(function(key) {
      return merged[key];
    });
  }

  // node_modules/@popperjs/core/lib/createPopper.js
  var DEFAULT_OPTIONS = {
    placement: "bottom",
    modifiers: [],
    strategy: "absolute"
  };
  function areValidElements() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return !args.some(function(element) {
      return !(element && typeof element.getBoundingClientRect === "function");
    });
  }
  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }
    var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions2 = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
    return function createPopper3(reference2, popper2, options) {
      if (options === void 0) {
        options = defaultOptions2;
      }
      var state = {
        placement: "bottom",
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions2),
        modifiersData: {},
        elements: {
          reference: reference2,
          popper: popper2
        },
        attributes: {},
        styles: {}
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state,
        setOptions: function setOptions(setOptionsAction) {
          var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
          cleanupModifierEffects();
          state.options = Object.assign({}, defaultOptions2, state.options, options2);
          state.scrollParents = {
            reference: isElement(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
            popper: listScrollParents(popper2)
          };
          var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers)));
          state.orderedModifiers = orderedModifiers.filter(function(m2) {
            return m2.enabled;
          });
          runModifierEffects();
          return instance.update();
        },
        // Sync update – it will always be executed, even if not necessary. This
        // is useful for low frequency updates where sync behavior simplifies the
        // logic.
        // For high frequency updates (e.g. `resize` and `scroll` events), always
        // prefer the async Popper#update method
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }
          var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
          if (!areValidElements(reference3, popper3)) {
            return;
          }
          state.rects = {
            reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
            popper: getLayoutRect(popper3)
          };
          state.reset = false;
          state.placement = state.options.placement;
          state.orderedModifiers.forEach(function(modifier) {
            return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
          });
          for (var index = 0; index < state.orderedModifiers.length; index++) {
            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }
            var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
            if (typeof fn2 === "function") {
              state = fn2({
                state,
                options: _options,
                name,
                instance
              }) || state;
            }
          }
        },
        // Async and optimistically optimized update – it will not be executed if
        // not necessary (debounced to run at most once-per-tick)
        update: debounce(function() {
          return new Promise(function(resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        }
      };
      if (!areValidElements(reference2, popper2)) {
        return instance;
      }
      instance.setOptions(options).then(function(state2) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state2);
        }
      });
      function runModifierEffects() {
        state.orderedModifiers.forEach(function(_ref) {
          var name = _ref.name, _ref$options = _ref.options, options2 = _ref$options === void 0 ? {} : _ref$options, effect3 = _ref.effect;
          if (typeof effect3 === "function") {
            var cleanupFn = effect3({
              state,
              name,
              instance,
              options: options2
            });
            var noopFn = function noopFn2() {
            };
            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }
      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function(fn2) {
          return fn2();
        });
        effectCleanupFns = [];
      }
      return instance;
    };
  }

  // node_modules/solid-react-transition/dist/esm/index.js
  var TransitionGroupContext = createContext(null);
  var TransitionGroupContext$1 = TransitionGroupContext;
  function nextFrame(fn2) {
    requestAnimationFrame(() => {
      requestAnimationFrame(fn2);
    });
  }
  var UNMOUNTED = "unmounted";
  var EXITED = "exited";
  var ENTERING = "entering";
  var ENTERED = "entered";
  var EXITING = "exiting";
  function noop() {
  }
  var defaultProps = {
    in: false,
    mountOnEnter: false,
    unmountOnExit: false,
    appear: false,
    enter: true,
    exit: true,
    onEnter: noop,
    onEntering: noop,
    onEntered: noop,
    onExit: noop,
    onExiting: noop,
    onExited: noop
  };
  var Transition2 = (p2) => {
    const [local, childProps] = splitProps(mergeProps(defaultProps, p2), ["in", "children", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
    let context2 = useContext(TransitionGroupContext$1);
    let childRef;
    let appear = context2 && !context2.isMounting ? local.enter : local.appear;
    let initialStatus;
    let appearStatus = null;
    if (local.in) {
      if (appear) {
        initialStatus = EXITED;
        appearStatus = ENTERING;
      } else {
        initialStatus = ENTERED;
      }
    } else {
      if (local.unmountOnExit || local.mountOnEnter) {
        initialStatus = UNMOUNTED;
      } else {
        initialStatus = EXITED;
      }
    }
    const [status, setStatus] = createSignal(initialStatus);
    let nextCallback = null;
    const [mounted, setMounted] = createSignal(false);
    const notUnmounted = createMemo(() => status() !== UNMOUNTED);
    onMount(() => {
      updateStatus(true, appearStatus);
      setMounted(true);
    });
    const inMemo = createMemo(() => local.in);
    createComputed(on(inMemo, () => {
      if (!mounted())
        return;
      const prevStatus = status();
      if (inMemo() && prevStatus === UNMOUNTED) {
        setStatus(EXITED);
      }
      let nextStatus = null;
      if (inMemo()) {
        if (prevStatus !== ENTERING && prevStatus !== ENTERED) {
          nextStatus = ENTERING;
        }
      } else {
        if (prevStatus === ENTERING || prevStatus === ENTERED) {
          nextStatus = EXITING;
        }
      }
      updateStatus(false, nextStatus ?? EXITED);
    }));
    onCleanup(() => {
      cancelNextCallback();
    });
    function getTimeouts() {
      const {
        timeout
      } = local;
      let exit, enter, appear2;
      if (typeof timeout === "number") {
        exit = enter = appear2 = timeout;
      } else if (timeout != null) {
        exit = timeout.exit;
        enter = timeout.enter;
        appear2 = timeout.appear !== void 0 ? timeout.appear : enter;
      }
      return {
        exit,
        enter,
        appear: appear2
      };
    }
    function updateStatus(mounting = false, nextStatus) {
      if (nextStatus !== null) {
        cancelNextCallback();
        if (nextStatus === ENTERING) {
          performEnter(mounting);
        } else {
          performExit();
        }
      } else if (local.unmountOnExit && status() === EXITED) {
        setStatus(UNMOUNTED);
      }
    }
    function performEnter(mounting) {
      const {
        enter
      } = local;
      const appearing = context2 ? context2.isMounting : mounting;
      const [maybeNode, maybeAppearing] = local.nodeRef ? [appearing] : [childRef, appearing];
      const timeouts = getTimeouts();
      const enterTimeout = appearing ? timeouts.appear : timeouts.enter;
      if (!mounting && !enter) {
        safeSetState(ENTERED, () => {
          local.onEntered(maybeNode);
        });
        return;
      }
      local.onEnter(maybeNode, maybeAppearing);
      nextFrame(() => safeSetState(ENTERING, () => {
        local.onEntering(maybeNode, maybeAppearing);
        onTransitionEnd(enterTimeout, () => {
          safeSetState(ENTERED, () => {
            local.onEntered(maybeNode, maybeAppearing);
          });
        });
      }));
    }
    function performExit() {
      const {
        exit
      } = local;
      const timeouts = getTimeouts();
      const maybeNode = local.nodeRef ? void 0 : childRef;
      if (!exit) {
        safeSetState(EXITED, () => {
          local.onExited(maybeNode);
        });
        return;
      }
      local.onExit(maybeNode);
      nextFrame(() => safeSetState(EXITING, () => {
        local.onExiting(maybeNode);
        onTransitionEnd(timeouts.exit, () => {
          safeSetState(EXITED, () => {
            local.onExited(maybeNode);
          });
          if (local.unmountOnExit) {
            nextFrame(() => {
              setStatus(UNMOUNTED);
            });
          }
        });
      }));
    }
    function cancelNextCallback() {
      if (nextCallback !== null) {
        nextCallback?.cancel();
        nextCallback = null;
      }
    }
    function safeSetState(nextState, callback) {
      callback = setNextCallback(callback);
      setStatus(nextState);
      callback();
    }
    function setNextCallback(callback) {
      let active = true;
      nextCallback = (...args) => {
        if (active) {
          active = false;
          nextCallback = null;
          callback(...args);
        }
      };
      nextCallback.cancel = () => {
        active = false;
      };
      return nextCallback;
    }
    function onTransitionEnd(timeout, handler) {
      setNextCallback(handler);
      const node = local.nodeRef ? local.nodeRef : childRef;
      const doesNotHaveTimeoutOrListener = timeout == null && !local.addEndListener;
      if (!node || doesNotHaveTimeoutOrListener) {
        nextCallback && setTimeout(nextCallback, 0);
        return;
      }
      if (local.addEndListener) {
        const [maybeNode, maybeNextCallback] = local.nodeRef ? [nextCallback] : [node, nextCallback];
        local.addEndListener(maybeNode, maybeNextCallback);
      }
      if (timeout != null && nextCallback) {
        setTimeout(nextCallback, timeout);
      }
    }
    let resolvedChildren;
    function renderChild() {
      if (!resolvedChildren)
        resolvedChildren = children(() => local.children);
      const c2 = resolvedChildren();
      return typeof c2 === "function" ? c2(status(), childProps) : c2;
    }
    return createComponent(TransitionGroupContext$1.Provider, {
      value: null,
      get children() {
        return createComponent(Show, {
          get when() {
            return notUnmounted();
          },
          get children() {
            return renderChild();
          }
        });
      }
    });
  };

  // node_modules/solid-bootstrap-core/dist/esm/index.js
  function callEventHandler(h2, e2) {
    let isPropagationStopped = false;
    const defaultFn = e2.stopPropagation;
    e2.stopPropagation = () => {
      isPropagationStopped = true;
      defaultFn();
    };
    if (typeof h2 === "function") {
      h2(e2);
    } else if (Array.isArray(h2)) {
      h2[0](h2[1], e2);
    }
    e2.stopPropagation = defaultFn;
    return {
      isPropagationStopped
    };
  }
  function resolveClasses(el, prev, now) {
    const p2 = prev ? prev.split(" ") : [];
    const n2 = now ? now.split(" ") : [];
    el.classList?.remove(...p2.filter((s2) => n2.indexOf(s2) === -1));
    el.classList?.add(...n2.filter((s2) => p2.indexOf(s2) === -1));
  }
  function isTrivialHref$1(href) {
    return !href || href.trim() === "#";
  }
  var defaultOptions = {
    tabIndex: 0
  };
  function useButtonProps(o2) {
    const options = mergeProps(defaultOptions, o2);
    const tagName = createMemo(() => {
      if (!options.tagName) {
        if (options.href != null || options.target != null || options.rel != null) {
          return "a";
        } else {
          return "button";
        }
      }
      return options.tagName;
    });
    const meta = {
      get tagName() {
        return tagName();
      }
    };
    if (tagName() === "button") {
      return [{
        get type() {
          return options.type || "button";
        },
        get disabled() {
          return options.disabled;
        }
      }, meta];
    }
    const getClickHandler = createMemo(() => (event) => {
      if (options.disabled || tagName() === "a" && isTrivialHref$1(options.href)) {
        event.preventDefault();
      }
      if (options.disabled) {
        event.stopPropagation();
        return;
      }
      callEventHandler(options.onClick, event);
    });
    const getKeyDownHandler = createMemo(() => (event) => {
      if (event.key === " ") {
        event.preventDefault();
        getClickHandler()(
          event
          /*HACK calling click handler with keyboard event*/
        );
      }
    });
    const getHref = () => {
      if (tagName() === "a") {
        return options.disabled ? void 0 : options.href || "#";
      }
      return options.href;
    };
    return [{
      role: "button",
      // explicitly undefined so that it overrides the props disabled in a spread
      // e.g. <Tag {...props} {...hookProps} />
      disabled: void 0,
      get tabIndex() {
        return options.disabled ? void 0 : options.tabIndex;
      },
      get href() {
        return getHref();
      },
      get target() {
        return tagName() === "a" ? options.target : void 0;
      },
      get "aria-disabled"() {
        return !options.disabled ? void 0 : options.disabled;
      },
      get rel() {
        return tagName() === "a" ? options.rel : void 0;
      },
      get onClick() {
        return getClickHandler();
      },
      get onKeyDown() {
        return getKeyDownHandler();
      }
    }, meta];
  }
  var Button = (props) => {
    const [local, otherProps] = splitProps(props, ["as"]);
    props.tabIndex;
    const [buttonProps, {
      tagName
    }] = useButtonProps({
      tagName: local.as,
      ...otherProps
    });
    return createComponent(Dynamic, mergeProps(otherProps, buttonProps, {
      component: tagName
    }));
  };
  var Button$1 = Button;
  var _tmpl$$1 = /* @__PURE__ */ template(`<a></a>`, 2);
  function isTrivialHref(href) {
    return !href || href.trim() === "#";
  }
  var Anchor = (props) => {
    const [local, otherProps] = splitProps(props, ["onKeyDown"]);
    const [buttonProps] = useButtonProps(mergeProps({
      tagName: "a"
    }, otherProps));
    const handleKeyDown = (e2) => {
      callEventHandler(buttonProps.onKeyDown, e2);
      callEventHandler(local.onKeyDown, e2);
    };
    return isTrivialHref(props.href) && !props.role || props.role === "button" ? (() => {
      const _el$ = _tmpl$$1.cloneNode(true);
      spread(_el$, mergeProps(otherProps, buttonProps, {
        "onKeyDown": handleKeyDown
      }), false, false);
      return _el$;
    })() : (() => {
      const _el$2 = _tmpl$$1.cloneNode(true);
      spread(_el$2, mergeProps(otherProps, {
        get onKeyDown() {
          return local.onKeyDown;
        }
      }), false, false);
      return _el$2;
    })();
  };
  var Anchor$1 = Anchor;
  var toArray = Function.prototype.bind.call(Function.prototype.call, [].slice);
  function qsa(element, selector) {
    return toArray(element.querySelectorAll(selector));
  }
  var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
  var optionsSupported = false;
  var onceSupported = false;
  try {
    options = {
      get passive() {
        return optionsSupported = true;
      },
      get once() {
        return onceSupported = optionsSupported = true;
      }
    };
    if (canUseDOM) {
      window.addEventListener("test", options, options);
      window.removeEventListener("test", options, true);
    }
  } catch (e2) {
  }
  var options;
  function addEventListener2(node, eventName, handler, options) {
    if (options && typeof options !== "boolean" && !onceSupported) {
      var once = options.once, capture = options.capture;
      var wrappedHandler = handler;
      if (!onceSupported && once) {
        wrappedHandler = handler.__once || function onceHandler(event) {
          this.removeEventListener(eventName, onceHandler, capture);
          handler.call(this, event);
        };
        handler.__once = wrappedHandler;
      }
      node.addEventListener(eventName, wrappedHandler, optionsSupported ? options : capture);
    }
    node.addEventListener(eventName, handler, options);
  }
  var DropdownContext = createContext(null);
  var DropdownContext$1 = DropdownContext;
  var $RAW = Symbol("store-raw");
  var $NODE = Symbol("store-node");
  var $NAME = Symbol("store-name");
  function wrap$1(value, name) {
    let p2 = value[$PROXY];
    if (!p2) {
      Object.defineProperty(value, $PROXY, {
        value: p2 = new Proxy(value, proxyTraps$1)
      });
      if (!Array.isArray(value)) {
        const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
        for (let i2 = 0, l2 = keys.length; i2 < l2; i2++) {
          const prop = keys[i2];
          if (desc[prop].get) {
            const get = desc[prop].get.bind(p2);
            Object.defineProperty(value, prop, {
              enumerable: desc[prop].enumerable,
              get
            });
          }
        }
      }
    }
    return p2;
  }
  function isWrappable(obj) {
    let proto;
    return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
  }
  function unwrap(item, set = /* @__PURE__ */ new Set()) {
    let result, unwrapped, v, prop;
    if (result = item != null && item[$RAW])
      return result;
    if (!isWrappable(item) || set.has(item))
      return item;
    if (Array.isArray(item)) {
      if (Object.isFrozen(item))
        item = item.slice(0);
      else
        set.add(item);
      for (let i2 = 0, l2 = item.length; i2 < l2; i2++) {
        v = item[i2];
        if ((unwrapped = unwrap(v, set)) !== v)
          item[i2] = unwrapped;
      }
    } else {
      if (Object.isFrozen(item))
        item = Object.assign({}, item);
      else
        set.add(item);
      const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
      for (let i2 = 0, l2 = keys.length; i2 < l2; i2++) {
        prop = keys[i2];
        if (desc[prop].get)
          continue;
        v = item[prop];
        if ((unwrapped = unwrap(v, set)) !== v)
          item[prop] = unwrapped;
      }
    }
    return item;
  }
  function getDataNodes(target) {
    let nodes = target[$NODE];
    if (!nodes)
      Object.defineProperty(target, $NODE, {
        value: nodes = {}
      });
    return nodes;
  }
  function getDataNode(nodes, property, value) {
    return nodes[property] || (nodes[property] = createDataNode(value));
  }
  function proxyDescriptor$1(target, property) {
    const desc = Reflect.getOwnPropertyDescriptor(target, property);
    if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE || property === $NAME)
      return desc;
    delete desc.value;
    delete desc.writable;
    desc.get = () => target[$PROXY][property];
    return desc;
  }
  function trackSelf(target) {
    if (getListener()) {
      const nodes = getDataNodes(target);
      (nodes._ || (nodes._ = createDataNode()))();
    }
  }
  function ownKeys(target) {
    trackSelf(target);
    return Reflect.ownKeys(target);
  }
  function createDataNode(value) {
    const [s2, set] = createSignal(value, {
      equals: false,
      internal: true
    });
    s2.$ = set;
    return s2;
  }
  var proxyTraps$1 = {
    get(target, property, receiver) {
      if (property === $RAW)
        return target;
      if (property === $PROXY)
        return receiver;
      if (property === $TRACK) {
        trackSelf(target);
        return receiver;
      }
      const nodes = getDataNodes(target);
      const tracked = nodes.hasOwnProperty(property);
      let value = tracked ? nodes[property]() : target[property];
      if (property === $NODE || property === "__proto__")
        return value;
      if (!tracked) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get))
          value = getDataNode(nodes, property, value)();
      }
      return isWrappable(value) ? wrap$1(value) : value;
    },
    has(target, property) {
      if (property === $RAW || property === $PROXY || property === $TRACK || property === $NODE || property === "__proto__")
        return true;
      this.get(target, property, target);
      return property in target;
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    },
    ownKeys,
    getOwnPropertyDescriptor: proxyDescriptor$1
  };
  function setProperty(state, property, value, deleting = false) {
    if (!deleting && state[property] === value)
      return;
    const prev = state[property], len = state.length;
    if (value === void 0)
      delete state[property];
    else
      state[property] = value;
    let nodes = getDataNodes(state), node;
    if (node = getDataNode(nodes, property, prev))
      node.$(() => value);
    if (Array.isArray(state) && state.length !== len)
      (node = getDataNode(nodes, "length", len)) && node.$(state.length);
    (node = nodes._) && node.$();
  }
  function mergeStoreNode(state, value) {
    const keys = Object.keys(value);
    for (let i2 = 0; i2 < keys.length; i2 += 1) {
      const key = keys[i2];
      setProperty(state, key, value[key]);
    }
  }
  function updateArray(current, next) {
    if (typeof next === "function")
      next = next(current);
    next = unwrap(next);
    if (Array.isArray(next)) {
      if (current === next)
        return;
      let i2 = 0, len = next.length;
      for (; i2 < len; i2++) {
        const value = next[i2];
        if (current[i2] !== value)
          setProperty(current, i2, value);
      }
      setProperty(current, "length", len);
    } else
      mergeStoreNode(current, next);
  }
  function updatePath(current, path, traversed = []) {
    let part, prev = current;
    if (path.length > 1) {
      part = path.shift();
      const partType = typeof part, isArray = Array.isArray(current);
      if (Array.isArray(part)) {
        for (let i2 = 0; i2 < part.length; i2++) {
          updatePath(current, [part[i2]].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "function") {
        for (let i2 = 0; i2 < current.length; i2++) {
          if (part(current[i2], i2))
            updatePath(current, [i2].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "object") {
        const {
          from = 0,
          to = current.length - 1,
          by = 1
        } = part;
        for (let i2 = from; i2 <= to; i2 += by) {
          updatePath(current, [i2].concat(path), traversed);
        }
        return;
      } else if (path.length > 1) {
        updatePath(current[part], path, [part].concat(traversed));
        return;
      }
      prev = current[part];
      traversed = [part].concat(traversed);
    }
    let value = path[0];
    if (typeof value === "function") {
      value = value(prev, traversed);
      if (value === prev)
        return;
    }
    if (part === void 0 && value == void 0)
      return;
    value = unwrap(value);
    if (part === void 0 || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
      mergeStoreNode(prev, value);
    } else
      setProperty(current, part, value);
  }
  function createStore(...[store, options]) {
    const unwrappedStore = unwrap(store || {});
    const isArray = Array.isArray(unwrappedStore);
    const wrappedStore = wrap$1(unwrappedStore);
    function setStore(...args) {
      batch(() => {
        isArray && args.length === 1 ? updateArray(unwrappedStore, args[0]) : updatePath(unwrappedStore, args);
      });
    }
    return [wrappedStore, setStore];
  }
  var $ROOT = Symbol("store-root");
  function applyState(target, parent, property, merge, key) {
    const previous = parent[property];
    if (target === previous)
      return;
    if (!isWrappable(target) || !isWrappable(previous) || key && target[key] !== previous[key]) {
      if (target !== previous) {
        if (property === $ROOT)
          return target;
        setProperty(parent, property, target);
      }
      return;
    }
    if (Array.isArray(target)) {
      if (target.length && previous.length && (!merge || key && target[0][key] != null)) {
        let i2, j, start2, end2, newEnd, item, newIndicesNext, keyVal;
        for (start2 = 0, end2 = Math.min(previous.length, target.length); start2 < end2 && (previous[start2] === target[start2] || key && previous[start2][key] === target[start2][key]); start2++) {
          applyState(target[start2], previous, start2, merge, key);
        }
        const temp = new Array(target.length), newIndices = /* @__PURE__ */ new Map();
        for (end2 = previous.length - 1, newEnd = target.length - 1; end2 >= start2 && newEnd >= start2 && (previous[end2] === target[newEnd] || key && previous[end2][key] === target[newEnd][key]); end2--, newEnd--) {
          temp[newEnd] = previous[end2];
        }
        if (start2 > newEnd || start2 > end2) {
          for (j = start2; j <= newEnd; j++)
            setProperty(previous, j, target[j]);
          for (; j < target.length; j++) {
            setProperty(previous, j, temp[j]);
            applyState(target[j], previous, j, merge, key);
          }
          if (previous.length > target.length)
            setProperty(previous, "length", target.length);
          return;
        }
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start2; j--) {
          item = target[j];
          keyVal = key ? item[key] : item;
          i2 = newIndices.get(keyVal);
          newIndicesNext[j] = i2 === void 0 ? -1 : i2;
          newIndices.set(keyVal, j);
        }
        for (i2 = start2; i2 <= end2; i2++) {
          item = previous[i2];
          keyVal = key ? item[key] : item;
          j = newIndices.get(keyVal);
          if (j !== void 0 && j !== -1) {
            temp[j] = previous[i2];
            j = newIndicesNext[j];
            newIndices.set(keyVal, j);
          }
        }
        for (j = start2; j < target.length; j++) {
          if (j in temp) {
            setProperty(previous, j, temp[j]);
            applyState(target[j], previous, j, merge, key);
          } else
            setProperty(previous, j, target[j]);
        }
      } else {
        for (let i2 = 0, len = target.length; i2 < len; i2++) {
          applyState(target[i2], previous, i2, merge, key);
        }
      }
      if (previous.length > target.length)
        setProperty(previous, "length", target.length);
      return;
    }
    const targetKeys = Object.keys(target);
    for (let i2 = 0, len = targetKeys.length; i2 < len; i2++) {
      applyState(target[targetKeys[i2]], previous, targetKeys[i2], merge, key);
    }
    const previousKeys = Object.keys(previous);
    for (let i2 = 0, len = previousKeys.length; i2 < len; i2++) {
      if (target[previousKeys[i2]] === void 0)
        setProperty(previous, previousKeys[i2], void 0);
    }
  }
  function reconcile(value, options = {}) {
    const {
      merge,
      key = "id"
    } = options, v = unwrap(value);
    return (state) => {
      if (!isWrappable(state) || !isWrappable(v))
        return v;
      const res = applyState(v, {
        [$ROOT]: state
      }, $ROOT, merge, key);
      return res === void 0 ? state : res;
    };
  }
  var createPopper2 = popperGenerator({
    defaultModifiers: [hide_default, popperOffsets_default, computeStyles_default, eventListeners_default, offset_default, flip_default, preventOverflow_default, arrow_default]
  });
  var disabledApplyStylesModifier = {
    name: "applyStyles",
    enabled: false,
    phase: "afterWrite",
    fn: () => void 0
  };
  var ariaDescribedByModifier = {
    name: "ariaDescribedBy",
    enabled: true,
    phase: "afterWrite",
    effect: ({
      state
    }) => () => {
      const {
        reference: reference2,
        popper: popper2
      } = state.elements;
      if ("removeAttribute" in reference2) {
        const ids = (reference2.getAttribute("aria-describedby") || "").split(",").filter((id) => id.trim() !== popper2.id);
        if (!ids.length)
          reference2.removeAttribute("aria-describedby");
        else
          reference2.setAttribute("aria-describedby", ids.join(","));
      }
    },
    fn: ({
      state
    }) => {
      const {
        popper: popper2,
        reference: reference2
      } = state.elements;
      const role = popper2.getAttribute("role")?.toLowerCase();
      if (popper2.id && role === "tooltip" && "setAttribute" in reference2) {
        const ids = reference2.getAttribute("aria-describedby");
        if (ids && ids.split(",").indexOf(popper2.id) !== -1) {
          return;
        }
        reference2.setAttribute("aria-describedby", ids ? `${ids},${popper2.id}` : popper2.id);
      }
    }
  };
  var EMPTY_MODIFIERS = [];
  function usePopper(referenceElement, popperElement, options) {
    const [popperInstance, setPopperInstance] = createSignal();
    const enabled = createMemo(() => options.enabled ?? true);
    const update = createMemo(on(popperInstance, (popper2) => () => {
      popper2?.update();
    }));
    const forceUpdate = createMemo(on(popperInstance, (popper2) => () => {
      popper2?.forceUpdate();
    }));
    const [popperState, setPopperState] = createStore({
      placement: options.placement ?? "bottom",
      get update() {
        return update();
      },
      get forceUpdate() {
        return forceUpdate();
      },
      attributes: {},
      styles: {
        popper: {},
        arrow: {}
      }
    });
    const updateModifier = {
      name: "updateStateModifier",
      enabled: true,
      phase: "write",
      requires: ["computeStyles"],
      fn: ({
        state
      }) => {
        const styles = {};
        const attributes = {};
        Object.keys(state.elements).forEach((element) => {
          styles[element] = state.styles[element];
          attributes[element] = state.attributes[element];
        });
        setPopperState(reconcile({
          ...popperState,
          state,
          styles,
          attributes,
          placement: state.placement
        }, {
          merge: true
        }));
      }
    };
    createEffect(() => {
      const instance = popperInstance();
      if (!instance || !enabled())
        return;
      instance.setOptions({
        onFirstUpdate: options.onFirstUpdate,
        placement: options.placement ?? "bottom",
        modifiers: [...options.modifiers ?? EMPTY_MODIFIERS, ariaDescribedByModifier, updateModifier, disabledApplyStylesModifier],
        strategy: options.strategy ?? "absolute"
      });
      queueMicrotask(() => {
        update()();
      });
    });
    createEffect(() => {
      const target = referenceElement();
      const popper2 = popperElement();
      if (target && popper2 && enabled()) {
        let instance;
        instance = createPopper2(target, popper2, {});
        setPopperInstance(instance);
      } else {
        if (popperInstance()) {
          popperInstance().destroy();
          setPopperInstance(void 0);
          setPopperState(reconcile({
            ...popperState,
            attributes: {},
            styles: {
              popper: {}
            }
          }, {
            merge: true
          }));
        }
      }
    });
    return () => popperState;
  }
  function contains2(context2, node) {
    if (context2.contains)
      return context2.contains(node);
    if (context2.compareDocumentPosition)
      return context2 === node || !!(context2.compareDocumentPosition(node) & 16);
  }
  function removeEventListener(node, eventName, handler, options) {
    var capture = options && typeof options !== "boolean" ? options.capture : options;
    node.removeEventListener(eventName, handler, capture);
    if (handler.__once) {
      node.removeEventListener(eventName, handler.__once, capture);
    }
  }
  function listen(node, eventName, handler, options) {
    addEventListener2(node, eventName, handler, options);
    return function() {
      removeEventListener(node, eventName, handler, options);
    };
  }
  function ownerDocument(node) {
    return node && node.ownerDocument || document;
  }
  var noop$4 = () => {
  };
  function isLeftClickEvent(event) {
    return event.button === 0;
  }
  function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
  }
  var getRefTarget = (ref) => ref;
  function useClickOutside(ref, onClickOutside = noop$4, {
    disabled,
    clickTrigger = "click"
  } = {}) {
    const [preventMouseClickOutsideRef, setPreventMouseClickOutsideRef] = createSignal(false);
    const handleMouseCapture = (e2) => {
      const currentTarget = getRefTarget(ref());
      setPreventMouseClickOutsideRef(!currentTarget || isModifiedEvent(e2) || !isLeftClickEvent(e2) || !!contains2(currentTarget, e2.target));
    };
    const handleMouse = (e2) => {
      if (!preventMouseClickOutsideRef()) {
        onClickOutside(e2);
      }
    };
    createEffect(() => {
      if (disabled || ref() == null)
        return void 0;
      const doc = ownerDocument(getRefTarget(ref()));
      let currentEvent = (doc.defaultView || window).event;
      const removeMouseCaptureListener = listen(doc, clickTrigger, handleMouseCapture, true);
      const removeMouseListener = listen(doc, clickTrigger, (e2) => {
        if (e2 === currentEvent) {
          currentEvent = void 0;
          return;
        }
        handleMouse(e2);
      });
      let mobileSafariHackListeners = [];
      if ("ontouchstart" in doc.documentElement) {
        mobileSafariHackListeners = [].slice.call(doc.body.children).map((el) => listen(el, "mousemove", noop$4));
      }
      onCleanup(() => {
        removeMouseCaptureListener();
        removeMouseListener();
        mobileSafariHackListeners.forEach((remove) => remove());
      });
    });
  }
  function toModifierMap(modifiers) {
    const result = {};
    if (!Array.isArray(modifiers)) {
      return modifiers || result;
    }
    modifiers?.forEach((m2) => {
      result[m2.name] = m2;
    });
    return result;
  }
  function toModifierArray(map = {}) {
    if (Array.isArray(map))
      return map;
    return Object.keys(map).map((k) => {
      map[k].name = k;
      return map[k];
    });
  }
  function mergeOptionsWithPopperConfig({
    enabled,
    enableEvents,
    placement,
    flip: flip2,
    offset: offset2,
    fixed,
    containerPadding,
    arrowElement,
    popperConfig = {}
  }) {
    const modifiers = toModifierMap(popperConfig.modifiers);
    return {
      ...popperConfig,
      placement,
      enabled,
      strategy: fixed ? "fixed" : popperConfig.strategy,
      modifiers: toModifierArray({
        ...modifiers,
        eventListeners: {
          enabled: enableEvents
        },
        preventOverflow: {
          ...modifiers.preventOverflow,
          options: containerPadding ? {
            padding: containerPadding,
            ...modifiers.preventOverflow?.options
          } : modifiers.preventOverflow?.options
        },
        offset: {
          options: {
            offset: offset2,
            ...modifiers.offset?.options
          }
        },
        arrow: {
          ...modifiers.arrow,
          enabled: !!arrowElement,
          options: {
            ...modifiers.arrow?.options,
            element: arrowElement
          }
        },
        flip: {
          enabled: !!flip2,
          ...modifiers.flip
        }
      })
    };
  }
  var noop$3 = () => {
  };
  function useDropdownMenu(o2 = {}) {
    const context2 = useContext(DropdownContext$1);
    const [arrowElement, attachArrowRef] = createSignal();
    const [hasShownRef, setHasShownRef] = createSignal(false);
    const [popperOptions, setPopperOptions] = createStore({});
    const options = mergeProps({
      fixed: false,
      popperConfig: {},
      usePopper: !!context2
    }, o2);
    const show = createMemo(() => {
      return context2?.show == null ? !!options.show : context2.show;
    });
    createEffect(() => {
      if (show() && !hasShownRef()) {
        setHasShownRef(true);
      }
    });
    createComputed(() => {
      setPopperOptions(reconcile(mergeOptionsWithPopperConfig({
        placement: options.placement || context2?.placement || "bottom-start",
        enabled: options.usePopper ?? !!context2,
        enableEvents: options.enableEventListeners == null ? show() : options.enableEventListeners,
        offset: options.offset,
        flip: options.flip,
        fixed: options.fixed,
        arrowElement: arrowElement(),
        popperConfig: options.popperConfig
      })));
    });
    const handleClose = (e2) => {
      context2?.toggle(false, e2);
    };
    const popper2 = usePopper(() => context2?.toggleElement, () => context2?.menuElement, popperOptions);
    createEffect(() => {
      if (context2?.menuElement) {
        useClickOutside(() => context2.menuElement, handleClose, {
          get clickTrigger() {
            return options.rootCloseEvent;
          },
          get disabled() {
            return !show();
          }
        });
      }
    });
    const menuProps = mergeProps({
      get ref() {
        return context2?.setMenu || noop$3;
      },
      get style() {
        return popper2()?.styles.popper;
      },
      get "aria-labelledby"() {
        return context2?.toggleElement?.id;
      }
    }, popper2()?.attributes.popper ?? {});
    const metadata = {
      get show() {
        return show();
      },
      get placement() {
        return context2?.placement;
      },
      get hasShown() {
        return hasShownRef();
      },
      get toggle() {
        return context2?.toggle;
      },
      get popper() {
        return options.usePopper ? popper2() : null;
      },
      get arrowProps() {
        return options.usePopper ? {
          ref: attachArrowRef,
          ...popper2()?.attributes.arrow,
          style: popper2()?.styles.arrow
        } : {};
      }
    };
    return [menuProps, metadata];
  }
  function DropdownMenu(p2) {
    const [local, options] = splitProps(p2, ["children"]);
    const [props, meta] = useDropdownMenu(options);
    return createMemo(() => local.children(props, meta));
  }
  var currentId = 0;
  function useSSRSafeId(defaultId) {
    return defaultId || `solid-aria-${++currentId}`;
  }
  var isRoleMenu = (el) => el.getAttribute("role")?.toLowerCase() === "menu";
  var noop$2 = () => {
  };
  function useDropdownToggle() {
    const id = useSSRSafeId();
    const context2 = useContext(DropdownContext$1);
    const handleClick = (e2) => {
      context2.toggle(!context2.show, e2);
    };
    return [{
      id,
      get ref() {
        return context2.setToggle || noop$2;
      },
      onClick: handleClick,
      get "aria-expanded"() {
        return !!context2.show;
      },
      get "aria-haspopup"() {
        return context2.menuElement && isRoleMenu(context2.menuElement) ? true : void 0;
      }
    }, {
      get show() {
        return context2.show;
      },
      get toggle() {
        return context2.toggle;
      }
    }];
  }
  function DropdownToggle({
    children: children2
  }) {
    const [props, meta] = useDropdownToggle();
    return createMemo(() => children2(props, meta));
  }
  var SelectableContext = createContext(null);
  var makeEventKey = (eventKey, href = null) => {
    if (eventKey != null)
      return String(eventKey);
    return href || null;
  };
  var SelectableContext$1 = SelectableContext;
  var NavContext = createContext(null);
  var NavContext$1 = NavContext;
  var ATTRIBUTE_PREFIX = `data-rr-ui-`;
  var PROPERTY_PREFIX = `rrUi`;
  function dataAttr(property) {
    return `${ATTRIBUTE_PREFIX}${property}`;
  }
  function dataProp(property) {
    return `${PROPERTY_PREFIX}${property}`;
  }
  function useDropdownItem(options) {
    const onSelectCtx = useContext(SelectableContext$1);
    const navContext = useContext(NavContext$1);
    const {
      activeKey
    } = navContext || {};
    const eventKey = makeEventKey(options.key, options.href);
    const isActive = createMemo(() => options.active == null && options.key != null ? makeEventKey(activeKey) === eventKey : options.active);
    const handleClick = (event) => {
      if (options.disabled)
        return;
      let result = callEventHandler(options.onClick, event);
      if (onSelectCtx && !result.isPropagationStopped) {
        onSelectCtx(eventKey, event);
      }
    };
    return [{
      onClick: handleClick,
      get "aria-disabled"() {
        return options.disabled || void 0;
      },
      get "aria-selected"() {
        return isActive();
      },
      [dataAttr("dropdown-item")]: ""
    }, {
      get isActive() {
        return isActive();
      }
    }];
  }
  var DropdownItem = (p2) => {
    const [local, props] = splitProps(
      // merge in prop defaults
      mergeProps({
        as: Button$1
      }, p2),
      // split off local props with rest passed to Dynamic
      ["eventKey", "disabled", "onClick", "active", "as"]
    );
    const [dropdownItemProps] = useDropdownItem({
      get key() {
        return local.eventKey;
      },
      get href() {
        return props.href;
      },
      get disabled() {
        return local.disabled;
      },
      get onClick() {
        return local.onClick;
      },
      get active() {
        return local.active;
      }
    });
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, dropdownItemProps));
  };
  var DropdownItem$1 = DropdownItem;
  var Context = createContext(canUseDOM ? window : void 0);
  Context.Provider;
  function useWindow() {
    return useContext(Context);
  }
  function createControlledProp(propValue, defaultValue, handler) {
    const [stateValue, setState] = createSignal(defaultValue());
    const isControlled = createMemo(() => propValue() !== void 0);
    createComputed(on(isControlled, (is, was) => {
      if (!is && was && stateValue() !== defaultValue()) {
        setState(() => defaultValue());
      }
    }));
    const getValue = () => isControlled() ? propValue() : stateValue();
    const setValue = (value, ...args) => {
      if (handler)
        handler(value, ...args);
      setState(() => value);
    };
    return [getValue, setValue];
  }
  function Dropdown(p2) {
    const props = mergeProps({
      itemSelector: `* [${dataAttr("dropdown-item")}]`,
      placement: "bottom-start"
    }, p2);
    const window2 = useWindow();
    const [show, onToggle] = createControlledProp(() => props.show, () => props.defaultShow, props.onToggle);
    const [menuRef, setMenu] = createSignal();
    const [toggleRef, setToggle] = createSignal();
    const [lastSourceEvent, setLastSourceEvent] = createSignal(null);
    const onSelectCtx = useContext(SelectableContext$1);
    const focusInDropdown = () => menuRef()?.contains(menuRef().ownerDocument.activeElement);
    const toggle = (nextShow, event, source = event?.type) => {
      onToggle(nextShow, {
        originalEvent: event,
        source
      });
    };
    const handleSelect = (key, event) => {
      let result = callEventHandler((event2) => {
        props.onSelect?.(key, event2);
        toggle(false, event2, "select");
      }, event);
      if (!result.isPropagationStopped) {
        onSelectCtx?.(key, event);
      }
    };
    const context2 = {
      toggle,
      setMenu,
      setToggle,
      get placement() {
        return props.placement;
      },
      get show() {
        return show();
      },
      get menuElement() {
        return menuRef();
      },
      get toggleElement() {
        return toggleRef();
      }
    };
    const focusToggle = () => {
      const ref = toggleRef();
      if (ref && ref.focus) {
        ref.focus();
      }
    };
    const maybeFocusFirst = () => {
      const type = lastSourceEvent();
      setLastSourceEvent(null);
      let focusType = props.focusFirstItemOnShow;
      if (focusType == null) {
        focusType = menuRef() && isRoleMenu(menuRef()) ? "keyboard" : false;
      }
      if (focusType === false || focusType === "keyboard" && !/^key.+$/.test(type)) {
        return;
      }
      const first = qsa(menuRef(), props.itemSelector)[0];
      if (first && first.focus)
        first.focus();
    };
    createEffect(() => {
      if (show()) {
        maybeFocusFirst();
      } else if (focusInDropdown()) {
        focusToggle();
      }
    });
    const getNextFocusedChild = (current, offset2) => {
      if (!menuRef())
        return null;
      const items = qsa(menuRef(), props.itemSelector);
      let index = items.indexOf(current) + offset2;
      index = Math.max(0, Math.min(index, items.length));
      return items[index];
    };
    const keydownHandler = (event) => {
      const {
        key
      } = event;
      const target = event.target;
      const fromMenu = menuRef()?.contains(target);
      const fromToggle = toggleRef()?.contains(target);
      const isInput = /input|textarea/i.test(target.tagName);
      if (isInput && (key === " " || key !== "Escape" && fromMenu || key === "Escape" && target.type === "search")) {
        return;
      }
      if (!fromMenu && !fromToggle) {
        return;
      }
      if (key === "Tab" && (!menuRef() || !show)) {
        return;
      }
      setLastSourceEvent(event.type);
      const meta = {
        originalEvent: event,
        source: event.type
      };
      switch (key) {
        case "ArrowUp": {
          const next = getNextFocusedChild(target, -1);
          if (next && next.focus)
            next.focus();
          event.preventDefault();
          return;
        }
        case "ArrowDown":
          event.preventDefault();
          if (!show) {
            onToggle(true, meta);
          } else {
            const next = getNextFocusedChild(target, 1);
            if (next && next.focus)
              next.focus();
          }
          return;
        case "Tab":
          if (!isServer) {
            addEventListener2(target.ownerDocument, "keyup", (e2) => {
              if (e2.key === "Tab" && !e2.target || !menuRef()?.contains(e2.target)) {
                onToggle(false, meta);
              }
            }, {
              once: true
            });
          }
          break;
        case "Escape":
          if (key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
          }
          onToggle(false, meta);
          focusToggle();
          break;
      }
    };
    if (!isServer) {
      window2.document.addEventListener("keydown", keydownHandler);
      onCleanup(() => window2.document.removeEventListener("keydown", keydownHandler));
    }
    return createComponent(SelectableContext$1.Provider, {
      value: handleSelect,
      get children() {
        return createComponent(DropdownContext$1.Provider, {
          value: context2,
          get children() {
            return props.children;
          }
        });
      }
    });
  }
  Dropdown.Menu = DropdownMenu;
  Dropdown.Toggle = DropdownToggle;
  Dropdown.Item = DropdownItem$1;
  function activeElement(doc) {
    if (doc === void 0) {
      doc = ownerDocument();
    }
    try {
      var active = doc.activeElement;
      if (!active || !active.nodeName)
        return null;
      return active;
    } catch (e2) {
      return doc.body;
    }
  }
  function ownerWindow(node) {
    var doc = ownerDocument(node);
    return doc && doc.defaultView || window;
  }
  function getComputedStyle3(node, psuedoElement) {
    return ownerWindow(node).getComputedStyle(node, psuedoElement);
  }
  var rUpper = /([A-Z])/g;
  function hyphenate(string) {
    return string.replace(rUpper, "-$1").toLowerCase();
  }
  var msPattern = /^ms-/;
  function hyphenateStyleName(string) {
    return hyphenate(string).replace(msPattern, "-ms-");
  }
  var supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;
  function isTransform(value) {
    return !!(value && supportedTransforms.test(value));
  }
  function style2(node, property) {
    var css = "";
    var transforms = "";
    if (typeof property === "string") {
      return node.style.getPropertyValue(hyphenateStyleName(property)) || getComputedStyle3(node).getPropertyValue(hyphenateStyleName(property));
    }
    Object.keys(property).forEach(function(key) {
      var value = property[key];
      if (!value && value !== 0) {
        node.style.removeProperty(hyphenateStyleName(key));
      } else if (isTransform(key)) {
        transforms += key + "(" + value + ") ";
      } else {
        css += hyphenateStyleName(key) + ": " + value + ";";
      }
    });
    if (transforms) {
      css += "transform: " + transforms + ";";
    }
    node.style.cssText += ";" + css;
  }
  function getBodyScrollbarWidth(ownerDocument3 = document) {
    const window2 = ownerDocument3.defaultView;
    return Math.abs(window2.innerWidth - ownerDocument3.documentElement.clientWidth);
  }
  var OPEN_DATA_ATTRIBUTE = dataAttr("modal-open");
  var ModalManager = class {
    constructor({
      ownerDocument: ownerDocument3,
      handleContainerOverflow = true,
      isRTL = false
    } = {}) {
      this.handleContainerOverflow = handleContainerOverflow;
      this.isRTL = isRTL;
      this.modals = [];
      this.ownerDocument = ownerDocument3;
    }
    getScrollbarWidth() {
      return getBodyScrollbarWidth(this.ownerDocument);
    }
    getElement() {
      return (this.ownerDocument || document).body;
    }
    setModalAttributes(_modal) {
    }
    removeModalAttributes(_modal) {
    }
    setContainerStyle(containerState) {
      const style$1 = {
        overflow: "hidden"
      };
      const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight";
      const container = this.getElement();
      containerState.style = {
        overflow: container.style.overflow,
        [paddingProp]: container.style[paddingProp]
      };
      if (containerState.scrollBarWidth) {
        style$1[paddingProp] = `${parseInt(style2(container, paddingProp) || "0", 10) + containerState.scrollBarWidth}px`;
      }
      container.setAttribute(OPEN_DATA_ATTRIBUTE, "");
      style2(container, style$1);
    }
    reset() {
      [...this.modals].forEach((m2) => this.remove(m2));
    }
    removeContainerStyle(containerState) {
      const container = this.getElement();
      container.removeAttribute(OPEN_DATA_ATTRIBUTE);
      Object.assign(container.style, containerState.style);
    }
    add(modal) {
      let modalIdx = this.modals.indexOf(modal);
      if (modalIdx !== -1) {
        return modalIdx;
      }
      modalIdx = this.modals.length;
      this.modals.push(modal);
      this.setModalAttributes(modal);
      if (modalIdx !== 0) {
        return modalIdx;
      }
      this.state = {
        scrollBarWidth: this.getScrollbarWidth(),
        style: {}
      };
      if (this.handleContainerOverflow) {
        this.setContainerStyle(this.state);
      }
      return modalIdx;
    }
    remove(modal) {
      const modalIdx = this.modals.indexOf(modal);
      if (modalIdx === -1) {
        return;
      }
      this.modals.splice(modalIdx, 1);
      if (!this.modals.length && this.handleContainerOverflow) {
        this.removeContainerStyle(this.state);
      }
      this.removeModalAttributes(modal);
    }
    isTopModal(modal) {
      return !!this.modals.length && this.modals[this.modals.length - 1] === modal;
    }
  };
  var ModalManager$1 = ModalManager;
  var resolveContainerRef = (ref, document2) => {
    if (!canUseDOM)
      return null;
    if (ref == null)
      return (document2 || ownerDocument()).body;
    if (typeof ref === "function")
      ref = ref();
    if (ref?.nodeType)
      return ref || null;
    return null;
  };
  function useWaitForDOMRef(props) {
    const window2 = useWindow();
    const [resolvedRef, setRef] = createSignal(resolveContainerRef(props.ref, window2?.document));
    createEffect(() => {
      if (props.onResolved && resolvedRef()) {
        props.onResolved(resolvedRef());
      }
    });
    createEffect(() => {
      const nextRef = resolveContainerRef(props.ref);
      if (nextRef !== resolvedRef()) {
        setRef(nextRef);
      }
    });
    return resolvedRef;
  }
  var _tmpl$ = /* @__PURE__ */ template(`<div></div>`, 2);
  var manager;
  function getManager(window2) {
    if (!manager)
      manager = new ModalManager$1({
        ownerDocument: window2?.document
      });
    return manager;
  }
  function useModalManager(provided) {
    const window2 = useWindow();
    const modalManager = provided || getManager(window2);
    const modal = {
      dialog: null,
      backdrop: null
    };
    return Object.assign(modal, {
      add: () => modalManager.add(modal),
      remove: () => modalManager.remove(modal),
      isTopModal: () => modalManager.isTopModal(modal),
      setDialogRef: (ref) => {
        modal.dialog = ref;
      },
      setBackdropRef: (ref) => {
        modal.backdrop = ref;
      }
    });
  }
  var defaultProps$3 = {
    show: false,
    role: "dialog",
    backdrop: true,
    keyboard: true,
    autoFocus: true,
    enforceFocus: true,
    restoreFocus: true,
    renderBackdrop: (props) => (() => {
      const _el$ = _tmpl$.cloneNode(true);
      spread(_el$, props, false, false);
      return _el$;
    })(),
    onHide: () => {
    }
  };
  var Modal = (p2) => {
    const [local, props] = splitProps(
      mergeProps(defaultProps$3, p2),
      // split off local props with rest passed as dialogProps
      ["show", "role", "class", "style", "children", "backdrop", "keyboard", "onBackdropClick", "onEscapeKeyDown", "transition", "backdropTransition", "autoFocus", "enforceFocus", "restoreFocus", "restoreFocusOptions", "renderDialog", "renderBackdrop", "manager", "container", "onShow", "onHide", "onExit", "onExited", "onExiting", "onEnter", "onEntering", "onEntered", "ref"]
    );
    const container = useWaitForDOMRef({
      get ref() {
        return local.container;
      }
    });
    const modal = useModalManager(local.manager);
    const owner = getOwner();
    const [isMounted, setIsMounted] = createSignal(false);
    onMount(() => setIsMounted(true));
    onCleanup(() => setIsMounted(false));
    const [exited, setExited] = createSignal(!local.show);
    let lastFocusRef = null;
    local.ref?.(modal);
    createComputed(on(() => local.show, (show, prevShow) => {
      if (canUseDOM && !prevShow && show) {
        lastFocusRef = activeElement();
      }
    }));
    createComputed(() => {
      if (!local.transition && !local.show && !exited()) {
        setExited(true);
      } else if (local.show && exited()) {
        setExited(false);
      }
    });
    const handleShow = () => {
      modal.add();
      removeKeydownListenerRef = listen(document, "keydown", handleDocumentKeyDown);
      removeFocusListenerRef = listen(
        document,
        "focus",
        // the timeout is necessary b/c this will run before the new modal is mounted
        // and so steals focus from it
        () => setTimeout(handleEnforceFocus),
        true
      );
      if (local.onShow) {
        local.onShow();
      }
      if (local.autoFocus) {
        const currentActiveElement = activeElement(document);
        if (modal.dialog && currentActiveElement && !contains2(modal.dialog, currentActiveElement)) {
          lastFocusRef = currentActiveElement;
          modal.dialog.focus();
        }
      }
    };
    const handleHide = () => {
      modal.remove();
      removeKeydownListenerRef?.();
      removeFocusListenerRef?.();
      if (local.restoreFocus) {
        lastFocusRef?.focus?.(local.restoreFocusOptions);
        lastFocusRef = null;
      }
    };
    createEffect(() => {
      if (!local.show || !container?.())
        return;
      handleShow();
    });
    createEffect(on(exited, (exited2, prev) => {
      if (exited2 && !(prev ?? exited2)) {
        handleHide();
      }
    }));
    onCleanup(() => {
      handleHide();
    });
    const handleEnforceFocus = () => {
      if (!local.enforceFocus || !isMounted() || !modal.isTopModal()) {
        return;
      }
      const currentActiveElement = activeElement();
      if (modal.dialog && currentActiveElement && !contains2(modal.dialog, currentActiveElement)) {
        modal.dialog.focus();
      }
    };
    const handleBackdropClick = (e2) => {
      if (e2.target !== e2.currentTarget) {
        return;
      }
      local.onBackdropClick?.(e2);
      if (local.backdrop === true) {
        local.onHide?.();
      }
    };
    const handleDocumentKeyDown = (e2) => {
      if (local.keyboard && e2.keyCode === 27 && modal.isTopModal()) {
        local.onEscapeKeyDown?.(e2);
        if (!e2.defaultPrevented) {
          local.onHide?.();
        }
      }
    };
    let removeFocusListenerRef;
    let removeKeydownListenerRef;
    const handleHidden = (...args) => {
      setExited(true);
      local.onExited?.(...args);
    };
    const dialogVisible = createMemo(() => !!(local.show || local.transition && !exited()));
    const dialogProps = mergeProps({
      get role() {
        return local.role;
      },
      get ref() {
        return modal.setDialogRef;
      },
      // apparently only works on the dialog role element
      get "aria-modal"() {
        return local.role === "dialog" ? true : void 0;
      }
    }, props, {
      get style() {
        return local.style;
      },
      get class() {
        return local.class;
      },
      tabIndex: -1
    });
    const getChildAsDocument = () => {
      const c2 = children(() => local.children);
      c2()?.setAttribute?.("role", "document");
      return c2;
    };
    let innerDialog = () => runWithOwner(owner, () => local.renderDialog ? local.renderDialog(dialogProps) : (() => {
      const _el$2 = _tmpl$.cloneNode(true);
      spread(_el$2, dialogProps, false, true);
      insert(_el$2, getChildAsDocument);
      return _el$2;
    })());
    const Dialog = () => {
      const Transition3 = local.transition;
      return !Transition3 ? innerDialog : createComponent(Transition3, {
        appear: true,
        unmountOnExit: true,
        get ["in"]() {
          return !!local.show;
        },
        get onExit() {
          return local.onExit;
        },
        get onExiting() {
          return local.onExiting;
        },
        onExited: handleHidden,
        get onEnter() {
          return local.onEnter;
        },
        get onEntering() {
          return local.onEntering;
        },
        get onEntered() {
          return local.onEntered;
        },
        children: innerDialog
      });
    };
    const Backdrop = () => {
      let backdropElement = null;
      if (local.backdrop) {
        const BackdropTransition2 = local.backdropTransition;
        backdropElement = local.renderBackdrop({
          ref: modal.setBackdropRef,
          onClick: handleBackdropClick
        });
        if (BackdropTransition2) {
          backdropElement = createComponent(BackdropTransition2, {
            appear: true,
            get ["in"]() {
              return !!local.show;
            },
            children: backdropElement
          });
        }
      }
      return backdropElement;
    };
    return createComponent(Show, {
      get when() {
        return createMemo(() => !!container())() && dialogVisible();
      },
      get children() {
        return createComponent(Portal, {
          get mount() {
            return container();
          },
          get children() {
            return [createComponent(Backdrop, {}), createComponent(Dialog, {})];
          }
        });
      }
    });
  };
  var Modal$1 = Object.assign(Modal, {
    Manager: ModalManager$1
  });
  var TabContext = createContext(null);
  var TabContext$1 = TabContext;
  function useNavItem(options) {
    const parentOnSelect = useContext(SelectableContext$1);
    const navContext = useContext(NavContext$1);
    const tabContext = useContext(TabContext$1);
    const isActive = createMemo(() => options.active == null && options.key != null ? navContext?.activeKey === options.key : options.active);
    const role = createMemo(() => navContext && !options.role && navContext.role === "tablist" ? "tab" : options.role);
    const onClick = createMemo(() => (e2) => {
      if (options.disabled)
        return;
      let result = callEventHandler(options.onClick, e2);
      if (options.key == null) {
        return;
      }
      if (parentOnSelect && !result.isPropagationStopped) {
        parentOnSelect(options.key, e2);
      }
    });
    const props = {
      get role() {
        return role();
      },
      get [dataAttr("event-key")]() {
        return navContext ? options.key : void 0;
      },
      get id() {
        return navContext ? navContext.getControllerId(options.key) : void 0;
      },
      get tabIndex() {
        return role() === "tab" && (options.disabled || !isActive()) ? -1 : void 0;
      },
      get ["aria-controls"]() {
        return isActive() || !tabContext?.unmountOnExit && !tabContext?.mountOnEnter ? navContext ? navContext.getControlledId(options.key) : void 0 : void 0;
      },
      get ["aria-disabled"]() {
        return role() === "tab" && options.disabled ? true : void 0;
      },
      get ["aria-selected"]() {
        return role() === "tab" && isActive() ? true : void 0;
      },
      get onClick() {
        return onClick();
      }
    };
    const meta = {
      get isActive() {
        return isActive();
      }
    };
    return [props, meta];
  }
  var defaultProps$2 = {
    as: Button$1
  };
  var NavItem = (p2) => {
    const [local, options] = splitProps(mergeProps(defaultProps$2, p2), ["as", "active", "eventKey"]);
    const [props, meta] = useNavItem(mergeProps({
      get active() {
        return p2.active;
      },
      get key() {
        return makeEventKey(p2.eventKey, p2.href);
      }
    }, options));
    props[dataAttr("active")] = meta.isActive;
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, options, props));
  };
  var NavItem$1 = NavItem;
  var noop$1 = (e2) => "";
  var EVENT_KEY_ATTR = dataAttr("event-key");
  var defaultProps$1 = {
    as: "div"
  };
  var Nav = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$1, p2), ["as", "onSelect", "activeKey", "role", "onKeyDown"]);
    const [needsRefocusRef, setNeedsRefocusRef] = createSignal(false);
    const [listNode, setListNode] = createSignal(null);
    const parentOnSelect = useContext(SelectableContext$1);
    const tabContext = useContext(TabContext$1);
    const getNextActiveTab = (offset2) => {
      const currentListNode = listNode();
      if (!currentListNode)
        return null;
      const items = qsa(currentListNode, `[${EVENT_KEY_ATTR}]:not([aria-disabled=true])`);
      const activeChild = currentListNode.querySelector("[aria-selected=true]");
      if (!activeChild || activeChild !== document.activeElement)
        return null;
      const index = items.indexOf(activeChild);
      if (index === -1)
        return null;
      let nextIndex = index + offset2;
      if (nextIndex >= items.length)
        nextIndex = 0;
      if (nextIndex < 0)
        nextIndex = items.length - 1;
      return items[nextIndex];
    };
    const handleSelect = (key, event) => {
      if (key == null)
        return;
      local.onSelect?.(key, event);
      parentOnSelect?.(key, event);
    };
    const handleKeyDown = (event) => {
      callEventHandler(local.onKeyDown, event);
      if (!tabContext) {
        return;
      }
      let nextActiveChild;
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          nextActiveChild = getNextActiveTab(-1);
          break;
        case "ArrowRight":
        case "ArrowDown":
          nextActiveChild = getNextActiveTab(1);
          break;
        default:
          return;
      }
      if (!nextActiveChild)
        return;
      event.preventDefault();
      handleSelect(nextActiveChild.dataset[dataProp("EventKey")] || null, event);
      setNeedsRefocusRef(true);
    };
    createEffect(() => {
      if (listNode() && needsRefocusRef()) {
        const activeChild = listNode().querySelector(`[${EVENT_KEY_ATTR}][aria-selected=true]`);
        activeChild?.focus();
      }
      setNeedsRefocusRef(false);
    });
    const mergedRef = (r) => {
      setListNode(r);
      if (typeof props.ref === "function") {
        props.ref(r);
      }
    };
    const activeKey = () => makeEventKey(tabContext?.activeKey ?? local.activeKey);
    const getRole = () => {
      return local.role || (tabContext ? "tablist" : void 0);
    };
    return createComponent(SelectableContext$1.Provider, {
      value: handleSelect,
      get children() {
        return createComponent(NavContext$1.Provider, {
          value: {
            get role() {
              return getRole();
            },
            // used by NavLink to determine it's role
            get activeKey() {
              return activeKey();
            },
            get getControlledId() {
              return tabContext?.getControlledId || noop$1;
            },
            get getControllerId() {
              return tabContext?.getControllerId || noop$1;
            }
          },
          get children() {
            return createComponent(Dynamic, mergeProps({
              get component() {
                return local.as;
              },
              get ["data-active-key"]() {
                return activeKey();
              }
            }, props, {
              onKeyDown: handleKeyDown,
              ref: mergedRef,
              get role() {
                return getRole();
              }
            }));
          }
        });
      }
    });
  };
  var Nav$1 = Object.assign(Nav, {
    Item: NavItem$1
  });
  var NoopTransition = (props) => {
    const resolvedChildren = children(() => props.children);
    const callChild = () => {
      const c2 = resolvedChildren();
      return typeof c2 === "function" ? c2(ENTERED, {}) : c2;
    };
    return createMemo(callChild);
  };
  var NoopTransition$1 = NoopTransition;
  var OverlayContext = createContext();
  var OverlayContext$1 = OverlayContext;
  var defaultProps2 = {
    role: "tabpanel"
  };
  function useTabPanel(p2) {
    const [local, props] = splitProps(mergeProps(defaultProps2, p2), ["active", "eventKey", "mountOnEnter", "transition", "unmountOnExit"]);
    const context2 = useContext(TabContext$1);
    if (!context2)
      return [props, {
        get eventKey() {
          return local.eventKey;
        },
        get isActive() {
          return local.active;
        },
        get mountOnEnter() {
          return local.mountOnEnter;
        },
        get transition() {
          return local.transition;
        },
        get unmountOnExit() {
          return local.unmountOnExit;
        }
      }];
    const key = makeEventKey(local.eventKey);
    const useTabPanel2 = mergeProps(props, {
      get id() {
        return context2?.getControlledId(local.eventKey);
      },
      get "aria-labelledby"() {
        return context2?.getControllerId(local.eventKey);
      }
    });
    return [useTabPanel2, {
      get eventKey() {
        return local.eventKey;
      },
      get isActive() {
        return local.active == null && key != null ? makeEventKey(context2?.activeKey) === key : local.active;
      },
      get transition() {
        return local.transition || context2?.transition || NoopTransition$1;
      },
      get mountOnEnter() {
        return local.mountOnEnter != null ? local.mountOnEnter : context2?.mountOnEnter;
      },
      get unmountOnExit() {
        return local.unmountOnExit != null ? local.unmountOnExit : context2?.unmountOnExit;
      }
    }];
  }
  var TabPanel = (props) => {
    const [tabPanelProps, other] = useTabPanel(props);
    other.transition;
    return createComponent(TabContext$1.Provider, {
      value: null,
      get children() {
        return createComponent(SelectableContext$1.Provider, {
          value: null,
          get children() {
            return createComponent(Dynamic, mergeProps({
              get component() {
                return props.as ?? "div";
              }
            }, tabPanelProps, {
              role: "tabpanel",
              get hidden() {
                return !other.isActive;
              },
              get ["aria-hidden"]() {
                return !other.isActive;
              }
            }));
          }
        });
      }
    });
  };
  var TabPanel$1 = TabPanel;
  var Tabs = (props) => {
    const [activeKey, onSelect] = createControlledProp(() => props.activeKey, () => props.defaultActiveKey, props.onSelect);
    const id = useSSRSafeId(props.id);
    const generateChildId = createMemo(() => props.generateChildId || ((key, type) => id ? `${id}-${type}-${key}` : null));
    const tabContext = {
      get onSelect() {
        return onSelect;
      },
      get activeKey() {
        return activeKey();
      },
      get transition() {
        return props.transition;
      },
      get mountOnEnter() {
        return props.mountOnEnter || false;
      },
      get unmountOnExit() {
        return props.unmountOnExit || false;
      },
      get getControlledId() {
        return (key) => generateChildId()(key, "pane");
      },
      get getControllerId() {
        return (key) => generateChildId()(key, "tab");
      }
    };
    return createComponent(TabContext$1.Provider, {
      value: tabContext,
      get children() {
        return createComponent(SelectableContext$1.Provider, {
          value: onSelect || null,
          get children() {
            return props.children;
          }
        });
      }
    });
  };
  Tabs.Panel = TabPanel$1;
  var Tabs$1 = Tabs;

  // node_modules/solid-bootstrap/dist/esm/index.js
  function toVal(mix) {
    var k, y, str = "";
    if (typeof mix === "string" || typeof mix === "number") {
      str += mix;
    } else if (typeof mix === "object") {
      if (Array.isArray(mix)) {
        for (k = 0; k < mix.length; k++) {
          if (mix[k]) {
            if (y = toVal(mix[k])) {
              str && (str += " ");
              str += y;
            }
          }
        }
      } else {
        for (k in mix) {
          if (mix[k]) {
            str && (str += " ");
            str += k;
          }
        }
      }
    }
    return str;
  }
  function classNames(...classes) {
    var i2 = 0, tmp, x, str = "";
    while (i2 < classes.length) {
      if (tmp = classes[i2++]) {
        if (x = toVal(tmp)) {
          str && (str += " ");
          str += x;
        }
      }
    }
    return str;
  }
  var DEFAULT_BREAKPOINTS = ["xxl", "xl", "lg", "md", "sm", "xs"];
  var ThemeContext2 = createContext({
    prefixes: {},
    breakpoints: DEFAULT_BREAKPOINTS
  });
  function useBootstrapPrefix(prefix, defaultPrefix) {
    const themeContext = useContext(ThemeContext2);
    return prefix || themeContext.prefixes[defaultPrefix] || defaultPrefix;
  }
  function useBootstrapBreakpoints() {
    const ctx = useContext(ThemeContext2);
    return () => ctx.breakpoints;
  }
  function useIsRTL() {
    const ctx = useContext(ThemeContext2);
    return () => ctx.dir === "rtl";
  }
  function ownerDocument2(node) {
    return node && node.ownerDocument || document;
  }
  function ownerWindow2(node) {
    var doc = ownerDocument2(node);
    return doc && doc.defaultView || window;
  }
  function getComputedStyle$1(node, psuedoElement) {
    return ownerWindow2(node).getComputedStyle(node, psuedoElement);
  }
  var rUpper2 = /([A-Z])/g;
  function hyphenate2(string) {
    return string.replace(rUpper2, "-$1").toLowerCase();
  }
  var msPattern2 = /^ms-/;
  function hyphenateStyleName2(string) {
    return hyphenate2(string).replace(msPattern2, "-ms-");
  }
  var supportedTransforms2 = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;
  function isTransform2(value) {
    return !!(value && supportedTransforms2.test(value));
  }
  function style3(node, property) {
    var css = "";
    var transforms = "";
    if (typeof property === "string") {
      return node.style.getPropertyValue(hyphenateStyleName2(property)) || getComputedStyle$1(node).getPropertyValue(hyphenateStyleName2(property));
    }
    Object.keys(property).forEach(function(key) {
      var value = property[key];
      if (!value && value !== 0) {
        node.style.removeProperty(hyphenateStyleName2(key));
      } else if (isTransform2(key)) {
        transforms += key + "(" + value + ") ";
      } else {
        css += hyphenateStyleName2(key) + ": " + value + ";";
      }
    });
    if (transforms) {
      css += "transform: " + transforms + ";";
    }
    node.style.cssText += ";" + css;
  }
  function triggerBrowserReflow(node) {
    node.offsetHeight;
  }
  var canUseDOM2 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
  var optionsSupported2 = false;
  var onceSupported2 = false;
  try {
    options = {
      get passive() {
        return optionsSupported2 = true;
      },
      get once() {
        return onceSupported2 = optionsSupported2 = true;
      }
    };
    if (canUseDOM2) {
      window.addEventListener("test", options, options);
      window.removeEventListener("test", options, true);
    }
  } catch (e2) {
  }
  var options;
  function addEventListener3(node, eventName, handler, options) {
    if (options && typeof options !== "boolean" && !onceSupported2) {
      var once = options.once, capture = options.capture;
      var wrappedHandler = handler;
      if (!onceSupported2 && once) {
        wrappedHandler = handler.__once || function onceHandler(event) {
          this.removeEventListener(eventName, onceHandler, capture);
          handler.call(this, event);
        };
        handler.__once = wrappedHandler;
      }
      node.addEventListener(eventName, wrappedHandler, optionsSupported2 ? options : capture);
    }
    node.addEventListener(eventName, handler, options);
  }
  function removeEventListener2(node, eventName, handler, options) {
    var capture = options && typeof options !== "boolean" ? options.capture : options;
    node.removeEventListener(eventName, handler, capture);
    if (handler.__once) {
      node.removeEventListener(eventName, handler.__once, capture);
    }
  }
  function listen2(node, eventName, handler, options) {
    addEventListener3(node, eventName, handler, options);
    return function() {
      removeEventListener2(node, eventName, handler, options);
    };
  }
  function triggerEvent(node, eventName, bubbles, cancelable) {
    if (bubbles === void 0) {
      bubbles = false;
    }
    if (cancelable === void 0) {
      cancelable = true;
    }
    if (node) {
      var event = document.createEvent("HTMLEvents");
      event.initEvent(eventName, bubbles, cancelable);
      node.dispatchEvent(event);
    }
  }
  function parseDuration$1(node) {
    var str = style3(node, "transitionDuration") || "";
    var mult = str.indexOf("ms") === -1 ? 1e3 : 1;
    return parseFloat(str) * mult;
  }
  function emulateTransitionEnd(element, duration, padding) {
    if (padding === void 0) {
      padding = 5;
    }
    var called = false;
    var handle = setTimeout(function() {
      if (!called)
        triggerEvent(element, "transitionend", true);
    }, duration + padding);
    var remove = listen2(element, "transitionend", function() {
      called = true;
    }, {
      once: true
    });
    return function() {
      clearTimeout(handle);
      remove();
    };
  }
  function transitionEnd(element, handler, duration, padding) {
    if (duration == null)
      duration = parseDuration$1(element) || 0;
    var removeEmulate = emulateTransitionEnd(element, duration, padding);
    var remove = listen2(element, "transitionend", handler);
    return function() {
      removeEmulate();
      remove();
    };
  }
  function parseDuration(node, property) {
    const str = style3(node, property) || "";
    const mult = str.indexOf("ms") === -1 ? 1e3 : 1;
    return parseFloat(str) * mult;
  }
  function transitionEndListener(element, handler) {
    const duration = parseDuration(element, "transitionDuration");
    const delay = parseDuration(element, "transitionDelay");
    const remove = transitionEnd(element, (e2) => {
      if (e2.target === element) {
        remove();
        handler(e2);
      }
    }, duration + delay);
  }
  var defaultProps$1d = {};
  var TransitionWrapper = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$1d, p2), ["onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "addEndListener", "children", "childRef"]);
    let [nodeRef, setNodeRef] = createSignal();
    const mergedRef = (ref) => {
      setNodeRef(ref);
      local.childRef?.(ref);
    };
    function normalize(callback) {
      return (param) => {
        if (callback && nodeRef()) {
          callback(nodeRef(), param);
        }
      };
    }
    const handlers = {
      get onEnter() {
        return normalize(local.onEnter);
      },
      get onEntering() {
        return normalize(local.onEntering);
      },
      get onEntered() {
        return normalize(local.onEntered);
      },
      get onExit() {
        return normalize(local.onExit);
      },
      get onExiting() {
        return normalize(local.onExiting);
      },
      get onExited() {
        return normalize(local.onExited);
      },
      get addEndListener() {
        return normalize(local.addEndListener);
      }
    };
    const resolvedChildren = children(() => local.children);
    function renderChild() {
      const child = resolvedChildren();
      if (typeof child === "function") {
        return (status, innerProps) => child(status, {
          ...innerProps,
          ref: mergedRef
        });
      } else {
        mergedRef(child);
        return child;
      }
    }
    return createComponent(Transition2, mergeProps(props, handlers, {
      get nodeRef() {
        return nodeRef();
      },
      get children() {
        return renderChild();
      }
    }));
  };
  var TransitionWrapper$1 = TransitionWrapper;
  var MARGINS = {
    height: ["marginTop", "marginBottom"],
    width: ["marginLeft", "marginRight"]
  };
  function getDefaultDimensionValue(dimension, elem) {
    const offset2 = `offset${dimension[0].toUpperCase()}${dimension.slice(1)}`;
    const value = elem[offset2];
    const margins = MARGINS[dimension];
    return value + // @ts-ignore
    parseInt(style3(elem, margins[0]), 10) + // @ts-ignore
    parseInt(style3(elem, margins[1]), 10);
  }
  var collapseStyles = {
    [EXITED]: "collapse",
    [EXITING]: "collapsing",
    [ENTERING]: "collapsing",
    [ENTERED]: "collapse show",
    [UNMOUNTED]: ""
  };
  var defaultProps$1c = {
    in: false,
    dimension: "height",
    timeout: 300,
    mountOnEnter: false,
    unmountOnExit: false,
    appear: false,
    getDimensionValue: getDefaultDimensionValue
  };
  var Collapse = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$1c, p2), ["onEnter", "onEntering", "onEntered", "onExit", "onExiting", "class", "children", "dimension", "getDimensionValue"]);
    const computedDimension = () => typeof local.dimension === "function" ? local.dimension() : local.dimension;
    const handleEnter = (elem) => {
      elem.style[computedDimension()] = "0";
      local.onEnter?.(elem);
    };
    const handleEntering = (elem) => {
      const scroll2 = `scroll${computedDimension()[0].toUpperCase()}${computedDimension().slice(1)}`;
      elem.style[computedDimension()] = `${elem[scroll2]}px`;
      local.onEntering?.(elem);
    };
    const handleEntered = (elem) => {
      elem.style[computedDimension()] = null;
      local.onEntered?.(elem);
    };
    const handleExit = (elem) => {
      elem.style[computedDimension()] = `${local.getDimensionValue(computedDimension(), elem)}px`;
      triggerBrowserReflow(elem);
      local.onExit?.(elem);
    };
    const handleExiting = (elem) => {
      elem.style[computedDimension()] = null;
      local.onExiting?.(elem);
    };
    const resolvedChildren = children(() => local.children);
    let prevClasses;
    return createComponent(TransitionWrapper$1, mergeProps({
      addEndListener: transitionEndListener
    }, props, {
      get ["aria-expanded"]() {
        return props.role ? props.in : null;
      },
      onEnter: handleEnter,
      onEntering: handleEntering,
      onEntered: handleEntered,
      onExit: handleExit,
      onExiting: handleExiting,
      children: (state, innerProps) => {
        const el = resolvedChildren();
        innerProps.ref(el);
        const newClasses = classNames(local.class, collapseStyles[state], computedDimension() === "width" && "collapse-horizontal");
        resolveClasses(el, prevClasses, newClasses);
        prevClasses = newClasses;
        return el;
      }
    }));
  };
  var Collapse$1 = Collapse;
  function isAccordionItemSelected(activeEventKey, eventKey) {
    return Array.isArray(activeEventKey) ? activeEventKey.includes(eventKey) : activeEventKey === eventKey;
  }
  var context$4 = createContext({});
  var AccordionContext = context$4;
  var defaultProps$1b = {
    as: "div"
  };
  var AccordionCollapse = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$1b, p2), ["as", "bsPrefix", "class", "children", "eventKey"]);
    const context2 = useContext(AccordionContext);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-collapse");
    return createComponent(Collapse$1, mergeProps({
      get ["in"]() {
        return isAccordionItemSelected(context2.activeEventKey, local.eventKey);
      }
    }, props, {
      get children() {
        return createComponent(Dynamic, {
          get component() {
            return local.as;
          },
          get ["class"]() {
            return classNames(local.class, bsPrefix);
          },
          get children() {
            return local.children;
          }
        });
      }
    }));
  };
  var AccordionCollapse$1 = AccordionCollapse;
  var context$3 = createContext({
    eventKey: ""
  });
  var AccordionItemContext = context$3;
  var defaultProps$1a = {
    as: "div"
  };
  var AccordionBody = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$1a, p2), ["as", "bsPrefix", "class"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-body");
    const context2 = useContext(AccordionItemContext);
    return createComponent(AccordionCollapse$1, {
      get eventKey() {
        return context2.eventKey;
      },
      get children() {
        return createComponent(Dynamic, mergeProps({
          get component() {
            return local.as;
          }
        }, props, {
          get ["class"]() {
            return classNames(local.class, bsPrefix);
          }
        }));
      }
    });
  };
  var AccordionBody$1 = AccordionBody;
  function useAccordionButton(eventKey, onClick) {
    const context2 = useContext(AccordionContext);
    return (e2) => {
      let eventKeyPassed = eventKey === context2.activeEventKey ? null : eventKey;
      if (context2.alwaysOpen) {
        if (Array.isArray(context2.activeEventKey)) {
          if (context2.activeEventKey.includes(eventKey)) {
            eventKeyPassed = context2.activeEventKey.filter((k) => k !== eventKey);
          } else {
            eventKeyPassed = [...context2.activeEventKey, eventKey];
          }
        } else {
          eventKeyPassed = [eventKey];
        }
      }
      context2.onSelect?.(eventKeyPassed, e2);
      callEventHandler(onClick, e2);
    };
  }
  var defaultProps$19 = {
    as: "button"
  };
  var AccordionButton = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$19, p2), ["as", "bsPrefix", "class", "onClick"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-button");
    const itemContext = useContext(AccordionItemContext);
    const accordionOnClick = useAccordionButton(itemContext.eventKey, local.onClick);
    const accordionContext = useContext(AccordionContext);
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      },
      onClick: accordionOnClick
    }, props, {
      get type() {
        return local.as === "button" ? "button" : void 0;
      },
      get ["aria-expanded"]() {
        return itemContext.eventKey === accordionContext.activeEventKey;
      },
      get ["class"]() {
        return classNames(local.class, bsPrefix, !isAccordionItemSelected(accordionContext.activeEventKey, itemContext.eventKey) && "collapsed");
      }
    }));
  };
  var AccordionButton$1 = AccordionButton;
  var defaultProps$18 = {
    as: "h2"
  };
  var AccordionHeader = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$18, p2), ["as", "bsPrefix", "class", "children", "onClick"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-header");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get ["class"]() {
        return classNames(local.class, bsPrefix);
      },
      get children() {
        return createComponent(AccordionButton$1, {
          get onClick() {
            return local.onClick;
          },
          get children() {
            return local.children;
          }
        });
      }
    }));
  };
  var AccordionHeader$1 = AccordionHeader;
  var defaultProps$17 = {
    as: "div"
  };
  var AccordionItem = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$17, p2), ["as", "bsPrefix", "class", "eventKey"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-item");
    const contextValue = {
      get eventKey() {
        return local.eventKey;
      }
    };
    return createComponent(AccordionItemContext.Provider, {
      value: contextValue,
      get children() {
        return createComponent(Dynamic, mergeProps({
          get component() {
            return local.as;
          }
        }, props, {
          get ["class"]() {
            return classNames(local.class, bsPrefix);
          }
        }));
      }
    });
  };
  var AccordionItem$1 = AccordionItem;
  var defaultProps$16 = {
    as: "div"
  };
  var Accordion = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$16, p2), ["as", "activeKey", "alwaysOpen", "bsPrefix", "class", "defaultActiveKey", "onSelect", "flush"]);
    const [activeKey, onSelect] = createControlledProp(() => local.activeKey, () => local.defaultActiveKey, local.onSelect);
    const prefix = useBootstrapPrefix(local.bsPrefix, "accordion");
    const contextValue = {
      get activeEventKey() {
        return activeKey();
      },
      get alwaysOpen() {
        return local.alwaysOpen;
      },
      get onSelect() {
        return onSelect;
      }
    };
    return createComponent(AccordionContext.Provider, {
      value: contextValue,
      get children() {
        return createComponent(Dynamic, mergeProps({
          get component() {
            return local.as;
          }
        }, props, {
          get ["class"]() {
            return classNames(local.class, prefix, local.flush && `${prefix}-flush`);
          }
        }));
      }
    });
  };
  var Accordion$1 = Object.assign(Accordion, {
    Button: AccordionButton$1,
    Collapse: AccordionCollapse$1,
    Item: AccordionItem$1,
    Header: AccordionHeader$1,
    Body: AccordionBody$1
  });
  var defaultProps$15 = {
    in: false,
    timeout: 300,
    mountOnEnter: false,
    unmountOnExit: false,
    appear: false
  };
  var fadeStyles$1 = {
    [ENTERING]: "show",
    [ENTERED]: "show"
  };
  var Fade = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$15, p2), ["class", "children", "transitionClasses"]);
    const handleEnter = (node, isAppearing) => {
      triggerBrowserReflow(node);
      props.onEnter?.(node, isAppearing);
    };
    let resolvedChildren;
    let prevClasses;
    return createComponent(TransitionWrapper$1, mergeProps({
      addEndListener: transitionEndListener,
      onEnter: handleEnter
    }, props, {
      children: (status, innerProps) => {
        if (!resolvedChildren)
          resolvedChildren = children(() => local.children);
        let el = resolvedChildren();
        while (typeof el === "function")
          el = el();
        innerProps.ref(el);
        const newClasses = classNames(
          "fade",
          local.class,
          // @ts-ignore
          fadeStyles$1?.[status],
          local.transitionClasses?.[status]
        );
        resolveClasses(el, prevClasses, newClasses);
        prevClasses = newClasses;
        return el;
      }
    }));
  };
  var Fade$1 = Fade;
  var _tmpl$$r = /* @__PURE__ */ template(`<button type="button"></button>`, 2);
  var defaultProps$14 = {
    "aria-label": "Close"
  };
  var CloseButton = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$14, p2), ["class", "variant"]);
    return (() => {
      const _el$ = _tmpl$$r.cloneNode(true);
      spread(_el$, mergeProps({
        get ["class"]() {
          return classNames("btn-close", local.variant && `btn-close-${local.variant}`, local.class);
        }
      }, props), false, false);
      return _el$;
    })();
  };
  var CloseButton$1 = CloseButton;
  var _tmpl$$q = /* @__PURE__ */ template(`<div></div>`, 2);
  var divWithClass = (c2) => (p2) => {
    return (() => {
      const _el$ = _tmpl$$q.cloneNode(true);
      spread(_el$, mergeProps(p2, {
        get ["class"]() {
          return classNames(p2.class, c2);
        }
      }), false, false);
      return _el$;
    })();
  };
  function createWithBsPrefix(prefix, {
    Component,
    defaultProps: defaultProps3 = {}
  } = {}) {
    const BsComponent = (p2) => {
      const [local, props] = splitProps(mergeProps({
        as: Component
      }, defaultProps3, p2), ["class", "bsPrefix", "as"]);
      const resolvedPrefix = useBootstrapPrefix(local.bsPrefix, prefix);
      return createComponent(Dynamic, mergeProps({
        get component() {
          return local.as || "div";
        },
        get ["class"]() {
          return classNames(local.class, resolvedPrefix);
        }
      }, props));
    };
    return BsComponent;
  }
  var _tmpl$$p = /* @__PURE__ */ template(`<div role="alert"></div>`, 2);
  var DivStyledAsH4$1 = divWithClass("h4");
  var AlertHeading = createWithBsPrefix("alert-heading", {
    Component: DivStyledAsH4$1
  });
  var AlertLink = createWithBsPrefix("alert-link", {
    Component: Anchor$1
  });
  var defaultProps$13 = {
    variant: "primary",
    defaultShow: true,
    transition: Fade$1,
    closeLabel: "Close alert"
  };
  var Alert = (uncontrolledProps) => {
    const [local, props] = splitProps(mergeProps(defaultProps$13, uncontrolledProps), ["bsPrefix", "children", "defaultShow", "show", "closeLabel", "closeVariant", "class", "children", "variant", "onClose", "dismissible", "transition"]);
    const [show, onClose] = createControlledProp(() => local.show, () => local.defaultShow, local.onClose);
    const prefix = useBootstrapPrefix(local.bsPrefix, "alert");
    const handleClose = (e2) => {
      if (onClose) {
        onClose(false, e2);
      }
    };
    const Transition3 = local.transition === true ? Fade$1 : local.transition;
    const alert = () => (() => {
      const _el$ = _tmpl$$p.cloneNode(true);
      spread(_el$, mergeProps(!Transition3 ? props : {}, {
        get ["class"]() {
          return classNames(local.class, prefix, local.variant && `${prefix}-${local.variant}`, local.dismissible && `${prefix}-dismissible`);
        }
      }), false, true);
      insert(_el$, (() => {
        const _c$ = createMemo(() => !!local.dismissible);
        return () => _c$() && createComponent(CloseButton$1, {
          onClick: handleClose,
          get ["aria-label"]() {
            return local.closeLabel;
          },
          get variant() {
            return local.closeVariant;
          }
        });
      })(), null);
      insert(_el$, () => local.children, null);
      return _el$;
    })();
    return createComponent(Show, {
      when: !!Transition3,
      get fallback() {
        return local.show ? alert : null;
      },
      get children() {
        return createComponent(Transition3, mergeProps({
          unmountOnExit: true
        }, props, {
          ref(r$) {
            undefined = r$;
          },
          get ["in"]() {
            return show();
          },
          children: alert
        }));
      }
    });
  };
  var Alert$1 = Object.assign(Alert, {
    Link: AlertLink,
    Heading: AlertHeading
  });
  function hasClass(element, className2) {
    if (element.classList)
      return !!className2 && element.classList.contains(className2);
    return (" " + (element.className.baseVal || element.className) + " ").indexOf(" " + className2 + " ") !== -1;
  }
  function addClass(element, className2) {
    if (element.classList)
      element.classList.add(className2);
    else if (!hasClass(element, className2))
      if (typeof element.className === "string")
        element.className = element.className + " " + className2;
      else
        element.setAttribute("class", (element.className && element.className.baseVal || "") + " " + className2);
  }
  var toArray2 = Function.prototype.bind.call(Function.prototype.call, [].slice);
  function qsa2(element, selector) {
    return toArray2(element.querySelectorAll(selector));
  }
  function replaceClassName(origClass, classToRemove) {
    return origClass.replace(new RegExp("(^|\\s)" + classToRemove + "(?:\\s|$)", "g"), "$1").replace(/\s+/g, " ").replace(/^\s*|\s*$/g, "");
  }
  function removeClass(element, className2) {
    if (element.classList) {
      element.classList.remove(className2);
    } else if (typeof element.className === "string") {
      element.className = replaceClassName(element.className, className2);
    } else {
      element.setAttribute("class", replaceClassName(element.className && element.className.baseVal || "", className2));
    }
  }
  var Selector = {
    FIXED_CONTENT: ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top",
    STICKY_CONTENT: ".sticky-top",
    NAVBAR_TOGGLER: ".navbar-toggler"
  };
  var BootstrapModalManager = class extends ModalManager$1 {
    adjustAndStore(prop, element, adjust) {
      const actual = element.style[prop];
      element.dataset[prop] = actual;
      style3(element, {
        [prop]: `${parseFloat(style3(element, prop)) + adjust}px`
      });
    }
    restore(prop, element) {
      const value = element.dataset[prop];
      if (value !== void 0) {
        delete element.dataset[prop];
        style3(element, {
          [prop]: value
        });
      }
    }
    setContainerStyle(containerState) {
      super.setContainerStyle(containerState);
      const container = this.getElement();
      addClass(container, "modal-open");
      if (!containerState.scrollBarWidth)
        return;
      const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight";
      const marginProp = this.isRTL ? "marginLeft" : "marginRight";
      qsa2(container, Selector.FIXED_CONTENT).forEach((el) => this.adjustAndStore(paddingProp, el, containerState.scrollBarWidth));
      qsa2(container, Selector.STICKY_CONTENT).forEach((el) => this.adjustAndStore(marginProp, el, -containerState.scrollBarWidth));
      qsa2(container, Selector.NAVBAR_TOGGLER).forEach((el) => this.adjustAndStore(marginProp, el, containerState.scrollBarWidth));
    }
    removeContainerStyle(containerState) {
      super.removeContainerStyle(containerState);
      const container = this.getElement();
      removeClass(container, "modal-open");
      const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight";
      const marginProp = this.isRTL ? "marginLeft" : "marginRight";
      qsa2(container, Selector.FIXED_CONTENT).forEach((el) => this.restore(paddingProp, el));
      qsa2(container, Selector.STICKY_CONTENT).forEach((el) => this.restore(marginProp, el));
      qsa2(container, Selector.NAVBAR_TOGGLER).forEach((el) => this.restore(marginProp, el));
    }
  };
  var sharedManager;
  function getSharedManager(options) {
    if (!sharedManager)
      sharedManager = new BootstrapModalManager(options);
    return sharedManager;
  }
  var defaultProps$11 = {
    as: "li",
    active: false,
    linkAs: Anchor$1,
    linkProps: {}
  };
  var BreadcrumbItem = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$11, p2), ["bsPrefix", "active", "children", "class", "as", "linkAs", "linkProps", "href", "title", "target"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "breadcrumb-item");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get ["class"]() {
        return classNames(prefix, local.class, {
          active: local.active
        });
      },
      get ["aria-current"]() {
        return local.active ? "page" : void 0;
      },
      get children() {
        return createMemo(() => !!local.active)() ? local.children : createComponent(Dynamic, mergeProps({
          get component() {
            return local.linkAs;
          }
        }, () => local.linkProps, {
          get href() {
            return local.href;
          },
          get title() {
            return local.title;
          },
          get target() {
            return local.target;
          },
          get children() {
            return local.children;
          }
        }));
      }
    }));
  };
  var BreadcrumbItem$1 = BreadcrumbItem;
  var _tmpl$$o = /* @__PURE__ */ template(`<ol></ol>`, 2);
  var defaultProps$10 = {
    as: "nav",
    label: "breadcrumb",
    listProps: {}
  };
  var Breadcrumb = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$10, p2), ["bsPrefix", "class", "listProps", "children", "label", "as"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "breadcrumb");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      },
      get ["aria-label"]() {
        return local.label;
      },
      get ["class"]() {
        return classNames(local.class);
      }
    }, props, {
      get children() {
        const _el$ = _tmpl$$o.cloneNode(true);
        spread(_el$, mergeProps(() => local.listProps, {
          get ["class"]() {
            return classNames(prefix, local.listProps?.class);
          }
        }), false, true);
        insert(_el$, () => local.children);
        return _el$;
      }
    }));
  };
  var Breadcrumb$1 = Object.assign(Breadcrumb, {
    Item: BreadcrumbItem$1
  });
  var defaultProps$$ = {
    variant: "primary",
    active: false,
    disabled: false
  };
  var Button2 = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$$, p2), ["as", "bsPrefix", "children", "variant", "size", "active", "class"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "btn");
    const [buttonProps, {
      tagName
    }] = useButtonProps({
      tagName: local.as,
      ...props
    });
    return createComponent(Dynamic, mergeProps({
      component: tagName
    }, buttonProps, props, {
      get ["class"]() {
        return classNames(local.class, prefix, local.active && "active", local.variant && `${prefix}-${local.variant}`, local.size && `${prefix}-${local.size}`, props.href && props.disabled && "disabled");
      },
      get children() {
        return local.children;
      }
    }));
  };
  var Button$12 = Button2;
  var defaultProps$Y = {
    as: "img"
  };
  var CardImg = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$Y, p2), ["as", "bsPrefix", "class", "variant"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "card-img");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      },
      get ["class"]() {
        return classNames(local.variant ? `${prefix}-${local.variant}` : prefix, local.class);
      }
    }, props));
  };
  var CardImg$1 = CardImg;
  var context$2 = createContext(null);
  var CardHeaderContext = context$2;
  var defaultProps$X = {
    as: "div"
  };
  var CardHeader = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$X, p2), ["as", "bsPrefix", "class"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "card-header");
    const contextValue = {
      get cardHeaderBsPrefix() {
        return prefix;
      }
    };
    return createComponent(CardHeaderContext.Provider, {
      value: contextValue,
      get children() {
        return createComponent(Dynamic, mergeProps({
          get component() {
            return local.as;
          }
        }, props, {
          get ["class"]() {
            return classNames(local.class, prefix);
          }
        }));
      }
    });
  };
  var CardHeader$1 = CardHeader;
  var DivStyledAsH5$1 = divWithClass("h5");
  var DivStyledAsH6 = divWithClass("h6");
  var CardBody = createWithBsPrefix("card-body");
  var CardTitle = createWithBsPrefix("card-title", {
    Component: DivStyledAsH5$1
  });
  var CardSubtitle = createWithBsPrefix("card-subtitle", {
    Component: DivStyledAsH6
  });
  var CardLink = createWithBsPrefix("card-link", {
    Component: "a"
  });
  var CardText = createWithBsPrefix("card-text", {
    Component: "p"
  });
  var CardFooter = createWithBsPrefix("card-footer");
  var CardImgOverlay = createWithBsPrefix("card-img-overlay");
  var defaultProps$W = {
    as: "div",
    body: false
  };
  var Card = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$W, p2), ["as", "bsPrefix", "class", "bg", "text", "border", "body", "children"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "card");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get ["class"]() {
        return classNames(local.class, prefix, local.bg && `bg-${local.bg}`, local.text && `text-${local.text}`, local.border && `border-${local.border}`);
      },
      get children() {
        return createMemo(() => !!local.body)() ? createComponent(CardBody, {
          get children() {
            return local.children;
          }
        }) : local.children;
      }
    }));
  };
  var Card$1 = Object.assign(Card, {
    Img: CardImg$1,
    Title: CardTitle,
    Subtitle: CardSubtitle,
    Body: CardBody,
    Link: CardLink,
    Text: CardText,
    Header: CardHeader$1,
    Footer: CardFooter,
    ImgOverlay: CardImgOverlay
  });
  var CardGroup = createWithBsPrefix("card-group");
  var CarouselCaption = createWithBsPrefix("carousel-caption");
  var defaultProps$V = {
    as: "div"
  };
  var CarouselItem = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$V, p2), ["as", "bsPrefix", "class", "interval"]);
    return {
      item: createComponent(Dynamic, mergeProps({
        get component() {
          return local.as;
        }
      }, props, {
        get ["class"]() {
          return classNames(local.class, useBootstrapPrefix(local.bsPrefix, "carousel-item"));
        }
      })),
      interval: local.interval
    };
  };
  var CarouselItem$1 = CarouselItem;
  var _tmpl$$m = /* @__PURE__ */ template(`<div></div>`, 2);
  var _tmpl$2$5 = /* @__PURE__ */ template(`<button type="button" data-bs-target=""></button>`, 2);
  var _tmpl$3$1 = /* @__PURE__ */ template(`<span aria-hidden="true" class="carousel-control-prev-icon"></span>`, 2);
  var _tmpl$4 = /* @__PURE__ */ template(`<span class="visually-hidden"></span>`, 2);
  var _tmpl$5 = /* @__PURE__ */ template(`<span aria-hidden="true" class="carousel-control-next-icon"></span>`, 2);
  var SWIPE_THRESHOLD = 40;
  var defaultProps$U = {
    as: "div",
    slide: true,
    fade: false,
    controls: true,
    indicators: true,
    indicatorLabels: [],
    defaultActiveIndex: 0,
    interval: 5e3,
    keyboard: true,
    pause: "hover",
    wrap: true,
    touch: true,
    prevLabel: "Previous",
    nextLabel: "Next"
  };
  function isVisible(element) {
    if (!element || !element.style || !element.parentNode || // @ts-ignore
    !element.parentNode.style) {
      return false;
    }
    const elementStyle = getComputedStyle(element);
    return elementStyle.display !== "none" && elementStyle.visibility !== "hidden" && getComputedStyle(element.parentNode).display !== "none";
  }
  var Carousel = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$U, p2), ["as", "bsPrefix", "slide", "fade", "controls", "indicators", "indicatorLabels", "activeIndex", "defaultActiveIndex", "onSelect", "onSlide", "onSlid", "interval", "keyboard", "onKeyDown", "pause", "onMouseOver", "onMouseOut", "wrap", "touch", "onTouchStart", "onTouchMove", "onTouchEnd", "prevIcon", "prevLabel", "nextIcon", "nextLabel", "variant", "class", "children", "ref"]);
    const [activeIndex, onSelect] = createControlledProp(() => local.activeIndex, () => local.defaultActiveIndex, local.onSelect);
    const prefix = useBootstrapPrefix(local.bsPrefix, "carousel");
    const isRTL = useIsRTL();
    const resolvedChildren = children(() => local.children);
    const items = createMemo(() => {
      const c2 = resolvedChildren();
      return Array.isArray(c2) ? c2 : [c2];
    });
    const [nextDirectionRef, setNextDirectionRef] = createSignal(null);
    const [direction, setDirection] = createSignal("next");
    const [paused, setPaused] = createSignal(false);
    const [isSliding, setIsSliding] = createSignal(false);
    const [renderedActiveIndex, setRenderedActiveIndex] = createSignal(activeIndex() || 0);
    createComputed(() => batch(() => {
      if (!isSliding() && activeIndex() !== renderedActiveIndex()) {
        if (nextDirectionRef()) {
          setDirection(nextDirectionRef());
        } else {
          setDirection((activeIndex() || 0) > renderedActiveIndex() ? "next" : "prev");
        }
        if (local.slide) {
          setIsSliding(true);
        }
        setRenderedActiveIndex(activeIndex() || 0);
      }
    }));
    createEffect(() => {
      if (nextDirectionRef()) {
        setNextDirectionRef(null);
      }
    });
    const activeChildInterval = createMemo(() => {
      for (let index = 0; index < items().length; index++) {
        if (index === activeIndex()) {
          const item = items()[index];
          return item.interval;
        }
      }
      return void 0;
    });
    const prev = (event) => {
      if (isSliding()) {
        return;
      }
      let nextActiveIndex = renderedActiveIndex() - 1;
      if (nextActiveIndex < 0) {
        if (!local.wrap) {
          return;
        }
        nextActiveIndex = items().length - 1;
      }
      setNextDirectionRef("prev");
      onSelect?.(nextActiveIndex, event);
    };
    const next = (event) => {
      if (isSliding()) {
        return;
      }
      let nextActiveIndex = renderedActiveIndex() + 1;
      if (nextActiveIndex >= items().length) {
        if (!local.wrap) {
          return;
        }
        nextActiveIndex = 0;
      }
      setNextDirectionRef("next");
      onSelect?.(nextActiveIndex, event);
    };
    const [elementRef, setElementRef] = createSignal();
    const mergedRef = (ref) => {
      setElementRef(ref);
      if (typeof local.ref === "function") {
        local.ref({
          get element() {
            return elementRef();
          },
          prev,
          next
        });
      }
    };
    const nextWhenVisible = () => {
      if (!document.hidden && isVisible(elementRef())) {
        if (isRTL()) {
          prev();
        } else {
          next();
        }
      }
    };
    const slideDirection = createMemo(() => direction() === "next" ? "start" : "end");
    createEffect(() => {
      if (local.slide) {
        return;
      }
      const active = renderedActiveIndex();
      const direction2 = slideDirection();
      untrack(() => {
        local.onSlide?.(active, direction2);
        local.onSlid?.(active, direction2);
      });
    });
    const orderClass = createMemo(() => `${prefix}-item-${direction()}`);
    const directionalClass = createMemo(() => `${prefix}-item-${slideDirection()}`);
    const handleEnter = (node) => {
      triggerBrowserReflow(node);
      local.onSlide?.(renderedActiveIndex(), slideDirection());
    };
    const handleEntered = () => {
      setIsSliding(false);
      local.onSlid?.(renderedActiveIndex(), slideDirection());
    };
    const handleKeyDown = (event) => {
      if (local.keyboard && !/input|textarea/i.test(
        //@ts-ignore
        event.target.tagName
      )) {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            if (isRTL()) {
              next(event);
            } else {
              prev(event);
            }
            return;
          case "ArrowRight":
            event.preventDefault();
            if (isRTL()) {
              prev(event);
            } else {
              next(event);
            }
            return;
        }
      }
      callEventHandler(local.onKeyDown, event);
    };
    const handleMouseOver = (event) => {
      if (local.pause === "hover") {
        setPaused(true);
      }
      callEventHandler(local.onMouseOver, event);
    };
    const handleMouseOut = (event) => {
      setPaused(false);
      callEventHandler(local.onMouseOut, event);
    };
    let touchStartXRef;
    let touchDeltaXRef;
    const handleTouchStart = (event) => {
      touchStartXRef = event.touches[0].clientX;
      touchDeltaXRef = 0;
      if (local.pause === "hover") {
        setPaused(true);
      }
      callEventHandler(local.onTouchStart, event);
    };
    const handleTouchMove = (event) => {
      if (event.touches && event.touches.length > 1) {
        touchDeltaXRef = 0;
      } else {
        touchDeltaXRef = event.touches[0].clientX - touchStartXRef;
      }
      callEventHandler(local.onTouchMove, event);
    };
    const handleTouchEnd = (event) => {
      if (local.touch) {
        const touchDeltaX = touchDeltaXRef;
        if (Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
          if (touchDeltaX > 0) {
            prev(event);
          } else {
            next(event);
          }
        }
      }
      if (local.pause === "hover") {
        let touchUnpauseTimeout = window.setTimeout(() => {
          setPaused(false);
        }, local.interval);
        onCleanup(() => {
          window.clearTimeout(touchUnpauseTimeout);
        });
      }
      callEventHandler(local.onTouchEnd, event);
    };
    const shouldPlay = createMemo(() => local.interval != null && !paused() && !isSliding());
    const [intervalHandleRef, setIntervalHandleRef] = createSignal();
    createEffect(() => {
      if (!shouldPlay()) {
        return void 0;
      }
      const nextFunc = isRTL() ? prev : next;
      setIntervalHandleRef(window.setInterval(document.visibilityState ? nextWhenVisible : nextFunc, activeChildInterval() ?? local.interval ?? void 0));
      onCleanup(() => {
        if (intervalHandleRef() !== null) {
          clearInterval(intervalHandleRef());
        }
      });
    });
    const isActive = createSelector(renderedActiveIndex);
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      },
      ref: mergedRef
    }, props, {
      onKeyDown: handleKeyDown,
      onMouseOver: handleMouseOver,
      onMouseOut: handleMouseOut,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      get ["class"]() {
        return classNames(local.class, prefix, local.slide && "slide", local.fade && `${prefix}-fade`, local.variant && `${prefix}-${local.variant}`);
      },
      get children() {
        return [createMemo(() => createMemo(() => !!local.indicators)() && (() => {
          const _el$2 = _tmpl$$m.cloneNode(true);
          className(_el$2, `${prefix}-indicators`);
          insert(_el$2, createComponent(For, {
            get each() {
              return items();
            },
            children: (_, index) => (() => {
              const _el$3 = _tmpl$2$5.cloneNode(true);
              _el$3.$$click = (e2) => onSelect?.(index(), e2);
              createRenderEffect((_p$) => {
                const _v$ = local.indicatorLabels?.length ? local.indicatorLabels[index()] : `Slide ${index() + 1}`, _v$2 = isActive(index()) ? "active" : void 0, _v$3 = isActive(index());
                _v$ !== _p$._v$ && setAttribute(_el$3, "aria-label", _p$._v$ = _v$);
                _v$2 !== _p$._v$2 && className(_el$3, _p$._v$2 = _v$2);
                _v$3 !== _p$._v$3 && setAttribute(_el$3, "aria-current", _p$._v$3 = _v$3);
                return _p$;
              }, {
                _v$: void 0,
                _v$2: void 0,
                _v$3: void 0
              });
              return _el$3;
            })()
          }));
          return _el$2;
        })()), (() => {
          const _el$ = _tmpl$$m.cloneNode(true);
          className(_el$, `${prefix}-inner`);
          insert(_el$, createComponent(For, {
            get each() {
              return items();
            },
            children: (child, index) => {
              const el = typeof child.item === "function" ? child.item() : child.item;
              return local.slide ? createComponent(TransitionWrapper$1, {
                get ["in"]() {
                  return isActive(index());
                },
                get onEnter() {
                  return isActive(index()) ? handleEnter : void 0;
                },
                get onEntered() {
                  return isActive(index()) ? handleEntered : void 0;
                },
                addEndListener: transitionEndListener,
                children: (status, innerProps) => {
                  innerProps.ref(el);
                  const newClasses = classNames(isActive(index()) && status !== "entered" && orderClass(), (status === "entered" || status === "exiting") && "active", (status === "entering" || status === "exiting") && directionalClass());
                  resolveClasses(el, child.prevClasses, newClasses);
                  child.prevClasses = newClasses;
                  return el;
                }
              }) : () => {
                createEffect(() => {
                  el.classList.toggle("active", isActive(index()));
                });
                return el;
              };
            }
          }));
          return _el$;
        })(), createMemo(() => createMemo(() => !!local.controls)() && [createMemo((() => {
          const _c$ = createMemo(() => !!(local.wrap || activeIndex() !== 0));
          return () => _c$() && createComponent(Anchor$1, {
            "class": `${prefix}-control-prev`,
            onClick: prev,
            get children() {
              return [createMemo(() => local.prevIcon ?? _tmpl$3$1.cloneNode(true)), createMemo(() => createMemo(() => !!local.prevLabel)() && (() => {
                const _el$5 = _tmpl$4.cloneNode(true);
                insert(_el$5, () => local.prevLabel);
                return _el$5;
              })())];
            }
          });
        })()), createMemo((() => {
          const _c$2 = createMemo(() => !!(local.wrap || activeIndex() !== items().length - 1));
          return () => _c$2() && createComponent(Anchor$1, {
            "class": `${prefix}-control-next`,
            onClick: next,
            get children() {
              return [createMemo(() => local.nextIcon ?? _tmpl$5.cloneNode(true)), createMemo(() => createMemo(() => !!local.nextLabel)() && (() => {
                const _el$7 = _tmpl$4.cloneNode(true);
                insert(_el$7, () => local.nextLabel);
                return _el$7;
              })())];
            }
          });
        })())])];
      }
    }));
  };
  var Carousel$1 = Object.assign(Carousel, {
    Caption: CarouselCaption,
    Item: CarouselItem$1
  });
  delegateEvents(["click"]);
  var DEVICE_SIZES = ["xxl", "xl", "lg", "md", "sm", "xs"];
  function useCol(o2) {
    const [local, props] = splitProps(o2, ["as", "bsPrefix", "class"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "col");
    const breakpoints = useBootstrapBreakpoints();
    const spans = [];
    const classes = [];
    breakpoints().forEach((brkPoint) => {
      const propValue = props[brkPoint];
      let span;
      let offset2;
      let order2;
      if (typeof propValue === "object" && propValue != null) {
        ({
          span,
          offset: offset2,
          order: order2
        } = propValue);
      } else {
        span = propValue;
      }
      const infix = brkPoint !== "xs" ? `-${brkPoint}` : "";
      if (span)
        spans.push(span === true ? `${bsPrefix}${infix}` : `${bsPrefix}${infix}-${span}`);
      if (order2 != null)
        classes.push(`order${infix}-${order2}`);
      if (offset2 != null)
        classes.push(`offset${infix}-${offset2}`);
    });
    const [_, cleanedProps] = splitProps(props, DEVICE_SIZES);
    return [mergeProps(cleanedProps, {
      get class() {
        return classNames(local.class, ...spans, ...classes);
      }
    }), {
      get as() {
        return local.as;
      },
      get bsPrefix() {
        return bsPrefix;
      },
      get spans() {
        return spans;
      }
    }];
  }
  var Col = (p2) => {
    const [useProps, meta] = useCol(p2);
    const [local, colProps] = splitProps(useProps, ["class"]);
    return createComponent(Dynamic, mergeProps({
      get component() {
        return meta.as ?? "div";
      }
    }, colProps, {
      get ["class"]() {
        return classNames(local.class, !meta.spans.length && meta.bsPrefix);
      }
    }));
  };
  var Col$1 = Col;
  var DropdownContext2 = createContext({});
  var DropdownContext$12 = DropdownContext2;
  var defaultProps$S = {
    as: Anchor$1,
    disabled: false
  };
  var DropdownItem2 = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$S, p2), ["as", "bsPrefix", "class", "eventKey", "disabled", "onClick", "active"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "dropdown-item");
    const [dropdownItemProps, meta] = useDropdownItem({
      get key() {
        return local.eventKey;
      },
      get href() {
        return props.href;
      },
      get disabled() {
        return local.disabled;
      },
      get onClick() {
        return local.onClick;
      },
      get active() {
        return local.active;
      }
    });
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, dropdownItemProps, {
      get ["class"]() {
        return classNames(local.class, prefix, meta.isActive && "active", local.disabled && "disabled");
      }
    }));
  };
  var DropdownItem$12 = DropdownItem2;
  var context$1 = createContext(null);
  var InputGroupContext = context$1;
  var context = createContext(null);
  var NavbarContext = context;
  var defaultProps$R = {
    as: "div",
    flip: true
  };
  function getDropdownMenuPlacement(alignEnd, dropDirection, isRTL) {
    const topStart = isRTL ? "top-end" : "top-start";
    const topEnd = isRTL ? "top-start" : "top-end";
    const bottomStart = isRTL ? "bottom-end" : "bottom-start";
    const bottomEnd = isRTL ? "bottom-start" : "bottom-end";
    const leftStart = isRTL ? "right-start" : "left-start";
    const leftEnd = isRTL ? "right-end" : "left-end";
    const rightStart = isRTL ? "left-start" : "right-start";
    const rightEnd = isRTL ? "left-end" : "right-end";
    let placement = alignEnd ? bottomEnd : bottomStart;
    if (dropDirection === "up")
      placement = alignEnd ? topEnd : topStart;
    else if (dropDirection === "end")
      placement = alignEnd ? rightEnd : rightStart;
    else if (dropDirection === "start")
      placement = alignEnd ? leftEnd : leftStart;
    return placement;
  }
  var DropdownMenu2 = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$R, p2), ["as", "bsPrefix", "class", "align", "rootCloseEvent", "flip", "show", "renderOnMount", "popperConfig", "ref", "variant"]);
    let alignEnd = false;
    const isNavbar = useContext(NavbarContext);
    const prefix = useBootstrapPrefix(local.bsPrefix, "dropdown-menu");
    const dropdownContext = useContext(DropdownContext$12);
    const align = local.align || dropdownContext.align;
    const isInputGroup = useContext(InputGroupContext);
    const alignClasses = [];
    if (align) {
      if (typeof align === "object") {
        const keys = Object.keys(align);
        if (keys.length) {
          const brkPoint = keys[0];
          const direction = align[brkPoint];
          alignEnd = direction === "start";
          alignClasses.push(`${prefix}-${brkPoint}-${direction}`);
        }
      } else if (align === "end") {
        alignEnd = true;
      }
    }
    const [menuProps, menuMeta] = useDropdownMenu({
      get flip() {
        return local.flip;
      },
      get rootCloseEvent() {
        return local.rootCloseEvent;
      },
      get show() {
        return local.show;
      },
      get usePopper() {
        return !isNavbar && alignClasses.length === 0;
      },
      get offset() {
        return [0, 2];
      },
      get popperConfig() {
        return local.popperConfig;
      },
      get placement() {
        return getDropdownMenuPlacement(alignEnd, dropdownContext.drop, dropdownContext.isRTL);
      }
    });
    const mergedRef = (ref) => {
      menuProps.ref?.(ref);
      local.ref?.(ref);
    };
    const extendedMenuProps = mergeProps(
      menuProps,
      // For custom components provide additional, non-DOM, props;
      typeof local.as !== "string" ? {
        get show() {
          return menuMeta.show;
        },
        get close() {
          return () => menuMeta.toggle?.(false);
        },
        get align() {
          return align;
        }
      } : {}
    );
    const style4 = () => menuMeta.popper?.placement ? {
      ...props.style,
      ...menuProps.style
    } : props.style;
    return createComponent(Show, {
      get when() {
        return menuMeta.hasShown || local.renderOnMount || isInputGroup;
      },
      get children() {
        return createComponent(Dynamic, mergeProps({
          get component() {
            return local.as;
          }
        }, props, extendedMenuProps, {
          ref: mergedRef,
          get style() {
            return style4();
          }
        }, () => alignClasses.length || isNavbar ? {
          "data-bs-popper": "static"
        } : {}, {
          get ["class"]() {
            return classNames(local.class, prefix, menuMeta.show && "show", alignEnd && `${prefix}-end`, local.variant && `${prefix}-${local.variant}`, ...alignClasses);
          }
        }));
      }
    });
  };
  var DropdownMenu$1 = DropdownMenu2;
  var defaultProps$Q = {
    as: Button$12
  };
  var DropdownToggle2 = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$Q, p2), ["as", "bsPrefix", "split", "class", "childBsPrefix", "ref"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "dropdown-toggle");
    const dropdownContext = useContext(DropdownContext$1);
    const isInputGroup = useContext(InputGroupContext);
    if (local.childBsPrefix !== void 0) {
      props.bsPrefix = local.childBsPrefix;
    }
    const [toggleProps] = useDropdownToggle();
    const [toggleLocal, toggleOther] = splitProps(toggleProps, ["ref"]);
    const mergedRef = (ref) => {
      toggleLocal.ref?.(ref);
      local.ref?.(ref);
    };
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      },
      get ["class"]() {
        return classNames(local.class, prefix, local.split && `${prefix}-split`, !!isInputGroup && dropdownContext?.show && "show");
      }
    }, toggleOther, props, {
      ref: mergedRef
    }));
  };
  var DropdownToggle$1 = DropdownToggle2;
  var DropdownHeader = createWithBsPrefix("dropdown-header", {
    defaultProps: {
      role: "heading"
    }
  });
  var DropdownDivider = createWithBsPrefix("dropdown-divider", {
    Component: "hr",
    defaultProps: {
      role: "separator"
    }
  });
  var DropdownItemText = createWithBsPrefix("dropdown-item-text", {
    Component: "span"
  });
  var defaultProps$P = {
    as: "div",
    navbar: false,
    align: "start",
    autoClose: true
  };
  var Dropdown2 = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$P, p2), ["as", "bsPrefix", "drop", "show", "defaultShow", "class", "align", "onSelect", "onToggle", "focusFirstItemOnShow", "navbar", "autoClose"]);
    const [show, onToggle] = createControlledProp(() => local.show, () => local.defaultShow, local.onToggle);
    const isInputGroup = useContext(InputGroupContext);
    const prefix = useBootstrapPrefix(local.bsPrefix, "dropdown");
    const isRTL = useIsRTL();
    const isClosingPermitted = (source) => {
      if (local.autoClose === false)
        return source === "click";
      if (local.autoClose === "inside")
        return source !== "rootClose";
      if (local.autoClose === "outside")
        return source !== "select";
      return true;
    };
    const handleToggle = (nextShow, meta) => {
      if (
        // null option below is for "bug?" in Solid returning null instead of document
        (meta.originalEvent.currentTarget === document || meta.originalEvent.currentTarget === null) && (meta.source !== "keydown" || meta.originalEvent.key === "Escape")
      ) {
        meta.source = "rootClose";
      }
      if (isClosingPermitted(meta.source))
        onToggle?.(nextShow, meta);
    };
    const alignEnd = local.align === "end";
    const placement = getDropdownMenuPlacement(alignEnd, local.drop, isRTL());
    const contextValue = {
      get align() {
        return local.align;
      },
      get drop() {
        return local.drop;
      },
      get isRTL() {
        return isRTL();
      }
    };
    return createComponent(DropdownContext$12.Provider, {
      value: contextValue,
      get children() {
        return createComponent(Dropdown, {
          placement,
          get show() {
            return show();
          },
          get onSelect() {
            return local.onSelect;
          },
          onToggle: handleToggle,
          get focusFirstItemOnShow() {
            return local.focusFirstItemOnShow;
          },
          itemSelector: `.${prefix}-item:not(.disabled):not(:disabled)`,
          get children() {
            return isInputGroup ? props.children : createComponent(Dynamic, mergeProps({
              get component() {
                return local.as;
              }
            }, props, {
              get ["class"]() {
                return classNames(local.class, show() && "show", (!local.drop || local.drop === "down") && prefix, local.drop === "up" && "dropup", local.drop === "end" && "dropend", local.drop === "start" && "dropstart");
              }
            }));
          }
        });
      }
    });
  };
  var Dropdown$1 = Object.assign(Dropdown2, {
    Toggle: DropdownToggle$1,
    Menu: DropdownMenu$1,
    Item: DropdownItem$12,
    ItemText: DropdownItemText,
    Divider: DropdownDivider,
    Header: DropdownHeader
  });
  var defaultProps$N = {
    as: "div",
    type: "valid",
    tooltip: false
  };
  var Feedback = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$N, p2), ["as", "class", "type", "tooltip"]);
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get ["class"]() {
        return classNames(local.class, `${local.type}-${local.tooltip ? "tooltip" : "feedback"}`);
      }
    }));
  };
  var Feedback$1 = Feedback;
  var _tmpl$$l = /* @__PURE__ */ template(`<img>`, 1);
  var defaultProps$M = {
    fluid: false,
    rounded: false,
    roundedCircle: false,
    thumbnail: false
  };
  var Image = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$M, p2), ["bsPrefix", "class", "fluid", "rounded", "roundedCircle", "thumbnail"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "img");
    return (() => {
      const _el$ = _tmpl$$l.cloneNode(true);
      spread(_el$, mergeProps(props, {
        get ["class"]() {
          return classNames(local.class, local.fluid && `${bsPrefix}-fluid`, local.rounded && `rounded`, local.roundedCircle && `rounded-circle`, local.thumbnail && `${bsPrefix}-thumbnail`);
        }
      }), false, false);
      return _el$;
    })();
  };
  var Image$1 = Image;
  var defaultProps$L = {
    fluid: true
  };
  var FigureImage = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$L, p2), ["class"]);
    return createComponent(Image$1, mergeProps(props, {
      get ["class"]() {
        return classNames(local.class, "figure-img");
      }
    }));
  };
  var FigureImage$1 = FigureImage;
  var FigureCaption = createWithBsPrefix("figure-caption", {
    Component: "figcaption"
  });
  var FigureCaption$1 = FigureCaption;
  var Figure = createWithBsPrefix("figure", {
    Component: "figure"
  });
  var Figure$1 = Object.assign(Figure, {
    Image: FigureImage$1,
    Caption: FigureCaption$1
  });
  var FormContext = createContext({});
  var FormContext$1 = FormContext;
  var defaultProps$K = {
    as: "div"
  };
  var FormGroup = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$K, p2), ["as", "controlId"]);
    const context2 = {
      get controlId() {
        return local.controlId;
      }
    };
    return createComponent(FormContext$1.Provider, {
      value: context2,
      get children() {
        return createComponent(Dynamic, mergeProps({
          get component() {
            return local.as;
          }
        }, props));
      }
    });
  };
  var FormGroup$1 = FormGroup;
  var _tmpl$$k = /* @__PURE__ */ template(`<label></label>`, 2);
  var defaultProps$J = {};
  var FloatingLabel = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$J, p2), ["bsPrefix", "class", "children", "controlId", "label"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-floating");
    return createComponent(FormGroup$1, mergeProps({
      get ["class"]() {
        return classNames(local.class, bsPrefix);
      },
      get controlId() {
        return local.controlId;
      }
    }, props, {
      get children() {
        return [createMemo(() => local.children), (() => {
          const _el$ = _tmpl$$k.cloneNode(true);
          insert(_el$, () => local.label);
          createRenderEffect(() => setAttribute(_el$, "for", local.controlId));
          return _el$;
        })()];
      }
    }));
  };
  var FloatingLabel$1 = FloatingLabel;
  var defaultProps$I = {
    as: "input",
    type: "checkbox",
    isValid: false,
    isInvalid: false
  };
  var FormCheckInput = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$I, p2), ["as", "id", "bsPrefix", "class", "type", "isValid", "isInvalid"]);
    const formContext = useContext(FormContext$1);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-check-input");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get type() {
        return local.type;
      },
      get id() {
        return local.id || formContext.controlId;
      },
      get ["class"]() {
        return classNames(local.class, bsPrefix, local.isValid && "is-valid", local.isInvalid && "is-invalid");
      }
    }));
  };
  var FormCheckInput$1 = FormCheckInput;
  var FormCheckContext = createContext();
  var FormCheckContext$1 = FormCheckContext;
  var _tmpl$$j = /* @__PURE__ */ template(`<label></label>`, 2);
  var defaultProps$H = {};
  var FormCheckLabel = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$H, p2), ["bsPrefix", "class", "for"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-check-label");
    const formContext = useContext(FormContext$1);
    const formCheckContext = useContext(FormCheckContext$1);
    formCheckContext?.setHasFormCheckLabel?.(true);
    return (() => {
      const _el$ = _tmpl$$j.cloneNode(true);
      spread(_el$, mergeProps(props, {
        get ["for"]() {
          return local.for || formContext.controlId;
        },
        get ["class"]() {
          return classNames(local.class, bsPrefix);
        }
      }), false, false);
      return _el$;
    })();
  };
  var FormCheckLabel$1 = FormCheckLabel;
  var _tmpl$$i = /* @__PURE__ */ template(`<div></div>`, 2);
  var defaultProps$G = {
    as: "input",
    title: "",
    type: "checkbox",
    inline: false,
    disabled: false,
    isValid: false,
    isInvalid: false,
    feedbackTooltip: false
  };
  var FormCheck = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$G, p2), ["as", "id", "bsPrefix", "bsSwitchPrefix", "inline", "disabled", "isValid", "isInvalid", "feedbackTooltip", "feedback", "feedbackType", "class", "style", "title", "type", "label", "children"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-check");
    const bsSwitchPrefix = useBootstrapPrefix(local.bsSwitchPrefix, "form-switch");
    const [hasFormCheckLabel, setHasFormCheckLabel] = createSignal(false);
    const formContext = useContext(FormContext$1);
    const innerFormContext = {
      get controlId() {
        return local.id || formContext.controlId;
      }
    };
    const resolvedChildren = children(() => local.children);
    const hasLabel = createMemo(() => local.label != null && local.label !== false && !resolvedChildren() || hasFormCheckLabel());
    return createComponent(FormContext$1.Provider, {
      value: innerFormContext,
      get children() {
        return createComponent(FormCheckContext$1.Provider, {
          value: {
            setHasFormCheckLabel
          },
          get children() {
            const _el$ = _tmpl$$i.cloneNode(true);
            insert(_el$, () => resolvedChildren() || [createComponent(FormCheckInput$1, mergeProps(props, {
              get type() {
                return local.type === "switch" ? "checkbox" : local.type;
              },
              get isValid() {
                return local.isValid;
              },
              get isInvalid() {
                return local.isInvalid;
              },
              get disabled() {
                return local.disabled;
              },
              get as() {
                return local.as;
              }
            })), createMemo((() => {
              const _c$ = createMemo(() => !!hasLabel());
              return () => _c$() && createComponent(FormCheckLabel$1, {
                get title() {
                  return local.title;
                },
                get children() {
                  return local.label;
                }
              });
            })()), createMemo((() => {
              const _c$2 = createMemo(() => !!local.feedback);
              return () => _c$2() && createComponent(Feedback$1, {
                get type() {
                  return local.feedbackType;
                },
                get tooltip() {
                  return local.feedbackTooltip;
                },
                get children() {
                  return local.feedback;
                }
              });
            })())]);
            createRenderEffect((_p$) => {
              const _v$ = local.style, _v$2 = classNames(local.class, hasLabel() && bsPrefix, local.inline && `${bsPrefix}-inline`, local.type === "switch" && bsSwitchPrefix);
              _p$._v$ = style(_el$, _v$, _p$._v$);
              _v$2 !== _p$._v$2 && className(_el$, _p$._v$2 = _v$2);
              return _p$;
            }, {
              _v$: void 0,
              _v$2: void 0
            });
            return _el$;
          }
        });
      }
    });
  };
  var FormCheck$1 = Object.assign(FormCheck, {
    Input: FormCheckInput$1,
    Label: FormCheckLabel$1
  });
  var defaultProps$F = {
    as: "input",
    isValid: false,
    isInvalid: false
  };
  var FormControl = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$F, p2), ["as", "bsPrefix", "type", "size", "htmlSize", "id", "class", "isValid", "isInvalid", "plaintext", "readOnly"]);
    const formContext = useContext(FormContext$1);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-control");
    const classes = () => {
      let classes2;
      if (local.plaintext) {
        classes2 = {
          [`${bsPrefix}-plaintext`]: true
        };
      } else {
        classes2 = {
          [bsPrefix]: true,
          [`${bsPrefix}-${local.size}`]: local.size
        };
      }
      return classes2;
    };
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get type() {
        return local.type;
      },
      get size() {
        return local.htmlSize;
      },
      get readOnly() {
        return local.readOnly;
      },
      get id() {
        return local.id || formContext.controlId;
      },
      get ["class"]() {
        return classNames(classes(), local.isValid && `is-valid`, local.isInvalid && `is-invalid`, local.type === "color" && `${bsPrefix}-color`);
      }
    }));
  };
  var FormControl$1 = Object.assign(FormControl, {
    Feedback: Feedback$1
  });
  var FormFloating = createWithBsPrefix("form-floating");
  var defaultProps$E = {
    as: "label",
    column: false,
    visuallyHidden: false
  };
  var FormLabel = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$E, p2), ["as", "bsPrefix", "column", "visuallyHidden", "class", "htmlFor"]);
    const formContext = useContext(FormContext$1);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-label");
    let columnClass = "col-form-label";
    if (typeof local.column === "string")
      columnClass = `${columnClass} ${columnClass}-${local.column}`;
    const classes = () => classNames(local.class, bsPrefix, local.visuallyHidden && "visually-hidden", local.column && columnClass);
    return !!local.column ? createComponent(Col$1, mergeProps({
      as: "label",
      get ["class"]() {
        return classes();
      },
      get htmlFor() {
        return local.htmlFor || formContext.controlId;
      }
    }, props)) : createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      },
      get ["class"]() {
        return classes();
      },
      get htmlFor() {
        return local.htmlFor || formContext.controlId;
      }
    }, props));
  };
  var FormLabel$1 = FormLabel;
  var _tmpl$$h = /* @__PURE__ */ template(`<input>`, 1);
  var defaultProps$D = {
    as: "img"
  };
  var FormRange = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$D, p2), ["bsPrefix", "class", "id"]);
    const formContext = useContext(FormContext$1);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-range");
    return (() => {
      const _el$ = _tmpl$$h.cloneNode(true);
      spread(_el$, mergeProps(props, {
        "type": "range",
        get ["class"]() {
          return classNames(local.class, bsPrefix);
        },
        get id() {
          return local.id || formContext.controlId;
        }
      }), false, false);
      return _el$;
    })();
  };
  var FormRange$1 = FormRange;
  var _tmpl$$g = /* @__PURE__ */ template(`<select></select>`, 2);
  var defaultProps$C = {
    isValid: false,
    isInvalid: false
  };
  var FormSelect = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$C, p2), ["bsPrefix", "size", "htmlSize", "class", "isValid", "isInvalid", "id"]);
    const formContext = useContext(FormContext$1);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-select");
    return (() => {
      const _el$ = _tmpl$$g.cloneNode(true);
      spread(_el$, mergeProps(props, {
        get size() {
          return local.htmlSize;
        },
        get ["class"]() {
          return classNames(local.class, bsPrefix, local.size && `${bsPrefix}-${local.size}`, local.isValid && `is-valid`, local.isInvalid && `is-invalid`);
        },
        get id() {
          return local.id || formContext.controlId;
        }
      }), false, false);
      return _el$;
    })();
  };
  var FormSelect$1 = FormSelect;
  var defaultProps$B = {
    as: "small"
  };
  var FormText = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$B, p2), ["as", "bsPrefix", "class", "muted"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-text");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get ["class"]() {
        return classNames(local.class, bsPrefix, local.muted && "text-muted");
      }
    }));
  };
  var FormText$1 = FormText;
  var Switch2 = (props) => createComponent(FormCheck$1, mergeProps(props, {
    type: "switch"
  }));
  var Switch$1 = Object.assign(Switch2, {
    Input: FormCheck$1.Input,
    Label: FormCheck$1.Label
  });
  var defaultProps$A = {
    as: "form"
  };
  var Form = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$A, p2), ["as", "class", "validated"]);
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get ["class"]() {
        return classNames(local.class, local.validated && "was-validated");
      }
    }));
  };
  var Form$1 = Object.assign(Form, {
    Group: FormGroup$1,
    Control: FormControl$1,
    Floating: FormFloating,
    Check: FormCheck$1,
    Switch: Switch$1,
    Label: FormLabel$1,
    Text: FormText$1,
    Range: FormRange$1,
    Select: FormSelect$1,
    FloatingLabel: FloatingLabel$1
  });
  var InputGroupText = createWithBsPrefix("input-group-text", {
    Component: "span"
  });
  var InputGroupCheckbox = (props) => createComponent(InputGroupText, {
    get children() {
      return createComponent(FormCheckInput$1, mergeProps({
        type: "checkbox"
      }, props));
    }
  });
  var InputGroupRadio = (props) => createComponent(InputGroupText, {
    get children() {
      return createComponent(FormCheckInput$1, mergeProps({
        type: "radio"
      }, props));
    }
  });
  var defaultProps$z = {
    as: "div"
  };
  var InputGroup = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$z, p2), ["as", "bsPrefix", "size", "hasValidation", "class"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "input-group");
    const contextValue = {};
    return createComponent(InputGroupContext.Provider, {
      value: contextValue,
      get children() {
        return createComponent(Dynamic, mergeProps({
          get component() {
            return local.as;
          }
        }, props, {
          get ["class"]() {
            return classNames(local.class, bsPrefix, local.size && `${bsPrefix}-${local.size}`, local.hasValidation && "has-validation");
          }
        }));
      }
    });
  };
  var InputGroup$1 = Object.assign(InputGroup, {
    Text: InputGroupText,
    Radio: InputGroupRadio,
    Checkbox: InputGroupCheckbox
  });
  var defaultProps$y = {};
  var ListGroupItem = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$y, p2), ["as", "bsPrefix", "active", "disabled", "eventKey", "class", "variant", "action"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "list-group-item");
    const [navItemProps, meta] = useNavItem(mergeProps({
      get key() {
        return makeEventKey(local.eventKey, props.href);
      },
      get active() {
        return local.active;
      }
    }, props));
    const handleClick = createMemo(() => (event) => {
      if (local.disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      navItemProps.onClick(event);
    });
    const disabledProps = () => local.disabled && props.tabIndex === void 0 ? {
      tabIndex: -1,
      ["aria-disabled"]: true
    } : {};
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as || (local.action ? props.href ? "a" : "button" : "div");
      }
    }, props, navItemProps, disabledProps, {
      get onClick() {
        return handleClick();
      },
      get ["class"]() {
        return classNames(local.class, bsPrefix, meta.isActive && "active", local.disabled && "disabled", local.variant && `${bsPrefix}-${local.variant}`, local.action && `${bsPrefix}-action`);
      }
    }));
  };
  var ListGroupItem$1 = ListGroupItem;
  var defaultProps$x = {
    as: "div"
  };
  var ListGroup = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$x, p2), ["as", "activeKey", "defaultActiveKey", "bsPrefix", "class", "variant", "horizontal", "numbered", "onSelect"]);
    const [activeKey, onSelect] = createControlledProp(() => local.activeKey, () => local.defaultActiveKey, local.onSelect);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "list-group");
    let horizontalVariant;
    if (local.horizontal) {
      horizontalVariant = local.horizontal === true ? "horizontal" : `horizontal-${local.horizontal}`;
    }
    return createComponent(Nav$1, mergeProps({
      get as() {
        return local.as;
      }
    }, props, {
      get activeKey() {
        return activeKey();
      },
      onSelect,
      get ["class"]() {
        return classNames(local.class, bsPrefix, local.variant && `${bsPrefix}-${local.variant}`, horizontalVariant && `${bsPrefix}-${horizontalVariant}`, local.numbered && `${bsPrefix}-numbered`);
      }
    }));
  };
  var ListGroup$1 = Object.assign(ListGroup, {
    Item: ListGroupItem$1
  });
  var size;
  function scrollbarSize(recalc) {
    if (!size && size !== 0 || recalc) {
      if (canUseDOM2) {
        var scrollDiv = document.createElement("div");
        scrollDiv.style.position = "absolute";
        scrollDiv.style.top = "-9999px";
        scrollDiv.style.width = "50px";
        scrollDiv.style.height = "50px";
        scrollDiv.style.overflow = "scroll";
        document.body.appendChild(scrollDiv);
        size = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
      }
    }
    return size;
  }
  var ModalBody = createWithBsPrefix("modal-body");
  var ModalContext = createContext({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onHide() {
    }
  });
  var ModalContext$1 = ModalContext;
  var _tmpl$$f = /* @__PURE__ */ template(`<div><div></div></div>`, 4);
  var defaultProps$w = {};
  var ModalDialog = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$w, p2), ["bsPrefix", "class", "contentClass", "centered", "size", "fullscreen", "children", "scrollable"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "modal");
    const dialogClass = `${bsPrefix}-dialog`;
    const fullScreenClass = typeof local.fullscreen === "string" ? `${bsPrefix}-fullscreen-${local.fullscreen}` : `${bsPrefix}-fullscreen`;
    return (() => {
      const _el$ = _tmpl$$f.cloneNode(true), _el$2 = _el$.firstChild;
      spread(_el$, mergeProps(props, {
        get ["class"]() {
          return classNames(dialogClass, local.class, local.size && `${bsPrefix}-${local.size}`, local.centered && `${dialogClass}-centered`, local.scrollable && `${dialogClass}-scrollable`, local.fullscreen && fullScreenClass);
        }
      }), false, true);
      insert(_el$2, () => local.children);
      createRenderEffect(() => className(_el$2, classNames(`${bsPrefix}-content`, local.contentClass, local.contentClass)));
      return _el$;
    })();
  };
  var ModalDialog$1 = ModalDialog;
  var ModalFooter = createWithBsPrefix("modal-footer");
  var _tmpl$$e = /* @__PURE__ */ template(`<div></div>`, 2);
  var defaultProps$v = {
    closeLabel: "Close",
    closeButton: false
  };
  var AbstractModalHeader = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$v, p2), ["closeLabel", "closeVariant", "closeButton", "onHide", "children"]);
    const context2 = useContext(ModalContext$1);
    const handleClick = () => {
      context2?.onHide();
      local.onHide?.();
    };
    return (() => {
      const _el$ = _tmpl$$e.cloneNode(true);
      spread(_el$, props, false, true);
      insert(_el$, () => local.children, null);
      insert(_el$, (() => {
        const _c$ = createMemo(() => !!local.closeButton);
        return () => _c$() && createComponent(CloseButton$1, {
          get ["aria-label"]() {
            return local.closeLabel;
          },
          get variant() {
            return local.closeVariant;
          },
          onClick: handleClick
        });
      })(), null);
      return _el$;
    })();
  };
  var AbstractModalHeader$1 = AbstractModalHeader;
  var defaultProps$u = {
    closeLabel: "Close",
    closeButton: false
  };
  var ModalHeader = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$u, p2), ["bsPrefix", "class"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "modal-header");
    return createComponent(AbstractModalHeader$1, mergeProps(props, {
      get ["class"]() {
        return classNames(local.class, bsPrefix);
      }
    }));
  };
  var ModalHeader$1 = ModalHeader;
  var DivStyledAsH4 = divWithClass("h4");
  var ModalTitle = createWithBsPrefix("modal-title", {
    Component: DivStyledAsH4
  });
  var _tmpl$$d = /* @__PURE__ */ template(`<div></div>`, 2);
  var _tmpl$2$4 = /* @__PURE__ */ template(`<div role="dialog"></div>`, 2);
  var defaultProps$t = {
    show: false,
    backdrop: true,
    keyboard: true,
    autoFocus: true,
    enforceFocus: true,
    restoreFocus: true,
    animation: true,
    dialogAs: ModalDialog$1
  };
  function DialogTransition$1(props) {
    return createComponent(Fade$1, mergeProps(props, {
      timeout: void 0
    }));
  }
  function BackdropTransition$1(props) {
    return createComponent(Fade$1, mergeProps(props, {
      timeout: void 0
    }));
  }
  var Modal2 = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$t, p2), [
      "bsPrefix",
      "class",
      "style",
      "dialogClass",
      "contentClass",
      "children",
      "dialogAs",
      "aria-labelledby",
      /* BaseModal props */
      "show",
      "animation",
      "backdrop",
      "keyboard",
      "onEscapeKeyDown",
      "onShow",
      "onHide",
      "container",
      "autoFocus",
      "enforceFocus",
      "restoreFocus",
      "restoreFocusOptions",
      "onEntered",
      "onExit",
      "onExiting",
      "onEnter",
      "onEntering",
      "onExited",
      "backdropClass",
      "manager"
    ]);
    const [modalStyle, setStyle] = createSignal({});
    const [animateStaticModal, setAnimateStaticModal] = createSignal(false);
    let waitingForMouseUpRef = false;
    let ignoreBackdropClickRef = false;
    let removeStaticModalAnimationRef = null;
    let modal;
    const isRTL = useIsRTL();
    const mergedRef = (ref) => {
      modal = ref;
      props.ref?.(ref);
    };
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "modal");
    const modalContext = {
      get onHide() {
        return local.onHide;
      }
    };
    function getModalManager() {
      if (local.manager)
        return local.manager;
      return getSharedManager({
        isRTL: isRTL()
      });
    }
    function updateDialogStyle(node) {
      if (!canUseDOM2)
        return;
      const containerIsOverflowing = getModalManager().getScrollbarWidth() > 0;
      const modalIsOverflowing = node.scrollHeight > ownerDocument2(node).documentElement.clientHeight;
      setStyle({
        paddingRight: containerIsOverflowing && !modalIsOverflowing ? scrollbarSize() : void 0,
        paddingLeft: !containerIsOverflowing && modalIsOverflowing ? scrollbarSize() : void 0
      });
    }
    const handleWindowResize = () => {
      if (modal) {
        updateDialogStyle(modal.dialog);
      }
    };
    onCleanup(() => {
      if (!isServer) {
        removeEventListener2(window, "resize", handleWindowResize);
      }
      removeStaticModalAnimationRef?.();
    });
    const handleDialogMouseDown = () => {
      waitingForMouseUpRef = true;
    };
    const handleMouseUp = (e2) => {
      if (waitingForMouseUpRef && modal && e2.target === modal.dialog) {
        ignoreBackdropClickRef = true;
      }
      waitingForMouseUpRef = false;
    };
    const handleStaticModalAnimation = () => {
      setAnimateStaticModal(true);
      removeStaticModalAnimationRef = transitionEnd(modal.dialog, () => {
        setAnimateStaticModal(false);
      });
    };
    const handleStaticBackdropClick = (e2) => {
      if (e2.target !== e2.currentTarget) {
        return;
      }
      handleStaticModalAnimation();
    };
    const handleClick = (e2) => {
      if (local.backdrop === "static") {
        handleStaticBackdropClick(e2);
        return;
      }
      if (ignoreBackdropClickRef || e2.target !== e2.currentTarget) {
        ignoreBackdropClickRef = false;
        return;
      }
      local.onHide?.();
    };
    const handleEscapeKeyDown = (e2) => {
      if (!local.keyboard && local.backdrop === "static") {
        e2.preventDefault();
        handleStaticModalAnimation();
      } else if (local.keyboard && local.onEscapeKeyDown) {
        local.onEscapeKeyDown(e2);
      }
    };
    const handleEnter = (node, ...args) => {
      if (node) {
        node.style.display = "block";
        updateDialogStyle(node);
      }
      local.onEnter?.(node, ...args);
    };
    const handleExit = (...args) => {
      removeStaticModalAnimationRef?.();
      local.onExit?.(...args);
    };
    const handleEntering = (...args) => {
      local.onEntering?.(...args);
      if (!isServer) {
        addEventListener3(window, "resize", handleWindowResize);
      }
    };
    const handleExited = (node) => {
      if (node)
        node.style.display = "";
      local.onExited?.(node);
      if (!isServer) {
        removeEventListener2(window, "resize", handleWindowResize);
      }
    };
    const renderBackdrop = (backdropProps) => (() => {
      const _el$ = _tmpl$$d.cloneNode(true);
      spread(_el$, mergeProps(backdropProps, {
        get ["class"]() {
          return classNames(`${bsPrefix}-backdrop`, local.backdropClass, !local.animation && "show");
        }
      }), false, false);
      return _el$;
    })();
    const baseModalStyle = () => {
      let s2 = {
        ...local.style,
        ...modalStyle()
      };
      if (!local.animation) {
        s2.display = "block";
      }
      return s2;
    };
    const renderDialog = (dialogProps) => (() => {
      const _el$2 = _tmpl$2$4.cloneNode(true);
      spread(_el$2, mergeProps(dialogProps, {
        get style() {
          return baseModalStyle();
        },
        get ["class"]() {
          return classNames(local.class, bsPrefix, animateStaticModal() && `${bsPrefix}-static`);
        },
        get onClick() {
          return local.backdrop ? handleClick : void 0;
        },
        "onMouseUp": handleMouseUp,
        get ["aria-labelledby"]() {
          return local["aria-labelledby"];
        }
      }), false, true);
      insert(_el$2, createComponent(Dynamic, mergeProps({
        get component() {
          return local.dialogAs;
        }
      }, props, {
        onMouseDown: handleDialogMouseDown,
        get ["class"]() {
          return local.dialogClass;
        },
        get contentClass() {
          return local.contentClass;
        },
        get children() {
          return local.children;
        }
      })));
      return _el$2;
    })();
    return createComponent(ModalContext$1.Provider, {
      value: modalContext,
      get children() {
        return createComponent(Modal$1, {
          get show() {
            return local.show;
          },
          ref: mergedRef,
          get backdrop() {
            return local.backdrop;
          },
          get container() {
            return local.container;
          },
          keyboard: true,
          get autoFocus() {
            return local.autoFocus;
          },
          get enforceFocus() {
            return local.enforceFocus;
          },
          get restoreFocus() {
            return local.restoreFocus;
          },
          get restoreFocusOptions() {
            return local.restoreFocusOptions;
          },
          onEscapeKeyDown: handleEscapeKeyDown,
          get onShow() {
            return local.onShow;
          },
          get onHide() {
            return local.onHide;
          },
          onEnter: handleEnter,
          onEntering: handleEntering,
          get onEntered() {
            return local.onEntered;
          },
          onExit: handleExit,
          get onExiting() {
            return local.onExiting;
          },
          onExited: handleExited,
          get manager() {
            return getModalManager();
          },
          get transition() {
            return local.animation ? DialogTransition$1 : void 0;
          },
          get backdropTransition() {
            return local.animation ? BackdropTransition$1 : void 0;
          },
          renderBackdrop,
          renderDialog
        });
      }
    });
  };
  var Modal$12 = Object.assign(Modal2, {
    Body: ModalBody,
    Header: ModalHeader$1,
    Title: ModalTitle,
    Footer: ModalFooter,
    Dialog: ModalDialog$1,
    TRANSITION_DURATION: 300,
    BACKDROP_TRANSITION_DURATION: 150
  });
  var NavItem2 = createWithBsPrefix("nav-item");
  var defaultProps$s = {
    as: Anchor$1,
    disabled: false
  };
  var NavLink = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$s, p2), ["as", "bsPrefix", "class", "active", "eventKey"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "nav-link");
    const [navItemProps, meta] = useNavItem(mergeProps({
      get key() {
        return makeEventKey(local.eventKey, props.href);
      },
      get active() {
        return local.active;
      }
    }, props));
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, navItemProps, {
      get ["class"]() {
        return classNames(local.class, bsPrefix, props.disabled && "disabled", meta.isActive && "active");
      }
    }));
  };
  var NavLink$1 = NavLink;
  var defaultProps$r = {
    as: "div",
    justify: false,
    fill: false
  };
  var Nav2 = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$r, p2), ["as", "activeKey", "defaultActiveKey", "bsPrefix", "variant", "fill", "justify", "navbar", "navbarScroll", "class", "onSelect"]);
    const [activeKey, onSelect] = createControlledProp(() => local.activeKey, () => local.defaultActiveKey, local.onSelect);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "nav");
    let navbarBsPrefix;
    let cardHeaderBsPrefix;
    let isNavbar = false;
    const navbarContext = useContext(NavbarContext);
    const cardHeaderContext = useContext(CardHeaderContext);
    if (navbarContext) {
      navbarBsPrefix = navbarContext.bsPrefix;
      isNavbar = local.navbar == null ? true : local.navbar;
    } else if (cardHeaderContext) {
      ({
        cardHeaderBsPrefix
      } = cardHeaderContext);
    }
    return createComponent(Nav$1, mergeProps({
      get as() {
        return local.as;
      },
      get activeKey() {
        return activeKey();
      },
      onSelect,
      get ["class"]() {
        return classNames(local.class, {
          [bsPrefix]: !isNavbar,
          [`${navbarBsPrefix}-nav`]: isNavbar,
          [`${navbarBsPrefix}-nav-scroll`]: isNavbar && local.navbarScroll,
          [`${cardHeaderBsPrefix}-${local.variant}`]: !!cardHeaderBsPrefix,
          [`${bsPrefix}-${local.variant}`]: !!local.variant,
          [`${bsPrefix}-fill`]: local.fill,
          [`${bsPrefix}-justified`]: local.justify
        });
      }
    }, props));
  };
  var Nav$12 = Object.assign(Nav2, {
    Item: NavItem2,
    Link: NavLink$1
  });
  var defaultProps$q = {};
  var NavbarBrand = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$q, p2), ["as", "bsPrefix", "class"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar-brand");
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as || (props.href ? "a" : "span");
      }
    }, props, {
      get ["class"]() {
        return classNames(local.class, bsPrefix);
      }
    }));
  };
  var NavbarBrand$1 = NavbarBrand;
  var _tmpl$$c = /* @__PURE__ */ template(`<div></div>`, 2);
  var defaultProps$p = {};
  var NavbarCollapse = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$p, p2), ["bsPrefix", "class", "children", "ref"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar-collapse");
    const context2 = useContext(NavbarContext);
    return createComponent(Collapse$1, mergeProps({
      get ["in"]() {
        return !!context2?.expanded;
      }
    }, props, {
      get children() {
        const _el$ = _tmpl$$c.cloneNode(true);
        const _ref$ = local.ref;
        typeof _ref$ === "function" ? use(_ref$, _el$) : local.ref = _el$;
        insert(_el$, () => local.children);
        createRenderEffect(() => className(_el$, classNames(bsPrefix, local.class)));
        return _el$;
      }
    }));
  };
  var NavbarCollapse$1 = NavbarCollapse;
  var _tmpl$$b = /* @__PURE__ */ template(`<span></span>`, 2);
  var defaultProps$o = {
    as: "button",
    label: "Toggle navigation"
  };
  var NavbarToggle = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$o, p2), ["as", "bsPrefix", "class", "children", "label", "onClick"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar-toggler");
    const context2 = useContext(NavbarContext);
    const handleClick = (e2) => {
      callEventHandler(local.onClick, e2);
      context2?.onToggle?.();
    };
    if (local.as === "button") {
      props.type = "button";
    }
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, props, {
      get type() {
        return local.as === "button" ? "button" : void 0;
      },
      onClick: handleClick,
      get ["aria-label"]() {
        return local.label;
      },
      get ["class"]() {
        return classNames(local.class, bsPrefix, !context2?.expanded && "collapsed");
      },
      get children() {
        return local.children || (() => {
          const _el$ = _tmpl$$b.cloneNode(true);
          className(_el$, `${bsPrefix}-icon`);
          return _el$;
        })();
      }
    }));
  };
  var NavbarToggle$1 = NavbarToggle;
  var OffcanvasBody = createWithBsPrefix("offcanvas-body");
  var defaultProps$n = {
    in: false,
    mountOnEnter: false,
    unmountOnExit: false,
    appear: false
  };
  var transitionStyles = {
    [ENTERING]: "show",
    [ENTERED]: "show"
  };
  var OffcanvasToggling = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$n, p2), ["bsPrefix", "class", "children"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "offcanvas");
    const resolvedChildren = children(() => local.children);
    let prevClasses;
    return createComponent(TransitionWrapper$1, mergeProps({
      addEndListener: transitionEndListener
    }, props, {
      children: (status, innerProps) => {
        const el = resolvedChildren();
        innerProps.ref(el);
        const newClasses = classNames(
          local.class,
          (status === ENTERING || status === EXITING) && `${bsPrefix}-toggling`,
          // @ts-ignore
          transitionStyles[status]
        );
        resolveClasses(el, prevClasses, newClasses);
        prevClasses = newClasses;
        return el;
      }
    }));
  };
  var OffcanvasToggling$1 = OffcanvasToggling;
  var defaultProps$m = {
    closeLabel: "Close",
    closeButton: false
  };
  var OffcanvasHeader = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$m, p2), ["bsPrefix", "class"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "offcanvas-header");
    return createComponent(AbstractModalHeader$1, mergeProps(props, {
      get ["class"]() {
        return classNames(local.class, bsPrefix);
      }
    }));
  };
  var OffcanvasHeader$1 = OffcanvasHeader;
  var DivStyledAsH5 = divWithClass("h5");
  var OffcanvasTitle = createWithBsPrefix("offcanvas-title", {
    Component: DivStyledAsH5
  });
  var _tmpl$$a = /* @__PURE__ */ template(`<div></div>`, 2);
  var _tmpl$2$3 = /* @__PURE__ */ template(`<div role="dialog"></div>`, 2);
  var defaultProps$l = {
    show: false,
    backdrop: true,
    keyboard: true,
    scroll: false,
    autoFocus: true,
    enforceFocus: true,
    restoreFocus: true,
    placement: "start"
  };
  function DialogTransition(props) {
    return createComponent(OffcanvasToggling$1, props);
  }
  function BackdropTransition(props) {
    return createComponent(Fade$1, props);
  }
  var Offcanvas = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$l, p2), [
      "bsPrefix",
      "class",
      "children",
      "aria-labelledby",
      "placement",
      /*BaseModal props */
      "show",
      "backdrop",
      "keyboard",
      "scroll",
      "onEscapeKeyDown",
      "onShow",
      "onHide",
      "container",
      "autoFocus",
      "enforceFocus",
      "restoreFocus",
      "restoreFocusOptions",
      "onEntered",
      "onExit",
      "onExiting",
      "onEnter",
      "onEntering",
      "onExited",
      "backdropClass",
      "manager",
      "ref"
    ]);
    let modalManager;
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "offcanvas");
    const navbarContext = useContext(NavbarContext);
    const handleHide = () => {
      navbarContext?.onToggle?.();
      local.onHide?.();
    };
    const modalContext = {
      get onHide() {
        return handleHide;
      }
    };
    function getModalManager() {
      if (local.manager)
        return local.manager;
      if (local.scroll) {
        if (!modalManager)
          modalManager = new BootstrapModalManager({
            handleContainerOverflow: false
          });
        return modalManager;
      }
      return getSharedManager();
    }
    const handleEnter = (node, ...args) => {
      if (node)
        node.style.visibility = "visible";
      local.onEnter?.(node, ...args);
    };
    const handleExited = (node, ...args) => {
      if (node)
        node.style.visibility = "";
      local.onExited?.(...args);
    };
    const renderBackdrop = (backdropProps) => (() => {
      const _el$ = _tmpl$$a.cloneNode(true);
      spread(_el$, mergeProps(backdropProps, {
        get ["class"]() {
          return classNames(`${bsPrefix}-backdrop`, local.backdropClass);
        }
      }), false, true);
      insert(_el$, () => props.children);
      return _el$;
    })();
    const renderDialog = (dialogProps) => (() => {
      const _el$2 = _tmpl$2$3.cloneNode(true);
      spread(_el$2, mergeProps(dialogProps, props, {
        get ["class"]() {
          return classNames(local.class, bsPrefix, `${bsPrefix}-${local.placement}`);
        },
        get ["aria-labelledby"]() {
          return local["aria-labelledby"];
        }
      }), false, true);
      insert(_el$2, () => local.children);
      return _el$2;
    })();
    return createComponent(ModalContext$1.Provider, {
      value: modalContext,
      get children() {
        return createComponent(Modal$1, {
          get show() {
            return local.show;
          },
          ref(r$) {
            const _ref$ = local.ref;
            typeof _ref$ === "function" ? _ref$(r$) : local.ref = r$;
          },
          get backdrop() {
            return local.backdrop;
          },
          get container() {
            return local.container;
          },
          get keyboard() {
            return local.keyboard;
          },
          get autoFocus() {
            return local.autoFocus;
          },
          get enforceFocus() {
            return local.enforceFocus && !scroll;
          },
          get restoreFocus() {
            return local.restoreFocus;
          },
          get restoreFocusOptions() {
            return local.restoreFocusOptions;
          },
          get onEscapeKeyDown() {
            return local.onEscapeKeyDown;
          },
          get onShow() {
            return local.onShow;
          },
          onHide: handleHide,
          onEnter: handleEnter,
          get onEntering() {
            return local.onEntering;
          },
          get onEntered() {
            return local.onEntered;
          },
          get onExit() {
            return local.onExit;
          },
          get onExiting() {
            return local.onExiting;
          },
          onExited: handleExited,
          get manager() {
            return getModalManager();
          },
          transition: DialogTransition,
          backdropTransition: BackdropTransition,
          renderBackdrop,
          renderDialog
        });
      }
    });
  };
  var Offcanvas$1 = Object.assign(Offcanvas, {
    Body: OffcanvasBody,
    Header: OffcanvasHeader$1,
    Title: OffcanvasTitle
  });
  var NavbarOffcanvas = (props) => {
    const context2 = useContext(NavbarContext);
    return createComponent(Offcanvas$1, mergeProps({
      get show() {
        return !!context2?.expanded;
      }
    }, props));
  };
  var NavbarOffcanvas$1 = NavbarOffcanvas;
  var NavbarText = createWithBsPrefix("navbar-text", {
    Component: "span"
  });
  var defaultProps$k = {
    as: "nav",
    expand: true,
    variant: "light",
    collapseOnSelect: false
  };
  var Navbar = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$k, p2), ["as", "bsPrefix", "expand", "variant", "bg", "fixed", "sticky", "class", "expanded", "defaultExpanded", "onToggle", "onSelect", "collapseOnSelect"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar");
    const [expanded, onToggle] = createControlledProp(() => local.expanded, () => local.defaultExpanded, local.onToggle);
    const handleCollapse = (...args) => {
      local.onSelect?.(...args);
      if (local.collapseOnSelect && expanded()) {
        onToggle?.(false);
      }
    };
    const expandClass = () => {
      let expandClass2 = `${bsPrefix}-expand`;
      if (typeof local.expand === "string")
        expandClass2 = `${expandClass2}-${local.expand}`;
      return expandClass2;
    };
    const navbarContext = {
      get onToggle() {
        return () => onToggle?.(!expanded());
      },
      bsPrefix,
      get expanded() {
        return !!expanded();
      }
    };
    return createComponent(NavbarContext.Provider, {
      value: navbarContext,
      get children() {
        return createComponent(SelectableContext$1.Provider, {
          value: handleCollapse,
          get children() {
            return createComponent(Dynamic, mergeProps({
              get component() {
                return local.as;
              }
            }, props, {
              get role() {
                return (
                  // will result in some false positives but that seems better
                  // than false negatives. strict `undefined` check allows explicit
                  // "nulling" of the role if the user really doesn't want one
                  props.role === void 0 && local.as !== "nav" ? "Navigation" : props.role
                );
              },
              get ["class"]() {
                return classNames(local.class, bsPrefix, local.expand && expandClass(), local.variant && `${bsPrefix}-${local.variant}`, local.bg && `bg-${local.bg}`, local.sticky && `sticky-${local.sticky}`, local.fixed && `fixed-${local.fixed}`);
              }
            }));
          }
        });
      }
    });
  };
  var Navbar$1 = Object.assign(Navbar, {
    Brand: NavbarBrand$1,
    Collapse: NavbarCollapse$1,
    Offcanvas: NavbarOffcanvas$1,
    Text: NavbarText,
    Toggle: NavbarToggle$1
  });
  var NavContext2 = createContext(null);
  var defaultProps$j = {};
  var NavDropdown = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$j, p2), ["id", "title", "children", "bsPrefix", "class", "rootCloseEvent", "menuRole", "disabled", "active", "renderMenuOnMount", "menuVariant"]);
    const navItemPrefix = useBootstrapPrefix(void 0, "nav-item");
    return createComponent(Dropdown$1, mergeProps(props, {
      get ["class"]() {
        return classNames(local.class, navItemPrefix);
      },
      get children() {
        return [createComponent(Dropdown$1.Toggle, {
          get id() {
            return local.id;
          },
          eventKey: null,
          get active() {
            return local.active;
          },
          get disabled() {
            return local.disabled;
          },
          get childBsPrefix() {
            return local.bsPrefix;
          },
          as: NavLink$1,
          get children() {
            return local.title;
          }
        }), createComponent(Dropdown$1.Menu, {
          get role() {
            return local.menuRole;
          },
          get renderOnMount() {
            return local.renderMenuOnMount;
          },
          get rootCloseEvent() {
            return local.rootCloseEvent;
          },
          get variant() {
            return local.menuVariant;
          },
          get children() {
            return local.children;
          }
        })];
      }
    }));
  };
  var NavDropdown$1 = Object.assign(NavDropdown, {
    Item: Dropdown$1.Item,
    ItemText: Dropdown$1.ItemText,
    Divider: Dropdown$1.Divider,
    Header: Dropdown$1.Header
  });
  var _tmpl$$9 = /* @__PURE__ */ template(`<li></li>`, 2);
  var _tmpl$2$2 = /* @__PURE__ */ template(`<span class="visually-hidden"></span>`, 2);
  var _tmpl$3 = /* @__PURE__ */ template(`<span aria-hidden="true"></span>`, 2);
  var defaultProps$g = {
    active: false,
    disabled: false,
    activeLabel: "(current)"
  };
  var PageItem = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$g, p2), ["active", "disabled", "class", "style", "activeLabel", "children", "ref"]);
    return (() => {
      const _el$ = _tmpl$$9.cloneNode(true);
      const _ref$ = local.ref;
      typeof _ref$ === "function" ? use(_ref$, _el$) : local.ref = _el$;
      insert(_el$, createComponent(Dynamic, mergeProps({
        get component() {
          return local.active || local.disabled ? "span" : Anchor$1;
        },
        "class": "page-link",
        get disabled() {
          return local.disabled;
        }
      }, props, {
        get children() {
          return [createMemo(() => local.children), createMemo(() => createMemo(() => !!(local.active && local.activeLabel))() && (() => {
            const _el$2 = _tmpl$2$2.cloneNode(true);
            insert(_el$2, () => local.activeLabel);
            return _el$2;
          })())];
        }
      })));
      createRenderEffect((_p$) => {
        const _v$ = local.style, _v$2 = classNames(local.class, "page-item", {
          active: local.active,
          disabled: local.disabled
        });
        _p$._v$ = style(_el$, _v$, _p$._v$);
        _v$2 !== _p$._v$2 && className(_el$, _p$._v$2 = _v$2);
        return _p$;
      }, {
        _v$: void 0,
        _v$2: void 0
      });
      return _el$;
    })();
  };
  var PageItem$1 = PageItem;
  function createButton(name, defaultValue, label = name) {
    function Button3(props) {
      const [_, rest] = splitProps(props, ["children"]);
      return createComponent(PageItem, mergeProps(rest, {
        get children() {
          return [(() => {
            const _el$3 = _tmpl$3.cloneNode(true);
            insert(_el$3, () => props.children || defaultValue);
            return _el$3;
          })(), (() => {
            const _el$4 = _tmpl$2$2.cloneNode(true);
            insert(_el$4, label);
            return _el$4;
          })()];
        }
      }));
    }
    Button3.displayName = name;
    return Button3;
  }
  var First = createButton("First", "\xAB");
  var Prev = createButton("Prev", "\u2039", "Previous");
  var Ellipsis = createButton("Ellipsis", "\u2026", "More");
  var Next = createButton("Next", "\u203A");
  var Last = createButton("Last", "\xBB");
  var _tmpl$$8 = /* @__PURE__ */ template(`<ul></ul>`, 2);
  var defaultProps$f = {};
  var Pagination = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$f, p2), ["bsPrefix", "class", "size"]);
    const decoratedBsPrefix = useBootstrapPrefix(local.bsPrefix, "pagination");
    return (() => {
      const _el$ = _tmpl$$8.cloneNode(true);
      spread(_el$, mergeProps(props, {
        get ["class"]() {
          return classNames(local.class, decoratedBsPrefix, local.size && `${decoratedBsPrefix}-${local.size}`);
        }
      }), false, false);
      return _el$;
    })();
  };
  var Pagination$1 = Object.assign(Pagination, {
    First,
    Prev,
    Ellipsis,
    Item: PageItem$1,
    Next,
    Last
  });
  function usePlaceholder({
    animation,
    bg,
    bsPrefix,
    size: size2,
    ...props
  }) {
    bsPrefix = useBootstrapPrefix(bsPrefix, "placeholder");
    const [{
      class: class_,
      ...colProps
    }] = useCol(props);
    return {
      ...colProps,
      class: classNames(class_, animation ? `${bsPrefix}-${animation}` : bsPrefix, size2 && `${bsPrefix}-${size2}`, bg && `bg-${bg}`)
    };
  }
  var PlaceholderButton = (props) => {
    return createComponent(Button$12, mergeProps(() => usePlaceholder(props), {
      disabled: true,
      tabIndex: -1,
      get children() {
        return props.children;
      }
    }));
  };
  var PlaceholderButton$1 = PlaceholderButton;
  var defaultProps$e = {
    as: "span"
  };
  var Placeholder = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$e, p2), ["as", "children"]);
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as;
      }
    }, () => usePlaceholder(props), {
      get children() {
        return local.children;
      }
    }));
  };
  var Placeholder$1 = Object.assign(Placeholder, {
    Button: PlaceholderButton$1
  });
  var PopoverHeader = createWithBsPrefix("popover-header");
  var PopoverBody = createWithBsPrefix("popover-body");
  var _tmpl$$7 = /* @__PURE__ */ template(`<div role="tooltip"><div class="popover-arrow"></div></div>`, 4);
  var defaultProps$d = {
    arrowProps: {},
    placement: "right"
  };
  var Popover = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$d, p2), ["bsPrefix", "placement", "class", "style", "children", "body", "arrowProps", "popper", "show"]);
    const decoratedBsPrefix = useBootstrapPrefix(local.bsPrefix, "popover");
    const context2 = useContext(OverlayContext$1);
    const primaryPlacement = () => (context2?.metadata?.placement || local.placement)?.split("-")?.[0];
    return (() => {
      const _el$ = _tmpl$$7.cloneNode(true), _el$2 = _el$.firstChild;
      spread(_el$, mergeProps({
        get ["x-placement"]() {
          return primaryPlacement();
        },
        get ["class"]() {
          return classNames(local.class, decoratedBsPrefix, primaryPlacement() && `bs-popover-auto`);
        }
      }, props, () => context2?.wrapperProps, {
        get style() {
          return Object.assign({}, local.style, context2?.wrapperProps?.style);
        }
      }), false, true);
      spread(_el$2, mergeProps(() => local.arrowProps, () => context2?.arrowProps), false, false);
      insert(_el$, (() => {
        const _c$ = createMemo(() => !!local.body);
        return () => _c$() ? createComponent(PopoverBody, {
          get children() {
            return local.children;
          }
        }) : local.children;
      })(), null);
      return _el$;
    })();
  };
  var Popover$1 = Object.assign(Popover, {
    Header: PopoverHeader,
    Body: PopoverBody
  });
  var ProgressContext = createContext();
  function getTabTransitionComponent(transition) {
    if (typeof transition === "boolean") {
      return transition ? Fade$1 : void 0;
    }
    return transition;
  }
  var defaultProps$7 = {};
  var TabContainer = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$7, p2), ["transition"]);
    return createComponent(Tabs$1, mergeProps(props, {
      get transition() {
        return getTabTransitionComponent(local.transition);
      }
    }));
  };
  var TabContainer$1 = TabContainer;
  var TabContent = createWithBsPrefix("tab-content");
  var defaultProps$6 = {};
  var TabPane = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$6, p2), ["bsPrefix", "transition"]);
    const [panelProps, meta] = useTabPanel(mergeProps(props, {
      get transition() {
        return getTabTransitionComponent(local.transition);
      }
    }));
    const [panelLocal, rest] = splitProps(panelProps, ["as", "class", "mountOnEnter", "unmountOnExit"]);
    const prefix = useBootstrapPrefix(local.bsPrefix, "tab-pane");
    const Transition3 = meta.transition || Fade$1;
    return createComponent(TabContext$1.Provider, {
      value: null,
      get children() {
        return createComponent(SelectableContext$1.Provider, {
          value: null,
          get children() {
            return createComponent(Transition3, {
              get ["in"]() {
                return meta.isActive;
              },
              get onEnter() {
                return meta.onEnter;
              },
              get onEntering() {
                return meta.onEntering;
              },
              get onEntered() {
                return meta.onEntered;
              },
              get onExit() {
                return meta.onExit;
              },
              get onExiting() {
                return meta.onExiting;
              },
              get onExited() {
                return meta.onExited;
              },
              get mountOnEnter() {
                return meta.mountOnEnter;
              },
              get unmountOnExit() {
                return meta.unmountOnExit;
              },
              get children() {
                return createComponent(Dynamic, mergeProps({
                  get component() {
                    return panelLocal.as ?? "div";
                  }
                }, rest, {
                  ref(r$) {
                    const _ref$ = props.ref;
                    typeof _ref$ === "function" ? _ref$(r$) : props.ref = r$;
                  },
                  get ["class"]() {
                    return classNames(panelLocal.class, prefix, meta.isActive && "active");
                  }
                }));
              }
            });
          }
        });
      }
    });
  };
  var TabPane$1 = TabPane;
  var Tab = (props) => {
    return props;
  };
  var Tab$1 = Object.assign(Tab, {
    Container: TabContainer$1,
    Content: TabContent,
    Pane: TabPane$1
  });
  var fadeStyles = {
    [ENTERING]: "showing",
    [EXITING]: "showing show"
  };
  var ToastFade = (props) => createComponent(Fade$1, mergeProps(props, {
    transitionClasses: fadeStyles
  }));
  var ToastFade$1 = ToastFade;
  var ToastContext = createContext({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClose() {
    }
  });
  var ToastContext$1 = ToastContext;
  var _tmpl$$3 = /* @__PURE__ */ template(`<div></div>`, 2);
  var defaultProps$32 = {
    closeLabel: "Close",
    closeButton: true
  };
  var ToastHeader = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$32, p2), ["bsPrefix", "closeLabel", "closeVariant", "closeButton", "class", "children"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "toast-header");
    const context2 = useContext(ToastContext$1);
    const handleClick = (e2) => {
      context2?.onClose?.(e2);
    };
    return (() => {
      const _el$ = _tmpl$$3.cloneNode(true);
      spread(_el$, mergeProps(props, {
        get ["class"]() {
          return classNames(bsPrefix, local.class);
        }
      }), false, true);
      insert(_el$, () => local.children, null);
      insert(_el$, (() => {
        const _c$ = createMemo(() => !!local.closeButton);
        return () => _c$() && createComponent(CloseButton$1, {
          get ["aria-label"]() {
            return local.closeLabel;
          },
          get variant() {
            return local.closeVariant;
          },
          onClick: handleClick,
          "data-dismiss": "toast"
        });
      })(), null);
      return _el$;
    })();
  };
  var ToastHeader$1 = ToastHeader;
  var ToastBody = createWithBsPrefix("toast-body");
  var _tmpl$$2 = /* @__PURE__ */ template(`<div></div>`, 2);
  var defaultProps$22 = {
    transition: ToastFade$1,
    show: true,
    animation: true,
    delay: 5e3,
    autohide: false
  };
  var Toast = (p2) => {
    const [local, props] = splitProps(mergeProps(defaultProps$22, p2), ["bsPrefix", "class", "transition", "show", "animation", "delay", "autohide", "onClose", "bg"]);
    const bsPrefix = useBootstrapPrefix(local.bsPrefix, "toast");
    const owner = getOwner();
    let delayRef = local.delay;
    let onCloseRef = local.onClose;
    createEffect(() => {
      delayRef = local.delay;
      onCloseRef = local.onClose;
    });
    let autohideTimeout;
    const autohideToast = createMemo(() => !!(local.autohide && local.show));
    const autohideFunc = createMemo(() => () => {
      if (autohideToast()) {
        onCloseRef?.();
      }
    });
    createEffect(() => {
      if (autohideToast()) {
        window.clearTimeout(autohideTimeout);
        autohideTimeout = window.setTimeout(autohideFunc(), delayRef);
      }
    });
    onCleanup(() => {
      window.clearTimeout(autohideTimeout);
    });
    const toastContext = {
      get onClose() {
        return local.onClose;
      }
    };
    const hasAnimation = !!(local.transition && local.animation);
    const Transition3 = local.transition;
    const ToastInner = () => runWithOwner(owner, () => (() => {
      const _el$ = _tmpl$$2.cloneNode(true);
      spread(_el$, mergeProps(props, {
        get ["class"]() {
          return classNames(bsPrefix, local.class, local.bg && `bg-${local.bg}`, !hasAnimation && (local.show ? "show" : "hide"));
        },
        "role": "alert",
        "aria-live": "assertive",
        "aria-atomic": "true"
      }), false, false);
      return _el$;
    })());
    return createComponent(ToastContext$1.Provider, {
      value: toastContext,
      get children() {
        return createMemo(() => !!(hasAnimation && local.transition))() ? createComponent(Transition3, {
          appear: true,
          get ["in"]() {
            return local.show;
          },
          unmountOnExit: true,
          get children() {
            return createComponent(ToastInner, {});
          }
        }) : createComponent(ToastInner, {});
      }
    });
  };
  var Toast$1 = Object.assign(Toast, {
    Body: ToastBody,
    Header: ToastHeader$1
  });

  // src/utils/toast.tsx
  var Wrapper = styled.div({
    position: "fixed",
    top: "2rem",
    left: "50%",
    transform: "translate(-50%, 0)"
  });
  var toast = (message, opt) => {
    const toast_element_container = document.createElement("div");
    const generate_id = ["toast", Date.now().toString(16), Math.round(Math.random() * 1e3).toString(16)].join("-");
    toast_element_container.id = generate_id;
    document.body.appendChild(toast_element_container);
    const element = createComponent(Wrapper, {
      get children() {
        return createComponent(Toast$1, {
          get children() {
            return [createComponent(Show, {
              get when() {
                return !!opt?.header;
              },
              get children() {
                return createComponent(Toast$1.Header, {
                  get children() {
                    return opt?.header;
                  }
                });
              }
            }), createComponent(Toast$1.Body, {
              children: message
            })];
          }
        });
      }
    });
    render(() => element, toast_element_container);
    setTimeout(() => {
      toast_element_container.parentNode.removeChild(toast_element_container);
    }, opt?.timeout || 3e3);
  };

  // src/utils/game.ts
  var getPlayerTeam = (num) => {
    const team = PLAYER_TEAM_MAP.find((d) => d.count === num);
    return team;
  };
  var getCampName = (type) => {
    if (type === "protagonist")
      return "\u597D\u4EBA\u9635\u8425";
    if (type === "villain")
      return "\u53CD\u6D3E\u9635\u8425";
    return "";
  };
  var avatars = {
    merlin: {
      name: "\u6885\u6797",
      code: "merlin",
      asset: "./assets/avatars/Hero_gM.png",
      type: "protagonist",
      skill: "\u6885\u6797\u53EF\u4EE5\u770B\u5230\u53CD\u6D3E\u9635\u8425\u7684\u73A9\u5BB6(\u57289-10\u4EBA\u6E38\u620F\u4E2D\uFF0C\u53CD\u6D3E\u9635\u8425\u7684\u83AB\u5FB7\u96F7\u5FB7\u9664\u5916)\uFF0C\u9690\u85CF\u4F60\u81EA\u5DF1\u7684\u8EAB\u4EFD\uFF0C\u5982\u679C\u88AB\u53CD\u6D3E\u9635\u8425\u731C\u4E2D\uFF0C\u53CD\u6D3E\u523A\u5BA2\u53EF\u4EE5\u76F4\u63A5\u6307\u8BA4\u4F60\u7ED3\u675F\u6E38\u620F)"
    },
    pacificville: {
      name: "\u6D3E\u897F\u7EF4\u5C14",
      code: "pacificville",
      asset: "./assets/avatars/Hero_gP.png",
      type: "protagonist",
      skill: "\u6D3E\u897F\u7EF4\u5C14\u53EF\u4EE5\u770B\u5230 \u6885\u6797 \u548C \u83AB\u7518\u5A1C\uFF0C\u4F46\u662F\u65E0\u6CD5\u5206\u8FA8\u5177\u4F53\u5BF9\u5E94\u7684\u4EBA"
    },
    loyal: {
      name: "\u5FE0\u81E3",
      code: "loyal",
      type: "protagonist",
      asset: "./assets/avatars/Hero_gz.png"
    },
    morgana: {
      name: "\u83AB\u7518\u5A1C",
      code: "morgana",
      asset: "./assets/avatars/Hero_bN.png",
      type: "villain",
      skill: "\u83AB\u7518\u5A1C\u53EF\u4EE5\u88AB \u597D\u4EBA\u9635\u8425 \u7684 \u6D3E\u897F\u7EF4\u5C14 \u770B\u5230\uFF0C\u4F46\u662F \u6D3E\u897F\u7EF4\u5C14 \u4E0D\u77E5\u9053\u4F60\u7684\u9635\u8425(\u65E0\u6CD5\u5206\u8FA8\u4F60\u662F\u83AB\u7518\u5A1C\u8FD8\u662F\u6885\u6797)"
    },
    assassin: {
      name: "\u523A\u5BA2",
      code: "assassin",
      asset: "./assets/avatars/Hero_bA.png",
      type: "villain",
      skill: "\u523A\u5BA2\u53EF\u4EE5\u5728\u4EFB\u4F55\u65F6\u5019\u523A\u6740\u4E00\u4F4D\u73A9\u5BB6\uFF0C\u5982\u679C\u8BE5\u73A9\u5BB6\u662F\u6885\u6797\uFF0C\u5219\u6E38\u620F\u7ED3\u675F\uFF0C\u53CD\u6D3E\u9635\u8425\u80DC\u5229\uFF0C\u53CD\u4E4B\u597D\u4EBA\u9635\u8425\u80DC\u5229"
    },
    oberon: {
      name: "\u5965\u4F2F\u4F26",
      code: "oberon",
      asset: "./assets/avatars/Hero_bO.png",
      type: "villain",
      skill: "\u5965\u4F2F\u4F26\u65E0\u6CD5\u88AB\u53CD\u6D3E\u9635\u8425\u7684\u961F\u53CB\u770B\u89C1\uFF0C\u4E5F\u65E0\u6CD5\u770B\u89C1\u53CD\u6D3E\u9635\u8425\u7684\u961F\u53CB\uFF0C\u4F46\u662F\u80FD\u88AB\u6885\u6797\u770B\u89C1"
    },
    minions: {
      name: "\u722A\u7259",
      code: "minions",
      asset: "./assets/avatars/Hero_bm.png",
      type: "villain"
    },
    mordred: {
      name: "\u83AB\u5FB7\u96F7\u5FB7",
      code: "mordred",
      asset: "./assets/avatars/Hero_bK.png",
      type: "villain",
      skill: "\u83AB\u5FB7\u96F7\u5FB7\u662F\u65E0\u6CD5\u88AB\u6885\u6797\u770B\u5230\u7684\u53CD\u6D3E\u9635\u8425\u8001\u5927"
    }
  };
  var PLAYER_TEAM_MAP = [
    {
      count: 5,
      players: [
        avatars.merlin,
        avatars.pacificville,
        avatars.loyal,
        avatars.morgana,
        avatars.assassin
      ]
    },
    {
      count: 6,
      players: [
        avatars.merlin,
        avatars.pacificville,
        avatars.loyal,
        avatars.loyal,
        avatars.morgana,
        avatars.assassin
      ]
    },
    {
      count: 7,
      players: [
        avatars.merlin,
        avatars.pacificville,
        avatars.loyal,
        avatars.loyal,
        avatars.morgana,
        avatars.assassin,
        avatars.oberon
      ]
    },
    {
      count: 8,
      players: [
        avatars.merlin,
        avatars.pacificville,
        avatars.loyal,
        avatars.loyal,
        avatars.loyal,
        avatars.morgana,
        avatars.assassin,
        avatars.minions
      ]
    },
    {
      count: 9,
      players: [
        avatars.merlin,
        avatars.pacificville,
        avatars.loyal,
        avatars.loyal,
        avatars.loyal,
        avatars.loyal,
        avatars.morgana,
        avatars.assassin,
        avatars.mordred
      ]
    },
    {
      count: 10,
      players: [
        avatars.merlin,
        avatars.pacificville,
        avatars.loyal,
        avatars.loyal,
        avatars.loyal,
        avatars.loyal,
        avatars.morgana,
        avatars.assassin,
        avatars.mordred,
        avatars.oberon
      ]
    }
  ];
  var preloadResource = () => {
    const resources = Object.values(avatars).reduce((result, data) => {
      if (data.asset) {
        result.push(data.asset);
      }
      return result;
    }, []);
    const tmp = document.createElement("div");
    tmp.setAttribute("style", "display:none;");
    document.body.appendChild(tmp);
    const load_promises = resources.map((r) => {
      let resolver;
      const promise = new Promise((resolve, reject) => {
        resolver = (result) => {
          if (result) {
            resolve();
          } else {
            reject();
          }
        };
      });
      const img = document.createElement("img");
      img.src = r;
      img.onload = () => {
        resolver(true);
      };
      img.onerror = () => {
        resolver(false);
      };
      tmp.appendChild(img);
      return promise;
    });
    return Promise.all(load_promises).finally(() => {
      tmp.parentNode.removeChild(tmp);
    });
  };

  // src/utils/modal.tsx
  var Mask = styled.div({
    background: "#00000033",
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });
  var openModal = (child) => {
    const modal_element_container = document.createElement("div");
    const generate_id = ["modal", Date.now().toString(16), Math.round(Math.random() * 1e3).toString(16)].join("-");
    modal_element_container.id = generate_id;
    document.body.appendChild(modal_element_container);
    const remove = () => {
      modal_element_container.parentNode.removeChild(modal_element_container);
    };
    const element = createComponent(Mask, {
      get children() {
        return child(remove);
      }
    });
    render(() => element, modal_element_container);
  };

  // src/components/avatar.card.tsx
  var _tmpl$2 = /* @__PURE__ */ template(`<span class=name>`);
  var _tmpl$22 = /* @__PURE__ */ template(`<span class=camp>`);
  var CardContent = styled.div((props) => {
    const main_color = props.type === "protagonist" ? "#198754" : "#dc3545";
    return {
      padding: ".4rem",
      ".card": {
        border: "none !important",
        ".name": {
          fontSize: "2rem"
        },
        ".camp": {
          color: main_color,
          marginLeft: ".4rem",
          fontSize: "1.5rem"
        }
      }
    };
  });
  var AvatarCard = (props) => {
    const name = createMemo(() => {
      return props.data.name;
    });
    const avatar_asset = createMemo(() => {
      return props.data.asset;
    });
    const skill = createMemo(() => {
      const no_skill = "\u4F60\u662F\u4E00\u4E2A\u767D\u677F\uFF0C\u4EC0\u4E48\u4E5F\u4E0D\u77E5\u9053\uFF0C\u770B\u8EAB\u4EFD\u7684\u65F6\u5019\u8BB0\u5F97\u88C5\u4F5C\u770B\u7684\u5F88\u8BA4\u771F\u7684\u6837\u5B50";
      return props.data.skill || no_skill;
    });
    const camp = createMemo(() => {
      const type = props.data.type;
      if (type === "protagonist")
        return "\u597D\u4EBA\u9635\u8425";
      if (type === "villain")
        return "\u53CD\u6D3E\u9635\u8425";
    });
    return createComponent(CardContent, {
      get type() {
        return props.data.type;
      },
      get children() {
        return createComponent(Card$1, {
          get children() {
            return [createComponent(Card$1.Img, {
              variant: "top",
              get src() {
                return avatar_asset();
              }
            }), createComponent(Card$1.Body, {
              get children() {
                return [createComponent(Card$1.Title, {
                  get children() {
                    return [(() => {
                      var _el$ = _tmpl$2();
                      insert(_el$, name);
                      return _el$;
                    })(), (() => {
                      var _el$2 = _tmpl$22();
                      insert(_el$2, camp);
                      return _el$2;
                    })()];
                  }
                }), createComponent(Card$1.Text, {
                  get children() {
                    return skill();
                  }
                }), createComponent(Show, {
                  get when() {
                    return props.extend;
                  },
                  get children() {
                    return props.extend();
                  }
                })];
              }
            })];
          }
        });
      }
    });
  };

  // src/views/home.tsx
  var _tmpl$6 = /* @__PURE__ */ template(`<b class=count>`);
  var _tmpl$23 = /* @__PURE__ */ template(`<div class=title>\u597D\u4EBA\u9635\u8425`);
  var _tmpl$32 = /* @__PURE__ */ template(`<div class=avatars>`);
  var _tmpl$42 = /* @__PURE__ */ template(`<div class=title>\u53CD\u6D3E\u9635\u8425`);
  var _tmpl$52 = /* @__PURE__ */ template(`<div class=foot>`);
  var _tmpl$62 = /* @__PURE__ */ template(`<span class=name>`);
  var GameHomeContainer = styled.div({
    width: "100%",
    height: "100%",
    background: "#f1f1f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
  });
  var TitleContainer = styled.div({
    fontSize: "2rem",
    marginBottom: "1rem",
    fontWeight: "bold"
  });
  var BuggtonGroup = styled.div({
    width: "calc(100% - 1rem)",
    padding: "0 0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    "& > *": {
      marginBottom: ".5rem"
    },
    "& > *:last-child": {
      marginBottom: 0
    }
  });
  var PlayerCountContainer = styled.div({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    ".count": {
      margin: "0 .5rem",
      fontSize: "1.5rem",
      color: "#198754"
    }
  });
  var StartGameDropdownContainer = styled(Dropdown$1)({
    width: "100%"
  });
  var AvatarsContainer = styled.div({
    marginTop: ".5rem",
    width: "calc(100% - 1rem)",
    padding: "0.5rem",
    borderRadius: ".5rem",
    "& > div": {
      marginBottom: "1rem",
      borderRadius: ".5rem",
      boxShadow: "#00000033 0px 10px 20px"
    },
    "& > div:last-child": {
      marginBottom: 0
    }
  });
  var CampContainer = styled.div((props) => {
    const main_color = props.type === "protagonist" ? "#198754" : "#dc3545";
    return {
      width: "100%",
      background: main_color,
      padding: "0 .5rem",
      paddingBottom: ".5rem",
      ".title": {
        color: "#fff",
        fontSize: "1rem"
      },
      ".avatars": {
        background: "#fff"
      }
    };
  });
  var HomeView = () => {
    let last_player_count = 5;
    try {
      const last_player_count_string = localStorage.getItem("LAST_PLAYER_COUNT");
      if (last_player_count_string && !isNaN(Number(last_player_count_string))) {
        last_player_count = Number(last_player_count_string);
      }
    } catch (error) {
    }
    onMount(() => {
      preloadResource().then(() => {
        toast("\u9884\u52A0\u8F7D\u8D44\u6E90\u6210\u529F\uFF01");
      }).catch((err) => {
        toast("\u9884\u52A0\u8F7D\u8D44\u6E90\u5931\u8D25");
      });
    });
    const context2 = useContext(GameAppControllerContext);
    const [player_count, setPlayerCount] = createSignal(last_player_count);
    const onSelect = (eventKey, event) => {
      if (!eventKey) {
        toast("\u8BF7\u9009\u62E9\u6B63\u786E\u7684\u6E38\u73A9\u4EBA\u6570\uFF01");
        return;
      }
      setPlayerCount(Number(eventKey));
    };
    createEffect(() => {
      const count = player_count();
      try {
        localStorage.setItem("LAST_PLAYER_COUNT", count.toString());
      } catch (error) {
      }
    });
    const team = createMemo(() => {
      const count = player_count();
      const team_data = getPlayerTeam(count);
      return team_data?.players || [];
    });
    const protagonist_team = createMemo(() => {
      return team().filter((d) => d.type === "protagonist");
    });
    const villaint_team = createMemo(() => {
      return team().filter((d) => d.type === "villain");
    });
    const onStartGame = () => {
      context2?.updateCurrent(`game_stage?player_count=${player_count()}`);
    };
    return createComponent(GameHomeContainer, {
      get children() {
        return [createComponent(TitleContainer, {
          children: "Oh My Avalon"
        }), createComponent(BuggtonGroup, {
          get children() {
            return [createComponent(PlayerCountContainer, {
              "class": "player-count",
              get children() {
                return ["\u5F53\u524D\u6E38\u620F\u4EBA\u6570: ", (() => {
                  var _el$ = _tmpl$6();
                  insert(_el$, player_count);
                  return _el$;
                })(), "\u4EBA"];
              }
            }), createComponent(StartGameDropdownContainer, {
              onSelect,
              get children() {
                return [createComponent(Dropdown$1.Toggle, {
                  style: {
                    width: "100%"
                  },
                  variant: "secondary",
                  children: "\u9009\u62E9\u6E38\u620F\u4EBA\u6570"
                }), createComponent(Dropdown$1.Menu, {
                  style: {
                    width: "100%"
                  },
                  align: "start",
                  get children() {
                    return createComponent(For, {
                      each: PLAYER_TEAM_MAP,
                      children: (item) => createComponent(Dropdown$1.Item, {
                        get active() {
                          return player_count() === item.count;
                        },
                        get eventKey() {
                          return item.count;
                        },
                        get children() {
                          return [createMemo(() => item.count), "\u4EBA"];
                        }
                      })
                    });
                  }
                })];
              }
            }), createComponent(Button$12, {
              style: {
                width: "100%"
              },
              variant: "primary",
              onclick: onStartGame,
              children: "\u5F00\u59CB\u6E38\u620F"
            })];
          }
        }), createComponent(AvatarsContainer, {
          get children() {
            return [createComponent(CampContainer, {
              type: "protagonist",
              get children() {
                return [_tmpl$23(), (() => {
                  var _el$3 = _tmpl$32();
                  insert(_el$3, createComponent(For, {
                    get each() {
                      return protagonist_team();
                    },
                    children: (item) => createComponent(AvatarItem, {
                      data: item
                    })
                  }));
                  return _el$3;
                })()];
              }
            }), createComponent(CampContainer, {
              type: "villain",
              get children() {
                return [_tmpl$42(), (() => {
                  var _el$5 = _tmpl$32();
                  insert(_el$5, createComponent(For, {
                    get each() {
                      return villaint_team();
                    },
                    children: (item) => createComponent(AvatarItem, {
                      data: item
                    })
                  }));
                  return _el$5;
                })()];
              }
            })];
          }
        })];
      }
    });
  };
  var AvatarItemContainer = styled.div({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0.2rem 0",
    ".name": {
      textDecoration: "underline"
    }
  });
  var AvatarItemModal = styled.div({
    width: "80vw",
    background: "#fff",
    borderRadius: ".2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    ".content": {
      ".name": {
        fontSize: "1.5rem"
      }
    },
    ".foot": {
      margin: ".5rem 0"
    }
  });
  var AvatarItem = (props) => {
    const name = createMemo(() => {
      return props.data.name;
    });
    const openAvatarInfo = () => {
      openModal((close) => {
        const avatar_info_element = createComponent(AvatarItemModal, {
          get children() {
            return [createComponent(AvatarCard, {
              get data() {
                return props.data;
              }
            }), (() => {
              var _el$6 = _tmpl$52();
              insert(_el$6, createComponent(Button$12, {
                variant: "primary",
                onclick: close,
                children: "\u5173\u95ED"
              }));
              return _el$6;
            })()];
          }
        });
        return avatar_info_element;
      });
    };
    return createComponent(AvatarItemContainer, {
      get children() {
        var _el$7 = _tmpl$62();
        _el$7.$$click = openAvatarInfo;
        insert(_el$7, name);
        return _el$7;
      }
    });
  };
  delegateEvents(["click"]);

  // node_modules/solid-js/store/dist/store.js
  var $RAW2 = Symbol("store-raw");
  var $NODE2 = Symbol("store-node");
  var $HAS = Symbol("store-has");
  var $SELF = Symbol("store-self");
  function wrap$12(value) {
    let p2 = value[$PROXY];
    if (!p2) {
      Object.defineProperty(value, $PROXY, {
        value: p2 = new Proxy(value, proxyTraps$12)
      });
      if (!Array.isArray(value)) {
        const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
        for (let i2 = 0, l2 = keys.length; i2 < l2; i2++) {
          const prop = keys[i2];
          if (desc[prop].get) {
            Object.defineProperty(value, prop, {
              enumerable: desc[prop].enumerable,
              get: desc[prop].get.bind(p2)
            });
          }
        }
      }
    }
    return p2;
  }
  function isWrappable2(obj) {
    let proto;
    return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
  }
  function unwrap2(item, set = /* @__PURE__ */ new Set()) {
    let result, unwrapped, v, prop;
    if (result = item != null && item[$RAW2])
      return result;
    if (!isWrappable2(item) || set.has(item))
      return item;
    if (Array.isArray(item)) {
      if (Object.isFrozen(item))
        item = item.slice(0);
      else
        set.add(item);
      for (let i2 = 0, l2 = item.length; i2 < l2; i2++) {
        v = item[i2];
        if ((unwrapped = unwrap2(v, set)) !== v)
          item[i2] = unwrapped;
      }
    } else {
      if (Object.isFrozen(item))
        item = Object.assign({}, item);
      else
        set.add(item);
      const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
      for (let i2 = 0, l2 = keys.length; i2 < l2; i2++) {
        prop = keys[i2];
        if (desc[prop].get)
          continue;
        v = item[prop];
        if ((unwrapped = unwrap2(v, set)) !== v)
          item[prop] = unwrapped;
      }
    }
    return item;
  }
  function getNodes(target, symbol) {
    let nodes = target[symbol];
    if (!nodes)
      Object.defineProperty(target, symbol, {
        value: nodes = /* @__PURE__ */ Object.create(null)
      });
    return nodes;
  }
  function getNode(nodes, property, value) {
    if (nodes[property])
      return nodes[property];
    const [s2, set] = createSignal(value, {
      equals: false,
      internal: true
    });
    s2.$ = set;
    return nodes[property] = s2;
  }
  function proxyDescriptor$12(target, property) {
    const desc = Reflect.getOwnPropertyDescriptor(target, property);
    if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE2)
      return desc;
    delete desc.value;
    delete desc.writable;
    desc.get = () => target[$PROXY][property];
    return desc;
  }
  function trackSelf2(target) {
    getListener() && getNode(getNodes(target, $NODE2), $SELF)();
  }
  function ownKeys2(target) {
    trackSelf2(target);
    return Reflect.ownKeys(target);
  }
  var proxyTraps$12 = {
    get(target, property, receiver) {
      if (property === $RAW2)
        return target;
      if (property === $PROXY)
        return receiver;
      if (property === $TRACK) {
        trackSelf2(target);
        return receiver;
      }
      const nodes = getNodes(target, $NODE2);
      const tracked = nodes[property];
      let value = tracked ? tracked() : target[property];
      if (property === $NODE2 || property === $HAS || property === "__proto__")
        return value;
      if (!tracked) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get))
          value = getNode(nodes, property, value)();
      }
      return isWrappable2(value) ? wrap$12(value) : value;
    },
    has(target, property) {
      if (property === $RAW2 || property === $PROXY || property === $TRACK || property === $NODE2 || property === $HAS || property === "__proto__")
        return true;
      getListener() && getNode(getNodes(target, $HAS), property)();
      return property in target;
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    },
    ownKeys: ownKeys2,
    getOwnPropertyDescriptor: proxyDescriptor$12
  };
  function setProperty2(state, property, value, deleting = false) {
    if (!deleting && state[property] === value)
      return;
    const prev = state[property], len = state.length;
    if (value === void 0) {
      delete state[property];
      if (state[$HAS] && state[$HAS][property] && prev !== void 0)
        state[$HAS][property].$();
    } else {
      state[property] = value;
      if (state[$HAS] && state[$HAS][property] && prev === void 0)
        state[$HAS][property].$();
    }
    let nodes = getNodes(state, $NODE2), node;
    if (node = getNode(nodes, property, prev))
      node.$(() => value);
    if (Array.isArray(state) && state.length !== len) {
      for (let i2 = state.length; i2 < len; i2++)
        (node = nodes[i2]) && node.$();
      (node = getNode(nodes, "length", len)) && node.$(state.length);
    }
    (node = nodes[$SELF]) && node.$();
  }
  function mergeStoreNode2(state, value) {
    const keys = Object.keys(value);
    for (let i2 = 0; i2 < keys.length; i2 += 1) {
      const key = keys[i2];
      setProperty2(state, key, value[key]);
    }
  }
  function updateArray2(current, next) {
    if (typeof next === "function")
      next = next(current);
    next = unwrap2(next);
    if (Array.isArray(next)) {
      if (current === next)
        return;
      let i2 = 0, len = next.length;
      for (; i2 < len; i2++) {
        const value = next[i2];
        if (current[i2] !== value)
          setProperty2(current, i2, value);
      }
      setProperty2(current, "length", len);
    } else
      mergeStoreNode2(current, next);
  }
  function updatePath2(current, path, traversed = []) {
    let part, prev = current;
    if (path.length > 1) {
      part = path.shift();
      const partType = typeof part, isArray = Array.isArray(current);
      if (Array.isArray(part)) {
        for (let i2 = 0; i2 < part.length; i2++) {
          updatePath2(current, [part[i2]].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "function") {
        for (let i2 = 0; i2 < current.length; i2++) {
          if (part(current[i2], i2))
            updatePath2(current, [i2].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "object") {
        const { from = 0, to = current.length - 1, by = 1 } = part;
        for (let i2 = from; i2 <= to; i2 += by) {
          updatePath2(current, [i2].concat(path), traversed);
        }
        return;
      } else if (path.length > 1) {
        updatePath2(current[part], path, [part].concat(traversed));
        return;
      }
      prev = current[part];
      traversed = [part].concat(traversed);
    }
    let value = path[0];
    if (typeof value === "function") {
      value = value(prev, traversed);
      if (value === prev)
        return;
    }
    if (part === void 0 && value == void 0)
      return;
    value = unwrap2(value);
    if (part === void 0 || isWrappable2(prev) && isWrappable2(value) && !Array.isArray(value)) {
      mergeStoreNode2(prev, value);
    } else
      setProperty2(current, part, value);
  }
  function createStore2(...[store, options]) {
    const unwrappedStore = unwrap2(store || {});
    const isArray = Array.isArray(unwrappedStore);
    const wrappedStore = wrap$12(unwrappedStore);
    function setStore(...args) {
      batch(() => {
        isArray && args.length === 1 ? updateArray2(unwrappedStore, args[0]) : updatePath2(unwrappedStore, args);
      });
    }
    return [wrappedStore, setStore];
  }
  var $ROOT2 = Symbol("store-root");
  var producers = /* @__PURE__ */ new WeakMap();
  var setterTraps = {
    get(target, property) {
      if (property === $RAW2)
        return target;
      const value = target[property];
      let proxy;
      return isWrappable2(value) ? producers.get(value) || (producers.set(value, proxy = new Proxy(value, setterTraps)), proxy) : value;
    },
    set(target, property, value) {
      setProperty2(target, property, unwrap2(value));
      return true;
    },
    deleteProperty(target, property) {
      setProperty2(target, property, void 0, true);
      return true;
    }
  };
  function produce(fn2) {
    return (state) => {
      if (isWrappable2(state)) {
        let proxy;
        if (!(proxy = producers.get(state))) {
          producers.set(state, proxy = new Proxy(state, setterTraps));
        }
        fn2(proxy);
      }
      return state;
    };
  }

  // src/utils/random.tools.ts
  var randomArray = (arr) => {
    const tmp_arr = [...arr];
    const result = [];
    for (const _ of arr) {
      let idx = Math.floor(Math.random() * tmp_arr.length);
      idx === tmp_arr.length && (idx -= 1);
      const data = tmp_arr.splice(idx, 1);
      result.push(...data);
    }
    return result;
  };

  // src/views/game-view/stage.util.ts
  var generateGameConfig = (player_count) => {
    const team = getPlayerTeam(player_count);
    const player_team = randomArray(team.players);
    const tasks = generateTasks(player_count);
    return {
      ...team,
      players: player_team.map((d, idx) => {
        return {
          ...d,
          id: idx + 1
        };
      }),
      tasks
    };
  };
  var GameStageContext = createContext();
  var getTaskPlayersMap = (player_count) => {
    if (player_count >= 8) {
      return [3, 4, 4, 5, 5];
    } else if (player_count === 7) {
      return [2, 3, 3, 4, 4];
    } else if (player_count === 6) {
      return [2, 3, 4, 3, 4];
    } else if (player_count === 5) {
      return [2, 3, 2, 3, 3];
    }
  };
  var generateTasks = (player_count) => {
    const special = player_count >= 7;
    const task = Array.from({ length: 5 }).reduce((result, _, index) => {
      const readable_round = index + 1;
      let failVoteCount = 1;
      if (special && readable_round === 3) {
        failVoteCount = 2;
      }
      let task_player_count_map = getTaskPlayersMap(player_count);
      if (!task_player_count_map) {
        return result;
      }
      const current_task_player = task_player_count_map[index];
      const data = {
        id: readable_round,
        taskPlayer: current_task_player,
        failCount: failVoteCount
      };
      result.push(data);
      return result;
    }, []);
    return task;
  };

  // src/views/game-view/game-night.tsx
  var _tmpl$7 = /* @__PURE__ */ template(`<div class=tip>\u70B9\u51FB\u5E8F\u53F7\u724C\u786E\u8BA4\u73A9\u5BB6\u8EAB\u4EFD`);
  var _tmpl$24 = /* @__PURE__ */ template(`<div class=players>`);
  var _tmpl$33 = /* @__PURE__ */ template(`<div class=actions>`);
  var _tmpl$43 = /* @__PURE__ */ template(`<div>`);
  var _tmpl$53 = /* @__PURE__ */ template(`<span class=id-card>`);
  var _tmpl$63 = /* @__PURE__ */ template(`<div class=info>`);
  var GameNightContainer = styled.div({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ".tip": {
      fontSize: "1.5rem",
      marginBottom: "1rem"
    },
    ".players": {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap"
    },
    ".actions": {
      marginTop: "1rem",
      width: "100%",
      padding: ".4rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  });
  var GameNight = () => {
    const context2 = useContext(GameStageContext);
    const players = context2.config.players;
    const [ready_player, updateReadyPlayer] = createSignal([], {
      name: "players_readystatus"
    });
    const onReady = (idx) => {
      const prev = [...ready_player()];
      prev.push(idx);
      updateReadyPlayer([...new Set(prev)]);
    };
    const onUnReady = (idx) => {
      let prev = [...ready_player()];
      prev = prev.filter((d) => d !== idx);
      updateReadyPlayer([...new Set(prev)]);
    };
    const all_ready = createMemo(() => {
      return ready_player().length === players.length;
    });
    const readyPlaye = () => {
      if (all_ready()) {
        toast("\u6E38\u620F\u5F00\u59CB\uFF01");
        context2?.updateStage("task");
      } else {
        toast("\u6240\u6709\u73A9\u5BB6\u5DF2\u786E\u8BA4\u8EAB\u4EFD\u540E\u518D\u5F00\u59CB\u6E38\u620F\uFF01");
      }
    };
    return createComponent(GameNightContainer, {
      get children() {
        return [_tmpl$7(), (() => {
          var _el$2 = _tmpl$24();
          insert(_el$2, createComponent(For, {
            each: players,
            children: (player, i2) => createComponent(NightPlayer, {
              get idx() {
                return i2() + 1;
              },
              info: player,
              get onReady() {
                return onReady.bind(void 0, i2() + 1);
              },
              get onUnReady() {
                return onUnReady.bind(void 0, i2() + 1);
              }
            })
          }));
          return _el$2;
        })(), (() => {
          var _el$3 = _tmpl$33();
          insert(_el$3, createComponent(Button$12, {
            get variant() {
              return all_ready() ? "success" : "secondary";
            },
            style: {
              width: "60%"
            },
            onclick: readyPlaye,
            children: "\u51C6\u5907\u5B8C\u6BD5"
          }));
          return _el$3;
        })()];
      }
    });
  };
  var NightPlayerContainer = styled.div((props) => {
    let main_color = "#333";
    if (props.locked) {
      main_color = "#0d6efd";
    }
    return {
      width: "15%",
      margin: ".2rem",
      position: "relative",
      ".info": {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: main_color,
        color: "#fff",
        borderRadius: ".4rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem",
        fontWeight: "bold"
      },
      "&::after": {
        display: "block",
        content: '""',
        paddingBottom: "100%"
      }
    };
  });
  var ModalContainer = styled.div({
    width: "80vw"
  });
  var InfoContainer = styled.div({
    width: "100%",
    marginBottom: "1rem",
    ".id-card": {
      margin: ".1rem",
      width: "2rem",
      height: "2rem",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#333",
      color: "#fff",
      fontWeight: "bold",
      borderRadius: ".4rem"
    }
  });
  var NightPlayer = (props) => {
    const [locked, updateLock] = createSignal(false, {
      equals: (prev, next) => prev === next
    });
    const [reunlock, updateReunlock] = createSignal(0);
    const context2 = useContext(GameStageContext);
    const players = context2.config.players;
    createEffect(on(locked, (v) => {
      if (v) {
        props.onReady();
      } else {
        props.onUnReady();
      }
    }));
    const onClickCard = () => {
      if (locked()) {
        toast("\u5DF2\u786E\u8BA4\u8EAB\u4EFD\uFF0C\u8EAB\u4EFD\u5DF2\u9501\u5B9A\uFF01");
        const reunlock_count = reunlock() + 1;
        if (reunlock_count > 10) {
          updateLock(false);
          updateReunlock(0);
        } else {
          updateReunlock(reunlock_count);
        }
        return;
      }
      openModal((close) => {
        const villain = players.filter((d) => d.type === "villain");
        const villain_without_oberon = villain.filter((d) => d.code !== "oberon");
        const villain_without_mordred = villain.filter((d) => d.code !== "mordred");
        const merlin_morgana = players.filter((d) => ["merlin", "morgana"].includes(d.code));
        let night_info = [];
        if (props.info.type === "villain") {
          night_info = villain_without_oberon;
        }
        if (props.info.code === "merlin") {
          night_info = villain_without_mordred;
        }
        if (props.info.code === "pacificville") {
          night_info = merlin_morgana;
        }
        if (props.info.code === "oberon") {
          night_info = [];
        }
        const extend = () => {
          const onclose = () => {
            updateLock(true);
            close();
          };
          return (() => {
            var _el$4 = _tmpl$43();
            insert(_el$4, createComponent(Show, {
              get when() {
                return !!night_info.length;
              },
              get children() {
                return createComponent(InfoContainer, {
                  get children() {
                    return ["\u4F60\u770B\u5230\u7684\u4FE1\u606F: ", createComponent(For, {
                      each: night_info,
                      children: (i2) => (() => {
                        var _el$5 = _tmpl$53();
                        insert(_el$5, () => i2.id);
                        return _el$5;
                      })()
                    })];
                  }
                });
              }
            }), null);
            insert(_el$4, createComponent(Button$12, {
              style: {
                width: "100%"
              },
              onclick: onclose,
              get children() {
                return ["#", createMemo(() => props.idx), "\u53F7\u73A9\u5BB6 \u786E\u8BA4\u8EAB\u4EFD"];
              }
            }), null);
            return _el$4;
          })();
        };
        const modal_content = createComponent(ModalContainer, {
          get children() {
            return createComponent(AvatarCard, {
              get data() {
                return props.info;
              },
              extend
            });
          }
        });
        return modal_content;
      });
    };
    return createComponent(NightPlayerContainer, {
      get locked() {
        return locked();
      },
      onclick: onClickCard,
      get children() {
        var _el$6 = _tmpl$63();
        insert(_el$6, () => props.idx);
        return _el$6;
      }
    });
  };

  // src/views/game-view/game-task.tsx
  var _tmpl$8 = /* @__PURE__ */ template(`<div class=result>`);
  var _tmpl$25 = /* @__PURE__ */ template(`<div class=round-box>`);
  var _tmpl$34 = /* @__PURE__ */ template(`<div class=task-name>\u7B2C<!>\u8F6E`);
  var _tmpl$44 = /* @__PURE__ */ template(`<div>\u8BE5\u8F6E\u4EFB\u52A1\u9700\u8981\u6709 <b style=font-size:1.2rem></b> \u7968 \u5931\u8D25\u7968\u624D\u4F1A\u5931\u8D25`);
  var _tmpl$54 = /* @__PURE__ */ template(`<div class=task-info><div>\u9700\u8981 <b style=font-size:1.2rem></b> \u4F4D\u73A9\u5BB6\u53C2\u52A0\u4EFB\u52A1`);
  var _tmpl$64 = /* @__PURE__ */ template(`<div class=vote-tip><b></b> \u53F7\u73A9\u5BB6 \u5F00\u59CB\u6295\u7968`);
  var _tmpl$72 = /* @__PURE__ */ template(`<span class=select-icon>\u5DF2\u9009\u62E9`);
  var _tmpl$82 = /* @__PURE__ */ template(`<div class=vote-box><div class=success>\u6210\u529F</div><div class=fail>\u5931\u8D25`);
  var _tmpl$9 = /* @__PURE__ */ template(`<div class=vote-action-button>`);
  var _tmpl$10 = /* @__PURE__ */ template(`<div class=player-tip>\u7B2C <span class=bold-font></span> \u8F6E\u6E38\u620F`);
  var _tmpl$11 = /* @__PURE__ */ template(`<div class=player-tip>\u672C\u6B21\u4EFB\u52A1\u9700\u8981 <span class=bold-font></span> \u5931\u8D25\u7968\u624D\u4F1A\u5931\u8D25`);
  var _tmpl$12 = /* @__PURE__ */ template(`<div class=player-tip>\u672C\u8F6E\u6E38\u620F\u8FD8\u9700\u8981<span class=bold-font></span>\u4F4D\u73A9\u5BB6\u53C2\u4E0E\u6295\u7968`);
  var _tmpl$13 = /* @__PURE__ */ template(`<div class=player-tip>\u9009\u62E9\u6295\u7968\u7684\u73A9\u5BB6`);
  var _tmpl$14 = /* @__PURE__ */ template(`<div class=player-selector>`);
  var _tmpl$15 = /* @__PURE__ */ template(`<div class=player-vote-confirm>`);
  var _tmpl$16 = /* @__PURE__ */ template(`<div class=tip><b>\u53F7\u73A9\u5BB6</b> \u8BF7\u9009\u62E9\u9700\u8981\u523A\u6740\u7684\u73A9\u5BB6`);
  var _tmpl$17 = /* @__PURE__ */ template(`<div class=player-selector-box>`);
  var GameTaskContainer = styled.div({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ".round-box": {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column"
    },
    ".result": {
      fontSize: "1.2rem",
      marginBottom: "2rem"
    }
  });
  var TaskBox = styled.div((props) => {
    let main_color = "#333";
    if (props.success === true) {
      main_color = "#198754";
    } else if (props.success === false) {
      main_color = "#dc3545";
    }
    return {
      width: "80%",
      // height: '4rem',
      margin: ".2rem 0",
      borderRadius: ".4rem",
      background: main_color,
      color: "#fff",
      ".task-name": {
        fontSize: "1.2rem",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      ".task-info": {
        fontSize: ".8rem",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      },
      ".task-result": {
        width: "100%"
      }
    };
  });
  var TaskResult = styled.div({
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });
  var TaskResultVote = styled.div((props) => {
    const main_color = props.success ? "#198754" : "#dc3545";
    return {
      width: "1rem",
      height: "1rem",
      background: main_color,
      margin: ".4rem",
      border: ".2rem solid #333"
    };
  });
  var GameTask = () => {
    const context2 = useContext(GameStageContext);
    const [task_status, updateTaskStatus] = createSignal([]);
    const [success_camp, updateCampResult] = createSignal();
    const tasks = context2?.config.tasks;
    const result_content = createMemo(() => {
      const successed = success_camp();
      if (successed !== void 0) {
        const success_camp_name = getCampName(successed);
        return `\u6E38\u620F\u5DF2\u7ED3\u675F\uFF01${success_camp_name}\u53D6\u5F97\u80DC\u5229`;
      }
    });
    const startVote = (index) => {
      const result_content_data = result_content();
      if (result_content_data) {
        toast(result_content_data);
        return;
      }
      const readable_index = index + 1;
      const status = task_status()[index];
      if (status) {
        toast(`\u7B2C${readable_index}\u8F6E\u6295\u7968\u5DF2\u7ECF\u7ED3\u675F\uFF01`);
        return;
      }
      if (index !== task_status().length) {
        toast(`\u7B2C${readable_index}\u8F6E\u6295\u7968\u5C1A\u672A\u5F00\u59CB\uFF0C\u5F53\u524D\u7B2C${task_status().length + 1}\u8F6E\u6E38\u620F\uFF01`);
        return;
      }
      ;
      const task = tasks[index];
      openModal((close) => {
        const onConfirm = (votes) => {
          const state = [...task_status()];
          const random_vote = randomArray(votes);
          if (state[index]) {
            state[index].votes = random_vote;
          } else {
            state.push({
              votes: random_vote
            });
          }
          updateTaskStatus(state);
          close();
        };
        return createComponent(VoteSelector, {
          onConfirm,
          cannel: close,
          get players() {
            return context2?.config.players;
          },
          task
        });
      });
    };
    const rounds = createMemo(() => {
      const status = task_status();
      return (tasks || []).map((task, idx) => {
        const current_status = status[idx];
        let task_success;
        if (current_status) {
          const current_fail = current_status.votes.filter((d) => !d.vote);
          if (current_fail.length >= task.failCount) {
            task_success = false;
          } else {
            task_success = true;
          }
        }
        return {
          ...task,
          status: current_status,
          success: task_success
        };
      });
    });
    createEffect(() => {
      const rounds_data = rounds();
      const successed = rounds_data.filter((d) => d.success === true);
      const failed = rounds_data.filter((d) => d.success === false);
      if (successed.length >= 3) {
        openModal((close) => {
          const onAssassinKillResult = (success_kill) => {
            if (!success_kill) {
              updateCampResult("protagonist");
            } else {
              updateCampResult("villain");
            }
            close();
          };
          return createComponent(AssassinModal, {
            get players() {
              return context2?.config.players;
            },
            onUpdateResult: onAssassinKillResult
          });
        });
        toast("\u597D\u4EBA\u9635\u8425\u53D6\u5F97\u4F18\u52BF\uFF01\u53CD\u6D3E\u9635\u8425\u523A\u5BA2\u53EF\u4EE5\u5F00\u59CB\u6307\u8BA4\u6885\u6797\uFF01");
      } else if (failed.length >= 3) {
        toast("\u53CD\u6D3E\u9635\u8425\u80DC\u5229\uFF01");
        updateCampResult("villain");
      }
    });
    return createComponent(GameTaskContainer, {
      get children() {
        return [createComponent(Show, {
          get when() {
            return result_content() !== void 0;
          },
          get children() {
            var _el$ = _tmpl$8();
            insert(_el$, result_content);
            return _el$;
          }
        }), (() => {
          var _el$2 = _tmpl$25();
          insert(_el$2, createComponent(For, {
            get each() {
              return rounds();
            },
            children: (task, idx) => {
              return createComponent(TaskBox, {
                get success() {
                  return task.success;
                },
                get onclick() {
                  return startVote.bind(void 0, idx());
                },
                get children() {
                  return [(() => {
                    var _el$3 = _tmpl$34(), _el$4 = _el$3.firstChild, _el$6 = _el$4.nextSibling, _el$5 = _el$6.nextSibling;
                    insert(_el$3, () => task.id, _el$6);
                    return _el$3;
                  })(), createComponent(Show, {
                    get when() {
                      return !!task.status;
                    },
                    get children() {
                      return createComponent(TaskResult, {
                        get children() {
                          return createComponent(For, {
                            get each() {
                              return task.status.votes;
                            },
                            children: (vote_data) => createComponent(TaskResultVote, {
                              get success() {
                                return vote_data.vote;
                              }
                            })
                          });
                        }
                      });
                    }
                  }), createComponent(Show, {
                    get when() {
                      return !task.status;
                    },
                    get children() {
                      var _el$7 = _tmpl$54(), _el$8 = _el$7.firstChild, _el$9 = _el$8.firstChild, _el$10 = _el$9.nextSibling;
                      insert(_el$10, () => task.taskPlayer);
                      insert(_el$7, createComponent(Show, {
                        get when() {
                          return task.failCount > 1;
                        },
                        get children() {
                          var _el$11 = _tmpl$44(), _el$12 = _el$11.firstChild, _el$13 = _el$12.nextSibling;
                          insert(_el$13, () => task.failCount);
                          return _el$11;
                        }
                      }), null);
                      return _el$7;
                    }
                  })];
                }
              });
            }
          }));
          return _el$2;
        })()];
      }
    });
  };
  var VoteModal = styled.div({
    width: "100%",
    height: "100%",
    background: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    ".player-tip": {
      fontSize: "1rem",
      width: "80%",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: ".4rem",
      ".bold-font": {
        margin: ".4rem",
        fontSize: "1.5rem",
        fontWeight: "bold"
      }
    },
    ".player-selector": {
      width: "80%",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: ".4rem"
    },
    ".player-vote-confirm": {
      width: "80%",
      marginTop: "2rem",
      "button": {
        margin: ".4rem 0",
        width: "100%"
      }
    }
  });
  var PlayerSelectorBox = styled.div((props) => {
    const main_color = props.selected ? "#0d6efd" : "#f1f1f1";
    const font_color = props.selected ? "#fff" : "#333";
    return {
      fontWeight: "bold",
      margin: ".2rem",
      background: main_color,
      borderRadius: ".4rem",
      color: font_color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "3rem",
      height: "3rem"
    };
  });
  var VoteBoxWapper = styled.div({
    width: "100%",
    height: "100%",
    background: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    "& > div": {
      marginBottom: ".4rem"
    },
    ".vote-tip": {
      fontSize: "1.2rem",
      color: "#fff"
    },
    ".vote-box": {
      width: "90%",
      height: "10rem",
      // background: '#fff',
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: ".4rem",
      "& > div": {
        width: "50%",
        height: "100%",
        margin: ".4rem",
        background: "#fff",
        borderRadius: ".4rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontSize: "2rem",
        ".select-icon": {
          fontSize: "1rem"
        }
      },
      ".success": {
        background: "#198754",
        color: "#fff"
      },
      ".fail": {
        background: "#dc3545",
        color: "#fff"
      }
    },
    ".vote-action-button": {
      width: "80%",
      "button": {
        width: "100%",
        margin: ".4rem 0"
      }
    }
  });
  var VoteSelector = (props) => {
    const [vote_status, updateVoteStatus] = createSignal([]);
    const last_vote = createMemo(() => {
      return props.task.taskPlayer - vote_status().length;
    });
    const startVote = (player) => {
      const voted = vote_status().find((d) => d.player.id === player.id);
      if (voted)
        return;
      if (last_vote() <= 0)
        return;
      openModal((close) => {
        let [vote_succces, updateVoteSuccess] = createSignal(void 0);
        const onVote = (success) => {
          if (player.type === "protagonist" && !success) {
            toast("\u597D\u4EBA\u9635\u8425\u65E0\u6CD5\u6295\u51FA\u5931\u8D25\u7968\uFF01", {
              timeout: 1e3
            });
            return;
          }
          updateVoteSuccess(success);
        };
        const onSubmit = () => {
          if (vote_succces() === void 0)
            return;
          const status = [...vote_status()];
          status.push({
            player,
            vote: vote_succces()
          });
          updateVoteStatus(status);
          close();
        };
        return createComponent(VoteBoxWapper, {
          get children() {
            return [(() => {
              var _el$14 = _tmpl$64(), _el$15 = _el$14.firstChild;
              insert(_el$15, () => player.id);
              return _el$14;
            })(), (() => {
              var _el$16 = _tmpl$82(), _el$17 = _el$16.firstChild, _el$18 = _el$17.firstChild, _el$20 = _el$17.nextSibling, _el$21 = _el$20.firstChild;
              addEventListener(_el$17, "click", onVote.bind(void 0, true), true);
              insert(_el$17, createComponent(Show, {
                get when() {
                  return vote_succces() === true;
                },
                get children() {
                  return _tmpl$72();
                }
              }), null);
              addEventListener(_el$20, "click", onVote.bind(void 0, false), true);
              insert(_el$20, createComponent(Show, {
                get when() {
                  return vote_succces() === false;
                },
                get children() {
                  return _tmpl$72();
                }
              }), null);
              return _el$16;
            })(), (() => {
              var _el$23 = _tmpl$9();
              insert(_el$23, createComponent(Button$12, {
                get variant() {
                  return vote_succces() !== void 0 ? "primary" : "secondary";
                },
                onclick: onSubmit,
                children: "\u786E\u5B9A"
              }), null);
              insert(_el$23, createComponent(Button$12, {
                variant: "secondary",
                onclick: close,
                children: "\u53D6\u6D88"
              }), null);
              return _el$23;
            })()];
          }
        });
      });
    };
    const player_selector_data = createMemo(() => {
      const status = vote_status();
      const players = props.players;
      return players.map((d) => {
        return {
          ...d,
          voted: !!status.find((s2) => s2.player.id === d.id)
        };
      });
    });
    const confirm = () => {
      if (vote_status().length !== props.task.taskPlayer) {
        toast(`\u8FD8\u5269${last_vote()}\u4F4D\u73A9\u5BB6\u672A\u53C2\u4E0E\u6295\u7968\uFF01`);
        return;
      }
      props.onConfirm(vote_status());
    };
    return createComponent(VoteModal, {
      get children() {
        return [(() => {
          var _el$24 = _tmpl$10(), _el$25 = _el$24.firstChild, _el$26 = _el$25.nextSibling;
          insert(_el$26, () => props.task.id);
          return _el$24;
        })(), createComponent(Show, {
          get when() {
            return props.task.failCount > 1;
          },
          get children() {
            var _el$27 = _tmpl$11(), _el$28 = _el$27.firstChild, _el$29 = _el$28.nextSibling;
            insert(_el$29, () => props.task.failCount);
            return _el$27;
          }
        }), (() => {
          var _el$30 = _tmpl$12(), _el$31 = _el$30.firstChild, _el$32 = _el$31.nextSibling;
          insert(_el$32, last_vote);
          return _el$30;
        })(), _tmpl$13(), (() => {
          var _el$34 = _tmpl$14();
          insert(_el$34, createComponent(For, {
            get each() {
              return player_selector_data();
            },
            children: (player) => {
              return createComponent(PlayerSelectorBox, {
                get selected() {
                  return player.voted;
                },
                onclick: () => startVote(player),
                get children() {
                  return player.id;
                }
              });
            }
          }));
          return _el$34;
        })(), (() => {
          var _el$35 = _tmpl$15();
          insert(_el$35, createComponent(Button$12, {
            onclick: confirm,
            children: "\u786E\u8BA4\u7968\u578B"
          }), null);
          insert(_el$35, createComponent(Button$12, {
            variant: "secondary",
            get onclick() {
              return props.cannel;
            },
            children: "\u8FD4\u56DE"
          }), null);
          return _el$35;
        })()];
      }
    });
  };
  var AssassinModalContainer = styled.div({
    padding: "2rem",
    width: "90%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    borderRadius: ".4rem",
    ".player-selector-box": {
      margin: ".4rem 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap"
    },
    ".confirm": {
      width: "100%"
    }
  });
  var AssassinModal = (props) => {
    const [selected, updateSelected] = createSignal();
    const assassin = createMemo(() => {
      return props.players.find((d) => d.code === "assassin");
    });
    const players = createMemo(() => {
      return props.players.map((d, index) => {
        const selected_player = selected() === index;
        return {
          ...d,
          selected: selected_player
        };
      });
    });
    const onSelected = (index) => {
      updateSelected(index);
    };
    const onKill = () => {
      const selected_taget = selected();
      if (selected_taget === void 0) {
        toast("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u8981\u523A\u6740\u7684\u76EE\u6807\uFF01");
      } else {
        const target = players()[selected_taget];
        if (target.code !== "merlin") {
          toast("\u523A\u6740\u6885\u6797\u5931\u8D25\uFF0C\u597D\u4EBA\u9635\u8425\u80DC\u5229\uFF01");
          props.onUpdateResult(false);
        } else {
          toast("\u523A\u6740\u6885\u6797\u6210\u529F\uFF01\u53CD\u6D3E\u9635\u8425\u80DC\u5229\uFF01");
          props.onUpdateResult(true);
        }
      }
    };
    return createComponent(AssassinModalContainer, {
      get children() {
        return [(() => {
          var _el$36 = _tmpl$16(), _el$37 = _el$36.firstChild, _el$38 = _el$37.firstChild;
          insert(_el$37, () => assassin().id, _el$38);
          return _el$36;
        })(), (() => {
          var _el$39 = _tmpl$17();
          insert(_el$39, createComponent(For, {
            get each() {
              return players();
            },
            children: (player, idx) => {
              return createComponent(PlayerSelectorBox, {
                get selected() {
                  return player.selected;
                },
                get onclick() {
                  return onSelected.bind(void 0, idx());
                },
                get children() {
                  return player.id;
                }
              });
            }
          }));
          return _el$39;
        })(), createComponent(Button$12, {
          onclick: onKill,
          "class": "confirm",
          get variant() {
            return selected() !== void 0 ? "primary" : "secondary";
          },
          children: "\u786E\u5B9A"
        })];
      }
    });
  };
  delegateEvents(["click"]);

  // src/views/game-view/game.tsx
  var GameStageContainer = styled.div({
    width: "100%",
    height: "100%",
    background: "#f1f1f1",
    overflow: "hidden"
  });
  var CommonActions = styled.div({
    position: "absolute",
    top: "1rem",
    right: "1rem"
  });
  var GameStageControllerView = () => {
    const store = useContext(GameAppControllerContext);
    const player_count = createMemo(() => {
      const player_num = Number(store?.query?.player_count);
      if (isNaN(player_num)) {
        toast("\u6E38\u620F\u4EBA\u6570\u914D\u7F6E\u9519\u8BEF!");
        store?.updateCurrent("game_home");
        return 0;
      }
      return player_num;
    });
    const game_config = generateGameConfig(player_count());
    const [game_stage_store, setGameStage] = createStore2({
      config: game_config,
      stage: "night",
      updateStage: (stage) => {
        setGameStage(produce((prev) => {
          prev.stage = stage;
        }));
      }
    });
    const onMenuClick = (key) => {
      if (key === "return_home") {
        store?.updateCurrent("game_home");
      }
    };
    return createComponent(GameStageContext.Provider, {
      value: game_stage_store,
      get children() {
        return [createComponent(CommonActions, {
          get children() {
            return createComponent(Dropdown$1, {
              onSelect: onMenuClick,
              get children() {
                return [createComponent(Dropdown$1.Toggle, {
                  size: "sm",
                  variant: "success",
                  id: "dropdown-basic",
                  children: "\u83DC\u5355"
                }), createComponent(Dropdown$1.Menu, {
                  get children() {
                    return createComponent(Dropdown$1.Item, {
                      eventKey: "return_home",
                      children: "\u8FD4\u56DE\u9996\u9875"
                    });
                  }
                })];
              }
            });
          }
        }), createComponent(GameStageContainer, {
          get children() {
            return createComponent(Switch, {
              get children() {
                return [createComponent(Match, {
                  get when() {
                    return game_stage_store.stage === "night";
                  },
                  get children() {
                    return createComponent(GameNight, {});
                  }
                }), createComponent(Match, {
                  get when() {
                    return game_stage_store.stage === "task";
                  },
                  get children() {
                    return createComponent(GameTask, {});
                  }
                })];
              }
            });
          }
        })];
      }
    });
  };

  // src/game.controller.tsx
  var GameAppControllerContext = createContext();
  var GameAppController = () => {
    const [view_store, updateStore] = createStore2({
      current: "game_home",
      updateCurrent: (view) => {
        const [view_name] = view.match(/[^\?]+/) || [];
        if (!view_name)
          return;
        const view_query = view.replace(view_name, "").replace(/^\?/, "");
        const querys = view_query.split("&");
        const querys_obj = querys.reduce((result, content) => {
          const [key, value] = content.split("=");
          if (!key)
            return result;
          result[key] = value || "";
          return result;
        }, {});
        console.log(view, "view");
        updateStore(produce((prev) => {
          prev.current = view_name;
          if (view_query) {
            prev.query = querys_obj;
          }
        }));
      }
    });
    return createComponent(GameAppControllerContext.Provider, {
      value: view_store,
      get children() {
        return createComponent(Switch, {
          get children() {
            return [createComponent(Match, {
              get when() {
                return view_store.current === "game_home";
              },
              get children() {
                return createComponent(HomeView, {});
              }
            }), createComponent(Match, {
              get when() {
                return view_store.current === "game_stage";
              },
              get children() {
                return createComponent(GameStageControllerView, {});
              }
            })];
          }
        });
      }
    });
  };

  // src/index.tsx
  var Container = styled.div({
    width: "100%",
    height: "100%"
  });
  var GlobalStyled = createGlobalStyles({
    "html, body, #root": {
      // fontSize: '18px',
      margin: 0,
      padding: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden"
    }
  });
  var App = () => {
    return createComponent(Container, {
      get children() {
        return [createComponent(GlobalStyled, {}), createComponent(GameAppController, {})];
      }
    });
  };
  render(() => createComponent(App, {}), document.querySelector("#root"));
})();
