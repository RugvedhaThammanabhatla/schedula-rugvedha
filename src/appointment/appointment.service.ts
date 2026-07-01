import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Appointment,
  AppointmentStatus,
} from './appointment.entity';

import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';
import { RecurringAvailability }
from '../doctor/recurring-availability.entity';

import { CustomAvailability }
from '../doctor/custom-availability.entity';

import { NotificationService }
from '../notification/notification.service';

import { NotificationType }
from '../notification/notification.enum';
@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(RecurringAvailability)
private recurringRepository:
Repository<RecurringAvailability>,

@InjectRepository(CustomAvailability)
private customRepository:
Repository<CustomAvailability>,
private readonly notificationService:
NotificationService,
  ) {}
async createAppointment(body: any) {
if (
  !body.appointmentDate ||
  !body.startTime ||
  !body.endTime
) {
  throw new BadRequestException(
    'Appointment date, start time and end time are required.',
  );
}
  const doctor =
    await this.doctorRepository.findOne({
      where: {
        id: body.doctorId,
      },
    });

  if (!doctor) {
    throw new NotFoundException(
      'Doctor not found',
    );
  }
  if (
  doctor.schedulingType?.toUpperCase() !==
    'STREAM' &&
  doctor.schedulingType?.toUpperCase() !==
    'WAVE'
) {
  throw new BadRequestException(
    'Invalid scheduling type',
  );
}


  const patient =
    await this.patientRepository.findOne({
      where: {
        id: body.patientId,
      },
    });

  if (!patient) {
    throw new NotFoundException(
      'Patient not found',
    );
  }


const appointmentDate = new Date(body.appointmentDate);

if (isNaN(appointmentDate.getTime())) {
  throw new BadRequestException(
    'Invalid appointment date format.',
  );
}

// Allow booking only for today
appointmentDate.setHours(0, 0, 0, 0);
const today = new Date();
today.setHours(0, 0, 0, 0);

const dayOfWeek = appointmentDate
  .toLocaleDateString('en-US', {
    weekday: 'long',
  })
  .toUpperCase();

const customAvailability =
  await this.customRepository.findOne({
    where: {
      doctorId: doctor.id,
      date: body.appointmentDate,
      startTime: body.startTime,
      endTime: body.endTime,
    },
  });

const recurringAvailability =
  await this.recurringRepository.find({
    where: {
      doctorId: doctor.id,
      dayOfWeek,
    },
  });

if (
  !customAvailability &&
  recurringAvailability.length === 0
) {
  throw new BadRequestException(
    'Doctor is not available for the selected date.',
  );
}

if (appointmentDate.getTime() !== today.getTime()) {
  throw new BadRequestException(
    'Appointments can only be booked for today.',
  );
}
// Validate consultation timings
const consultationStart = new Date(
  `${body.appointmentDate}T${body.startTime}`,
);

const consultationEnd = new Date(
  `${body.appointmentDate}T${body.endTime}`,
);

if (consultationStart >= consultationEnd) {
  throw new BadRequestException(
    'Invalid consultation timings.',
  );
}
  let tokenNumber = 0;
// Booking window validation
const bookingOpenTime = new Date(consultationStart);
bookingOpenTime.setHours(
  bookingOpenTime.getHours() - 2,
);

const bookingCloseTime = new Date(consultationEnd);
bookingCloseTime.setHours(
  bookingCloseTime.getHours() - 1,
);

const currentTime = new Date();
currentTime.setSeconds(0);
currentTime.setMilliseconds(0);

if (currentTime < bookingOpenTime) {
  throw new BadRequestException(
    'Booking window has not opened yet.',
  );
}

if (currentTime > bookingCloseTime) {
  throw new BadRequestException(
    'Booking window has closed.',
  );
}


  if (

    doctor.schedulingType
      ?.toUpperCase() ===
    'WAVE'

  ) {

    const bookedCount =

      await this.appointmentRepository.count({

        where: {

          doctorId:
            body.doctorId,

          appointmentDate:
            body.appointmentDate,

          status:
            AppointmentStatus.BOOKED,

        },

      });



    if (

      bookedCount >=
      doctor.maxCapacity

    ) {

      throw new BadRequestException(

        'Wave is full',

      );

    }



    tokenNumber =
      bookedCount + 1;

  }

  else {
const slotExists =
  customAvailability ||
  recurringAvailability.some(
    slot =>
      slot.startTime === body.startTime &&
      slot.endTime === body.endTime,
  );

if (!slotExists) {
  throw new BadRequestException(
    'Selected slot is not available.',
  );
}
    const duplicate =

      await this.appointmentRepository.findOne({

        where: {

          doctorId:
            body.doctorId,

          appointmentDate:
            body.appointmentDate,

          startTime:
            body.startTime,

          endTime:
            body.endTime,

          status:
            AppointmentStatus.BOOKED,

        },

      });



    if (duplicate) {

      throw new BadRequestException(

        'Slot already booked',

      );

    }

  }




  const appointment =

this.appointmentRepository.create({

...body,

tokenNumber,

status:
AppointmentStatus.BOOKED,

});



const savedAppointment =

await this.appointmentRepository.save(

appointment,

);

if (!savedAppointment) {
  throw new BadRequestException(
    'Failed to create appointment',
  );
}

await this.notificationService.createNotification(

patient.id,

'Appointment Booked',

`Your appointment with Dr. ${doctor.fullName} on ${body.appointmentDate} from ${body.startTime} to ${body.endTime} has been booked successfully.`,

NotificationType.APPOINTMENT_BOOKED,

);



return savedAppointment;

}
   
  async getMyAppointments(
    patientId: number,
  ) {
    const appointments =
      await this.appointmentRepository.find({
        where: { patientId },
      });

    if (appointments.length === 0) {
      throw new NotFoundException(
        'No appointments found',
      );
    }

    return appointments;
  }

  async cancelAppointment(
    id: number,
    patientId: number,
  ) {
    const appointment =
      await this.appointmentRepository.findOne({
        where: { id },
      });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found',
      );
    }

    if (
      appointment.patientId !== patientId
    ) {
      throw new BadRequestException(
        'Unauthorized cancellation',
      );
    }

    if (
      appointment.status ===
      AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Appointment already cancelled',
      );
    }

    const appointmentDate =
      new Date(
        appointment.appointmentDate,
      );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException(
        'Cannot cancel past appointment',
      );
    }

    appointment.status =
AppointmentStatus.CANCELLED;


await this.appointmentRepository.save(

appointment,

);


await this.notificationService
.createNotification(

patientId,

'Appointment Cancelled',

`Your appointment scheduled on ${appointment.appointmentDate} from ${appointment.startTime} to ${appointment.endTime} has been cancelled successfully.`,

NotificationType.APPOINTMENT_CANCELLED,

);



return {

message:
'Appointment cancelled successfully',

};
  }

  async getDoctorAppointments(
    doctorId: number,
  ) {
    const appointments =
      await this.appointmentRepository.find({
        where: { doctorId },
      });

    if (appointments.length === 0) {
      throw new NotFoundException(
        'No appointments found',
      );
    }

    return appointments;
  }
   async rescheduleAppointment(
  appointmentId: number,
  patientId: number,
  body: any,
) {
  const appointment =
    await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
      },
    });
  if (!appointment) {
    throw new NotFoundException(
      'Appointment not found',
    );
  }

  if (
    appointment.patientId !== patientId
  ) {
    throw new BadRequestException(
      'Unauthorized reschedule',
    );
  }

  if (
    appointment.status ===
    AppointmentStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'Cannot reschedule cancelled appointment',
    );
  }

  const now = new Date();

  const appointmentTime =
    new Date(
      `${appointment.appointmentDate}T${appointment.startTime}`,
    );

  const diff =
    appointmentTime.getTime() -
    now.getTime();

  if (
    diff > 0 &&
    diff <= 30 * 60 * 1000
  ) {
    throw new BadRequestException(
      'Reschedule not allowed within 30 minutes',
    );
  }

  // Validate request body
if (!body) {
  throw new BadRequestException(
    'Request body is required',
  );
}

const {
  appointmentDate,
  startTime,
  endTime,
} = body;

  if (
    appointment.appointmentDate ===
      appointmentDate &&
    appointment.startTime ===
      startTime &&
    appointment.endTime ===
      endTime
  ) {
    throw new BadRequestException(
      'Cannot reschedule to same slot',
    );
  }

  const selectedDate =
    new Date(appointmentDate);

  if (
    isNaN(selectedDate.getTime())
  ) {
    throw new BadRequestException(
      'Invalid date',
    );
  }

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  if (
    selectedDate < today
  ) {
    throw new BadRequestException(
      'Past date not allowed',
    );
  }

  const doctor =
    await this.doctorRepository.findOne({
      where: {
        id:
          appointment.doctorId,
      },
    });
  if (!doctor) {
    throw new NotFoundException(
      'Doctor not found',
    );
  }
if (!doctor.availability) {
  throw new BadRequestException(
    'Doctor unavailable',
  );
}
  if (
    doctor.schedulingType
      ?.toUpperCase() ===
    'STREAM'
  ) {
    const customSlot =
await this.customRepository.findOne({

where:{

doctorId:doctor.id,

date:appointmentDate,

startTime,

endTime

}

});


const selectedDate =
new Date(appointmentDate);


const dayOfWeek =
selectedDate.toLocaleDateString(

'en-US',

{weekday:'long'}

);


const recurringSlot =
await this.recurringRepository.findOne({

where:{

doctorId:doctor.id,

dayOfWeek,

startTime,

endTime

}

});


if(
!customSlot &&
!recurringSlot
){

throw new BadRequestException(

'Slot does not exist'

);

}

    const booked =
      await this.appointmentRepository.findOne({
        where: {

          doctorId:
            doctor.id,

          appointmentDate,

          startTime,

          endTime,

          status:
            AppointmentStatus.BOOKED,

        },
      });

    if (booked) {

      throw new BadRequestException(

        'Slot already booked',

      );

    }

  }

  if (
    doctor.schedulingType
      ?.toUpperCase() ===
    'WAVE'
  ) {

    const booked =
      await this.appointmentRepository.count({

        where: {

          doctorId:
            doctor.id,

          appointmentDate,

          status:
            AppointmentStatus.BOOKED,

        },

      });

    if (
      booked >=
      doctor.maxCapacity
    ) {

      throw new BadRequestException(

        'Wave is full',

      );

    }

  }
  const oldSlot = {
  appointmentDate:
    appointment.appointmentDate,

  startTime:
    appointment.startTime,

  endTime:
    appointment.endTime,
};

  appointment.appointmentDate =
    appointmentDate;

  appointment.startTime =
    startTime;

  appointment.endTime =
    endTime;

  await this.appointmentRepository.save(

    appointment,

  );


await this.notificationService
.createNotification(

patientId,

'Appointment Rescheduled',

`Your appointment has been rescheduled to ${appointmentDate} from ${startTime} to ${endTime}.`,

NotificationType.APPOINTMENT_RESCHEDULED,

);



return {

message:
'Appointment rescheduled successfully',

releasedSlot:
oldSlot,

reservedSlot:{

appointmentDate,

startTime,

endTime,

},

};
}
private getFormattedDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
async findNextAvailableSlot(doctorId: number) {

  if (isNaN(doctorId)) {
    throw new BadRequestException(
      'Invalid doctor ID',
    );
  }

  const doctor = await this.doctorRepository.findOne({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new NotFoundException(
      'Doctor not found',
    );
  }

  if (!doctor.availability) {
    throw new BadRequestException(
      'Doctor unavailable',
    );
  }

  if (
    doctor.schedulingType?.toUpperCase() !== 'STREAM' &&
    doctor.schedulingType?.toUpperCase() !== 'WAVE'
  ) {
    throw new BadRequestException(
      'Invalid scheduling type',
    );
  }


  const SEARCH_WINDOW_DAYS = 3;
const today = new Date();

  for (let i = 0; i <= SEARCH_WINDOW_DAYS; i++) {


    const currentDate = new Date();

    currentDate.setDate(
      currentDate.getDate() + i,
    );

    const date =
  this.getFormattedDate(
    currentDate,
  );



    /* CUSTOM AVAILABILITY */

    const customSlots =
      await this.customRepository.find({

        where: {
          doctorId,
          date,
        },

      });



    if (customSlots.length > 0) {


      if (
        doctor.schedulingType?.toUpperCase() ===
        'WAVE'
      ) {

        for (const slot of customSlots) {

          const count =
            await this.appointmentRepository.count({

              where: {

                doctorId,

                appointmentDate: date,

                startTime: slot.startTime,

                endTime: slot.endTime,

                status:
                  AppointmentStatus.BOOKED,

              },

            });



          if (
            count <
            doctor.maxCapacity!
          ) {

            return {

              doctorId,

              nextAvailableDate:
                date,

              schedulingType:
                doctor.schedulingType,

              availabilityType:
                'CUSTOM',

              bookingAllowed:
                true,

              slots: [slot],

            };

          }

        }

      }


      else {


        for (const slot of customSlots) {


          const booked =
            await this.appointmentRepository.findOne({

              where: {

                doctorId,

                appointmentDate:
                  date,

                startTime:
                  slot.startTime,

                endTime:
                  slot.endTime,

                status:
                  AppointmentStatus.BOOKED,

              },

            });



          if (!booked) {


            return {

              doctorId,

              nextAvailableDate:
                date,

              schedulingType:
                doctor.schedulingType,

              availabilityType:
                'CUSTOM',

              bookingAllowed:
                true,

              slots: [slot],

            };

          }

        }

      }

    }



    /* RECURRING AVAILABILITY */

    const dayOfWeek =

      currentDate
        .toLocaleDateString(

          'en-US',

          {
            weekday: 'long',
          },

        )
        .toUpperCase();



    const recurringSlots =

      await this.recurringRepository.find({

        where: {

          doctorId,

          dayOfWeek,

        },

      });



    /* WEEKLY OFF */

    if (
      customSlots.length === 0 &&
      recurringSlots.length === 0
    ) {

      continue;

    }



    if (recurringSlots.length > 0) {


      if (
        doctor.schedulingType?.toUpperCase() ===
        'WAVE'
      ) {


        for (const slot of recurringSlots) {


          const count =

            await this.appointmentRepository.count({

              where: {

                doctorId,

                appointmentDate:
                  date,

                startTime:
                  slot.startTime,

                endTime:
                  slot.endTime,

                status:
                  AppointmentStatus.BOOKED,

              },

            });



          if (
            count <
            doctor.maxCapacity!
          ) {


            return {

              doctorId,

              nextAvailableDate:
                date,

              schedulingType:
                doctor.schedulingType,

              availabilityType:
                'RECURRING',

              bookingAllowed:
                true,

              slots: [slot],

            };

          }

        }

      }



      else {


        for (const slot of recurringSlots) {


          const booked =

            await this.appointmentRepository.findOne({

              where: {

                doctorId,

                appointmentDate:
                  date,

                startTime:
                  slot.startTime,

                endTime:
                  slot.endTime,

                status:
                  AppointmentStatus.BOOKED,

              },

            });



          if (!booked) {


            return {

              doctorId,

              nextAvailableDate:
                date,

              schedulingType:
                doctor.schedulingType,

              availabilityType:
                'RECURRING',

              bookingAllowed:
                true,

              slots: [slot],

            };

          }

        }

      }

    }

  }


  throw new NotFoundException(

    'No appointments available within the next 3 working days. Please try again later.'

  );

}
}