import { RecurringAvailability } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Appointment,AppointmentStatus,
} from '../appointment/appointment.entity';

@Injectable()
export class DoctorService {
   constructor(
  @InjectRepository(Doctor)
  private doctorRepository: Repository<Doctor>,

  @InjectRepository(RecurringAvailability)
  private recurringRepository: Repository<RecurringAvailability>,

  @InjectRepository(CustomAvailability)
  private customRepository: Repository<CustomAvailability>,

  @InjectRepository(Appointment)
  private appointmentRepository:
  Repository<Appointment>,
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
   async createAvailability(body: any) {
  const { doctorId, dayOfWeek, startTime, endTime } = body;

  if (startTime >= endTime) {
    throw new BadRequestException('Invalid time range');
  }

  const duplicate = await this.recurringRepository.findOne({
    where: {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  if (duplicate) {
    throw new BadRequestException('Duplicate availability exists');
  }

  const existingSlots = await this.recurringRepository.find({
    where: {
      doctorId,
      dayOfWeek,
    },
  });

  for (const slot of existingSlots) {
    const overlap =
      startTime < slot.endTime &&
      endTime > slot.startTime;

    if (overlap) {
      throw new BadRequestException(
        'Overlapping slot exists',
      );
    }
  }

  const availability =
    this.recurringRepository.create(body);

  return await this.recurringRepository.save(
    availability,
  );
}

async getAvailability() {
  return await this.recurringRepository.find();
}

 async updateAvailability(
  id: number,
  body: any,
) {
  const existing =
    await this.recurringRepository.findOne({
      where: { id },
    });

  if (!existing) {
    throw new NotFoundException(
      'Availability not found',
    );
  }

  const {
    doctorId,
    dayOfWeek,
    startTime,
    endTime,
  } = body;

  if (startTime >= endTime) {
    throw new BadRequestException(
      'Invalid time range',
    );
  }

  const slots =
    await this.recurringRepository.find({
      where: {
        doctorId,
        dayOfWeek,
      },
    });

  for (const slot of slots) {
    if (slot.id === id) {
      continue;
    }

    const overlap =
      startTime < slot.endTime &&
      endTime > slot.startTime;

    if (overlap) {
      throw new BadRequestException(
        'Overlapping slot exists',
      );
    }
  }

  await this.recurringRepository.update(
    id,
    body,
  );

  return await this.recurringRepository.findOne({
    where: { id },
  });
}
async deleteAvailability(id: number) {
  const availability = await this.recurringRepository.findOne({
    where: { id },
  });

  if (!availability) {
    throw new NotFoundException('Availability not found');
  }

  await this.recurringRepository.delete(id);

  return {
    message: 'Availability deleted successfully',
  };
}

 async createOverride(body: any) {
  const {
    doctorId,
    date,
    startTime,
    endTime,
  } = body;

  if (startTime >= endTime) {
    throw new BadRequestException(
      'Invalid time range',
    );
  }

  const duplicate =
    await this.customRepository.findOne({
      where: {
        doctorId,
        date,
        startTime,
        endTime,
      },
    });

  if (duplicate) {
    throw new BadRequestException(
      'Duplicate override exists',
    );
  }

  const slots =
    await this.customRepository.find({
      where: {
        doctorId,
        date,
      },
    });

  for (const slot of slots) {
    const overlap =
      startTime < slot.endTime &&
      endTime > slot.startTime;

    if (overlap) {
      throw new BadRequestException(
        'Overlapping override exists',
      );
    }
  }

  const override =
    this.customRepository.create(body);

  return await this.customRepository.save(
    override,
  );
}

async getAvailabilityByDate(date: string) {
  const override = await this.customRepository.find({
    where: { date },
  });

  if (override.length > 0) {
    return override;
  }

  return {
    message: 'No custom availability found for this date',
  };
}
async getDoctorSlots(
  doctorId: number,
  date: string,
  duration: string = '15',
) {
  const doctor = await this.doctorRepository.findOne({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new NotFoundException('Doctor not found');
  }
  if (doctor.schedulingType !== 'STREAM') {
  throw new BadRequestException(
    'Doctor is not using STREAM scheduling',
  );
}

  if (!date) {
    throw new BadRequestException('Date is required');
  }

  const slotDuration = Number(duration);

  if (
    isNaN(slotDuration) ||
    slotDuration <= 0
  ) {
    throw new BadRequestException(
      'Invalid slot duration',
    );
  }

  const selectedDate = new Date(date);

  if (isNaN(selectedDate.getTime())) {
    throw new BadRequestException(
      'Invalid date',
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    throw new BadRequestException(
      'Past date not allowed',
    );
  }

  let availability: any[] = [];

  const customAvailability =
    await this.customRepository.find({
      where: {
        doctorId,
        date,
      },
    });

  if (customAvailability.length > 0) {
    availability = customAvailability;
  } else {
    const dayOfWeek =
      selectedDate.toLocaleDateString(
        'en-US',
        { weekday: 'long' }
      )
.toUpperCase();
    availability =
      await this.recurringRepository.find({
        where: {
          doctorId,
          dayOfWeek,
        },
      });
  }

  if (availability.length === 0) {
    throw new NotFoundException(
      'No availability found',
    );
  }

  const slots: any[] = [];

  for (const item of availability) {
    const [startHour, startMinute] =
      item.startTime
        .split(':')
        .map(Number);

    const [endHour, endMinute] =
      item.endTime
        .split(':')
        .map(Number);

    const start = new Date(selectedDate);
    start.setHours(
      startHour,
      startMinute,
      0,
      0,
    );

    const end = new Date(selectedDate);
    end.setHours(
      endHour,
      endMinute,
      0,
      0,
    );

    while (start < end) {
      const slotEnd = new Date(
        start.getTime() +
          slotDuration * 60000,
      );

      if (slotEnd > end) {
        break;
      }

      if (slotEnd > new Date()) {
        slots.push({
          startTime: start
            .toTimeString()
            .slice(0, 5),
          endTime: slotEnd
            .toTimeString()
            .slice(0, 5),
        });
      }

           start.setMinutes(
  start.getMinutes() +
    slotDuration +
    (doctor.bufferTime || 0),
);   
    }
  }

   const bookedAppointments =
  await this.appointmentRepository.find({
    where: {
      doctorId,
      appointmentDate: date,
    },
  });

const availableSlots = slots.filter(
  (slot) =>
    !bookedAppointments.some(
      (booking) =>
        booking.startTime === slot.startTime &&
        booking.endTime === slot.endTime,
    ),
);

if (availableSlots.length === 0) {
  throw new NotFoundException(
    'No slots available',
  );
}

return availableSlots;
}
 async updateSchedulingType(
  doctorId: number,
  body: any,
) {
  const doctor =
    await this.doctorRepository.findOne({
      where: { id: doctorId },
    });

  if (!doctor) {
    throw new NotFoundException(
      'Doctor not found',
    );
  }

  if (
    body.schedulingType !== 'STREAM' &&
    body.schedulingType !== 'WAVE'
  ) {
    throw new BadRequestException(
      'Invalid scheduling type',
    );
  }

  if (
    body.schedulingType === 'STREAM'
  ) {
    if (
      !body.slotDuration ||
      body.slotDuration <= 0
    ) {
      throw new BadRequestException(
        'Invalid slot duration',
      );
    }

    if (
      body.bufferTime === undefined ||
      body.bufferTime < 0
    ) {
      throw new BadRequestException(
        'Invalid buffer time',
      );
    }
  }

  if (
    body.schedulingType === 'WAVE'
  ) {
    if (
      !body.maxCapacity ||
      body.maxCapacity <= 0
    ) {
      throw new BadRequestException(
        'Invalid capacity',
      );
    }
  }

  await this.doctorRepository.update(
    doctorId,
    body,
  );

  return {
    message:
      'Scheduling type updated successfully',
  };
}
async getWaveAvailability(
  doctorId: number,
  date: string,
) {
  const doctor =
    await this.doctorRepository.findOne({
      where: { id: doctorId },
    });

  if (!doctor) {
    throw new NotFoundException(
      'Doctor not found',
    );
  }
  if (doctor.schedulingType !== 'WAVE') {
  throw new BadRequestException(
    'Doctor is not using WAVE scheduling',
  );
}
if (!date) {
  throw new BadRequestException(
    'Date is required',
  );
}

const selectedDate = new Date(date);

if (isNaN(selectedDate.getTime())) {
  throw new BadRequestException(
    'Invalid date',
  );
}

  const booked =
    await this.appointmentRepository.count({
      where: {
        doctorId,
        appointmentDate: date,
      },
    });

  return {
    schedulingType: 'WAVE',
    capacity: doctor.maxCapacity,
    booked,
    available:
      doctor.maxCapacity - booked,
  };
}
async getDoctorAppointments(
  doctorId: number,
  date?: string,
) {

const doctor = await this.doctorRepository.findOne({
where:{id:doctorId},
});

if(!doctor){
throw new NotFoundException(
'Doctor not found',
);
}

const query =
this.appointmentRepository.createQueryBuilder(
'appointment',
);

query.where(
'appointment.doctorId=:doctorId',
{doctorId},
);

query.andWhere(
"appointment.status != 'CANCELLED'",
);

if(date){

const selectedDate = new Date(date);

if(isNaN(selectedDate.getTime())){
throw new BadRequestException(
'Invalid date',
);
}

query.andWhere(
'appointment.appointmentDate=:date',
{date},
);

}

const appointments =
await query.getMany();

if(appointments.length===0){
throw new NotFoundException(
'No appointments found',
);
}

return {
  message: 'Appointments fetched successfully',

  count: appointments.length,

  data: appointments.map((appointment) => ({
    id: appointment.id,

    patient: {
      id: appointment.patientId,
    },

    appointmentDate:
      appointment.appointmentDate,

    startTime:
      appointment.startTime,

    endTime:
      appointment.endTime,

    status:
      appointment.status,

    schedulingType:
      doctor.schedulingType,
  })),
};

}
async cancelDoctorAppointment(
doctorId:number,
appointmentId:number,
){
  if(isNaN(appointmentId)){
throw new BadRequestException(
'Invalid appointment ID',
);
}

const doctor =
await this.doctorRepository.findOne({
where:{id:doctorId},
});

if(!doctor){
throw new NotFoundException(
'Doctor not found',
);
}

const appointment =
await this.appointmentRepository.findOne({
where:{
id:appointmentId,
},
});

if(!appointment){
throw new NotFoundException(
'Appointment not found',
);
}

if(
appointment.doctorId!==doctorId
){
throw new BadRequestException(
'Unauthorized access',
);
}

if(
appointment.status==='CANCELLED'
){
throw new BadRequestException(
'Appointment already cancelled',
);
}


appointment.status=
AppointmentStatus.CANCELLED;

await this.appointmentRepository.save(
appointment,
);

return{

message:
'Appointment cancelled successfully',

appointment,

};

}
}