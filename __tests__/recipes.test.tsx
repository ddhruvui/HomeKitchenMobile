import { render, screen, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api } from '../src/lib/api';
import { blankDraft, draftFrom, draftToBody, filterRecipes, tagCounts, tagsOf } from '../src/lib/recipes';
import RecipesScreen from '../app/(tabs)/recipes';
import type { Recipe } from '../src/lib/types';

const book: Recipe[] = [
  { id: 'r1', title: 'Pav Bhaji', ingredients: [{ ingredientId: 'i1', qty: 2, unit: 'cup', note: 'mashed' }], morningSteps: [], steps: ['Boil.'], tags: ['street food'] },
  { id: 'r2', title: 'Tomato Soup', ingredients: [], morningSteps: [], steps: [], tags: ['Soup', 'quick'] },
  { id: 'r3', title: 'Dal Shorba', ingredients: [], morningSteps: [], steps: [], tags: ['soup'] },
];

describe('the recipe list', () => {
  it('collects tags once each, ignoring case', () => { expect(tagsOf(book)).toEqual(['quick', 'soup', 'street food']); });
  it('counts the recipes under each tag, once per recipe whatever the case', () => {
    expect(tagCounts([...book, { id: 'r4', title: 'Rasam', ingredients: [], morningSteps: [], steps: [], tags: ['Soup', 'soup'] }])).toEqual({ 'street food': 1, soup: 3, quick: 1 });
  });
  it('filters by tag and by title together', () => {
    expect(filterRecipes(book, '', 'soup').map((r) => r.id)).toEqual(['r2', 'r3']);
    expect(filterRecipes(book, 'dal', 'soup').map((r) => r.id)).toEqual(['r3']);
    expect(filterRecipes(book, '', null)).toHaveLength(3);
  });
});

describe('the editor draft', () => {
  it('round-trips a recipe and splits tags only on save', () => {
    const d = draftFrom(book[0]);
    expect(d.tagsText).toBe('street food'); expect(d.morningSteps).toEqual(['']);
    expect(draftToBody({ ...d, tagsText: 'street food, quick,' })).toEqual({ title: 'Pav Bhaji', tags: ['street food', 'quick'], morningSteps: [], steps: ['Boil.'], sources: [], ingredients: [{ ingredientId: 'i1', qty: 2, unit: 'cup', note: 'mashed' }] });
  });
  it('drops blank steps and unchosen lines, and reads a comma decimal', () => {
    const body = draftToBody({ ...blankDraft(), title: ' Poha ', lines: [{ ingredientId: 'i2', qty: '1,5', unit: '', note: ' ' }, { ingredientId: '', qty: '', unit: '', note: '' }] });
    expect(body).toEqual({ title: 'Poha', tags: [], morningSteps: [], steps: [], sources: [], ingredients: [{ ingredientId: 'i2', qty: 1.5 }] });
    expect(draftToBody({ ...blankDraft(), title: 'Poha', sources: [' https://example.com/poha ', '', "Mom's notebook"] }).sources).toEqual(['https://example.com/poha', "Mom's notebook"]);
    expect(draftFrom({ id: 'r9', title: 'Old', ingredients: [], morningSteps: [], steps: [], tags: [] }).sources).toEqual([]);
  });
});

describe('the Recipes tab', () => {
  beforeEach(() => { jest.spyOn(api.recipes, 'list').mockResolvedValue(book); });
  afterEach(() => jest.restoreAllMocks());
  const wrap = () => render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RecipesScreen /></QueryClientProvider>
    </SafeAreaProvider>);

  it('a tag pill narrows the list and a second tap clears it', async () => {
    await wrap();
    const soup = await screen.findByRole('button', { name: 'soup 2' });
    expect(screen.getByRole('button', { name: 'quick 1' })).toBeTruthy();
    await fireEvent.press(soup);
    expect(screen.getByText('Tomato Soup')).toBeTruthy(); expect(screen.getByText('Dal Shorba')).toBeTruthy();
    expect(screen.queryByText('Pav Bhaji')).toBeNull();
    await fireEvent.press(soup);
    expect(screen.getByText('Pav Bhaji')).toBeTruthy();
  });
});
