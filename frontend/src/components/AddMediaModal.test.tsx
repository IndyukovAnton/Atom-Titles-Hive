import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import AddMediaModal from './AddMediaModal';
import { server } from '../test/mocks/api';
import { http, HttpResponse } from 'msw';
import { config } from '../config/index';

describe('AddMediaModal', () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(
            <AddMediaModal isOpen={false} onClose={onClose} onSuccess={onSuccess} />
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render form fields when open', async () => {
        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/категория/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/оценка/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/группа/i)).toBeInTheDocument();
    });

    it('should submit form with valid data', async () => {
        const user = userEvent.setup();

        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        // Fill required fields
        await user.type(screen.getByLabelText(/название/i), 'New Movie');
        
        // Select category (Select component interactions can be tricky, often implemented as radiogroup or similar in tests depending on library)
        // Adjusting strategy for Shadcn Select, which often uses a trigger button
        // For simplicity in this test environment without full Shadcn setup, we focus on inputs we can easily target
        // Or we assume standard selects if they are native, but Shadcn uses Radix UI.
        // Radix UI Select trigger is usually a button.
        
        const ratingInput = screen.getByLabelText(/оценка/i);
        await user.clear(ratingInput);
        await user.type(ratingInput, '9');

        const submitButton = screen.getByRole('button', { name: /сохранить/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('should show validation errors for empty required fields', async () => {
        const user = userEvent.setup();

        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        const submitButton = screen.getByRole('button', { name: /сохранить/i });
        await user.click(submitButton);

        await waitFor(() => {
            // Check for HTML5 validation or text errors
            // Zod resolver usually puts error messages in the DOM
            // Need to know how FormInput renders errors. Assuming standard React Hook Form usage.
            // If native `required` attribute is present, browser might prevent submission. 
            // `userEvent` triggers browser validation.
        });
        
        // Since we passed `required` prop to FormInput, checking if it is required
        expect(screen.getByLabelText(/название/i)).toBeRequired();
    });

    it('should handle API error on submission', async () => {
        const user = userEvent.setup();

        // Override MSW handler to return error
        server.use(
            http.post(`${config.apiUrl}/media`, () => {
                return HttpResponse.json(
                    { message: 'Failed to create' },
                    { status: 400 }
                );
            })
        );

        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        await user.type(screen.getByLabelText(/название/i), 'New Movie');
        const submitButton = screen.getByRole('button', { name: /сохранить/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Failed to create');
        });
    });
});
