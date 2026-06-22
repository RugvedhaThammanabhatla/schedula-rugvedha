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
  ) {}
async createAppointment(body: any) {

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


  const appointmentDate =
    new Date(body.appointmentDate);

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  if (
    appointmentDate < today
  ) {
    throw new BadRequestException(
      'Past appointment not allowed',
    );
  }


  let tokenNumber = 0;



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




  return await this.appointmentRepository.save(

    appointment,

  );

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

   return {

  message:
    'Appointment rescheduled successfully',

  releasedSlot:
    oldSlot,

  reservedSlot: {

    appointmentDate,

    startTime,

    endTime,

  },

};
}
async findNextAvailableSlot(
doctorId:number
){

if(isNaN(doctorId)){
throw new BadRequestException(
'Invalid doctor ID'
);
}


const doctor=
await this.doctorRepository.findOne({

where:{id:doctorId}

});


if(!doctor){
throw new NotFoundException(
'Doctor not found'
);
}


if(!doctor.availability){
throw new BadRequestException(
'Doctor unavailable'
);
}


if(

doctor.schedulingType?.toUpperCase()!=='STREAM'

&&

doctor.schedulingType?.toUpperCase()!=='WAVE'

){

throw new BadRequestException(
'Invalid scheduling type'
);

}



for(let i=0;i<30;i++){


const currentDate=new Date();

currentDate.setDate(

currentDate.getDate()+i

);



const date=

currentDate

.toISOString()

.split('T')[0];



/* CUSTOM */


const customSlots=

await this.customRepository.find({

where:{

doctorId,

date

}

});


if(customSlots.length>0){


if(

doctor.schedulingType?.toUpperCase()

==='WAVE'

){


const count=

await this.appointmentRepository.count({

where:{

doctorId,

appointmentDate:date,

status:
AppointmentStatus.BOOKED

}

});


if(

count<doctor.maxCapacity!

){

return{


doctorId,


nextAvailableDate:
date,


schedulingType:
doctor.schedulingType,


availabilityType:
'CUSTOM',


bookingAllowed:
true,


slots:
customSlots


};

}

}


else{


for(const slot of customSlots){


const booked=

await this.appointmentRepository.findOne({

where:{


doctorId,


appointmentDate:date,


startTime:
slot.startTime,


endTime:
slot.endTime,


status:
AppointmentStatus.BOOKED


}

});


if(!booked){


return{


doctorId,


nextAvailableDate:
date,


schedulingType:
doctor.schedulingType,


availabilityType:
'CUSTOM',


bookingAllowed:
true,


slots:
customSlots


};


}


}


}


}




/* RECURRING */


const dayOfWeek=

currentDate

.toLocaleDateString(

'en-US',

{

weekday:'long'

}

)

.toUpperCase();




const recurringSlots=

await this.recurringRepository.find({

where:{


doctorId,


dayOfWeek


}

});



if(recurringSlots.length>0){


if(

doctor.schedulingType?.toUpperCase()

==='WAVE'

){


const count=

await this.appointmentRepository.count({

where:{


doctorId,


appointmentDate:date,


status:
AppointmentStatus.BOOKED


}

});



if(

count<doctor.maxCapacity!

){

return{


doctorId,


nextAvailableDate:
date,


schedulingType:
doctor.schedulingType,


availabilityType:
'RECURRING',


bookingAllowed:
true,


slots:
recurringSlots


};


}

}



else{


for(const slot of recurringSlots){


const booked=

await this.appointmentRepository.findOne({

where:{


doctorId,


appointmentDate:date,


startTime:
slot.startTime,


endTime:
slot.endTime,


status:
AppointmentStatus.BOOKED


}

});



if(!booked){


return{


doctorId,


nextAvailableDate:
date,


schedulingType:
doctor.schedulingType,


availabilityType:
'RECURRING',


bookingAllowed:
true,


slots:
recurringSlots


};


}


}


}


}


}



throw new NotFoundException(

'No appointments available in next 30 working days. Please try again later.'

);


}
}
