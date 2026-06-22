import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
imports:[

TypeOrmModule.forFeature([User]),

PassportModule,

ConfigModule,

JwtModule.registerAsync({

imports:[ConfigModule],

inject:[ConfigService],

useFactory:(configService:ConfigService)=>({

secret:
configService.get<string>('JWT_SECRET')
?? 'schedula-secret-key',

signOptions:{
expiresIn:'1h'
}

})

})

],

controllers:[
AuthController
],

providers:[

AuthService,

JwtStrategy,

RolesGuard

],

exports:[JwtModule]

})
export class AuthModule{}