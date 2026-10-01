import { api } from '../src/lib/api';
const mockFetch = (status: number, body: unknown) => { (globalThis as { fetch: unknown }).fetch = jest.fn(async () => ({ ok: status < 400, status, json: async () => body })); };
describe('api client on the phone', () => {
  it('reads the base URL from EXPO_PUBLIC_API_URL and returns JSON', async () => {
    mockFetch(200, { ok: true, db: 'HomeKitchenTest' });
    await api.settings.get();
    expect((globalThis.fetch as jest.Mock).mock.calls[0][0]).toMatch(/^http:\/\/localhost:3000\/api\/settings$/);
  });
  it('a week with no list is null', async () => { mockFetch(404, { error: 'not found' }); expect(await api.lists.forWeek('2026-09-05')).toBeNull(); });
  it('check sends PATCH with the flag', async () => {
    mockFetch(200, { id: 'l', items: [] }); await api.lists.check('l', 'oni', true);
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('PATCH'); expect(JSON.parse(init.body)).toEqual({ checked: true });
  });
});
describe('asking about a dish', () => {
  it('posts the whole thread to /api/ai/chat', async () => {
    mockFetch(200, { reply: 'Potatoes.', model: 'm' });
    expect(await api.ai.chat([{ role: 'user', text: 'What do I need?' }])).toEqual({ reply: 'Potatoes.', model: 'm' });
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toMatch(/\/api\/ai\/chat$/); expect(JSON.parse(init.body)).toEqual({ messages: [{ role: 'user', text: 'What do I need?' }] });
  });
});
