import { Socket } from 'socket.io';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
  };
}
