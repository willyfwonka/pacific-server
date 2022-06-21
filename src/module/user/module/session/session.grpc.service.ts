import { GrpcMethod, Payload } from '@nestjs/microservices';
import { CurrentSession } from '../../../shared/decorator/param/current-session';
import {
  from,
  map,
  mergeAll,
  Observable,
  pluck,
  Subject,
  switchMap,
} from 'rxjs';
import { User } from '../../model/user';
import { Session } from './model/session';
import { UnauthenticatedException } from '../../../shared/exception/grpc/unauthenticated-exception';
import { GrpcService } from '../../../shared/decorator/class/grpc-service';

@GrpcService()
export class SessionService {
  @GrpcMethod() // Server streaming
  list(
    @CurrentSession(['user.sessions']) currentUser: Observable<User>,
  ): Observable<Session> {
    const subject = new Subject<Session>();

    currentUser.pipe(pluck('user', 'sessions'), mergeAll()).subscribe({
      next: (chunk: Session) => {
        subject.next(chunk);
      },
      complete: () => subject.complete(),
      error: () => subject.complete(),
    });

    return subject.asObservable();
    // Or can be done as -> return user.pipe(pluck('sessions'), mergeAll());
  }

  @GrpcMethod()
  delete(
    @Payload('token') token: string,
    @CurrentSession() currentSession: Observable<Session>,
  ): Observable<Session> {
    if (null == token) {
      throw new UnauthenticatedException();
    }

    return currentSession.pipe(
      switchMap((session) => {
        if (session.id === token) {
          throw new UnauthenticatedException('Cannot destroy current session');
        }

        return from(Session.findOneOrThrow({ where: { id: token } })).pipe(
          map((session) => {
            session.remove({ transaction: false });
            return session;
          }),
        );
      }),
    );
  }
}