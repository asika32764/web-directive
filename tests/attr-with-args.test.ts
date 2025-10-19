import WebDirective from '../src';
import { WebDirectiveBinding } from '../src/types';
import { nextTick } from '../src';

let wd: WebDirective;

describe('Simple Attributes Tests', () => {
  beforeEach(() => {
    if (wd) {
      wd.disconnect();
    }

    wd = new WebDirective({
      enableAttrParams: true,
      enableChildrenUpdated: true,
    });

    document.body.innerHTML = `
    <div id="app">
        <div class="main">
            <button id="copy-button" w-copy:foo-bar.sakura.sun-flower="Hello">
                Copy
            </button>

            <div class="container">
            
            </div>
        </div>
    </div>
    `;
  });

  it('Add attributes run at initial', () => {
    expect.hasAssertions();
    wd.register('copy', {
      mounted: (el: Element, bindings) => {
        const value = bindings.value;
        expect(bindings.name).toBe('w-copy');
        expect(bindings.directive).toBe('w-copy:foo-bar.sakura.sun-flower');
        expect(bindings.arg).toBe('foo-bar');
        expect(bindings.modifiers.sakura).toBeTruthy();
        expect(bindings.modifiers.sunFlower).toBeTruthy();
        expect(bindings.mutation).toBeUndefined();
        expect(bindings.oldValue).toBeUndefined();
        expect(value).toBe('Hello');
        expect(el.textContent?.trim()).toBe('Copy');
      }
    })
    wd.listen();
  });

  it('Add attributes run instant after registered', () => {
    expect.hasAssertions();
    wd.listen();

    wd.register('copy', {
      mounted: (el: Element, bindings) => {
        const value = bindings.value;
        expect(bindings.name).toBe('w-copy');
        expect(bindings.directive).toBe('w-copy:foo-bar.sakura.sun-flower');
        expect(bindings.arg).toBe('foo-bar');
        expect(bindings.modifiers.sakura).toBeTruthy();
        expect(bindings.modifiers.sunFlower).toBeTruthy();
        expect(bindings.mutation).toBeUndefined();
        expect(bindings.oldValue).toBeUndefined();
        expect(value).toBe('Hello');
        expect(el.textContent?.trim()).toBe('Copy');
      }
    });
  });

  it('Add element with multiple directives / value changed', async () => {
    expect.hasAssertions();

    wd.listen();
    
    const mounted: Record<string, { el: Element, binding: WebDirectiveBinding<any> }> = {};
    const updated: Record<string, { el: Element, binding: WebDirectiveBinding<any> }> = {};

    wd.register<HTMLElement, { a?: boolean; b?: boolean; c?: boolean; }>('foo', {
      mounted: (el, binding) => {
        expect(binding.modifiers.a === true || binding.modifiers.a === undefined).toBeTruthy();
        expect(binding.modifiers.b).toBeTruthy();
        expect(binding.modifiers.c).toBeUndefined();

        mounted[binding.directive] = { el, binding };
      },
      updated: (el, binding) => {
        updated[binding.directive] = { el, binding };
      }
    });

    document.querySelector('.container')!.innerHTML = '<div class="foo" w-foo:bar.a.b="FOOOOOO"> <span class="bar">BARRRR</span> </div>';

    await nextTick();

    document.querySelector('.foo')!.setAttribute('w-foo:bar.a.b', 'FOOOOOO2');
    document.querySelector('.foo')!.setAttribute('w-foo:baz.b', 'FOOOOOO');

    await nextTick();

    expect(mounted['w-foo:bar.a.b'].el.nodeName).toBe('DIV');
    expect(mounted['w-foo:bar.a.b'].el.classList.value).toBe('foo');
    expect(mounted['w-foo:bar.a.b'].binding.arg).toBe('bar');
    expect(mounted['w-foo:bar.a.b'].binding.modifiers.a).toBe(true);
    expect(mounted['w-foo:bar.a.b'].binding.modifiers.b).toBe(true);
    expect(mounted['w-foo:bar.a.b'].binding.value).toBe('FOOOOOO');
    expect(mounted['w-foo:bar.a.b'].binding.mutation).not.toBeUndefined();
    expect(mounted['w-foo:bar.a.b'].el.querySelector('span')!.textContent).toBe('BARRRR');

    expect(mounted['w-foo:baz.b'].el.nodeName).toBe('DIV');
    expect(mounted['w-foo:baz.b'].el.classList.value).toBe('foo');
    expect(mounted['w-foo:baz.b'].binding.arg).toBe('baz');
    expect(mounted['w-foo:baz.b'].binding.modifiers.b).toBe(true);
    expect(mounted['w-foo:baz.b'].binding.value).toBe('FOOOOOO');
    expect(mounted['w-foo:baz.b'].binding.mutation).not.toBeUndefined();
    expect(mounted['w-foo:baz.b'].el.querySelector('span')!.textContent).toBe('BARRRR');

    expect(updated['w-foo:bar.a.b'].el.nodeName).toBe('DIV');
    expect(updated['w-foo:bar.a.b'].el.classList.value).toBe('foo');
    expect(updated['w-foo:bar.a.b'].binding.arg).toBe('bar');
    expect(updated['w-foo:bar.a.b'].binding.modifiers.a).toBe(true);
    expect(updated['w-foo:bar.a.b'].binding.modifiers.b).toBe(true);
    expect(updated['w-foo:bar.a.b'].binding.value).toBe('FOOOOOO2');
    expect(updated['w-foo:bar.a.b'].binding.oldValue).toBe('FOOOOOO');
    expect(updated['w-foo:bar.a.b'].binding.mutation).not.toBeUndefined();
  });

  it('Add element with directive / element removed', async () => {
    expect.hasAssertions();

    wd.listen();

    const mounted: Record<string, { el: Element, binding: WebDirectiveBinding<any> }> = {};
    const unmounted: Record<string, { el: Element, binding: WebDirectiveBinding<any> }> = {};

    wd.register('foo', {
      mounted: (el, binding) => {
        mounted[binding.directive] = { el, binding };
      },
      unmounted: (el, binding) => {
        unmounted[binding.directive] = { el, binding };
      }
    });

    document.querySelector('.container')!.innerHTML = '<div class="foo" w-foo:bar.a.b="FOOOOOO"> <span class="bar">BARRRR</span> </div>';

    await nextTick();

    document.querySelector('.container')!.remove();

    await nextTick();

    expect(mounted['w-foo:bar.a.b'].el.nodeName).toBe('DIV');
    expect(mounted['w-foo:bar.a.b'].el.classList.value).toBe('foo');
    expect(mounted['w-foo:bar.a.b'].binding.arg).toBe('bar');
    expect(mounted['w-foo:bar.a.b'].binding.modifiers.a).toBe(true);
    expect(mounted['w-foo:bar.a.b'].binding.modifiers.b).toBe(true);
    expect(mounted['w-foo:bar.a.b'].binding.value).toBe('FOOOOOO');
    expect(mounted['w-foo:bar.a.b'].binding.mutation).not.toBeUndefined();
    expect(mounted['w-foo:bar.a.b'].el.querySelector('span')!.textContent).toBe('BARRRR');

    expect(unmounted['w-foo:bar.a.b'].el.nodeName).toBe('DIV');
    expect(unmounted['w-foo:bar.a.b'].el.classList.value).toBe('foo');
    expect(unmounted['w-foo:bar.a.b'].binding.arg).toBe('bar');
    expect(unmounted['w-foo:bar.a.b'].binding.modifiers.a).toBe(true);
    expect(unmounted['w-foo:bar.a.b'].binding.modifiers.b).toBe(true);
    expect(unmounted['w-foo:bar.a.b'].binding.value).toBe('FOOOOOO');
    expect(unmounted['w-foo:bar.a.b'].binding.mutation).not.toBeUndefined();
  });

  it('Add attribute with only arg', async () => {
    expect.hasAssertions();

    wd.listen();

    const mounted: Record<string, { el: Element, binding: WebDirectiveBinding<any> }> = {};

    wd.register('foo', {
      mounted: (el, binding) => {
        mounted[binding.directive] = { el, binding };
      },
    });

    document.querySelector('.container')!.setAttribute('w-foo:bar', 'FOOOOOO');

    await nextTick();

    expect(mounted['w-foo:bar'].el.nodeName).toBe('DIV');
    expect(mounted['w-foo:bar'].el.classList.value).toBe('container');
    expect(mounted['w-foo:bar'].binding.arg).toBe('bar');
    expect(Object.keys(mounted['w-foo:bar'].binding.modifiers).length).toBe(0);
    expect(mounted['w-foo:bar'].binding.value).toBe('FOOOOOO');
    expect(mounted['w-foo:bar'].binding.mutation).not.toBeUndefined();
  });

  it('Add attribute with only modifiers', async () => {
    expect.hasAssertions();

    wd.listen();

    const mounted: Record<string, { el: Element, binding: WebDirectiveBinding<any> }> = {};

    wd.register('foo', {
      mounted: (el, binding) => {
        mounted[binding.directive] = { el, binding };
      },
    });

    document.querySelector('.container')!.setAttribute('w-foo.a.b', 'FOOOOOO');

    await nextTick();

    expect(mounted['w-foo:bar'].el.nodeName).toBe('DIV');
    expect(mounted['w-foo:bar'].el.classList.value).toBe('container');
    expect(mounted['w-foo:bar'].binding.arg).toBeUndefined();
    expect(mounted['w-foo:bar'].binding.modifiers.a).toBe(true);
    expect(mounted['w-foo:bar'].binding.modifiers.b).toBe(true);
    expect(mounted['w-foo:bar'].binding.value).toBe('FOOOOOO');
    expect(mounted['w-foo:bar'].binding.mutation).not.toBeUndefined();
  });
});
