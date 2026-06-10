import 'global-jsdom/register';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from '../src/App';
import { useStore } from '../src/store/store';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const { act } = await import('react-dom/test-utils');

const el = document.createElement('div');
document.body.appendChild(el);
const root = createRoot(el);
const body = () => document.body.textContent || '';
const clickEl = async (label: string) => {
  const all = [...document.querySelectorAll<HTMLElement>('button,div,span')];
  const b = all.reverse().find((x) => (x.textContent || '').trim() === label);
  if (!b) throw new Error('element not found: ' + label);
  await act(async () => { b.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};
const typeInto = async (placeholder: string, value: string) => {
  const inp = [...document.querySelectorAll<HTMLInputElement>('input')].find((i) => i.placeholder.includes(placeholder));
  if (!inp) throw new Error('input not found: ' + placeholder);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setter.call(inp, value);
    inp.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
};

await act(async () => { root.render(createElement(App)); });

// 1. onboarding: 5 intro steps, name the home
console.log('1 onboarding shown:', body().includes('Meet Kun Troll') ? 'OK' : 'FAIL');
await clickEl('Get started');
await clickEl('Continue'); // value props
await clickEl('Continue'); // permissions
await typeInto('The Loft', 'Casa PM');
await clickEl('Continue');
console.log('2 final step personalised:', body().includes('welcome to Casa PM') ? 'OK' : 'FAIL');
await clickEl('Add my first device');
console.log('3 onboarding done + AddDevice opened:', body().includes('Scanning your network') ? 'OK' : 'FAIL');
console.log('4 homeName persisted:', useStore.getState().homeName === 'Casa PM' ? 'OK' : 'FAIL');

// 2. discovery (simulated pool): wait for scan
await act(async () => { await new Promise((r) => setTimeout(r, 4000)); });
console.log('5 discovery found pool:', body().includes('Samsung TV') && body().includes('Yamaha RX-A870') && body().includes('Hue Bridge') ? 'OK' : 'FAIL');

// 3. add the TV from discovery
await clickEl('Samsung TV');
console.log('6 prefilled name+room step:', body().includes('Name & room') ? 'OK' : 'FAIL');
await clickEl('Add device');
console.log('7 commands step:', body().includes('How should I learn its commands?') ? 'OK' : 'FAIL');
await clickEl('Use the command library');
const st1 = useStore.getState();
console.log('8 TV added + main auto-set:', st1.devices.length === 1 && st1.mainId === st1.devices[0].id && st1.volId === st1.devices[0].id ? 'OK' : 'FAIL', '| protocol:', st1.devices[0].protocol);

// 4. empty home checks: lights empty state, rooms empty state
console.log('9 home shows lights empty state:', body().includes('No lights yet') ? 'OK' : 'FAIL');
console.log('10 greeting:', body().includes('Casa PM · 1 of 1 devices online') ? 'OK' : 'FAIL');

// 5. pair the Hue bridge via Add Device
await clickEl('Settings');
await clickEl('Add a device');
await act(async () => { await new Promise((r) => setTimeout(r, 3000)); });
await clickEl('Hue Bridge');
console.log('11 pairing screen:', body().includes('Press the bridge button') ? 'OK' : 'FAIL');
await clickEl('I pressed it — pair now');
await act(async () => { await new Promise((r) => setTimeout(r, 4500)); });
console.log('12 lights found:', body().includes('Found 3 lights') ? 'OK' : 'FAIL');
await clickEl('Add 3 lights');
const st2 = useStore.getState();
console.log('13 bridge + lights imported:', st2.bridges.length === 1 && st2.devices.filter((d) => d.type === 'light').length === 3 && !!st2.bridges[0].username ? 'OK' : 'FAIL');

// 6. create a room
await clickEl('Rooms');
console.log('14 rooms empty state:', body().includes('No rooms yet') ? 'OK' : 'FAIL');
await clickEl('New room');
await typeInto('Living Room', 'Sala');
// toggle all devices into the room
for (const d of useStore.getState().devices) await clickEl(d.name).catch(() => {});
await clickEl('Create room');
console.log('15 room created:', useStore.getState().rooms.length === 1 && body().includes('Sala') ? 'OK' : 'FAIL');

// 7. build a scene with a value step
await clickEl('Scenes');
console.log('16 scenes empty state:', body().includes('No scenes yet') ? 'OK' : 'FAIL');
await clickEl('New scene');
await typeInto('Scene name', 'Movie Night');
await clickEl('Add step');
await clickEl('Samsung TV'); // adds power_on step
// edit step → set volume 40? change action to volume via step editor
const stepRow = [...document.querySelectorAll<HTMLElement>('div')].find((x) => (x.textContent || '').trim() === 'Samsung TV · Turn on');
await act(async () => { stepRow!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
await clickEl('Set volume');
console.log('17 value control shown:', body().includes('Volume ·') ? 'OK' : 'FAIL');
await clickEl('Done');
await clickEl('Save');
const sc = useStore.getState().scenes[0];
console.log('18 scene saved with value:', sc && sc.name === 'Movie Night' && sc.steps[0].action === 'volume' && typeof sc.steps[0].value === 'number' ? 'OK' : 'FAIL', '| label:', sc?.steps[0]?.label);

// 8. run the scene
await act(async () => { useStore.getState().runScene(sc.id); });
await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
const tv = useStore.getState().devices.find((d) => d.type === 'tv')!;
console.log('19 scene fired → controller + volume applied:', useStore.getState().tab === 'controller' && tv.state.volume === sc.steps[0].value ? 'OK' : 'FAIL');
console.log('20 activity logged:', useStore.getState().activity[0].title === 'Movie Night' ? 'OK' : 'FAIL');

// 9. erase all
window.confirm = () => true;
await act(async () => { useStore.getState().eraseAll(); });
await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
const st3 = useStore.getState();
console.log('21 erase → bare + onboarding:', st3.devices.length === 0 && st3.scenes.length === 0 && !st3.seenOnboarding && body().includes('Meet Kun Troll') ? 'OK' : 'FAIL');
console.log('22 storage key v2:', localStorage.getItem('kuntroll.v1') === null ? 'OK' : 'FAIL');
process.exit(0);
