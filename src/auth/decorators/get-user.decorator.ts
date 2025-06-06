import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common"


export const GetUser= createParamDecorator(

  (data:string,ctx:ExecutionContext)=> {

    const req=ctx.switchToHttp().getRequest();

    const user = req.user;
    const datos={};

    if (!user) {
      throw new InternalServerErrorException('User not found in request');
    }
    
    if (data) {
      datos[data]= user[data]
      return datos
    }

    return user
  }

)