import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsDate, IsEmail, Length } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { EthereumAddress } from "../utils/EthereumAddress";

@Entity()
export class User {

  @Column({
    type: 'varchar',
    length: '42',
    unique: true,
  })
  ethereumAddress: EthereumAddress

  @PrimaryGeneratedColumn('uuid')
  readonly uuid: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  @Length(3, 20)
  username?: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: '60',
    nullable: true,
  })
  @Exclude()
  private _password?: string;

  @Column({ nullable: true })
  @IsEmail()
  @Length(5, 255)
  email?: string;

  @Column({ default: false })
  verified?: boolean;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  @IsDate()
  dateOfBirth?: Date;

  @Column({ nullable: true })
  phone?: string;

  set password(password) {
    if (password){
      this._password = bcrypt.hashSync(password, 2);
    } else {
      this._password = null;
    }
  }

  get password() {
    return this._password;
  }

  async comparePassword(password) {
    if (this.password){
      return await bcrypt.compare(password, this.password)
    }
    return false;
  }
}
