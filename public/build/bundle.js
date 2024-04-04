
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var questions = {
    	"2024-04-04": [
    	{
    		question: "What is the chemical name for Vitamin C?",
    		answer: "Ascorbic Acid"
    	},
    	{
    		question: "Which fruit is commonly mistaken for having the highest Vitamin C content per serving?",
    		answer: "Oranges"
    	},
    	{
    		question: "What is the primary function of Vitamin C in the human body?",
    		answer: "Vitamin C is an antioxidant that is essential for the synthesis of collagen and the repair of tissues."
    	},
    	{
    		question: "Can the human body synthesize Vitamin C?",
    		answer: "No, humans must obtain Vitamin C from their diet or supplements."
    	},
    	{
    		question: "What disease is caused by a severe Vitamin C deficiency?",
    		answer: "Scurvy"
    	},
    	{
    		question: "Besides citrus fruits, name a vegetable that is a high source of Vitamin C.",
    		answer: "Bell peppers"
    	}
    ],
    	"2024-04-05": [
    	{
    		question: "What does GLP-1 stand for in the context of GLP-1 drugs like Ozempic?",
    		answer: "Glucagon-like peptide-1"
    	},
    	{
    		question: "What is the primary use of GLP-1 drugs such as Ozempic?",
    		answer: "To lower blood sugar levels in type 2 diabetes"
    	},
    	{
    		question: "How do GLP-1 drugs like Ozempic work in the body?",
    		answer: "They mimic the GLP-1 hormone, which increases insulin production and decreases glucagon release"
    	},
    	{
    		question: "Can GLP-1 drugs like Ozempic aid in weight loss?",
    		answer: "Yes, they can promote weight loss by slowing gastric emptying and reducing appetite"
    	},
    	{
    		question: "Is Ozempic used for type 1 diabetes treatment?",
    		answer: "No, it is approved for type 2 diabetes, not type 1"
    	},
    	{
    		question: "Add your custom question here",
    		answer: "Add your custom answer here"
    	}
    ]
    };

    /* src/Progress.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file$1 = "src/Progress.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (55:4) {#each Object.keys(scoring) as key, index}
    function create_each_block(ctx) {
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*index*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", hexagonPath);
    			add_location(path, file$1, 64, 12, 1784);
    			attr_dev(svg, "width", "128");
    			attr_dev(svg, "height", "144");
    			attr_dev(svg, "viewBox", "0 0 128 144");
    			attr_dev(svg, "class", "hexagon svelte-9rn3fu");
    			set_style(svg, "fill", fillColor(/*scoring*/ ctx[0][/*key*/ ctx[5]]));
    			add_location(svg, file$1, 55, 8, 1500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", click_handler, false, false, false, false),
    					listen_dev(svg, "mouseout", /*handleMouseOut*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*scoring*/ 1) {
    				set_style(svg, "fill", fillColor(/*scoring*/ ctx[0][/*key*/ ctx[5]]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(55:4) {#each Object.keys(scoring) as key, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_value = Object.keys(/*scoring*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "hexagon-container svelte-9rn3fu");
    			add_location(div, file$1, 53, 0, 1413);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fillColor, scoring, Object, handleClick, handleMouseOut, hexagonPath*/ 7) {
    				each_value = Object.keys(/*scoring*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const hexagonPath = "M64,18l32,18v36l-32,18l-32,-18v-36l32,-18Z";

    // Function to determine fill color based on score
    function fillColor(score) {
    	switch (score) {
    		case 0:
    			return 'red';
    		case 1:
    			return 'orange';
    		case 2:
    			return 'yellow';
    		case 3:
    			return 'green';
    		default:
    			return 'lightgrey';
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Progress', slots, []);
    	let { scoring = {} } = $$props;
    	let selectedIndex = null; // Reactive variable to store the index of the selected hexagon

    	function handleClick(index) {
    		selectedIndex = index;
    	}

    	// Function to reset the selected index when another hexagon is clicked or when clicked again
    	function handleMouseOut() {
    		selectedIndex = null;
    	}

    	const writable_props = ['scoring'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Progress> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => handleClick(index);

    	$$self.$$set = $$props => {
    		if ('scoring' in $$props) $$invalidate(0, scoring = $$props.scoring);
    	};

    	$$self.$capture_state = () => ({
    		scoring,
    		selectedIndex,
    		hexagonPath,
    		handleClick,
    		handleMouseOut,
    		fillColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('scoring' in $$props) $$invalidate(0, scoring = $$props.scoring);
    		if ('selectedIndex' in $$props) selectedIndex = $$props.selectedIndex;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [scoring, handleClick, handleMouseOut, click_handler];
    }

    class Progress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { scoring: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progress",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get scoring() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scoring(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (115:3) {#if questions[previousDay]}
    function create_if_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "←";
    			add_location(button, file, 115, 4, 3980);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[11], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(115:3) {#if questions[previousDay]}",
    		ctx
    	});

    	return block;
    }

    // (119:3) {#if questions[nextDay]}
    function create_if_block_2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "→";
    			add_location(button, file, 119, 4, 4088);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[12], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(119:3) {#if questions[nextDay]}",
    		ctx
    	});

    	return block;
    }

    // (128:2) {#if todayQuestions.length === 0}
    function create_if_block_1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "No questions available today";
    			attr_dev(h1, "class", "svelte-a5mqdz");
    			add_location(h1, file, 128, 3, 4251);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(128:2) {#if todayQuestions.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (131:2) {#if todayQuestions.length > 0}
    function create_if_block(ctx) {
    	let div;
    	let p;
    	let t_value = /*currentQuestion*/ ctx[2].question + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file, 132, 4, 4369);
    			attr_dev(div, "class", "current-question");
    			add_location(div, file, 131, 3, 4334);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentQuestion*/ 4 && t_value !== (t_value = /*currentQuestion*/ ctx[2].question + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(131:2) {#if todayQuestions.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let t5;
    	let div5;
    	let t6;
    	let t7;
    	let form;
    	let input;
    	let t8;
    	let button;
    	let t10;
    	let div3;
    	let progress;
    	let t11;
    	let div4;
    	let t12;
    	let t13;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = questions[/*previousDay*/ ctx[3]] && create_if_block_3(ctx);
    	let if_block1 = questions[/*nextDay*/ ctx[4]] && create_if_block_2(ctx);
    	let if_block2 = /*todayQuestions*/ ctx[1].length === 0 && create_if_block_1(ctx);
    	let if_block3 = /*todayQuestions*/ ctx[1].length > 0 && create_if_block(ctx);

    	progress = new Progress({
    			props: { scoring: /*scoring*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			t1 = text(/*selectedDay*/ ctx[0]);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "Healthle";
    			t5 = space();
    			div5 = element("div");
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			t7 = space();
    			form = element("form");
    			input = element("input");
    			t8 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t10 = space();
    			div3 = element("div");
    			create_component(progress.$$.fragment);
    			t11 = space();
    			div4 = element("div");
    			t12 = text("Points Earned: ");
    			t13 = text(/*pointsEarned*/ ctx[6]);
    			add_location(div0, file, 113, 2, 3938);
    			add_location(div1, file, 122, 2, 4157);
    			attr_dev(div2, "class", "title");
    			add_location(div2, file, 112, 1, 3916);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter your Answer here");
    			add_location(input, file, 136, 3, 4472);
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 137, 3, 4559);
    			add_location(form, file, 135, 2, 4423);
    			attr_dev(div3, "class", "progress-container svelte-a5mqdz");
    			add_location(div3, file, 139, 2, 4609);
    			attr_dev(div4, "class", "points-earned svelte-a5mqdz");
    			add_location(div4, file, 143, 2, 4724);
    			attr_dev(div5, "class", "quiz");
    			add_location(div5, file, 126, 1, 4193);
    			attr_dev(main, "class", "svelte-a5mqdz");
    			add_location(main, file, 111, 0, 3908);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(main, t5);
    			append_dev(main, div5);
    			if (if_block2) if_block2.m(div5, null);
    			append_dev(div5, t6);
    			if (if_block3) if_block3.m(div5, null);
    			append_dev(div5, t7);
    			append_dev(div5, form);
    			append_dev(form, input);
    			set_input_value(input, /*answerInput*/ ctx[7]);
    			append_dev(form, t8);
    			append_dev(form, button);
    			append_dev(div5, t10);
    			append_dev(div5, div3);
    			mount_component(progress, div3, null);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, t12);
    			append_dev(div4, t13);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[13]),
    					listen_dev(form, "submit", prevent_default(/*gradeAnswer*/ ctx[9]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (questions[/*previousDay*/ ctx[3]]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*selectedDay*/ 1) set_data_dev(t1, /*selectedDay*/ ctx[0]);

    			if (questions[/*nextDay*/ ctx[4]]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*todayQuestions*/ ctx[1].length === 0) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div5, t6);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*todayQuestions*/ ctx[1].length > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(div5, t7);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*answerInput*/ 128 && input.value !== /*answerInput*/ ctx[7]) {
    				set_input_value(input, /*answerInput*/ ctx[7]);
    			}

    			const progress_changes = {};
    			if (dirty & /*scoring*/ 32) progress_changes.scoring = /*scoring*/ ctx[5];
    			progress.$set(progress_changes);
    			if (!current || dirty & /*pointsEarned*/ 64) set_data_dev(t13, /*pointsEarned*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progress.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progress.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_component(progress);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function gradeAnswerWithAI(answer) {
    	
    } // const client = createClient({ apiKey: 'your_openai_api_key_here' });
    // const questionPrompt = `Based on the question: "${currentQuestion.question}", how well does the answer "${answer}" align on a scale from 0 to 3? 0 means not at all, 1 means slightly, 2 means moderately, and 3 means perfectly.`;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let todayQuestions = [];
    	let currentQuestionIndex = 0;
    	let currentQuestion = {};
    	let today;
    	let selectedDay;
    	let previousDay;
    	let nextDay;
    	let scoring = {}; // Initialize scoring hashmap

    	function calculateAdjacentDays() {
    		console.log('calculateAdjacentDays');
    		if (!selectedDay) return;
    		const todayDate = new Date(selectedDay); // Use selectedDay instead of today
    		console.log('selectedDay', selectedDay);
    		const previousDate = new Date(todayDate);
    		console.log('previousDate', previousDate.toISOString());
    		previousDate.setDate(previousDate.getDate() - 1);
    		console.log('previousDate', previousDate.toISOString());
    		console.log('previousDate', previousDate.toISOString());
    		console.log('previousDate', previousDate.toISOString());
    		console.log('previousDate', previousDate.toISOString());
    		console.log('previousDate', previousDate.toISOString());
    		$$invalidate(3, previousDay = previousDate.toISOString().slice(0, 10));
    		const nextDate = new Date(todayDate);
    		nextDate.setDate(nextDate.getDate() + 1);
    		$$invalidate(4, nextDay = nextDate.toISOString().slice(0, 10));
    	}

    	function loadQuestionsForDate(date) {
    		$$invalidate(1, todayQuestions = questions[date] || []);

    		if (todayQuestions.length > 0) {
    			currentQuestionIndex = 0;
    			$$invalidate(2, currentQuestion = todayQuestions[currentQuestionIndex]);
    			$$invalidate(5, scoring = {}); // Reset scoring for new day
    			todayQuestions.forEach((_, index) => $$invalidate(5, scoring[index] = undefined, scoring));
    		}
    	}

    	onMount(() => {
    		today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
    		$$invalidate(0, selectedDay = today);
    		calculateAdjacentDays();
    		loadQuestionsForDate(selectedDay);
    	});

    	let { name } = $$props;
    	let questionsCorrect = 0;
    	let totalQuestions = todayQuestions.length;
    	let pointsEarned = 0;
    	let answerInput = '';

    	function changeDay(offset) {
    		const newDay = new Date(selectedDay); // Use selectedDay instead of today
    		newDay.setDate(newDay.getDate() + offset);
    		const newDayStr = newDay.toISOString().slice(0, 10);

    		if (questions[newDayStr]) {
    			$$invalidate(0, selectedDay = newDayStr); // Update selectedDay instead of today
    			loadQuestionsForDate(selectedDay);
    		}
    	}

    	// try {
    	// 	const response = await client.createCompletion({
    	// 		model: 'text-davinci-003',
    	// 		prompt: questionPrompt,
    	// 		temperature: 0.7,
    	// 		max_tokens: 60,
    	// 		top_p: 1.0,
    	// 		frequency_penalty: 0.0,
    	// 		presence_penalty: 0.0,
    	// 	});
    	// 	const score = parseInt(response.choices[0].text.trim());
    	// 	return {
    	// 		numberOfPoints: score,
    	// 		questionNumberAnsweredCorrectly: score > 0 ? 1 : 0
    	// 	};
    	// } catch (error) {
    	// 	console.error('Error grading answer with AI:', error);
    	// 	// Fallback to a default score in case of an error
    	// 	return { numberOfPoints: 0, questionNumberAnsweredCorrectly: 0 };
    	// }
    	function gradeAnswer() {
    		_gradeAnswer(answerInput).then(({ numberOfPoints, questionNumberAnsweredCorrectly }) => {
    			$$invalidate(6, pointsEarned += numberOfPoints);
    			questionsCorrect += questionNumberAnsweredCorrectly;

    			// Update scoring based on the answer correctness
    			$$invalidate(5, scoring[currentQuestionIndex] = questionNumberAnsweredCorrectly ? 3 : 0, scoring);

    			$$invalidate(7, answerInput = ''); // Reset input after grading

    			if (currentQuestionIndex < todayQuestions.length - 1) {
    				currentQuestionIndex++;
    				$$invalidate(2, currentQuestion = todayQuestions[currentQuestionIndex]);
    			}
    		});
    	}

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	});

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => changeDay(-1);
    	const click_handler_1 = () => changeDay(1);

    	function input_input_handler() {
    		answerInput = this.value;
    		$$invalidate(7, answerInput);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(10, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		questions,
    		todayQuestions,
    		currentQuestionIndex,
    		currentQuestion,
    		today,
    		selectedDay,
    		previousDay,
    		nextDay,
    		scoring,
    		calculateAdjacentDays,
    		loadQuestionsForDate,
    		name,
    		Progress,
    		questionsCorrect,
    		totalQuestions,
    		pointsEarned,
    		answerInput,
    		changeDay,
    		gradeAnswerWithAI,
    		gradeAnswer
    	});

    	$$self.$inject_state = $$props => {
    		if ('todayQuestions' in $$props) $$invalidate(1, todayQuestions = $$props.todayQuestions);
    		if ('currentQuestionIndex' in $$props) currentQuestionIndex = $$props.currentQuestionIndex;
    		if ('currentQuestion' in $$props) $$invalidate(2, currentQuestion = $$props.currentQuestion);
    		if ('today' in $$props) today = $$props.today;
    		if ('selectedDay' in $$props) $$invalidate(0, selectedDay = $$props.selectedDay);
    		if ('previousDay' in $$props) $$invalidate(3, previousDay = $$props.previousDay);
    		if ('nextDay' in $$props) $$invalidate(4, nextDay = $$props.nextDay);
    		if ('scoring' in $$props) $$invalidate(5, scoring = $$props.scoring);
    		if ('name' in $$props) $$invalidate(10, name = $$props.name);
    		if ('questionsCorrect' in $$props) questionsCorrect = $$props.questionsCorrect;
    		if ('totalQuestions' in $$props) totalQuestions = $$props.totalQuestions;
    		if ('pointsEarned' in $$props) $$invalidate(6, pointsEarned = $$props.pointsEarned);
    		if ('answerInput' in $$props) $$invalidate(7, answerInput = $$props.answerInput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedDay*/ 1) {
    			(calculateAdjacentDays()); // Recalculate adjacent days when selectedDay changes
    		}
    	};

    	return [
    		selectedDay,
    		todayQuestions,
    		currentQuestion,
    		previousDay,
    		nextDay,
    		scoring,
    		pointsEarned,
    		answerInput,
    		changeDay,
    		gradeAnswer,
    		name,
    		click_handler,
    		click_handler_1,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
