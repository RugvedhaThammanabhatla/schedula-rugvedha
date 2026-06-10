import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  AuthModule,
  DoctorModule,
  PatientModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
