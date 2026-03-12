import { CurrentUserData } from './current-user.type';

export interface JwtPayload extends CurrentUserData {
  sub: string;
}
