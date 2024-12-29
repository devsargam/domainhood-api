import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, metadata: ArgumentMetadata) {
    const { data, success, error } = this.schema.safeParse(value);
    if (!success) {
      console.log(error.format());
      throw new BadRequestException('Validation Failed');
    }
    return data;
  }
}
