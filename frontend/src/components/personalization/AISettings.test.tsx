import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { AISettings } from './AISettings';

const getCliStatus = vi.fn();
const getCodexCliStatus = vi.fn();

vi.mock('@/api/recommendations', () => ({
  recommendationsApi: {
    getCliStatus: (...args: unknown[]) => getCliStatus(...args),
    getCodexCliStatus: (...args: unknown[]) => getCodexCliStatus(...args),
  },
}));

describe('AISettings', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getCliStatus.mockResolvedValue({
      installed: true,
      authed: true,
      version: '1.0.0',
      path: 'claude',
    });
    getCodexCliStatus.mockResolvedValue({
      installed: true,
      authed: true,
      version: '0.50.0',
      path: 'codex',
    });
  });

  it('renders three source cards', () => {
    render(<AISettings preferences={{}} onChange={onChange} />);

    expect(screen.getByText('Claude (Cloud API)')).toBeInTheDocument();
    expect(screen.getByText('Claude (Local CLI)')).toBeInTheDocument();
    expect(screen.getByText('Codex (Local CLI)')).toBeInTheDocument();
  });

  it('selecting Codex shows CodexCliSection and probes status', async () => {
    const user = userEvent.setup();
    render(
      <AISettings preferences={{ aiSource: 'claude-api' }} onChange={onChange} />,
    );

    await user.click(screen.getByText('Codex (Local CLI)'));
    expect(onChange).toHaveBeenCalledWith({ aiSource: 'codex-cli' });
  });

  it('loads codex status when source is codex-cli', async () => {
    render(
      <AISettings preferences={{ aiSource: 'codex-cli' }} onChange={onChange} />,
    );

    await waitFor(() => {
      expect(getCodexCliStatus).toHaveBeenCalled();
    });
    expect(getCliStatus).not.toHaveBeenCalled();

    expect(
      await screen.findByText(/Codex CLI готов/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Путь к бинарю/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Модель/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Разрешать WebSearch/i)).toBeInTheDocument();
  });

  it('updates codexCliPath and codexModel via onChange', async () => {
    const user = userEvent.setup();
    render(
      <AISettings preferences={{ aiSource: 'codex-cli' }} onChange={onChange} />,
    );

    await screen.findByText(/Codex CLI готов/i);

    await user.type(screen.getByPlaceholderText('codex'), 'C:\\codex.cmd');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ codexCliPath: expect.any(String) }),
    );

    await user.type(screen.getByPlaceholderText('gpt-5.4'), 'gpt-5.4-mini');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ codexModel: expect.any(String) }),
    );
  });
});
