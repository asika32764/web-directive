# Web Directive

A library to implement directive functions for native HTML without any framework, 
which is inspired by Vue.js.

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
  * [Installation](#installation)
    * [Getting Started](#getting-started)
    * [Register Directives](#register-directives)
  * [Custom Prefix](#custom-prefix)
<!-- TOC -->

## Installation

```shell
npm i web-directive

# OR

yarn add web-directive
```

### Getting Started

ES Module

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
  wd.listen();
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

```ts
wd.register('foo', {
  // Reguired
  // When element attach to DOM or attribute attach to element
  mounted(el, bindings) {
    // Do any thing you want
    const { value } = bindings;
    
    el._foo = new Foo(value);
  },
  
  // Optional
  // When element detach from DOM or attribute dettach from element
  unmounted(el, bindings) {
    el._foo.stop();
    delete el._foo;
  },
  
  // Optional
  // When values changed
  updated(el, bindings) {
    const { value } = bindings;
    el._foo.setOptions(value);
  }
});
```

The `bindings` interface:

```ts
interface WebDirectiveBinding<T extends Element = HTMLElement> {
  directive: string;
  node: T;
  value: any;
  oldValue: any;
  mutation?: MutationRecord;
  dir: WebDirectiveHandler<T>;
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

## Custom Prefix

```ts
const wd = new WebDirective({
  prefix: 'x-'
});
```

## Todo

- Support modifier and arguments like: `w-foo.bar:yoo`
