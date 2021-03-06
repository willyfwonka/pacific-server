import { IsUUID } from 'class-validator';

/**
 * Two models of created for Delete and Update operations in order to
 * see which class instance is causing in case of a problem.
 */

export abstract class UpdateModel {
  @IsUUID()
  id: string;
}
