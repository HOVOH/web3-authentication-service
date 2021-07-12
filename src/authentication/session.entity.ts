import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import * as moment from 'moment';
import { Exclude, Expose } from 'class-transformer';
import { serialize } from '@hovoh/nestjs-api-lib';
import { ApplicationError } from '@hovoh/nestjs-application-error';
import { IAccessToken, errors } from '@hovoh/nestjs-authentication-lib';

const EXPOSE_REFRESH_GROUP = 'expose_refresh_group';
const EXPOSE_ACCESS_GROUP = 'expose_access_group';

export interface IRefreshToken {
  refreshSecret: number;
  refreshableUntil: Date;
}

export const SESSION_LENGTH = 30;
export const REFRESH_LENGTH = 1440;

@Entity()
@Exclude()
export class Session implements IAccessToken, IRefreshToken {
  @Expose({ groups: [EXPOSE_ACCESS_GROUP] })
  @PrimaryGeneratedColumn('uuid')
  readonly uuid: string;

  @ManyToOne(() => User)
  user: User;

  @Expose({ groups: [EXPOSE_ACCESS_GROUP] })
  @Column()
  userUuid: string;

  @Expose({ groups: [EXPOSE_ACCESS_GROUP] })
  @Column({
    name: 'startedAt',
    type: 'timestamp with time zone',
  })
  startedAt: Date;

  @Expose({ groups: [EXPOSE_ACCESS_GROUP] })
  @Column({
    type: 'timestamp with time zone',
  })
  validUntil: Date;

  @Expose({ groups: [EXPOSE_REFRESH_GROUP] })
  @Column()
  refreshSecret: number;

  @Expose({ groups: [EXPOSE_REFRESH_GROUP] })
  @Column({
    type: 'timestamp with time zone',
  })
  refreshableUntil: Date;

  anon = false;

  start() {
    this.startedAt = new Date();
    this.validUntil = moment(this.startedAt).add(SESSION_LENGTH, 'm').toDate();
    this.refreshableUntil = moment(this.startedAt).add(REFRESH_LENGTH, 'm').toDate();
  }

  refresh() {
    if (!this.startedAt) {
      throw new Error('Session never started');
    }
    if (!this.refreshable()) {
      throw new ApplicationError(errors.BAD_REFRESH_TOKEN);
    }
    this.validUntil = moment(new Date()).add(SESSION_LENGTH, 'm').toDate();
  }

  refreshable() {
    return moment(this.refreshableUntil).isAfter(new Date());
  }

  refreshToken(): IRefreshToken {
    return serialize(this, { groups: [EXPOSE_REFRESH_GROUP] }) as IRefreshToken;
  }

  accessToken(): IAccessToken {
    return serialize(this, { groups: [EXPOSE_ACCESS_GROUP] }) as IAccessToken;
  }
}
