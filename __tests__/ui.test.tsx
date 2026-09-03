import { render, screen, fireEvent } from '@testing-library/react-native';
import { Pill, Stepper } from '../src/components/ui';

// render() is asynchronous in this version of the library — await it before touching `screen`.
describe('ui bits render under jest-expo', () => {
  it('a pill shows its label and count and reports selection', async () => {
    await render(<Pill label="Costco" count={9} on onPress={() => {}} />);
    expect(screen.getByText('Costco')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
    expect(screen.getByRole('button', { selected: true })).toBeTruthy();
  });
  it('the stepper clamps at its floor and steps up', async () => {
    const onChange = jest.fn();
    await render(<Stepper value={1} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('fewer')); expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.press(screen.getByLabelText('more')); expect(onChange).toHaveBeenLastCalledWith(2);
  });
});
