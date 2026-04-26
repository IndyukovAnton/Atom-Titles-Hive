import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth Strategy — optional.
 * Enabled only when GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL are all set.
 * Partial configuration (e.g. id without secret) throws at bootstrap to surface misconfiguration.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger(GoogleStrategy.name);
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    const provided = [clientID, clientSecret, callbackURL].filter(Boolean).length;
    const isConfigured = provided === 3;
    const isPartial = provided > 0 && provided < 3;

    if (isPartial) {
      throw new Error(
        'Google OAuth is partially configured. Set all of GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL — or none of them.',
      );
    }

    super(
      isConfigured
        ? {
            clientID: clientID!,
            clientSecret: clientSecret!,
            callbackURL: callbackURL!,
            scope: ['email', 'profile'],
          }
        : {
            clientID: 'disabled',
            clientSecret: 'disabled',
            callbackURL: 'disabled',
            scope: ['email', 'profile'],
          },
    );

    this.isConfigured = isConfigured;

    if (!isConfigured) {
      GoogleStrategy.logger.log('Google OAuth not configured — strategy disabled');
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
