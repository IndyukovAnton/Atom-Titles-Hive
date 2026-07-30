import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  const basePayload = { username: 'validuser', password: 'password123' };

  it('should accept payload without email', async () => {
    const dto = plainToInstance(RegisterDto, basePayload);

    expect(await validate(dto)).toHaveLength(0);
  });

  it('should normalize empty string email to undefined', async () => {
    const dto = plainToInstance(RegisterDto, { ...basePayload, email: '' });

    expect(dto.email).toBeUndefined();
    expect(await validate(dto)).toHaveLength(0);
  });

  it('should accept a valid email', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...basePayload,
      email: 'user@example.com',
    });

    expect(dto.email).toBe('user@example.com');
    expect(await validate(dto)).toHaveLength(0);
  });

  it('should reject an invalid email', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...basePayload,
      email: 'not-an-email',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });
});
