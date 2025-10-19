# Web Directive

[![Version](https://img.shields.io/npm/v/web-directive.svg?style=flat-square)](https://www.npmjs.com/package/web-directive)
![Test](https://img.shields.io/github/actions/workflow/status/asika32764/web-directive/ci.yml?style=flat-square)
[![License](https://img.shields.io/npm/l/web-directive.svg?style=flat-square)](LICENSE)

A library to implement directive pattern for native HTML without any framework,
which is inspired by Vue.js.

See [DEMO](https://codepen.io/asika32764/pen/RwmoWWa)

```html

<button w-copy="Text to copy">
  ...
</button>

<script>
  wd.register('copy', {
    mounted(el, { value }) {
      el.addEventListener('click', () => {
        navigator.clipboard.writeText(value);
      });
    }
  });
</script>
```

<!-- TOC -->

* [Web Directive](#web-directive)
  * [Why Need This?](#why-need-this)
  * [Installation](#installation)
    * [Register Directives](#register-directives)
    * [Singleton Your Object](#singleton-your-object)
    * [Listener Helper](#listener-helper)
  * [Listen to Child Elements](#listen-to-child-elements)
  * [Argument and Modifiers](#argument-and-modifiers)
    * [Add Multiple Directives](#add-multiple-directives)
    * [Modifiers Cases](#modifiers-cases)
  * [Lifecycle](#lifecycle)
    * [Updated Timing](#updated-timing)
    * [Events](#events)
  * [Custom Prefix](#custom-prefix)
  * [Options](#options)

<!-- TOC -->

## Why Need This?

For a long time we've relied on approaches where inserting a Web Component into HTML activates functionality
immediately, or where frameworks like Vue and Angular use directives to extend HTML elements. Plain HTML doesn't have a
directive-like functions that lets us inject JavaScript behaviors just by adding an attribute.

For example, if you want a `copy to clipboard` feature that works across projects and environments, the traditional way
is to write JS that binds a click event to the button:

```js
for (var el of document.querySelectorAll('.js-copy-btn')) {
  el.addEventListener('click', (e) => {
    navigator.clipboard.writeText(e.currentTarget.dataset.text);
  });
}
```

This works in static HTML, but it can fail with virtual DOM frameworks like Vue or React because the virtual DOM may
rewrite the DOM tree and remove event bindings.

```vue

<template>
  <App>
    <!-- This button not work -->
    <button class="js-copy-btn" data-text="Hello">
      Copy
    </button>
  </App>
</template>
```

To make small features reusable across projects and environments, a common solution is to use
`delegated event listeners`:

```ts
$(document).on('click', '.js-copy-btn', (e) => {
  navigator.clipboard.writeText(e.currentTarget.dataset.text);
});
```

This approach has some drawbacks. First, the `delegate` pattern is not commonly used; for developers unfamiliar with
jQuery or similar libraries, this pattern can be confusing. Second, for SPAs that frequently need to unbind event
handlers, this method can lead to memory leaks or unexpected behavior because the event handlers remain attached to the
DOM even after the related elements have been removed.

Another solution is implement a `WebComponent` such
as `<copy-button>`, which ensures it works everywhere. However, Web Components have a higher development barrier: adding
a custom HTML element for a simple feature can feel heavy or unintuitive, and enabling Shadow DOM may make CSS harder to
manage.

`WebDirective` aims to let developers easily write cross-project, cross-environment HTML extensions that can be mounted
to existing HTML with non-invasively and removed cleanly without side effects or leftovers. The example below shows
implementing a `copy to clipboard` feature as a directive and mounting it in a Vue environment:

```vue

<script setup lang="ts">
import WebDirective from 'web-directive';

const wd = WebDirective();
wd.register('copy', {
  mounted(el, { value }) {
    el.addEventListener('click', copy);
  },
  unmounted(el) {
    el.removeEventListener('click', copy);
  }
});

function copy(e: MouseEvent) {
  navigator.clipboard.writeText(e.currentTarget.dataset.text);
}
</script>

<template>
  <App>
    <MyButton w-copy data-text="Hello World">
      Copy Text
    </MyButton>
  </App>
</template>
```

As an early experimental version, we heavily referenced Vue.js for the interface to reduce the learning curve for
developers. However, due to some limitations of native HTML, we cannot achieve exactly the same behavior.
Implementations of directives like this have been used in our team since 2020, it is very stable and intuitive,
and perfectly suitable for production use.

## Installation

NPM or Yarn

```shell
npm i web-directive

# OR

yarn add web-directive
```

UnPkg

```html
<!-- UMD -->
<script src="https://www.unpkg.com/web-directive/dist/web-directive.umd.min.cjs"></script>

<!-- ES Module -->
<script type="module">
  import WebDirective from 'https://www.unpkg.com/web-directive/dist/web-directive.js';

  // ...
</script>
```

Bundler

```ts
import WebDirective from 'web-directive';

const wd = new WebDirective();
wd.listen();

export default wd;
```

Browser

```html

<script src="path/to/web-directive/dist/web-directive.umd.js"></script>

<script>
  const wd = new WebDirective();
  wd.listen(); // Will listen to document.body
</script>
```

Listen to smaller scope.

```ts
const element = document.querySelector('#foo');

wd.listen(element);
```

Stop listening

```ts
wd.disconnect();
```

### Register Directives

After register a directive (for example: `foo`), you can add `w-foo` directive to any HTML element and the directive
will instantly work.

This is very useful that if you want to add some cross-platform custom logic to existing Vue/React/Angular template
without writing code for every frameworks.

```ts
wd.register('foo', {
  // Reguired
  // When element attach to DOM or attribute attach to element
  mounted(el, binding) {
    // Do any thing you want
    const { value } = bindings;

    el._foo = new Foo(value);
  },

  // Optional
  // When element detach from DOM or attribute dettach from element
  unmounted(el, binding) {
    el._foo.stop();
    delete el._foo;
  },

  // Optional
  // When values changed
  updated(el, binding) {
    const { value } = bindings;
    el._foo.setOptions(value);
  }
});
```

Now, add `w-foo` to HTML, it will run the `mounted()` hook:

```ts
const ele = document.querySelector('...');

ele.setAttribute('w-foo', '{ "options": ...}');
```

-----

The `binding` interface:

```ts
export interface WebDirectiveBinding<El extends Element = HTMLElement, Modifiers extends Record<string, boolean> = Record<string, boolean>> {
  directive: string;
  name: string;
  node: El;
  value: any;
  oldValue: any;
  mutation?: MutationRecord;
  handler: WebDirectiveHandler<El, Modifiers>;
  arg: string | null;
  modifiers: Modifiers;
  instance: WebDirective;
}
```

Use JSON as value

```ts
wd.register('foo', {
  mounted(el, { value }) {
    const options = JSON.parse(value || '{}');
  },
});
```

### Singleton Your Object

WebDirective provides a static method to get singleton instance.

```ts
import { singleton } from 'web-directive';

wd.register('foo', {
  mounted(el, { value }) {
    // Get or create singleton instance
    singleton(el, 'foo', () => new Foo(value));
  },

  updated(el, { value }) {
    // Get singleton instance and update it
    singleton(el, 'foo')?.setOptions(value);
  },

  unmounted(el, binding) {
    // Remove singleton instance and clean up
    const foo = singleton(el, 'foo', false);

    foo?.stop();
  },
});
```

### Listener Helper

WebDirective provides a `useEventListener()` helper to help you listen to events and auto unbind them when element
unmounted.

```ts
import { useEventListener } from 'web-directive';

wd.register('foo', {
  mounted(el, binding) {
    useEventListener(el, 'click', (e) => {
      console.log('Element clicked');
    });
  },
});
```

Note if you use async function as mounted hook, you must all `useEventListener()` before first await.

```ts
wd.register('foo', {
  async mounted(el, binding) {
    // Must all before first await
    useEventListener(el, 'click', (e) => {
      console.log('Element clicked');
    });

    await someAsyncTask();

    // ERROR: Can not find context to bind event
    useEventListener(el, 'click', (e) => {
      console.log('Element clicked');
    });
  },
});
```

## Listen to Child Elements

By default, unlike Vue.js, WebDirective's `updated` hook only listen to the updates of element itself.
If you want to listen to children elements' changes, you can set the `enableChildrenUpdated` option to `true`.
Different from Vue.js, you must use `childrenUpdated` hook to handle children elements' updates.

```ts
import WebDirective from './index';

const wd = new WebDirective({
  enableChildrenUpdated: true
});

wd.register('foo', {
  mounted(el, { value }) {
    // ...
  },

  updated(el, { value }) {
    // Self element updated, including attributes changed, innterText changed, etc.
  },

  childrenUpdated(el, binding) {
    // Children elements tree updated.
  },
});
```

## Argument and Modifiers

WebDirective supports argument and modifiers like Vue.js. However, due to native HTML not supports query elements by
dynamic attribute names, this function must traverse elements to find attributes, which is not very efficient, so it is
disabled by default, you must manually enable it.

```ts
import WebDirective from './index';

const wd = new WebDirective({
  enableAttrParams: true
});

wd.listen();
```

Now you can add directive like this:

```html

<button w-foo:hello.bar.baz="value">
  ...
</button>
```

And you can access the argument and modifiers in the binding object:

```ts
wd.register('foo', {
  mounted(el, binding) {
    console.log(binding.directive); // Full directive name: 'x-foo:hello.bar.baz'
    console.log(binding.name); // Directive short name: 'x-foo'
    console.log(binding.arg); // 'hello'
    console.log(binding.modifiers); // { bar: true, baz: true }
  },
});
```

### Add Multiple Directives

When enable argument and modifiers, you can add multiple directives to one element:

```html

<button w-foo:arg1.mod1.mod2="value1" w-bar:arg2.mod3="value2">
  ...
</button>
```

### Modifiers Cases

All modifiers are boolean values, if a modifier exists, its value is `true`, otherwise wll not exists.
Since HTML attributes not supports `camelCase`, all modifier must write as `kebab-case`, and will auto
convert to camelCase after parsed.

```html

<button w-foo:mod-one.mod-two>
  ...
</button>
```

```ts
wd.register('foo', {
  mounted(el, binding) {
    console.log(binding.modifiers.modOne); // true
    console.log(binding.modifiers.modTwo); // true
  },
});
```

> [!important]
> Native HTML do not support to change argument and modifiers dynamically, if you change them,
> it will be same as removed the old attribute and re-add a new attribute, so the `unmounted` and `mounted` hooks will
> be called.

## Lifecycle

All hooks list below:

- `mounted(el, binding)`: Called when the directive is first bound to the element. This is where you can set up any
  initial state or event listeners.
- `unmounted(el, binding)`: Called when the directive is unbound from the element. This is where you can clean up any
  resources or event listeners.
- `updated(el, binding)`: Called when the value of the directive changes. This is where you can respond to changes in
  the directive's value.
- `childrenUpdated(el, binding)`: Called when the children elements of the element are updated. This hook is only
  available when `enableChildrenUpdated` option is set to `true`.

> [!note]
> Unlike Vue.js, all hooks will be called after mutation occurs, at this time, the DOM is already updated.
> So WebDirective do not provide `beforeMount`, `beforeUpdate` and `beforeUnmount` hooks.

### Updated Timing

WebDirective uses MutationObserver to listen to DOM changes, so the `updated` hook will be called after the mutation
occurs.
If you want to get the result after directive updated, you must wait next event loop.

```ts
let updated = 0;

wd.register('foo', {
  mounted(el, binding) {
    // ...
  },
  updated() {
    updated++;
  }
});

// Let's update directive value
element.setAttribute('w-foo', '1');

console.log(updated); // Still 0, mutation will triggered after next loop

await Promise.resolve().then();

console.log(updated); // 1
```

WebDirective provides a static method `nextTick()` to wait for next update cycle.

```ts
import { nextTick } from 'web-directive';

element.setAttribute('w-foo', '1');

await nextTick();

console.log(updated); // 1
```

### Events

WebDirective can emit custom events when directives are mounted, unmounted, or updated.

By default, the event names are prefixed with `wd:`. You can listen to these events on the element:

- `wd:mounted`
- `wd:unmounted`
- `wd:updated`
- `wd:children-updated`

```ts
el.addEventListener('wd:mounted', (e) => {
  const binding = e.detail as WebDirectiveBinding;
  console.log(`Directive ${binding.directive} mounted`);
});
```

If you want to change the event prefix, you can set the `eventPrefix` option when creating WebDirective instance.

```ts
const wd = new WebDirective({
  eventPrefix: 'flower:'
});
```

## Custom Prefix

You can use custom prefix to avoid conflicts with other libraries.

```ts
const wd = new WebDirective({
  prefix: 'x-'
});
```

## Options

List of all options as table

```ts
export interface WebDirectiveOptions {
  prefix?: string;
  eventPrefix?: string;
  enableAttrParams?: boolean;
  enableChildrenUpdated?: boolean;
}
```

| Option                | Type      | Default | Description                                |
|-----------------------|-----------|---------|--------------------------------------------|
| prefix                | `string`  | `w-`    | The prefix for directive attributes.       |
| enableAttrParams      | `boolean` | `false` | Enable argument and modifiers support.     |
| enableChildrenUpdated | `boolean` | `false` | Enable children elements update listening. |
| eventPrefix           | `string`  | `wd:`   | The prefix for custom events emitted.      |
