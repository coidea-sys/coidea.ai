import { render, screen, fireEvent } from '@testing-library/react';
import { RegistrationForm } from './RegistrationForm';

const mockRegister = jest.fn();

jest.mock('../hooks/useHuman', () => ({
  useHuman: () => ({
    register: mockRegister,
    isLoading: false,
    error: null,
    REGISTRATION_FEE: BigInt(1000000000000000),
  }),
}));

describe('RegistrationForm', () => {
  beforeEach(() => {
    mockRegister.mockClear();
  });

  it('should render form', () => {
    render(<RegistrationForm />);
    expect(screen.getByText('注册 Human 账户')).toBeInTheDocument();
  });

  it('should have username input', () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText('用户名 *')).toBeInTheDocument();
  });

  it('should show registration fee', () => {
    render(<RegistrationForm />);
    expect(screen.getByText(/注册费用:/)).toBeInTheDocument();
  });

  it('should have submit button', () => {
    render(<RegistrationForm />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
