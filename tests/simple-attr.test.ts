import WebDirective from '../src';
import { nextTick } from '../src/utilities/timing';

let wd: WebDirective;

describe('Simple Attributes Tests', () => {
  beforeEach(() => {
    if (wd) {
      wd.disconnect();
    }

    wd = new WebDirective();

    // console.log(wd.attachedElements.);

    document.body.innerHTML = `
    <div id="app">
        <div class="main">
            <button id="copy-button" w-copy="Hello">
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
        expect(bindings.directive).toBe('w-copy');
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
        expect(bindings.directive).toBe('w-copy');
        expect(bindings.mutation).toBeUndefined();
        expect(bindings.oldValue).toBeUndefined();
        expect(bindings.value).toBe('Hello');
        expect(el.textContent?.trim()).toBe('Copy');
      }
    });
  });

  it('Add element with attribute / value changed / removed', async () => {
    expect.hasAssertions();

    wd.listen();

    wd.register('foo', {
      mounted: (el, bindings) => {
        expect(el.nodeName).toBe('DIV');
        expect(el.classList.value).toBe('foo');
        expect(bindings.value).toBe('FOOOOOO');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.querySelector('span')!.textContent).toBe('BARRRR');
      },
      updated: (el, bindings) => {
        expect(bindings.value).toBe('FOOOOOO2');
        expect(bindings.mutation).not.toBeUndefined();
        expect(bindings.oldValue).toBe('FOOOOOO');
        expect(el.getAttribute('w-foo')).toBe('FOOOOOO2');
      },
      unmounted: (el, bindings) => {
        expect(el.nodeName).toBe('DIV');
        expect(el.classList.value).toBe('foo');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBeNull();
      }
    });

    document.querySelector('.container')!.innerHTML = '<div class="foo" w-foo="FOOOOOO"> <span class="bar">BARRRR</span> </div>';

    await nextTick();

    document.querySelector('[w-foo]')!.setAttribute('w-foo', 'FOOOOOO2');

    await nextTick();

    document.querySelector('[w-foo]')!.removeAttribute('w-foo');

    await nextTick();
  });

  it('Add element with attribute in children / value changed / removed', async () => {
    expect.hasAssertions();

    wd.listen();

    wd.register('foo', {
      mounted: (el, bindings) => {
        expect(el.nodeName).toBe('SPAN');
        expect(el.classList.value).toBe('bar');
        expect(bindings.value).toBe('FOOOOOO');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el!.textContent).toBe('BARRRR');
      },
      updated: (el, bindings) => {
        expect(el.nodeName).toBe('SPAN');
        expect(bindings.value).toBe('FOOOOOO2');
        expect(bindings.oldValue).toBe('FOOOOOO');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBe('FOOOOOO2');
      },
      unmounted: (el, bindings) => {
        expect(el.nodeName).toBe('SPAN');
        expect(el.classList.value).toBe('bar');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBeNull();
      },
    });

    document.querySelector('.container')!.innerHTML = '<div class="foo"> <span w-foo="FOOOOOO" class="bar">BARRRR</span> </div>';

    await nextTick();

    document.querySelector('[w-foo]')!.setAttribute('w-foo', 'FOOOOOO2');

    await nextTick();

    document.querySelector('[w-foo]')!.removeAttribute('w-foo');
  });

  it('Add attribute to root element / value changed / children changed / removed', async () => {
    expect.hasAssertions();

    wd.options.enableChildrenUpdated = true;
    wd.listen();

    const hooks = {
      mounted: 0,
      updated: 0,
      unmounted: 0,
      childrenUpdated: 0
    };

    wd.register('foo', {
      mounted: (el, bindings) => {
        expect(el.nodeName).toBe('BODY');
        expect(bindings.value).toBe('FOOOOOO');
        expect(bindings.mutation).not.toBeUndefined();

        hooks.mounted++;
      },
      updated: (el, bindings) => {
        expect(el.nodeName).toBe('BODY');
        expect(bindings.value).toBe('FOOOOOO2');
        expect(bindings.oldValue).toBe('FOOOOOO');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBe('FOOOOOO2');

        hooks.updated++;
      },
      unmounted: (el, bindings) => {
        expect(el.nodeName).toBe('BODY');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBeNull();

        hooks.unmounted++;
      },
      childrenUpdated: (el, bindings) => {
        expect(el.nodeName).toBe('BODY');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBe('FOOOOOO2');
        expect(el.querySelector('.container')).toBeNull();

        hooks.childrenUpdated++;
      }
    });

    // Test add attr
    document.body.setAttribute('w-foo', 'FOOOOOO');

    await nextTick();

    // Test update attr
    document.body.setAttribute('w-foo', 'FOOOOOO2');

    await nextTick();

    // Test children update
    document.body.querySelector('.container')!.remove();

    await nextTick();

    // Test remove attr
    document.body.removeAttribute('w-foo');

    await nextTick();

    expect(hooks.mounted).toBe(1);
    expect(hooks.updated).toBe(2);
    expect(hooks.unmounted).toBe(1);
    expect(hooks.childrenUpdated).toBe(1);
  });

  it('Add attribute to child element / value changed / children changed / removed', async () => {
    expect.hasAssertions();

    wd.options.enableChildrenUpdated = true;
    wd.listen();

    const hooks = {
      mounted: 0,
      updated: 0,
      unmounted: 0,
      childrenUpdated: 0
    };

    wd.register('foo', {
      mounted: (el, bindings) => {
        expect(el.nodeName).toBe('DIV');
        expect(bindings.value).toBe('FOOOOOO');
        expect(bindings.mutation).not.toBeUndefined();

        hooks.mounted++;
      },
      updated: (el, bindings) => {
        expect(el.nodeName).toBe('DIV');
        expect(bindings.value).toBe('FOOOOOO2');
        expect(bindings.oldValue).toBe('FOOOOOO');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBe('FOOOOOO2');

        hooks.updated++;
      },
      unmounted: (el, bindings) => {
        expect(el.nodeName).toBe('DIV');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBeNull();

        hooks.unmounted++;
      },
      childrenUpdated: (el, bindings) => {
        expect(el.nodeName).toBe('DIV');
        expect(bindings.mutation).not.toBeUndefined();
        expect(el.getAttribute('w-foo')).toBe('FOOOOOO2');
        expect(el.querySelector('.container')).toBeNull();

        hooks.childrenUpdated++;
      }
    });

    // Test add attr
    const app = document.querySelector<HTMLDivElement>('#app')!;

    app.setAttribute('w-foo', 'FOOOOOO');

    await nextTick();

    // Test update attr
    app.setAttribute('w-foo', 'FOOOOOO2');

    await nextTick();

    // Test children update
    app.querySelector('.container')!.remove();

    await nextTick();

    // Test remove attr
    app.removeAttribute('w-foo');

    await nextTick();

    expect(hooks.mounted).toBe(1);
    expect(hooks.updated).toBe(2);
    expect(hooks.unmounted).toBe(1);
    expect(hooks.childrenUpdated).toBe(1);
  });

  it('Add attribute to child element / no children changed', async () => {
    wd.listen();

    const hooks = {
      mounted: 0,
      updated: 0,
      unmounted: 0,
      childrenUpdated: 0
    };

    wd.register('foo', {
      mounted: (el, bindings) => {
        hooks.mounted++;
      },
      updated: (el, bindings) => {
        hooks.updated++;
      },
      unmounted: (el, bindings) => {
        hooks.unmounted++;
      },
      childrenUpdated: (el, bindings) => {
        hooks.childrenUpdated++;
      }
    });

    // Test add attr
    const app = document.querySelector<HTMLDivElement>('#app')!;

    app.setAttribute('w-foo', 'FOOOOOO');

    await nextTick();

    // Test children update
    app.querySelector('.container')!.remove();

    await nextTick();

    expect(hooks.mounted).toBe(1);
    expect(hooks.childrenUpdated).toBe(0);
  });

  it('Attributes value changed', () => {
    expect.hasAssertions();
    wd.listen();

    wd.register('copy', {
      mounted: (node: Element, { value }) => {

      },
      updated: (node, { value }) => {
        expect(value).toBe('Hello2');
      }
    });

    document.querySelector('#copy-button')!.setAttribute('w-copy', 'Hello2');
  });
});
