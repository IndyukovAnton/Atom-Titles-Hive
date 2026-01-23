import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth Strategy - Optional
 * Only initializes if GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are configured.
 * For desktop apps without Google OAuth, this strategy is skipped.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://localhost:3000/auth/google/callback';

    // Only initialize if Google OAuth is configured
    const isConfigured = !!(clientID && clientSecret);

    super(
      isConfigured
        ? {
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'profile'],
          }
        : {
            // Dummy config - strategy won't be used
            clientID: 'not-configured',
            clientSecret: 'not-configured',
            callbackURL: 'http://localhost/not-configured',
            scope: ['email', 'profile'],
          },
    );

    this.isConfigured = isConfigured;

    if (!isConfigured) {
      console.log(
        '[GoogleStrategy] Google OAuth not configured - strategy disabled',
      );
    }
  }

  get enabled(): boolean {
    return this.isConfigured;
  }

  validate(
    accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      name?: { givenName?: string; familyName?: string };
      emails?: Array<{ value?: string }>;
      photos?: Array<{ value?: string }>;
    },
    done: VerifyCallback,
  ): void {
    const { name, emails, photos, id } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
      accessToken,
    };
    done(null, user);
  }
}
