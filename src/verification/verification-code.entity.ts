import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from "class-transformer";

@Entity()
export class VerificationCode{
  @PrimaryGeneratedColumn()
  @Exclude()
  id: number;

  @Column({
    name: "code",
    length: 64
  })
  code: string

  @Column()
  @Exclude()
  identifierType: "ethereumAddress" | "username"

  @Column()
  @Exclude()
  identifier: string;

  @Column({default: false})
  @Exclude()
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
