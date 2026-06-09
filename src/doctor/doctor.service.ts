import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DoctorService {
  private doctors = [
    {
      id: 1,
      fullName: 'Dr John',
      specialization: 'Cardiologist',
      experience: 5,
      consultationFee: 500,
      availability: true,
    },
    {
      id: 2,
      fullName: 'Dr Rahul',
      specialization: 'Neurologist',
      experience: 7,
      consultationFee: 700,
      availability: false,
    },
    {
      id: 3,
      fullName: 'Dr Priya',
      specialization: 'Dermatologist',
      experience: 4,
      consultationFee: 400,
      availability: true,
    },
  ];

  getDoctors(
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

    let result = this.doctors;

    if (specialization) {
      result = result.filter(
        (doctor) =>
          doctor.specialization.toLowerCase() ===
          specialization.toLowerCase(),
      );
    }

    if (search) {
      result = result.filter((doctor) =>
        doctor.fullName.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (availability !== undefined) {
      const available = availability === 'true';
      result = result.filter(
        (doctor) => doctor.availability === available,
      );
    }

    if (result.length === 0) {
      throw new NotFoundException('No doctors found');
    }

    const start = (pageNumber - 1) * limitNumber;
    const end = start + limitNumber;

    return result.slice(start, end);
  }

  getDoctorById(id: number) {
    const doctor = this.doctors.find(
      (doctor) => doctor.id === id,
    );

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }
}