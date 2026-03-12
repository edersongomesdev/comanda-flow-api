import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserData } from '../types/current-user.type';

export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserData | undefined, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: CurrentUserData }>();
    const user = request.user;

    if (!field) {
      return user;
    }

    return user?.[field];
  },
);
