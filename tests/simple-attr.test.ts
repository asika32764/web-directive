import WebDirective from '../src';
import { nextTick } from '../src/utilities/timing';

let wd: WebDirective;

describe('Simple Attributes Tests', () => {
  beforeEach(() => {
    if (wd) {
      wd.disconnect();
    }

    wd = new WebDirective();

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
      }
    });

    document.querySelector('.container')!.innerHTML = '<div class="foo"> <span w-foo="FOOOOOO" class="bar">BARRRR</span> </div>';

    await nextTick();

    document.querySelector('[w-foo]')!.setAttribute('w-foo', 'FOOOOOO2');

    await nextTick();

    document.querySelector('[w-foo]')!.removeAttribute('w-foo');
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
