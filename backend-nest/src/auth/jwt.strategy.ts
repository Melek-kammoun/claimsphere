import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwkToPem from 'jwk-to-pem';

const jwk = {
  kty: 'EC' as const,
  crv: 'P-256' as const,
  x: 'cvZKc1v0bP8HewmnsWIscU4NwpODNQRGNCill7snUmQ',
  y: 'nEUOcrWhYVqzVOO6_sef0MbySUAunjJQC5q-9G8PbeI',
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwkToPem(jwk),
      algorithms: ['ES256'],
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
