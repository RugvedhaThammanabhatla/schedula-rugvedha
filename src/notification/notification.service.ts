import {
Injectable,
NotFoundException,
BadRequestException,
ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Notification } from './notification.entity';

import { NotificationType }
from './notification.enum';

@Injectable()
export class NotificationService {

constructor(

@InjectRepository(Notification)

private notificationRepository:
Repository<Notification>,

){}
private async findNotification(
id:number,
){

const notification=
await this.notificationRepository.findOne({

where:{id},

});

if(!notification){

throw new NotFoundException(

'Notification not found'

);

}

return notification;

}
async getNotifications(
patientId:number
){

const notifications=

await this.notificationRepository.find({

where:{
patientId,
},

order:{
createdAt:'DESC'
},

});


if(
notifications.length===0
){

throw new NotFoundException(

'No notifications found'

);

}


return notifications;

}
async markAsRead(
id:number,
patientId:number,
){

const notification=
await this.findNotification(id);



if(
notification.patientId!==patientId
){

throw new ForbiddenException(

'Unauthorized access'

);

}



if(
notification.isRead
){

throw new BadRequestException(

'Notification already read'

);

}



notification.isRead=true;



await this.notificationRepository.save(

notification

);



return{

message:
'Notification marked as read'

};

}
async markAllAsRead(
patientId:number,
){

const result =
await this.notificationRepository.update(

{

patientId,

isRead:false,

},

{

isRead:true,

},

);


if ((result?.affected ?? 0) === 0) {
    throw new NotFoundException(
        'No unread notifications found',
    );
}

}
async getUnreadCount(
patientId:number,
){

const count =

await this.notificationRepository.count({

where:{

patientId,

isRead:false,

},

});


return{

count,

};

}
async createNotification(

patientId:number,

title:string,

message:string,

type:NotificationType,

){

const notification =

this.notificationRepository.create({

patientId,

title,

message,

type,

isRead:false,

});


return await this.notificationRepository.save(

notification,

);

}
}