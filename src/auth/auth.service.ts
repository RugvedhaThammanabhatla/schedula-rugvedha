import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { User } from './user.entity';

@Injectable()
export class AuthService {

  private readonly logger =
    new Logger(AuthService.name);

  constructor(

    @InjectRepository(User)
    private userRepository:
      Repository<User>,

    private jwtService:
      JwtService,

  ) {}



  async signup(

    email: string,
    password: string,
    role: string,

  ) {

    this.logger.log(
      `Signup attempt : ${email}`,
    );


    const existingUser =
      await this.userRepository.findOne({

        where: {
          email,
        },

      });


    if (existingUser) {

      throw new ConflictException(

        'Email already registered',

      );

    }


    const hashedPassword =
      await bcrypt.hash(

        password,

        10,

      );



    const user =
      this.userRepository.create({

        email,

        password:
          hashedPassword,

        role,

      });



    await this.userRepository.save(

      user,

    );


    return {

      message:
        'User registered successfully',

      user: {

        id:
          user.id,

        email:
          user.email,

        role:
          user.role,

      },

    };

  }



  async login(

    email: string,

    password: string,

  ) {


    const user =
      await this.userRepository.findOne({

        where: {
          email,
        },

      });



    if (!user) {

      throw new UnauthorizedException(

        'Invalid credentials',

      );

    }



    const validPassword =
      await bcrypt.compare(

        password,

        user.password,

      );



    if (!validPassword) {

      throw new UnauthorizedException(

        'Invalid credentials',

      );

    }



    const payload = {

      sub:
        user.id,

      email:
        user.email,

      role:
        user.role,

    };



    return {

      access_token:

        this.jwtService.sign(

          payload,

        ),

      email:
        user.email,

      role:
        user.role,

    };

  }

}