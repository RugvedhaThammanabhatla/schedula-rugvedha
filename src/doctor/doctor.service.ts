import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}
  async getDoctors(
    specialization?: string,
    search?: string,
    page: string = '1',
    limit: string = '10',
    availability?: string,
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (pageNumber < 1 || limitNumber < 1) {
      throw new BadRequestException('Invalid pagination values');
    }

    const query = this.doctorRepository.createQueryBuilder('doctor');

    if (specialization) {
      query.andWhere(
        'LOWER(doctor.specialization) = LOWER(:specialization)',
        { specialization },
      );
    }

    if (search) {
      query.andWhere(
        'LOWER(doctor.fullName) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    if (availability !== undefined) {
      query.andWhere(
        'doctor.availability = :availability',
        { availability: availability === 'true' },
      );
    }

    query.skip((pageNumber - 1) * limitNumber);
    query.take(limitNumber);

    const doctors = await query.getMany();

    if (doctors.length === 0) {
      throw new NotFoundException('No doctors found');
    }

    return doctors;
  }

 async getDoctorById(id: number) {
  const doctor = await this.doctorRepository
    .createQueryBuilder('doctor')
    .where('doctor.id = :id', { id })
    .getOne();

  if (!doctor) {
    throw new NotFoundException('Doctor not found');
  }

  return doctor;
  }
}