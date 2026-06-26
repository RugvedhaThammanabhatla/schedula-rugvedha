import {
Controller,
Get,
Patch,
Param,
Req,
UseGuards
}
from '@nestjs/common';

import { NotificationService }
from './notification.service';

import { JwtAuthGuard }
from '../auth/jwt-auth.guard';

import { RolesGuard }
from '../auth/roles.guard';

import { Roles }
from '../auth/roles.decorator';


@Controller('notifications')
export class NotificationController {

constructor(

private readonly notificationService:
NotificationService,

){}



@UseGuards(
JwtAuthGuard,
RolesGuard
)

@Roles('PATIENT')

@Get()

getNotifications(

@Req()
req:any,

){

return this.notificationService
.getNotifications(

req.user.userId

);

}
@UseGuards(
JwtAuthGuard,
RolesGuard
)

@Roles('PATIENT')

@Patch(':id/read')

markAsRead(

@Param('id')
id:string,


@Req()
req:any,

){

return this.notificationService
.markAsRead(

Number(id),

req.user.userId,

);

}
@UseGuards(
JwtAuthGuard,
RolesGuard,
)

@Roles('PATIENT')

@Patch('read-all')

markAllAsRead(

@Req()
req:any,

){

return this.notificationService
.markAllAsRead(

req.user.userId,

);

}
@UseGuards(
JwtAuthGuard,
RolesGuard,
)

@Roles('PATIENT')

@Get('unread-count')

getUnreadCount(

@Req()
req:any,

){

return this.notificationService
.getUnreadCount(

req.user.userId,

);

}

}