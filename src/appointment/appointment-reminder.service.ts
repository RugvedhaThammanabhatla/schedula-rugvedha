import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
Appointment,
AppointmentStatus
}
from './appointment.entity';

import { Doctor }
from '../doctor/doctor.entity';

import { Patient }
from '../patient/patient.entity';

import { NotificationService }
from '../notification/notification.service';

import { NotificationType }
from '../notification/notification.enum';
import { Logger } from '@nestjs/common';


@Injectable()
export class AppointmentReminderService {
private readonly logger =
new Logger(
AppointmentReminderService.name
);

constructor(

@InjectRepository(Appointment)
private appointmentRepository:
Repository<Appointment>,


@InjectRepository(Doctor)
private doctorRepository:
Repository<Doctor>,


@InjectRepository(Patient)
private patientRepository:
Repository<Patient>,


private notificationService:
NotificationService,

){}

@Cron('0 */5 * * * *')
async handleCron() {
    this.logger.log(
'Checking appointment reminders'
);
const REMINDER_WINDOW = 60;

const appointments =

await this.appointmentRepository.find({

where:{

status:
AppointmentStatus.BOOKED,

reminderSent:false,

},

order:{
appointmentDate:'ASC',
},

});


for(

const appointment

of appointments

){

const doctor =

await this.doctorRepository.findOne({

where:{

id:appointment.doctorId,

},

});


if(!doctor){

continue;

}


const patient =

await this.patientRepository.findOne({

where:{

id:appointment.patientId,

},

});


if(!patient){

continue;

}


const appointmentTime =

new Date(

`${appointment.appointmentDate}T${appointment.startTime}`

);
if (

isNaN(

appointmentTime.getTime()

)

){

continue;

}

const now = new Date();


const diffMinutes =

(

appointmentTime.getTime()

-

now.getTime()

)

/

60000;

if(

diffMinutes <= REMINDER_WINDOW

&&

diffMinutes > 0

){

let title='';

let message='';



if(

doctor.schedulingType?.toUpperCase()

===

'WAVE'

){

title='Appointment Reminder';


message =

`Reminder: You have an appointment with Dr. ${doctor.fullName}.

Reporting Time: ${appointment.startTime}

Token Number: ${appointment.tokenNumber}.`;

}



else{


title='Appointment Reminder';


message =

`Reminder: You have an appointment with Dr. ${doctor.fullName} on ${appointment.appointmentDate} from ${appointment.startTime} to ${appointment.endTime}.`;



}
this.logger.log(

`Sending reminder for appointment ${appointment.id}`

);

await this.notificationService
.createNotification(

patient.id,

title,

message,

NotificationType.APPOINTMENT_REMINDER,

);



appointment.reminderSent=true;
await this.appointmentRepository.save(

appointment,

);


}


}


}
}