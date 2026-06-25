import { JwtPayload } from './jwt-payload.interface';

export interface RefreshTokenPayload extends JwtPayload {
  tokenId: number;
  type: 'refresh';
}
